use crate::db::documents::Document;
use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub document: Document,
    pub snippet: String,
    pub rank: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

#[tauri::command]
pub fn search_documents(
    db: State<'_, Database>,
    query: String,
    page: i64,
    per_page: i64,
) -> Result<SearchResponse, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Sanitize query for FTS5 - escape special characters and wrap in quotes for phrase search
    let sanitized_query = sanitize_fts5_query(&query);

    // FTS5 search with BM25 ranking
    let offset = (page - 1) * per_page;

    let mut stmt = conn
        .prepare(
            "SELECT f.document_id, f.content, rank
         FROM fts_documents f
         WHERE fts_documents MATCH ?1
         ORDER BY rank
         LIMIT ?2 OFFSET ?3",
        )
        .map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(params![sanitized_query, per_page, offset], |row| {
            let document_id: String = row.get(0)?;
            let content: String = row.get(1)?;
            let rank: f64 = row.get(2)?;

            Ok((document_id, content, rank))
        })
        .map_err(|e| e.to_string())?;

    let mut search_results = Vec::new();

    for result in results {
        let (document_id, content, rank) = result.map_err(|e| e.to_string())?;

        // Get document by id directly
        let doc = conn.query_row(
            "SELECT id, title, file_path, file_type, file_size, page_count, indexed_at, updated_at, tags
             FROM documents WHERE id = ?1",
            params![document_id],
            |row| {
                let tags_str: String = row.get(8)?;
                let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();

                Ok(Document {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    file_path: row.get(2)?,
                    file_type: row.get(3)?,
                    file_size: row.get(4)?,
                    page_count: row.get(5)?,
                    indexed_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    tags,
                })
            }
        );

        let doc = match doc {
            Ok(d) => d,
            Err(_) => continue, // Skip if document not found
        };

        // Generate snippet (first 200 chars of content)
        let snippet = if content.len() > 200 {
            format!("{}...", &content[..200])
        } else {
            content
        };

        search_results.push(SearchResult {
            document: doc,
            snippet,
            rank,
        });
    }

    // Get total count
    let total: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM fts_documents WHERE fts_documents MATCH ?1",
            params![sanitized_query],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(SearchResponse {
        results: search_results,
        total,
        page,
        per_page,
    })
}

/// Build a safe FTS5 query string from raw user input.
///
/// FTS5 does not do prefix matching by default: the token `oli` only matches the
/// exact token `oli`, not `oligarch`. To support "type-ahead" search we append a
/// trailing `*` (FTS5 prefix query) to the final token, so `oli` matches
/// `oligarch`, `oligarchy`, etc. Multi-word queries get each non-final token
/// escaped and matched exactly, and only the last token is prefix-matched
/// (e.g. `hello wor` -> `hello wor*`).
fn sanitize_fts5_query(query: &str) -> String {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        // Empty query: match nothing instead of erroring on an empty MATCH string.
        return "\"\"".to_string();
    }

    let tokens: Vec<&str> = trimmed.split_whitespace().collect();

    let mut parts: Vec<String> = Vec::with_capacity(tokens.len());

    for (index, token) in tokens.iter().enumerate() {
        let is_last = index == tokens.len() - 1;

        // Strip quotes and asterisks from user input so they can't inject
        // FTS5 syntax; we add our own prefix marker at the end.
        let cleaned: String = token
            .chars()
            .filter(|c| !matches!(c, '"' | '*'))
            .collect();

        if cleaned.is_empty() {
            continue;
        }

        // Escape a token so FTS5 treats it as a literal term (not an operator).
        // Wrap in double quotes and escape any embedded double quotes.
        let escaped = format!("\"{}\"", cleaned.replace('"', "\"\""));

        if is_last {
            // Prefix match on the final token: "oli" -> "oli"*
            parts.push(format!("{}*", escaped));
        } else {
            parts.push(escaped);
        }
    }

    if parts.is_empty() {
        return "\"\"".to_string();
    }

    parts.join(" AND ")
}
