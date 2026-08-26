use chrono::Utc;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: i64,
    pub page_count: i32,
    pub indexed_at: String,
    pub updated_at: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentContent {
    pub page_num: i32,
    pub content: String,
}

pub fn insert_document(
    conn: &Connection,
    title: &str,
    file_path: &str,
    file_type: &str,
    file_size: i64,
    page_count: i32,
) -> Result<Document> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let tags = "[]";

    conn.execute(
        "INSERT INTO documents (id, title, file_path, file_type, file_size, page_count, indexed_at, updated_at, tags)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, title, file_path, file_type, file_size, page_count, now, now, tags],
    )?;

    Ok(Document {
        id,
        title: title.to_string(),
        file_path: file_path.to_string(),
        file_type: file_type.to_string(),
        file_size,
        page_count,
        indexed_at: now.clone(),
        updated_at: now,
        tags: vec![],
    })
}

pub fn insert_document_content(
    conn: &Connection,
    document_id: &str,
    page_num: i32,
    content: &str,
) -> Result<()> {
    conn.execute(
        "INSERT INTO document_content (document_id, page_num, content)
         VALUES (?1, ?2, ?3)",
        params![document_id, page_num, content],
    )?;

    Ok(())
}

pub fn update_fts_index(
    conn: &Connection,
    document_id: &str,
    title: &str,
    content: &str,
) -> Result<()> {
    // Insert into standalone FTS5 table with document_id for lookup
    conn.execute(
        "INSERT INTO fts_documents (document_id, title, content) VALUES (?1, ?2, ?3)",
        params![document_id, title, content],
    )?;

    Ok(())
}

pub fn list_documents(conn: &Connection, offset: i64, limit: i64) -> Result<Vec<Document>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, file_path, file_type, file_size, page_count, indexed_at, updated_at, tags
         FROM documents
         ORDER BY indexed_at DESC
         LIMIT ?1 OFFSET ?2"
    )?;

    let documents = stmt.query_map(params![limit, offset], |row| {
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
    })?;

    documents.collect()
}

pub fn delete_document(conn: &Connection, id: &str) -> Result<()> {
    // Delete from FTS by document_id
    conn.execute(
        "DELETE FROM fts_documents WHERE document_id = ?1",
        params![id],
    )?;

    // Delete document (cascades to content)
    conn.execute("DELETE FROM documents WHERE id = ?1", params![id])?;

    Ok(())
}

pub fn get_document_by_id(conn: &Connection, id: &str) -> Result<Option<Document>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, file_path, file_type, file_size, page_count, indexed_at, updated_at, tags
         FROM documents WHERE id = ?1"
    )?;

    let result = stmt.query_row(params![id], |row| {
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
    });

    match result {
        Ok(doc) => Ok(Some(doc)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn get_document_by_path(conn: &Connection, file_path: &str) -> Result<Option<Document>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, file_path, file_type, file_size, page_count, indexed_at, updated_at, tags
         FROM documents WHERE file_path = ?1"
    )?;

    let result = stmt.query_row(params![file_path], |row| {
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
    });

    match result {
        Ok(doc) => Ok(Some(doc)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn get_document_content(conn: &Connection, document_id: &str) -> Result<Vec<DocumentContent>> {
    let mut stmt = conn.prepare(
        "SELECT page_num, content FROM document_content
         WHERE document_id = ?1
         ORDER BY page_num",
    )?;

    let contents = stmt.query_map(params![document_id], |row| {
        Ok(DocumentContent {
            page_num: row.get(0)?,
            content: row.get(1)?,
        })
    })?;

    contents.collect()
}

pub fn get_document_count(conn: &Connection) -> Result<i64> {
    conn.query_row("SELECT COUNT(*) FROM documents", [], |row| row.get(0))
}

pub fn get_total_size(conn: &Connection) -> Result<i64> {
    conn.query_row(
        "SELECT COALESCE(SUM(file_size), 0) FROM documents",
        [],
        |row| row.get(0),
    )
}

pub fn get_file_type_counts(conn: &Connection) -> Result<Vec<(String, i64)>> {
    let mut stmt = conn.prepare("SELECT file_type, COUNT(*) FROM documents GROUP BY file_type")?;

    let counts = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;

    counts.collect()
}
