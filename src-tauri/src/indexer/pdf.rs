use pdf_extract::extract_text_from_mem;
use std::fs;
use std::path::Path;

pub fn extract_pdf_text(file_path: &Path) -> Result<Vec<String>, String> {
    let bytes = fs::read(file_path).map_err(|e| format!("Failed to read PDF file: {}", e))?;

    let text =
        extract_text_from_mem(&bytes).map_err(|e| format!("Failed to extract PDF text: {}", e))?;

    // Split into pages (simple heuristic: split on page breaks)
    let pages = split_into_pages(&text);

    Ok(pages)
}

fn split_into_pages(text: &str) -> Vec<String> {
    // Simple page splitting - in production, use proper PDF page boundaries
    let mut pages = Vec::new();
    let mut current_page = String::new();
    let mut line_count = 0;

    for line in text.lines() {
        current_page.push_str(line);
        current_page.push('\n');
        line_count += 1;

        // Rough heuristic: ~50 lines per page
        if line_count >= 50 {
            pages.push(current_page.clone());
            current_page.clear();
            line_count = 0;
        }
    }

    if !current_page.trim().is_empty() {
        pages.push(current_page);
    }

    if pages.is_empty() {
        pages.push(text.to_string());
    }

    pages
}
