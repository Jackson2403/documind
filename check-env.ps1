#!/usr/bin/env pwsh
# DocuMind - Environment Check Script

Write-Host "DocuMind - Checking Environment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>&1
    Write-Host " $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " NOT FOUND" -ForegroundColor Red
    Write-Host "  → Install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version 2>&1
    Write-Host " $npmVersion" -ForegroundColor Green
} catch {
    Write-Host " NOT FOUND" -ForegroundColor Red
    $allGood = $false
}

# Check Rust
Write-Host "Checking Rust..." -NoNewline
try {
    $rustVersion = rustc --version 2>&1
    Write-Host " $rustVersion" -ForegroundColor Green
} catch {
    Write-Host " NOT FOUND" -ForegroundColor Red
    Write-Host "  → Install Rust: winget install Rustlang.Rustup" -ForegroundColor Yellow
    Write-Host "  → Then run: rustup default stable-msvc" -ForegroundColor Yellow
    $allGood = $false
}

# Check Cargo
Write-Host "Checking Cargo..." -NoNewline
try {
    $cargoVersion = cargo --version 2>&1
    Write-Host " $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host " NOT FOUND" -ForegroundColor Red
    $allGood = $false
}

# Check node_modules
Write-Host "Checking node_modules..." -NoNewline
if (Test-Path "node_modules") {
    Write-Host " INSTALLED" -ForegroundColor Green
} else {
    Write-Host " NOT INSTALLED" -ForegroundColor Red
    Write-Host "  → Run: npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Check project files
Write-Host ""
Write-Host "Checking project files..." -ForegroundColor Cyan

$requiredFiles = @(
    "package.json",
    "src/App.tsx",
    "src/main.tsx",
    "src-tauri/Cargo.toml",
    "src-tauri/tauri.conf.json",
    "src-tauri/src/main.rs",
    "src-tauri/src/lib.rs"
)

foreach ($file in $requiredFiles) {
    Write-Host "  $file..." -NoNewline
    if (Test-Path $file) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " MISSING" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to build DocuMind:" -ForegroundColor Cyan
    Write-Host "  npm run tauri dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Some checks failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install missing dependencies and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick setup:" -ForegroundColor Cyan
    Write-Host "  1. Install Rust: winget install Rustlang.Rustup" -ForegroundColor White
    Write-Host "  2. Set toolchain: rustup default stable-msvc" -ForegroundColor White
    Write-Host "  3. Install VS Build Tools (C++ workload)" -ForegroundColor White
    Write-Host "  4. Run: npm install" -ForegroundColor White
    Write-Host "  5. Run: npm run tauri dev" -ForegroundColor White
    Write-Host ""
}
