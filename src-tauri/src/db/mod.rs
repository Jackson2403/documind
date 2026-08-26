use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub mod documents;
pub mod schema;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Enable foreign keys
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        // Initialize schema
        schema::initialize(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
