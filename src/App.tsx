import { useState, useEffect, useCallback } from "react";
import type {
  Document,
  SearchResponse,
  DashboardStats,
} from "./types/document";
import {
  getDashboardStats,
  searchDocuments,
  listDocuments,
  indexDocument,
  indexFolder,
} from "./hooks/useTauri";
import { open } from "@tauri-apps/plugin-dialog";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { SearchBar } from "./components/SearchBar";
import { DocumentList } from "./components/DocumentList";
import { DocumentViewer } from "./components/DocumentViewer";
import { AiSummarizer } from "./components/AiSummarizer";

type View = "dashboard" | "search" | "documents" | "viewer" | "ai";
type Theme = "light" | "dark";

const THEME_KEY = "documind-theme";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme (dark mode) state, persisted and applied to <html data-theme>.
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const s = await getDashboardStats();
      setStats(s);
    } catch (e) {
      console.error("Failed to load stats:", e);
      setError(String(e));
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await listDocuments(0, 50);
      setDocuments(docs);
    } catch (e) {
      console.error("Failed to load documents:", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setView("documents");
      return;
    }
    setLoading(true);
    setView("search");
    try {
      const results = await searchDocuments(query, 1, 20);
      setSearchResults(results);
    } catch (e) {
      console.error("Search failed:", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectDocument = useCallback((doc: Document) => {
    setSelectedDoc(doc);
    setView("viewer");
  }, []);

  const handleBack = useCallback(() => {
    setSelectedDoc(null);
    setView("documents");
  }, []);

  const handleAddFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Documents",
            extensions: [
              "pdf",
              "txt",
              "md",
              "csv",
              "log",
              "json",
              "xml",
              "html",
              "png",
              "jpg",
              "jpeg",
              "tiff",
              "bmp",
              "webp",
            ],
          },
        ],
      });
      if (selected && typeof selected === "string") {
        setLoading(true);
        await indexDocument(selected);
        await loadDocuments();
        await loadStats();
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to add file:", e);
      setError(String(e));
      setLoading(false);
    }
  }, [loadDocuments, loadStats]);

  const handleAddFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        setLoading(true);
        const count = await indexFolder(selected);
        await loadDocuments();
        await loadStats();
        setLoading(false);
        if (count > 0) {
          setError(null);
        }
      }
    } catch (e) {
      console.error("Failed to add folder:", e);
      setError(String(e));
      setLoading(false);
    }
  }, [loadDocuments, loadStats]);

  // Listen for AI view request from DocumentViewer
  useEffect(() => {
    const listener = () => setView("ai");
    window.addEventListener("documind-show-ai", listener);
    return () => window.removeEventListener("documind-show-ai", listener);
  }, []);

  useEffect(() => {
    loadStats();
    loadDocuments();
  }, [loadStats, loadDocuments]);

  return (
    <Layout
      currentView={view}
      onNavigate={setView}
      stats={stats}
      onRefresh={loadStats}
      onAddFile={handleAddFile}
      onAddFolder={handleAddFolder}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      <SearchBar onSearch={handleSearch} loading={loading} />

      {view === "dashboard" && (
        <Dashboard
          stats={stats}
          documents={documents}
          onSelectDocument={handleSelectDocument}
          onViewAll={() => setView("documents")}
        />
      )}

      {view === "documents" && (
        <DocumentList
          documents={documents}
          onSelectDocument={handleSelectDocument}
          loading={loading}
          emptyMessage="No documents indexed yet. Click 'Add Folder' to get started."
        />
      )}

      {view === "search" && searchResults && (
        <DocumentList
          documents={searchResults.results.map((r) => r.document)}
          onSelectDocument={handleSelectDocument}
          loading={loading}
          snippets={Object.fromEntries(
            searchResults.results.map((r) => [r.document.id, r.snippet])
          )}
          emptyMessage={`No results found for your query.`}
        />
      )}

      {view === "viewer" && selectedDoc && (
        <DocumentViewer document={selectedDoc} onBack={handleBack} />
      )}

      {view === "ai" && selectedDoc && (
        <AiSummarizer document={selectedDoc} onBack={handleBack} />
      )}

      {error && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            background: "var(--danger-soft)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger)",
            borderRadius: 12,
            padding: "12px 16px",
            maxWidth: 400,
            boxShadow: "var(--shadow-md)",
            zIndex: 1000,
          }}
        >
          <strong>Error:</strong> {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 8,
              fontSize: "0.8em",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </Layout>
  );
}
