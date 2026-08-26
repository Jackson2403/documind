import React, { useState } from "react";
import type { DashboardStats } from "../types/document";

type View = "dashboard" | "search" | "documents" | "viewer" | "ai";
type Theme = "light" | "dark";

interface LayoutProps {
  currentView: View;
  onNavigate: (view: View) => void;
  stats: DashboardStats | null;
  onRefresh: () => void;
  onAddFile: () => void;
  onAddFolder: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  documents: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

export function Layout({
  currentView,
  onNavigate,
  stats,
  onRefresh,
  onAddFile,
  onAddFolder,
  theme,
  onToggleTheme,
  children,
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      <nav
        style={{
          width: collapsed ? 72 : 240,
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          transition: "width var(--dur-med) var(--ease)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
            padding: "0 6px",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          {!collapsed && (
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              DocuMind
            </span>
          )}
        </div>

        {/* Grouped nav */}
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {!collapsed && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--sidebar-text-muted)",
                padding: "8px 10px 6px",
              }}
            >
              Overview
            </div>
          )}
          <NavItem
            icon={icons.dashboard}
            label="Dashboard"
            active={currentView === "dashboard"}
            onClick={() => onNavigate("dashboard")}
            collapsed={collapsed}
          />
          <NavItem
            icon={icons.search}
            label="Search"
            active={currentView === "search"}
            onClick={() => onNavigate("search")}
            collapsed={collapsed}
          />

          {!collapsed && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--sidebar-text-muted)",
                padding: "16px 10px 6px",
                marginTop: 4,
              }}
            >
              Library
            </div>
          )}
          <NavItem
            icon={icons.documents}
            label="Documents"
            active={currentView === "documents" || currentView === "viewer" || currentView === "ai"}
            onClick={() => onNavigate("documents")}
            collapsed={collapsed}
          />
        </div>

        {/* Stats */}
        {!collapsed && (
          <div
            style={{
              marginTop: 8,
              padding: "14px 10px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {stats ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--sidebar-text)" }}>
                  <span>📄</span>
                  <span>{stats.document_count} documents</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--sidebar-text)" }}>
                  <span>💾</span>
                  <span>{formatBytes(stats.total_size_bytes)}</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--sidebar-text-muted)" }}>
                ⏳ Loading…
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <ActionButton onClick={onAddFile} collapsed={collapsed} primary>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            {!collapsed && "Add File"}
          </ActionButton>
          <ActionButton onClick={onAddFolder} collapsed={collapsed}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            {!collapsed && "Add Folder"}
          </ActionButton>
        </div>

        {/* Bottom controls */}
        <div
          style={{
            marginTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 12,
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            gap: 8,
          }}
        >
          <button
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              color: "var(--sidebar-text)",
              border: "none",
              borderRadius: 8,
              padding: "9px 10px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "background var(--dur-fast) var(--ease)",
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
            {!collapsed && (theme === "dark" ? "Light" : "Dark")}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.06)",
              color: "var(--sidebar-text)",
              border: "none",
              borderRadius: 8,
              padding: "9px 10px",
              cursor: "pointer",
              fontSize: 14,
              transition: "background var(--dur-fast) var(--ease)",
            }}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Refresh (compact, only when expanded) */}
        {!collapsed && (
          <button
            onClick={onRefresh}
            style={{
              marginTop: 8,
              background: "transparent",
              color: "var(--sidebar-text-muted)",
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 12,
              textAlign: "left",
              transition: "color var(--dur-fast) var(--ease)",
            }}
          >
            ↻ Refresh data
          </button>
        )}
      </nav>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          background: "var(--bg)",
        }}
      >
        {children}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        position: "relative",
        background: active ? "var(--sidebar-active-bg)" : "transparent",
        color: active ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
        fontSize: "0.95em",
        fontWeight: active ? 700 : 500,
        transition: "all var(--dur-fast) var(--ease)",
        justifyContent: collapsed ? "center" : "flex-start",
      }}
    >
      <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
      {active && !collapsed && (
        <div
          style={{
            width: 3,
            height: 16,
            background: "var(--brand)",
            borderRadius: 2,
            position: "absolute",
            right: -4,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
      )}
    </button>
  );
}

function ActionButton({
  onClick,
  collapsed,
  primary,
  children,
}: {
  onClick: () => void;
  collapsed: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: primary ? "var(--brand)" : "rgba(255,255,255,0.08)",
        color: primary ? "#fff" : "var(--sidebar-text)",
        border: "none",
        borderRadius: 10,
        padding: "10px 12px",
        cursor: "pointer",
        fontSize: "0.9em",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 8,
        transition: "all var(--dur-fast) var(--ease)",
      }}
    >
      {children}
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
