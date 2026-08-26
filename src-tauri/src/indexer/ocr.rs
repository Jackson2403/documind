use std::path::Path;
use std::process::Command;

/// Extract text from an image using Tesseract OCR via command line
/// Returns the extracted text as a String
pub fn extract_text_from_image(image_path: &Path) -> Result<String, String> {
    // Check if file exists
    if !image_path.exists() {
        return Err(format!("Image file does not exist: {:?}", image_path));
    }

    // Try to find tesseract - check PATH first, then common installation paths
    let tesseract_cmd = find_tesseract()?;

    // Run tesseract command
    // tesseract <input_image> stdout
    let output = Command::new(&tesseract_cmd)
        .arg(image_path)
        .arg("stdout")
        .output()
        .map_err(|e| format!("Failed to execute tesseract at {}: {}", tesseract_cmd, e))?;

    // Check if command succeeded
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Tesseract failed: {}", stderr));
    }

    // Convert output to string
    let text = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(text)
}

/// Find tesseract executable - check PATH first, then common installation paths
fn find_tesseract() -> Result<String, String> {
    // Try PATH first
    if Command::new("tesseract")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        return Ok("tesseract".to_string());
    }

    // Check common Windows installation paths
    let common_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files\Tesseract\tesseract.exe",
    ];

    for path in &common_paths {
        if Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    Err("Tesseract not found. Please install Tesseract OCR and ensure it's in PATH or installed at a standard location.".to_string())
}
