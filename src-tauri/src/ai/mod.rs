use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::io::Read;
use std::time::Duration;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryResult {
    pub summary: String,
}

const OLLAMA_URL: &str = "http://localhost:11434";
const DEFAULT_MODEL: &str = "phi4-mini:latest";
const TINY_MODEL: &str = "qwen2.5:0.5b";
const CHUNK_SIZE: usize = 4_000;
const CHUNK_OVERLAP: usize = 200;
const DIRECT_CALL_THRESHOLD: usize = 5_000;
const CHUNK_NUM_PREDICT: u32 = 300;
const FINAL_NUM_PREDICT: u32 = 1200;
const OLLAMA_TIMEOUT_SECS: u64 = 180;
const CONCURRENT_LIMIT: usize = 4;

pub fn run_summarization(
    cleaned: &str,
    title: &str,
    app_handle: &tauri::AppHandle,
) -> Result<SummaryResult, String> {
    if cleaned.is_empty() {
        return Err("This document has no extracted text to summarize.".to_string());
    }
    if !ollama_available() {
        return Err("Ollama isn't running on localhost:11434.".to_string());
    }
    let _ = app_handle.emit("summarize-progress", "Starting summarization…");
    let final_summary = if cleaned.len() <= DIRECT_CALL_THRESHOLD {
        let _ = app_handle.emit("summarize-progress", "Generating summary…");
        ollama_summarize(cleaned, DEFAULT_MODEL, FINAL_NUM_PREDICT)?
    } else {
        let chunks = chunk_text(cleaned, CHUNK_SIZE, CHUNK_OVERLAP);
        let total = chunks.len();
        let chunk_summaries = summarize_chunks_concurrent(&chunks, total, app_handle)?;
        let _ = app_handle.emit("summarize-progress", "Merging chunk summaries…");
        let combined = chunk_summaries.join("\n\n");
        ollama_summarize(&combined, DEFAULT_MODEL, FINAL_NUM_PREDICT)?
    };
    let _ = app_handle.emit("summarize-progress", "Done!");
    Ok(SummaryResult {
        summary: format!(
            "AI summary for \"{}\"\n\n{}\n\n- Generated locally via {} on Ollama.",
            title, final_summary, DEFAULT_MODEL
        ),
    })
}
/// Summarize chunks concurrently, up to `CONCURRENT_LIMIT` at a time, using
/// the fast tiny model.
fn summarize_chunks_concurrent(
    chunks: &[String],
    total: usize,
    app_handle: &tauri::AppHandle,
) -> Result<Vec<String>, String> {
    use std::sync::{Arc, Mutex};

    let results: Arc<Mutex<Vec<(usize, String)>>> = Arc::new(Mutex::new(Vec::with_capacity(total)));
    let errors: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
    let completed: Arc<Mutex<usize>> = Arc::new(Mutex::new(0));

    for batch_start in (0..total).step_by(CONCURRENT_LIMIT) {
        let batch_end = usize::min(batch_start + CONCURRENT_LIMIT, total);
        std::thread::scope(|s| {
            for i in batch_start..batch_end {
                let chunk = &chunks[i];
                let results = &results;
                let errors = &errors;
                let completed = &completed;
                let app_handle = app_handle;

                s.spawn(move || {
                    let summary = ollama_summarize(chunk, TINY_MODEL, CHUNK_NUM_PREDICT);
                    match summary {
                        Ok(s) => {
                            let mut r = results.lock().unwrap();
                            r.push((i, s));
                        }
                        Err(e) => {
                            let mut errs = errors.lock().unwrap();
                            errs.push(format!("Chunk {}/{}: {}", i + 1, total, e));
                        }
                    }
                    let mut c = completed.lock().unwrap();
                    *c += 1;
                    let _ = app_handle.emit(
                        "summarize-progress",
                        format!("Summarizing chunk {}/{}…", *c, total),
                    );
                });
            }
        });

        {
            let errs = errors.lock().unwrap();
            if !errs.is_empty() {
                return Err(errs.join("\n"));
            }
        }
    }

    let mut sorted = results.lock().unwrap().clone();
    sorted.sort_by_key(|(idx, _)| *idx);
    Ok(sorted.into_iter().map(|(_, s)| s).collect())
}

fn chunk_text(text: &str, size: usize, overlap: usize) -> Vec<String> {
    let mut chunks = Vec::new();
    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();
    let mut start = 0;
    while start < len {
        let end = usize::min(start + size, len);
        let chunk: String = chars[start..end].iter().collect();
        chunks.push(chunk);
        if end == len { break; }
        start = if end + overlap >= len { len } else { end.saturating_sub(overlap) };
    }
    chunks
}

pub fn load_document_content(doc_id: &str, conn: &Connection) -> Result<String, String> {
    let mut stmt = conn
        .prepare("SELECT content FROM document_content WHERE document_id = ?1 ORDER BY page_num")
        .map_err(|e| format!("Database query error: {e}"))?;
    let rows = stmt
        .query_map(params![doc_id], |row| row.get::<_, String>(0))
        .map_err(|e| format!("Database error: {e}"))?;
    let mut text = String::new();
    for row in rows {
        let page_text = row.map_err(|e| e.to_string())?;
        text.push_str(&page_text);
        text.push('\n');
    }
    Ok(text)
}

pub fn normalize_whitespace(text: &str) -> String {
    text.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn truncate_at_char_boundary(text: &str, max_chars: usize) -> String {
    if text.chars().count() <= max_chars { return text.to_string(); }
    let mut truncated: String = text.chars().take(max_chars).collect();
    truncated.push_str("...");
    truncated
}

fn ollama_available() -> bool {
    let client = match reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(3)).build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };
    match client.get(format!("{OLLAMA_URL}/api/tags")).send() {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

fn ollama_summarize(text: &str, model: &str, num_predict: u32) -> Result<String, String> {
    let truncated: String = truncate_at_char_boundary(text, CHUNK_SIZE + 1000);

    let system = match num_predict {
        CHUNK_NUM_PREDICT => "You are DocuMind, an AI document summarizer. \
            Summarize the following excerpt concisely in 2-3 sentences. \
            Capture the main topic and key points only. Do not add meta-commentary.",
        _ => "You are DocuMind, an AI document summarizer. \
            Write a concise, well-structured final summary of the document \
            using the excerpt summaries below. Combine them into a coherent \
            overview — main topic, key points, decisions, and conclusions. \
            Use plain prose (a few short paragraphs). Do not repeat the prompt.",
    };

    let payload = serde_json::json!({
        "model": model,
        "system": system,
        "prompt": truncated,
        "stream": false,
        "options": {
            "temperature": 0.3,
            "num_ctx": 16384,
            "num_predict": num_predict
        }
    });

    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(OLLAMA_TIMEOUT_SECS))
        .build()
        .map_err(|e| e.to_string())?;

    let mut response = client
        .post(format!("{OLLAMA_URL}/api/generate"))
        .json(&payload)
        .send()
        .map_err(|e| format!("Failed to reach Ollama: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let mut body = String::new();
        let _ = response.read_to_string(&mut body);
        return Err(format!("Ollama returned HTTP {status}: {body}"));
    }

    #[derive(Deserialize)]
    struct GenerateResponse {
        response: String,
        #[serde(default)]
        error: Option<String>,
    }

    let parsed: GenerateResponse = response
        .json()
        .map_err(|e| format!("Failed to parse Ollama response: {e}"))?;

    if let Some(err) = parsed.error {
        return Err(err);
    }

    let summary = parsed.response.trim().to_string();
    if summary.is_empty() {
        return Err("Ollama returned an empty summary.".to_string());
    }

    Ok(summary)
}
