import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { getLatestAnalysis } from "@/server/analyze.functions";
import { fmtMoney, CAT_ICONS, type AnalysisResult } from "@/lib/finza-utils";

export const Route = createFileRoute("/app/transactions")({
  component: Tx,
});

function Tx() {
  const { token } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!token) return;
    getLatestAnalysis({ data: { token } })
      .then((d) => setResult(d.result as AnalysisResult | null))
      .catch(() => {});
  }, [token]);

  const cur = result?.currency || "BRL";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [type, setType] = useState("");

  const cats = useMemo(
    () => Array.from(new Set(result?.transactions.map((t) => t.category) ?? [])),
    [result]
  );

  const filtered = useMemo(() => {
    if (!result) return [];
    return result.transactions.filter(
      (t) =>
        (!q || t.description.toLowerCase().includes(q.toLowerCase())) &&
        (!cat || t.category === cat) &&
        (!type || t.type === type)
    );
  }, [result, q, cat, type]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Todas as <em>transações</em>
          </h1>
          <p className="page-subtitle">
            Identificadas e categorizadas pela IA
          </p>
        </div>
      </div>

      {!result ? (
        <div className="empty-state">
          <div className="empty-icon-sm">📋</div>
          <p>Nenhuma transação ainda. Faça uma análise primeiro.</p>
          <Link to="/app/ai" className="btn btn-primary" style={{ marginTop: 16 }}>
            ✦ Analisar agora
          </Link>
        </div>
      ) : (
        <>
          <div className="filter-row">
            <div className="search-wrap">
              <svg
                className="search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="filter-input"
                placeholder="Buscar transação..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              <option value="credit">Receitas</option>
              <option value="debit">Gastos</option>
            </select>
          </div>
          <div className="card">
            <div className="tx-list">
              {filtered.map((t, i) => (
                <div key={i} className="tx-item">
                  <div
                    className="tx-icon"
                    style={{ background: "var(--surface2)" }}
                  >
                    {CAT_ICONS[t.category] || "💳"}
                  </div>
                  <div className="tx-info">
                    <div className="tx-name">{t.description}</div>
                    <div className="tx-cat">{t.category}</div>
                  </div>
                  <div className="tx-right">
                    <div
                      className={`tx-amount ${t.type === "credit" ? "credit" : ""}`}
                    >
                      {t.type === "credit" ? "+" : "-"}
                      {fmtMoney(t.amount, cur)}
                    </div>
                    <div className="tx-date">{t.date}</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--muted-c)",
                    padding: 24,
                  }}
                >
                  Nenhuma transação corresponde aos filtros.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}