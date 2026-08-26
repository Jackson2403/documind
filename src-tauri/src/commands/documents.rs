use crate::ai;
use crate::db::documents::{self, Document, DocumentContent};
use crate::db::Database;
use crate::indexer::{self, ExtractedContent};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::State;
use walkdir::WalkDir;

use tokio::task::spawn_blocking;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub document_count: i64,
    pub total_size_bytes: i64,
    pub file_types: std::collections::HashMap<String, i64>,
    pub recent_documents: Vec<Document>,
}

#[tauri::command]
pub fn get_dashboard_stats(db: State<'_, Database>) -> Result<DashboardStats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let document_count = documents::get_document_count(&conn).map_err(|e| e.to_string())?;

    let total_size_bytes = documents::get_total_size(&conn).map_err(|e| e.to_string())?;

    let file_type_counts = documents::get_file_type_counts(&conn).map_err(|e| e.to_string())?;

    let mut file_types = std::collections::HashMap::new();
    for (file_type, count) in file_type_counts {
        file_types.insert(file_type, count);
    }

    let recent_documents = documents::list_documents(&conn, 0, 5).map_err(|e| e.to_string())?;

    Ok(DashboardStats {
        document_count,
        total_size_bytes,
        file_types,
        recent_documents,
    })
}

#[tauri::command]
pub fn list_documents(
    db: State<'_, Database>,
    offset: i64,
    limit: i64,
) -> Result<Vec<Document>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    documents::list_documents(&conn, offset, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn index_document(db: State<'_, Database>, file_path: String) -> Result<Document, String> {
    let path = Path::new(&file_path);

    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    let file_size = metadata.len() as i64;

    let title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let file_type = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Extract content
    let content = indexer::extract_content(path)?;

    let (pages, page_count) = match content {
        ExtractedContent::Pdf(pages) => {
            let count = pages.len() as i32;
            (pages, count)
        }
        ExtractedContent::Text(text) => (vec![text], 1),
        ExtractedContent::Ocr(pages) => {
            let count = pages.len() as i32;
            (pages, count)
        }
    };

    // Insert document
    let doc =
        documents::insert_document(&conn, &title, &file_path, &file_type, file_size, page_count)
            .map_err(|e| e.to_string())?;

    // Insert content pages
    for (i, page_content) in pages.iter().enumerate() {
        documents::insert_document_content(&conn, &doc.id, (i + 1) as i32, page_content)
            .map_err(|e| e.to_string())?;
    }

    // Update FTS index
    let full_content = pages.join(" ");
    documents::update_fts_index(&conn, &doc.id, &title, &full_content)
        .map_err(|e| e.to_string())?;

    Ok(doc)
}

#[tauri::command]
pub fn delete_document(db: State<'_, Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    documents::delete_document(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_document_content(
    db: State<'_, Database>,
    document_id: String,
) -> Result<Vec<DocumentContent>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    documents::get_document_content(&conn, &document_id).map_err(|e| e.to_string())
}

/// Index all supported files in a folder recursively.
/// Returns the number of files successfully indexed.
#[tauri::command]
pub fn index_folder(db: State<'_, Database>, folder_path: String) -> Result<i64, String> {
    let folder = Path::new(&folder_path);
    if !folder.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let supported_extensions = [
        "pdf", "txt", "md", "csv", "log", "json", "xml", "html", "png", "jpg", "jpeg", "tiff",
        "bmp", "webp",
    ];

    let mut indexed_count: i64 = 0;

    for entry in WalkDir::new(folder).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase())
            .unwrap_or_default();

        if !supported_extensions.contains(&extension.as_str()) {
            continue;
        }

        // Try to index each file; skip failures silently
        let result = index_single_file(&db, path);
        if result.is_ok() {
            indexed_count += 1;
        }
    }

    Ok(indexed_count)
}

/// Helper: index a single file by path (shared logic between index_document and index_folder)
fn index_single_file(db: &State<'_, Database>, path: &Path) -> Result<Document, String> {
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    let file_size = metadata.len() as i64;

    let title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let file_type = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    let file_path = path.to_string_lossy().to_string();

    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Check if already indexed (by file_path)
    if let Ok(Some(_existing)) = documents::get_document_by_path(&conn, &file_path) {
        return Err("Already indexed".to_string());
    }

    // Extract content
    let content = indexer::extract_content(path)?;

    let (pages, page_count) = match content {
        ExtractedContent::Pdf(pages) => {
            let count = pages.len() as i32;
            (pages, count)
        }
        ExtractedContent::Text(text) => (vec![text], 1),
        ExtractedContent::Ocr(pages) => {
            let count = pages.len() as i32;
            (pages, count)
        }
    };

    // Insert document
    let doc =
        documents::insert_document(&conn, &title, &file_path, &file_type, file_size, page_count)
            .map_err(|e| e.to_string())?;

    // Insert content pages
    for (i, page_content) in pages.iter().enumerate() {
        documents::insert_document_content(&conn, &doc.id, (i + 1) as i32, page_content)
            .map_err(|e| e.to_string())?;
    }

    // Update FTS index
    let full_content = pages.join(" ");
    documents::update_fts_index(&conn, &doc.id, &title, &full_content)
        .map_err(|e| e.to_string())?;

    Ok(doc)
}
/// Summarize a document using the local Ollama LLM with hybrid chunking.
/// The actual Ollama work runs on a background thread so the UI stays responsive.
/// Progress events are emitted via `app_handle` as chunks are processed.
#[tauri::command]
pub async fn summarize_document(
    app_handle: tauri::AppHandle,
    db: State<'_, Database>,
    document_id: String,
) -> Result<String, String> {
    // Extract data from State synchronously (State is !Send, so this must
    // happen before any async boundary).
    let (title, cleaned) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let t = conn
            .query_row(
                "SELECT title FROM documents WHERE id = ?1",
                rusqlite::params![&document_id],
                |row| row.get::<_, String>(0),
            )
            .map_err(|e| format!("Document not found: {e}"))?;
        let text = ai::load_document_content(&document_id, &conn)?;
        let c = ai::normalize_whitespace(&text);
        drop(conn);
        (t, c)
    };

    if cleaned.is_empty() {
        return Err("This document has no extracted text to summarize.".to_string());
    }

    // Offload the blocking Ollama calls to a background thread so the UI
    // stays responsive (no more "Not Responding" during summarization).
    let result = spawn_blocking(move || {
        ai::run_summarization(&cleaned, &title, &app_handle)
    })
    .await
    .map_err(|e| format!("Background task failed: {e}"))??;

    Ok(result.summary)
}
