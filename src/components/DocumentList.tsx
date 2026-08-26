import type { Document } from "../types/document";

interface DocumentListProps {
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
  loading?: boolean;
  snippets?: Record<string, string>;
  emptyMessage?: string;
}

export function DocumentList({
  documents,
  onSelectDocument,
  loading,
  snippets,
  emptyMessage = "No documents found.",
}: DocumentListProps) {
  if (loading) {
    return <div style={styles.loading}>Loading…</div>;
  }

  if (documents.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: "2.6em", marginBottom: 12 }}>🔍</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.countBar}>
        {documents.length} document{documents.length === 1 ? "" : "s"}
      </div>
      <div style={styles.grid}>
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            snippet={snippets?.[doc.id]}
            onClick={() => onSelectDocument(doc)}
          />
        ))}
      </div>
    </div>
  );
}

interface DocumentCardProps {
  document: Document;
  snippet?: string;
  onClick: () => void;
}

function DocumentCard({ document, snippet, onClick }: DocumentCardProps) {
  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardHeader}>
        <div style={styles.fileIcon}>{getFileIcon(document.file_type)}</div>
        <div style={styles.cardTitleWrap}>
          <div style={styles.cardTitle}>{document.title}</div>
          <span style={styles.badge}>{document.file_type.toUpperCase()}</span>
        </div>
      </div>

      {snippet && <div style={styles.snippet}>{snippet}</div>}

      <div style={styles.cardMeta}>
        <span>{formatBytes(document.file_size)}</span>
        <span>•</span>
        <span>{document.page_count} pages</span>
        <span>•</span>
        <span>{new Date(document.indexed_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function getFileIcon(fileType: string): string {
  const icons: Record<string, string> = {
    pdf: "📕",
    txt: "📝",
    md: "📝",
    csv: "📊",
    doc: "📘",
    docx: "📘",
    png: "🖼️",
    jpg: "🖼️",
    jpeg: "🖼️",
    tiff: "🖼️",
    bmp: "🖼️",
    webp: "🖼️",
    json: "🧾",
    xml: "🧾",
    html: "🌐",
    log: "📋",
  };
  return icons[fileType.toLowerCase()] || "📄";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "24px 32px",
    flex: 1,
    minHeight: 0,
    overflow: "auto",
  },
  countBar: {
    fontSize: "0.85em",
    fontWeight: 700,
    color: "var(--text-muted)",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  loading: {
    padding: 60,
    textAlign: "center",
    color: "var(--text-muted)",
    flex: 1,
  },
  empty: {
    padding: 80,
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "1.05em",
    flex: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
  },
  card: {
    background: "var(--bg-elevated)",
    borderRadius: 16,
    padding: 20,
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border)",
    transition: "transform var(--dur-med) var(--ease), box-shadow var(--dur-med) var(--ease), border-color var(--dur-med) var(--ease)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  fileIcon: {
    fontSize: "2em",
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: "1em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "var(--text)",
  },
  badge: {
    alignSelf: "flex-start",
    fontSize: "0.7em",
    fontWeight: 800,
    letterSpacing: "0.05em",
    color: "var(--brand)",
    background: "var(--brand-soft)",
    borderRadius: 999,
    padding: "2px 8px",
  },
  snippet: {
    fontSize: "0.9em",
    color: "var(--text-secondary)",
    marginBottom: 12,
    padding: "10px 12px",
    background: "var(--bg-subtle)",
    borderRadius: 10,
    lineHeight: 1.6,
    maxHeight: 80,
    overflow: "hidden",
  },
  cardMeta: {
    display: "flex",
    gap: 8,
    fontSize: "0.82em",
    color: "var(--text-muted)",
  },
};
