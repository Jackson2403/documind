use std::fs;
use std::path::Path;

pub fn extract_text_file(file_path: &Path) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| format!("Failed to read text file: {}", e))
}
