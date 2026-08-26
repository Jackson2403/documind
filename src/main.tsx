import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

interface ErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error.message || String(error) };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#f9fafb",
            color: "#111",
            fontFamily: "system-ui, sans-serif",
            padding: 40,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", marginBottom: 24, maxWidth: 500 }}>
            {this.state.error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
