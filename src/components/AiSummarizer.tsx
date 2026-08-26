import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import type { Document } from "../types/document";
import { summarizeDocument } from "../hooks/useTauri";

interface AiSummarizerProps {
  document: Document;
  onBack: () => void;
}

export function AiSummarizer({ document, onBack }: AiSummarizerProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    const unlisten = listen<string>("summarize-progress", (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleSummarise = async () => {
    setLoading(true);
    setProgress(null);
    setError(null);
    try {
      const result = await summarizeDocument(document.id);
      setSummary(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <button onClick={onBack} style={styles.backBtn}>
            ← Back
          </button>
        </div>
        <div style={styles.headerInfo}>
          <h1 style={styles.title}>AI Summarization</h1>
          <div style={styles.meta}>
            <span>📄 {document.title}</span>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>{progress ?? "Generating summary…"}</p>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <div style={{ fontSize: "1.6em", marginBottom: 8 }}>⚠️</div>
            <div style={{ marginBottom: 12 }}>Error: {error}</div>
            <button onClick={onBack} style={styles.errorBtn}>
              ← Back
            </button>
          </div>
        )}

        {summary && (
          <div style={styles.summaryBox}>
            <div style={styles.summaryHeader}>
              <span style={{ fontSize: "1.4em" }}>🧠</span>
              <span style={styles.summaryTitle}>Summary</span>
            </div>
            <pre style={styles.summaryText}>{summary}</pre>
          </div>
        )}

        {!summary && !loading && !error && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "3em" }}>🧠</div>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Generate an AI summary of this document using your local LLM.
            </p>
            <button onClick={handleSummarise} style={styles.actionBtn}>
              🎯 Generate Summary
            </button>
          </div>
        )}
      </div>
    </div>
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
  },
  headerTop: { marginBottom: 16 },
  backBtn: {
    background: "var(--bg-subtle)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: "0.9em",
    fontWeight: 600,
  },
  headerInfo: { flex: 1 },
  title: {
    fontSize: "1.5em",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    marginBottom: 4,
    color: "var(--text)",
  },
  meta: {
    display: "flex",
    gap: 8,
    color: "var(--text-muted)",
    fontSize: "0.9em",
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: "24px 32px",
    width: "100%",
  },
  loadingCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: "60px 0",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid var(--border-strong)",
    borderTopColor: "var(--brand)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  loadingText: {
    color: "var(--text-muted)",
    fontSize: "1.05em",
  },
  error: {
    background: "var(--danger-soft)",
    border: "1px solid var(--danger-border)",
    borderRadius: 16,
    padding: 24,
    color: "var(--danger)",
    textAlign: "center",
  },
  errorBtn: {
    background: "var(--bg-subtle)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },
  summaryBox: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
    boxShadow: "var(--shadow-sm)",
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1px solid var(--border)",
  },
  summaryTitle: {
    fontSize: "1.1em",
    fontWeight: 700,
    color: "var(--text)",
  },
  summaryText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "inherit",
    lineHeight: 1.7,
    fontSize: "0.95em",
    color: "var(--text)",
    maxHeight: "60vh",
    overflow: "auto",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "60px 0",
  },
  actionBtn: {
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    cursor: "pointer",
    fontSize: "1em",
    fontWeight: 700,
    transition: "opacity var(--dur-fast) var(--ease)",
  },
};
