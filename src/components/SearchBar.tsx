import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputWrap}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your documents…"
            style={styles.input}
          />
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={styles.clearBtn}
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? (
            <span style={styles.spinner} />
          ) : (
            "Search"
          )}
        </button>
      </form>
      <div style={styles.hint}>
        Tip: type a partial word (e.g. <code>oli</code>) to match longer terms like{" "}
        <code>oligarch</code>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: "20px 32px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-elevated)",
    flexShrink: 0,
  },
  form: {
    display: "flex",
    gap: 10,
    width: "100%",
  },
  inputWrap: {
    flex: 1,
    position: "relative",
  },
  input: {
    width: "100%",
    padding: "12px 44px 12px 46px",
    fontSize: "0.95em",
    border: "1px solid var(--border)",
    borderRadius: 12,
    outline: "none",
    background: "var(--bg)",
    color: "var(--text)",
    boxShadow: "var(--shadow-xs)",
    transition: "all var(--dur-fast) var(--ease)",
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "0.85em",
    padding: 4,
  },
  button: {
    padding: "12px 24px",
    background: "var(--brand)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.9em",
    minWidth: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background var(--dur-fast) var(--ease)",
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  hint: {
    margin: "10px 0 0",
    fontSize: "0.8em",
    color: "var(--text-muted)",
  },
};
