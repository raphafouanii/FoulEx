import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getMyStatus } from "@/server/analyze.functions";

export const Route = createFileRoute("/app/premium")({
  component: Premium,
});

function Premium() {
  const { token } = useAuth();
  const [status, setStatus] = useState<{ plan: string; used: number; limit: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyStatus({ data: { token } }).then(setStatus).catch(() => {});
  }, [token]);

  const isPremium = status?.plan === "premium";

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Plano <em>Premium</em>
          </h1>
          <p className="page-subtitle">
            Mais análises, mais controle do seu dinheiro
          </p>
        </div>
      </div>

      {status && (
        <div className="usage-bar-wrap">
          <div className="usage-info">
            Análises usadas {isPremium ? "este mês" : "(plano grátis)"}
            <strong>
              {status.used} / {status.limit}
            </strong>
          </div>
          <div className="ai-badge">
            <span className="ai-dot" />
            Plano {isPremium ? "Premium" : "Grátis"}
          </div>
        </div>
      )}

      <div className="premium-hero">
        <div className="premium-crown">👑</div>
        <h2
          style={{
            fontFamily: "'DM Serif Display',serif",
            fontSize: 32,
            marginBottom: 8,
          }}
        >
          Desbloqueie o{" "}
          <em style={{ color: "var(--acc)", fontStyle: "italic" }}>
            poder total
          </em>{" "}
          da IA
        </h2>
        <p
          style={{
            color: "var(--txt2)",
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          20 análises completas todo mês, histórico ilimitado e prioridade no
          processamento.
        </p>
      </div>

      <div className="plan-grid">
        <div className="plan-card">
          {!isPremium && <span className="plan-badge-curr">Atual</span>}
          <div className="plan-name">Grátis</div>
          <div className="plan-price">
            <em>R$ 0</em>
          </div>
          <div className="plan-period">para sempre</div>
          <ul className="plan-features">
            <li>2 análises de IA no total</li>
            <li>Dashboard completo</li>
            <li>Categorização automática</li>
            <li>Recomendações personalizadas</li>
          </ul>
        </div>

        <div className="plan-card premium">
          <span className="plan-badge-best">Mais escolhido</span>
          {isPremium && <span className="plan-badge-curr">Atual</span>}
          <div className="plan-name">Premium</div>
          <div className="plan-price">
            <em>R$ 19,90</em>
          </div>
          <div className="plan-period">por mês · cancele quando quiser</div>
          <ul className="plan-features">
            <li>
              <strong>20 análises</strong> de IA por mês
            </li>
            <li>Histórico completo de análises</li>
            <li>Suporte prioritário</li>
            <li>Acesso a novos modelos primeiro</li>
            <li>Sem anúncios</li>
          </ul>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() =>
              toast.info(
                "💡 Demonstração: o pagamento ainda não está ativo. Esta é apenas a tela visual do plano Premium."
              )
            }
          >
            Assinar Premium · R$ 19,90/mês
          </button>
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "var(--txt2)",
              textAlign: "center",
              opacity: 0.7,
            }}
          >
            🛈 Tela demonstrativa — o checkout não está ativo nesta versão.
          </p>
        </div>
      </div>
    </section>
  );
}