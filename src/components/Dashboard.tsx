import type { Document, DashboardStats } from "../types/document";

interface DashboardProps {
  stats: DashboardStats | null;
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
  onViewAll: () => void;
}

export function Dashboard({
  stats,
  documents,
  onSelectDocument,
  onViewAll,
}: DashboardProps) {
  if (!stats) {
    return <div style={styles.loading}>Loading dashboard…</div>;
  }

  const fileTypes = Object.entries(stats.file_types);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.subtitle}>Your knowledge base at a glance</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={styles.statsGrid}>
        <StatCard
          icon="📄"
          label="Documents"
          value={stats.document_count.toLocaleString()}
          accent="var(--brand)"
          accentSoft="var(--brand-soft)"
        />
        <StatCard
          icon="💾"
          label="Storage Used"
          value={formatBytes(stats.total_size_bytes)}
          accent="var(--accent-cyan)"
          accentSoft="rgba(6,182,212,0.12)"
        />
        <StatCard
          icon="🏷️"
          label="File Types"
          value={fileTypes.length.toString()}
          accent="var(--accent-violet)"
          accentSoft="rgba(139,92,246,0.12)"
        />
      </div>

      {/* File type breakdown */}
      {fileTypes.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>File Type Breakdown</h2>
          <div style={styles.chips}>
            {fileTypes.map(([type, count]) => (
              <div key={type} style={styles.chip}>
                <span style={styles.chipIcon}>{getFileIcon(type)}</span>
                <span style={styles.chipLabel}>{type.toUpperCase()}</span>
                <span style={styles.chipCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent documents */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Documents</h2>
          {documents.length > 5 && (
            <button onClick={onViewAll} style={styles.viewAllBtn}>
              View All →
            </button>
          )}
        </div>

        {stats.recent_documents.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: "2.6em", marginBottom: 12 }}>📂</div>
            <p style={{ fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>
              No documents yet
            </p>
            <p style={{ fontSize: "0.9em", color: "var(--text-muted)" }}>
              Click "Add Folder" in the sidebar to get started.
            </p>
          </div>
        ) : (
          <div style={styles.recentList}>
            {stats.recent_documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                style={styles.recentItem}
                onClick={() => onSelectDocument(doc)}
              >
                <div style={styles.recentIcon}>{getFileIcon(doc.file_type)}</div>
                <div style={styles.recentInfo}>
                  <div style={styles.recentTitle}>{doc.title}</div>
                  <div style={styles.recentMeta}>
                    {formatBytes(doc.file_size)} • {doc.page_count} pages •{" "}
                    {new Date(doc.indexed_at).toLocaleDateString()}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  accentSoft,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
  accentSoft: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: accentSoft }}>{icon}</div>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
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
    padding: "28px 32px",
    width: "100%",
    flex: 1,
    minHeight: 0,
    overflow: "auto",
  },
  header: {
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: "1.7em",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "var(--text)",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "0.95em",
    marginTop: 4,
  },
  loading: {
    padding: 60,
    textAlign: "center",
    color: "var(--text-muted)",
    flex: 1,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    background: "var(--bg-elevated)",
    borderRadius: 16,
    padding: 24,
    textAlign: "center",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border)",
    transition: "transform var(--dur-med) var(--ease), box-shadow var(--dur-med) var(--ease)",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    fontSize: "1.5em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  statValue: {
    fontSize: "1.9em",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  statLabel: {
    fontSize: "0.85em",
    color: "var(--text-muted)",
    marginTop: 4,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  section: {
    background: "var(--bg-elevated)",
    borderRadius: 16,
    padding: 24,
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border)",
    marginBottom: 20,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: "1.05em",
    fontWeight: 700,
    color: "var(--text)",
  },
  viewAllBtn: {
    background: "transparent",
    border: "none",
    color: "var(--brand)",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.9em",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    background: "var(--bg-subtle)",
    borderRadius: 999,
    border: "1px solid var(--border)",
  },
  chipIcon: {
    fontSize: "1.1em",
  },
  chipLabel: {
    fontWeight: 700,
    fontSize: "0.85em",
    color: "var(--text)",
  },
  chipCount: {
    fontSize: "0.8em",
    fontWeight: 800,
    color: "var(--brand)",
    background: "var(--brand-soft)",
    borderRadius: 999,
    padding: "2px 8px",
  },
  empty: {
    textAlign: "center",
    padding: 48,
    color: "var(--text-muted)",
  },
  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  recentItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 12px",
    borderRadius: 12,
    cursor: "pointer",
    transition: "background var(--dur-fast) var(--ease)",
  },
  recentIcon: {
    fontSize: "1.5em",
  },
  recentInfo: {
    flex: 1,
    minWidth: 0,
  },
  recentTitle: {
    fontWeight: 700,
    fontSize: "0.95em",
    color: "var(--text)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  recentMeta: {
    fontSize: "0.82em",
    color: "var(--text-muted)",
  },
};
