<div align="center">

# 📚 DocuMind

**Privacy-first document search & AI summarization — 100% local, zero cloud.**  
*Built with Rust + Tauri v2 + React + Ollama*

<br />

[![GitHub release](https://img.shields.io/badge/release-v0.1.0-6366f1?style=flat-square)](https://github.com/Jackson2403/documind)
[![License: MIT](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)](LICENSE)
[![Rust](https://img.shields.io/badge/Rust-1.85%2B-f74c00?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Tauri](https://img.shields.io/badge/Tauri-v2-ffc131?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/DB-SQLite_FTS5-003b57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-8b5cf6?style=flat-square)](CONTRIBUTING.md)

<br />

https://github.com/user-attachments/assets/00000000-0000-0000-0000-000000000000  
<!-- Replace the URL above with a real screenshot or screen recording once available -->

</div>

---

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| 📄 **Document Indexing** | ✅ | PDF, TXT, MD, CSV, JSON, XML, HTML, and images via OCR |
| 🔍 **Full-Text Search** | ✅ | SQLite FTS5 with BM25 ranking — type-ahead prefix matching included |
| 🧠 **AI Summarization** | ✅ | Local LLM (Ollama) with smart chunking for large documents |
| 🌙 **Dark Mode** | ✅ | Light/dark theme with system preference detection |
| 🖼️ **OCR Support** | ✅ | Tesseract-powered text extraction for scanned documents & images |
| 📊 **Dashboard** | ✅ | Document count, storage stats, file-type breakdown, recent activity |
| 📖 **Document Viewer** | ✅ | Per-page content view with search-result snippet highlighting |
| 🔒 **100% Private** | ✅ | Everything runs locally — no data ever leaves your machine |

---

## 🧩 Architecture

```
┌──────────────────────────────────────────────────┐
│                  DocuMind App                    │
│                                                  │
│  ┌──────────────┐      ┌──────────────────────┐  │
│  │  React UI     │◄────►│  Tauri IPC Bridge    │  │
│  │  (TypeScript) │ Tauri│  (JSON-RPC)           │  │
│  └──────────────┘      └──────┬───────────────┘  │
│                               │                    │
│  ┌────────────────────────────▼─────────────────┐ │
│  │              Rust Backend                     │ │
│  │  ┌─────────┐ ┌────────┐ ┌────────────────┐  │ │
│  │  │ Indexer  │ │ Search │ │  AI (Ollama)   │  │ │
│  │  │ PDF/Text │ │  FTS5  │ │ Chunk+Summarize│  │ │
│  │  │ OCR      │ │  BM25  │ │                │  │ │
│  │  └────┬─────┘ └───┬────┘ └───────┬────────┘  │ │
│  │       │           │              │            │ │
│  │       ▼           ▼              ▼            │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │  SQLite Database (document_content + FTS) │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
  ┌──────┴──────┐     ┌──────┴──────┐
  │  Local Files │     │  Ollama     │
  │  (PDFs, etc) │     │  (localhost) │
  └─────────────┘     └─────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop Shell** | [Tauri v2](https://tauri.app) — lightweight, secure native wrapper |
| **Frontend** | React 18 + TypeScript 5.6 + Vite 6 |
| **Backend** | Rust 2021 edition (staticlib + cdylib) |
| **Database** | SQLite via rusqlite with FTS5 full-text search |
| **PDF Extraction** | [pdf-extract](https://crates.io/crates/pdf-extract) |
| **OCR** | Tesseract (via system install) |
| **AI** | Ollama REST API (`phi4-mini` / `qwen2.5:0.5b`) |
| **Search** | BM25-ranked FTS5 with prefix matching |

## 📦 Prerequisites

### Windows

```powershell
# 1. Install Rust
winget install Rustlang.Rustup
rustup default stable-msvc

# 2. Install Visual Studio Build Tools
#  → https://visualstudio.microsoft.com/visual-cpp-build-tools/
#  → Select "Desktop development with C++" + Windows 10/11 SDK

# 3. WebView2 (pre-installed on Win10/11)
winget install Microsoft.EdgeWebView2Runtime

# 4. Node.js dependencies
npm install
```

### macOS / Linux

```bash
# Rust (via rustup)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable

# Node.js
npm install
```

## 🚀 Quick Start

```bash
# Development mode (hot-reload frontend)
npm run tauri dev

# Production build
npm run tauri build

# The built app will be in src-tauri/target/release/bundle/
```

When running `npm run tauri dev`:
1. Vite dev server starts on port 1420
2. Rust backend compiles (first build: 2-5 min)
3. DocuMind window opens automatically

### AI Summarization (Optional)

Install [Ollama](https://ollama.com) and pull a model:

```bash
ollama pull phi4-mini    # Recommended (2.8B params, fast)
ollama pull qwen2.5:0.5b # Lightweight alternative (500M params)
```

DocuMind auto-detects Ollama at `localhost:11434` and falls back gracefully if unavailable.

## 📁 Project Structure

```
documind/
├── src/                          # React frontend
│   ├── components/
│   │   ├── Layout.tsx           # App shell with sidebar + dark mode
│   │   ├── SearchBar.tsx        # Search input with prefix hints
│   │   ├── Dashboard.tsx        # Stats, recent docs, file types
│   │   ├── DocumentList.tsx     # Document grid with snippets
│   │   ├── DocumentViewer.tsx   # Per-page content reader
│   │   └── AiSummarizer.tsx     # Ollama-powered summarization
│   ├── styles/
│   │   ├── theme.css            # Design tokens (light + dark)
│   │   └── global.css           # Base styles + scrollbar + fonts
│   ├── hooks/useTauri.ts        # Tauri IPC wrappers
│   ├── types/document.ts        # TypeScript interfaces
│   ├── App.tsx                  # Main app (routing, state, theme)
│   └── main.tsx                 # React entry point
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── ai/mod.rs            # Ollama client + chunked summarization
│   │   ├── commands/
│   │   │   ├── documents.rs     # Document CRUD + stats + summarize
│   │   │   └── search.rs        # FTS5 search with sanitize + prefix
│   │   ├── db/
│   │   │   ├── schema.rs        # SQLite schema (documents, FTS5)
│   │   │   └── documents.rs     # Query builders
│   │   ├── indexer/
│   │   │   ├── mod.rs           # Dispatch by file extension
│   │   │   ├── pdf.rs           # PDF text via pdf-extract
│   │   │   ├── text.rs          # Plain text file reader
│   │   │   └── ocr.rs           # Tesseract image -> text
│   │   ├── lib.rs               # Plugin registration + Tauri setup
│   │   └── main.rs              # Entry point
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/                   # App icons (32x32, 128x128, ico, icns)
├── .github/
│   └── ISSUE_TEMPLATE/          # Bug report + feature request templates
├── package.json                 # Node.js dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite build config
├── check-env.ps1                # Environment verification script
└── LICENSE                      # MIT
```

## 🗃️ Database Location

| OS | Path |
|----|------|
| **Windows** | `%APPDATA%\documind\documind.db` |
| **macOS** | `~/Library/Application Support/documind/documind.db` |
| **Linux** | `~/.local/share/documind/documind.db` |

## 📖 Usage Guide

### Indexing Documents

Use the sidebar buttons:
- **Add File** — Index a single PDF, text file, or image
- **Add Folder** — Recursively index an entire directory

### Searching

DocuMind supports **prefix matching** — type a partial word and it will match longer terms:

| You type | Matches |
|----------|---------|
| `oli` | `oligarch`, `oligarchy`, `oligotrophic` |
| `con` | `constitution`, `control`, `content` |
| `hello wor` | `hello world` (multi-word with prefix) |

Results are ranked by BM25 relevance and show a snippet of the matching content.

### AI Summarization

1. Open any document in the viewer
2. Click **✨ Summarize with AI**
3. DocuMind automatically:
   - Loads the full document text
   - Chunks large documents (4,000-char chunks with overlap)
   - Summarizes chunks in parallel (4 concurrent threads)
   - Merges chunk summaries into a final coherent summary

Requires [Ollama](https://ollama.com) running locally with a compatible model.

## 🔒 Privacy & Security

DocuMind is designed with privacy as a core principle:

- ✅ **100% Local** — No internet connection required
- ✅ **No Cloud** — Documents never leave your machine
- ✅ **Open Source** — Fully auditable codebase
- ✅ **No Telemetry** — Zero tracking, analytics, or usage data
- ✅ **No Account** — No sign-up, login, or API keys needed
- ✅ **Local AI** — Summarization runs on your hardware via Ollama

## 🧭 Roadmap

### Phase 1-3: MVP ✅

- [x] Project scaffold + SQLite database
- [x] Document indexer (PDF, text, images)
- [x] Full-text search with FTS5 + BM25 ranking
- [x] Dashboard with stats and recent documents
- [x] Document viewer with pagination
- [x] Dark mode + design system
- [x] AI summarization with chunked processing

### Phase 4: OCR & Image Pipeline

- [ ] Tesseract OCR for scanned documents (basic support exists)
- [ ] Image preprocessing (deskew, threshold, DPI normalization)
- [ ] Multi-page TIFF support

### Phase 5: Advanced AI

- [ ] Document Q&A (retrieval-augmented generation)
- [ ] Cross-document search with semantic ranking
- [ ] Custom prompt templates for summarization
- [ ] Model selection UI (pick Ollama model from the app)

### Phase 6: Quality of Life

- [ ] File system watcher (auto-index on file changes)
- [ ] Tag management and filtering
- [ ] Export to PDF / TXT / Markdown
- [ ] Drag-and-drop document import
- [ ] Batch re-index / repair

## 🤝 Contributing

Contributions of all kinds are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

**Quick ways to help:**
- 🐛 Report bugs via [Issues](https://github.com/Jackson2403/documind/issues)
- 💡 Suggest features via [Feature Requests](https://github.com/Jackson2403/documind/issues/new?template=feature_request.md)
- 🛠️ Open a [Pull Request](https://github.com/Jackson2403/documind/pulls)
- ⭐ Star the repo to show support

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ using Rust + Tauri + React**  
[Report Bug](https://github.com/Jackson2403/documind/issues) · [Request Feature](https://github.com/Jackson2403/documind/issues/new?template=feature_request.md) · [Star on GitHub](https://github.com/Jackson2403/documind)

</div>