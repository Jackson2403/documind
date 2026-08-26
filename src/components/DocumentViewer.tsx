import React, { useState, useEffect } from "react";
import type { Document } from "../types/document";
import { getDocumentContent } from "../hooks/useTauri";

interface DocumentViewerProps {
  document: Document;
  onBack: () => void;
}

interface Page {
  page_num: number;
  content: string;
}

export function DocumentViewer({ document, onBack }: DocumentViewerProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const safeDoc = document ?? ({} as Document);
  const title = safeDoc.title ?? "Untitled";
  const fileType = (safeDoc.file_type ?? "").toUpperCase();
  const fileSize = Number.isFinite(safeDoc.file_size) ? safeDoc.file_size : 0;
  const pageCount = Number.isFinite(safeDoc.page_count) ? safeDoc.page_count : 0;

  let indexedDate = "Unknown";
  try {
    const d = new Date(safeDoc.indexed_at as string);
    if (!isNaN(d.getTime())) {
      indexedDate = d.toLocaleDateString();
    }
  } catch {
    indexedDate = "Unknown";
  }

  useEffect(() => {
    let cancelled = false;
    async function loadContent() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDocumentContent(safeDoc.id as string);
        if (cancelled) return;
        setPages(Array.isArray(result) ? result : []);
      } catch (e) {
        if (cancelled) return;
        setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (safeDoc.id) {
      loadContent();
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [safeDoc.id]);

  return (
    <div style={styles.container}>
      {/* Sticky header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <button onClick={onBack} style={styles.backBtn}>
            ← Back
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("documind-show-ai"));
            }}
            style={styles.aiBtn}
          >
            ✨ Summarize with AI
          </button>
        </div>
        <div style={styles.headerInfo}>
          <h1 style={styles.title}>{title}</h1>
          <div style={styles.meta}>
            <span style={styles.badge}>{fileType || "FILE"}</span>
            <span>{formatBytes(fileSize)}</span>
            <span>•</span>
            <span>{pageCount} pages</span>
            <span>•</span>
            <span>Indexed {indexedDate}</span>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {loading && <div style={styles.loading}>Loading content…</div>}
        {error && (
          <div style={styles.error}>
            Error loading content: {error}
            <button onClick={onBack} style={styles.backBtn}>
              ← Go Back
            </button>
          </div>
        )}
        {!loading && !error && pages.length === 0 && (
          <div style={styles.empty}>No content available for this document.</div>
        )}
        {!loading &&
          !error &&
          pages.map((page) => (
            <div key={page.page_num} style={styles.page}>
              <div style={styles.pageHeader}>Page {page.page_num}</div>
              <div style={styles.pageContent}>{page.content}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, Math.min(i, sizes.length - 1))).toFixed(1)) +
    " " +
    sizes[Math.min(i, sizes.length - 1)]
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-elevated)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  backBtn: {
    background: "var(--bg-subtle)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: "0.9em",
    fontWeight: 600,
    transition: "all var(--dur-fast) var(--ease)",
  },
  aiBtn: {
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 18px",
    cursor: "pointer",
    fontSize: "0.9em",
    fontWeight: 700,
    transition: "opacity var(--dur-fast) var(--ease)",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: "1.6em",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    marginBottom: 8,
    color: "var(--text)",
  },
  meta: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "var(--text-muted)",
    fontSize: "0.85em",
  },
  badge: {
    fontSize: "0.72em",
    fontWeight: 800,
    letterSpacing: "0.05em",
    color: "var(--brand)",
    background: "var(--brand-soft)",
    borderRadius: 999,
    padding: "3px 10px",
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: 24,
    width: "100%",
  },
  loading: {
    textAlign: "center",
    padding: 40,
    color: "var(--text-muted)",
  },
  error: {
    background: "var(--danger-soft)",
    border: "1px solid var(--danger-border)",
    borderRadius: 12,
    padding: 16,
    color: "var(--danger)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "flex-start",
  },
  empty: {
    textAlign: "center",
    padding: 60,
    color: "var(--text-muted)",
  },
  page: {
    marginBottom: 24,
    padding: 24,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
  },
  pageHeader: {
    fontSize: "0.8em",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid var(--border)",
  },
  pageContent: {
    lineHeight: 1.75,
    whiteSpace: "pre-wrap",
    fontSize: "0.95em",
    color: "var(--text)",
  },
};
