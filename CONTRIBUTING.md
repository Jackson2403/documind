# Contributing to DocuMind

First off, thanks for taking the time to contribute! 🎉

DocuMind is a privacy-first local document search and AI summarization tool built with Rust + Tauri + React. Every contribution — whether a bug report, feature suggestion, or pull request — makes the project better.

## Code of Conduct

By participating you agree to be respectful and constructive. Harassment, trolling, and personal attacks are not tolerated.

## How Can I Contribute?

### 🐛 Reporting Bugs

Open a [bug report](https://github.com/Jackson2403/documind/issues/new?template=bug_report.md) and include:

- Steps to reproduce (clear and exact)
- What you expected to happen
- Your OS, DocuMind version, and (if relevant) Ollama version
- Screenshots or error logs

### ✨ Suggesting Features

Open a [feature request](https://github.com/Jackson2403/documind/issues/new?template=feature_request.md) and describe:

- The problem you're trying to solve
- The solution you'd like
- Any alternatives you've considered

### 🛠️ Pull Requests

1. **Fork** the repository.
2. **Create a branch** for your change: `git checkout -b feat/my-feature` or `fix/my-bug`.
3. **Make your changes** following the style guidelines below.
4. **Test** — run both `npm run build` (frontend) and `cargo build` (backend).
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add OCR image support`
   - `fix: resolve FTS5 prefix search`
   - `docs: update README with new screenshots`
   - `refactor: extract chunking logic into shared module`
6. **Push** and open a Pull Request against `main`.

## Development Setup

```bash
# Prerequisites: Rust, Node.js, VS Build Tools
# See README.md for full setup instructions.

npm install
npm run tauri dev   # hot-reload development mode
npm run tauri build # production build
```

### Code Style

- **Rust**: `cargo fmt` before committing. Use `cargo clippy` to catch common issues.
- **TypeScript / React**: Prefer explicit types over `any`. Use `const` over `let` where possible.
- **CSS**: Use CSS custom properties from `theme.css` — avoid hard-coded colors.
- **Inline styles**: Keep `React.CSSProperties` style objects at the bottom of the component file, grouped under a single `const styles` record.

## Project Structure

```
documind/
├── src/                    # React frontend
│   ├── components/          # UI components
│   ├── hooks/               # Tauri IPC wrappers
│   ├── styles/              # Design system (theme.css, global.css)
│   └── types/               # TypeScript interfaces
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── ai/              # Ollama summarization
│   │   ├── commands/        # Tauri IPC command handlers
│   │   ├── db/              # SQLite + FTS5
│   │   └── indexer/         # PDF/text/image extraction
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

## Questions?

Open a [Discussion](https://github.com/Jackson2403/documind/discussions) or ask in the issue tracker.

---

**Thank you for helping make DocuMind better!** 🚀