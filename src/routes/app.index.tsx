import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getLatestAnalysis } from "@/server/analyze.functions";
import { fmtMoney, CAT_COLORS, CAT_ICONS, type AnalysisResult } from "@/lib/finza-utils";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { token } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    getLatestAnalysis({ data: { token } })
      .then((d) => setResult(d.result as AnalysisResult | null))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  const cur = result?.currency || "BRL";

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Seu <em>painel</em>
          </h1>
          <p className="page-subtitle">
            {result
              ? `Última análise: ${result.period}`
              : "Nenhuma análise realizada ainda"}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/app/ai" className="btn btn-primary">
            ✦ Analisar com IA
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <div className="ai-orb">
            <div className="orb-ring or1" />
            <span className="orb-glyph">✦</span>
          </div>
        </div>
      ) : !result ? (
        <div className="empty-dashboard">
          <div className="empty-visual">
            <div className="ev-ring ev-r1" />
            <div className="ev-ring ev-r2" />
            <div className="ev-ring ev-r3" />
            <div className="ev-icon">📦</div>
          </div>
          <h2 className="empty-title">Pronto para começar?</h2>
          <p className="empty-desc">
            Envie um extrato bancário ou planilha. Nossa IA analisa tudo e
            preenche o painel — categorias, métricas e recomendações
            personalizadas.
          </p>
          <Link to="/app/ai" className="btn btn-primary btn-lg">
            ✦ Fazer primeira análise
          </Link>
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card green">
              <div className="metric-label">Receitas</div>
              <div className="metric-value">
                {fmtMoney(result.metrics.income, cur)}
              </div>
            </div>
            <div className="metric-card red">
              <div className="metric-label">Gastos</div>
              <div className="metric-value">
                {fmtMoney(result.metrics.expense, cur)}
              </div>
            </div>
            <div className="metric-card teal">
              <div className="metric-label">Saldo</div>
              <div className="metric-value">
                {fmtMoney(result.metrics.balance, cur)}
              </div>
            </div>
            <div className="metric-card yellow">
              <div className="metric-label">Taxa de Economia</div>
              <div className="metric-value">
                {result.metrics.savings_rate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid-3-1">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Gastos por Categoria</div>
                  <div className="card-title-sub">
                    Distribuição da análise atual
                  </div>
                </div>
              </div>
              <div className="chart-area">
                {result.categories.slice(0, 8).map((c, i) => {
                  const max = Math.max(
                    ...result.categories.map((x) => x.amount)
                  );
                  const h = max > 0 ? (c.amount / max) * 100 : 0;
                  return (
                    <div
                      key={c.name}
                      className="chart-bar"
                      data-val={`${c.name}: ${fmtMoney(c.amount, cur)}`}
                      style={{
                        height: `${h}%`,
                        background: CAT_COLORS[i % CAT_COLORS.length],
                      }}
                    />
                  );
                })}
              </div>
              <div className="chart-labels">
                {result.categories.slice(0, 8).map((c) => (
                  <span key={c.name} className="chart-label">
                    {c.name.slice(0, 6)}
                  </span>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Categorias</div>
                <span className="pill teal">IA</span>
              </div>
              <div>
                {result.categories.slice(0, 6).map((c, i) => (
                  <div key={c.name} className="cat-item">
                    <div className="cat-row">
                      <span
                        className="cat-dot"
                        style={{
                          background: CAT_COLORS[i % CAT_COLORS.length],
                        }}
                      />
                      <span className="cat-name">{c.name}</span>
                      <span className="cat-amt">
                        {fmtMoney(c.amount, cur)}
                      </span>
                      <span className="cat-pct">
                        {c.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="cat-bar-bg">
                      <div
                        className="cat-bar-fill"
                        style={{
                          width: `${c.percentage}%`,
                          background: CAT_COLORS[i % CAT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Transações Identificadas</div>
                <div className="card-title-sub">
                  {result.metrics.transactions_count} transações analisadas
                </div>
              </div>
              <Link to="/app/transactions" className="btn btn-ghost btn-sm">
                Ver todas →
              </Link>
            </div>
            <div className="tx-list">
              {result.transactions.slice(0, 8).map((t, i) => (
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
            </div>
          </div>
        </>
      )}
    </section>
  );
}