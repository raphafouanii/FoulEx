import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const initial = (user?.name || user?.email || "?")[0].toUpperCase();
  const display = user?.name || user?.email?.split("@")[0] || "Usuário";

  const navItem = (to: string, label: string, extra?: ReactNode, cls = "") => (
    <Link
      to={to}
      className={`nav-item ${cls} ${path === to ? "active" : ""}`}
      onClick={() => setOpen(false)}
    >
      <span className="nav-text">{label}</span>
      {extra}
    </Link>
  );

  return (
    <div className="fz-app">
      <header className="mobile-topbar">
        <div className="logo-mark">
          <span className="logo-dot" />
          Finza
        </div>
        <button
          className={`hamburger ${open ? "open" : ""}`}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-inner">
          <div className="logo">
            <div className="logo-mark">
              <span className="logo-dot" />
              Finza
            </div>
            <div className="logo-sub">Controle Financeiro</div>
          </div>
          <nav className="nav">
            <div className="nav-label">Principal</div>
            {navItem("/app", "📊 Dashboard")}
            {navItem("/app/transactions", "📋 Transações")}
            {navItem("/app/budget", "🎯 Orçamento")}
            <div className="nav-label" style={{ marginTop: 8 }}>Ferramentas</div>
            {navItem("/app/history", "📜 Histórico")}
            {navItem(
              "/app/ai",
              "✦ Análise IA",
              <span className="nav-badge nav-badge--glow">✦</span>,
              "nav-item--ai"
            )}
            {navItem("/app/premium", "👑 Premium", <span className="nav-badge">PRO</span>)}
          </nav>
          <div className="sidebar-footer">
            <div
              className="user-card"
              onClick={async () => {
                signOut();
                nav({ to: "/login" });
              }}
              title="Sair"
            >
              <div className="avatar">{initial}</div>
              <div className="user-info">
                <div className="user-name">{display}</div>
                <div className="user-plan">Sair</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`sidebar-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />

      <main className="main">{children}</main>
    </div>
  );
}