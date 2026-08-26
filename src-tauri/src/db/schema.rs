use rusqlite::{Connection, Result};

pub fn initialize(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        -- Documents table
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL UNIQUE,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            page_count INTEGER DEFAULT 0,
            indexed_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            tags TEXT DEFAULT '[]'
        );

        -- Per-page content
        CREATE TABLE IF NOT EXISTS document_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            page_num INTEGER NOT NULL,
            content TEXT NOT NULL,
            UNIQUE(document_id, page_num)
        );

        -- FTS5 virtual table for full-text search (standalone, not external content)
        -- document_id stores the UUID so we can map results back to documents
        CREATE VIRTUAL TABLE IF NOT EXISTS fts_documents USING fts5(
            document_id,
            title,
            content
        );

        -- Index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
        CREATE INDEX IF NOT EXISTS idx_documents_indexed_at ON documents(indexed_at);
        "#,
    )?;

    Ok(())
}
