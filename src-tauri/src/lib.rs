mod ai;
mod commands;
mod db;
mod indexer;

use commands::documents::{
    delete_document, get_dashboard_stats, get_document_content, index_document, index_folder,
    list_documents, summarize_document,
};
use commands::search::search_documents;
use db::Database;

pub fn run() {
    let app_data_dir = dirs::data_dir()
        .unwrap_or_else(|| std::env::current_dir().expect("Failed to get current directory"))
        .join("documind");

    std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
    let db_path = app_data_dir.join("documind.db");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Database::new(db_path).expect("Failed to open DB"))
        .invoke_handler(tauri::generate_handler![
            get_dashboard_stats,
            list_documents,
            index_document,
            index_folder,
            delete_document,
            get_document_content,
            search_documents,
            summarize_document,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
