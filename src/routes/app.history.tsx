import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAnalysisHistory } from "@/server/analyze.functions";
import { fmtMoney, type AnalysisResult } from "@/lib/finza-utils";

export const Route = createFileRoute("/app/history")({
  component: HistoryPage,
});

interface HistoryItem {
  id: string;
  fileName: string;
  createdAt: string;
  result: any;
}

function HistoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!token) return;
    getAnalysisHistory({ data: { token } })
      .then((res) => {
        if (res.ok) setItems(res.history);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📜 Histórico</h1>
            <p className="page-subtitle">Carregando...</p>
          </div>
        </div>
      </section>
    );
  }

  if (selected) {
    const r = selected.result as AnalysisResult | null;
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📜 Histórico</h1>
            <p className="page-subtitle">{selected.fileName}</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setSelected(null)}>
            ← Voltar
          </button>
        </div>
        {r && r.metrics ? (
          <div className="result-wrap">
            <div className="result-header">
              <div>
                <div className="card-title" style={{ fontSize: 20 }}>
                  {selected.fileName}
                </div>
                <div className="card-title-sub">
                  {new Date(selected.createdAt).toLocaleString("pt-BR")} · {r.period || ""}
                </div>
              </div>
            </div>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-emoji">💰</div>
                <div className="insight-label">Receitas</div>
                <div className="insight-val">{fmtMoney(r.metrics.income, r.currency)}</div>
              </div>
              <div className="insight-card">
                <div className="insight-emoji">💸</div>
                <div className="insight-label">Gastos</div>
                <div className="insight-val">{fmtMoney(r.metrics.expense, r.currency)}</div>
              </div>
              <div className="insight-card">
                <div className="insight-emoji">📊</div>
                <div className="insight-label">Economia</div>
                <div className="insight-val">{r.metrics.savings_rate?.toFixed(1) || "0"}%</div>
              </div>
            </div>
            {r.diagnosis && (
              <div className="ai-commentary">
                <div className="ai-comment-label">✦ Diagnóstico da IA</div>
                <div
                  className="ai-comment-body"
                  dangerouslySetInnerHTML={{
                    __html: r.diagnosis.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              </div>
            )}
            {r.recommendations && r.recommendations.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <div className="card-title">📋 Recomendações</div>
                </div>
                <ul className="rec-list">
                  {r.recommendations.map((rec, i) => (
                    <li key={i} className="rec-item">
                      <span className="rec-num">{String(i + 1).padStart(2, "0")}</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "var(--txt2)" }}>
              {typeof r === "string" ? r : JSON.stringify(r, null, 2)}
            </pre>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📜 Histórico</h1>
          <p className="page-subtitle">Suas análises anteriores</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ color: "var(--txt2)" }}>Nenhuma análise realizada ainda.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ padding: 16, cursor: "pointer" }} onClick={() => setSelected(item)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--txt)" }}>📄 {item.fileName}</div>
                  <div style={{ fontSize: 13, color: "var(--txt2)", marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 13 }}>
                  Ver análise →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}