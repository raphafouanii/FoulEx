import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getLatestAnalysis } from "@/server/analyze.functions";
import { fmtMoney, CAT_COLORS, type AnalysisResult } from "@/lib/finza-utils";

export const Route = createFileRoute("/app/budget")({
  component: Budget,
});

function Budget() {
  const { token } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!token) return;
    getLatestAnalysis({ data: { token } })
      .then((d) => setResult(d.result as AnalysisResult | null))
      .catch(() => {});
  }, [token]);

  const cur = result?.currency || "BRL";

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Seu <em>orçamento</em>
          </h1>
          <p className="page-subtitle">Metas geradas pela IA</p>
        </div>
      </div>

      {!result ? (
        <div className="empty-state">
          <div className="empty-icon-sm">🎯</div>
          <p>Faça uma análise para gerar metas de orçamento.</p>
          <Link to="/app/ai" className="btn btn-primary" style={{ marginTop: 16 }}>
            ✦ Analisar agora
          </Link>
        </div>
      ) : (
        <>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card card-highlight-green">
              <div className="metric-label">Balanço do período</div>
              <div className="metric-value metric-xl">
                {fmtMoney(result.metrics.balance, cur)}
              </div>
              <div className="metric-sub">{result.period}</div>
              <div className="progress-bar-bg" style={{ marginTop: 16 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, (result.metrics.expense / Math.max(result.metrics.income, 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="progress-labels">
                <span>Gasto: {fmtMoney(result.metrics.expense, cur)}</span>
                <span>Receita: {fmtMoney(result.metrics.income, cur)}</span>
              </div>
            </div>
            <div className="card">
              <div className="metric-label">Taxa de economia</div>
              <div
                className="metric-value metric-xl"
                style={{ color: "var(--acc)" }}
              >
                {result.metrics.savings_rate.toFixed(1)}%
              </div>
              <div className="metric-sub">
                {result.metrics.savings_rate >= 20
                  ? "Excelente!"
                  : result.metrics.savings_rate >= 10
                    ? "No caminho certo"
                    : "Pode melhorar"}
              </div>
              <div className="economy-badge" style={{ marginTop: 16 }}>
                {result.metrics.savings_rate >= 20
                  ? "🎉 Você está economizando bem"
                  : "💡 Tente reduzir gastos não essenciais"}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Por Categoria</div>
              <span className="pill teal">Análise IA</span>
            </div>
            <div className="budget-grid">
              {result.categories.slice(0, 9).map((c, i) => {
                const pct = Math.min(100, c.percentage);
                const dash = 220;
                const filled = (pct / 100) * dash;
                return (
                  <div key={c.name} className="budget-item">
                    <div className="ring-wrap">
                      <svg width="76" height="76" viewBox="0 0 80 80">
                        <circle className="ring-bg" cx="40" cy="40" r="35" />
                        <circle
                          className="ring-fill"
                          cx="40"
                          cy="40"
                          r="35"
                          style={{
                            stroke: CAT_COLORS[i % CAT_COLORS.length],
                            strokeDasharray: `${filled} ${dash}`,
                          }}
                        />
                      </svg>
                      <div className="ring-label">{pct.toFixed(0)}%</div>
                    </div>
                    <div className="budget-name">{c.name}</div>
                    <div className="budget-sub">
                      {fmtMoney(c.amount, cur)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}