pub mod ocr;
pub mod pdf;
pub mod text;

use std::path::Path;

pub enum ExtractedContent {
    Pdf(Vec<String>), // Pages
    Text(String),     // Single content
    Ocr(Vec<String>), // OCR pages
}

pub fn extract_content(file_path: &Path) -> Result<ExtractedContent, String> {
    let extension = file_path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    match extension.as_str() {
        "pdf" => {
            let pages = pdf::extract_pdf_text(file_path)?;
            Ok(ExtractedContent::Pdf(pages))
        }
        "txt" | "md" | "csv" | "log" | "json" | "xml" | "html" => {
            let content = text::extract_text_file(file_path)?;
            Ok(ExtractedContent::Text(content))
        }
        "png" | "jpg" | "jpeg" | "tiff" | "bmp" | "webp" => {
            let content = ocr::extract_text_from_image(file_path)?;
            Ok(ExtractedContent::Ocr(vec![content]))
        }
        _ => Err(format!("Unsupported file type: {}", extension)),
    }
}
