import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) nav({ to: "/app" });
  }, [user, loading, nav]);

  return (
    <main className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="landing-logo">✦</span>
          <span>Finza</span>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-ghost">
            Entrar
          </Link>
          <Link to="/login" className="btn btn-primary">
            Criar conta grátis
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <span className="landing-pill">✦ IA Financeira em português</span>
        <h1 className="landing-title">
          Seu extrato analisado por <em>IA</em>
          <br />
          em menos de 30 segundos
        </h1>
        <p className="landing-sub">
          Envie um PDF, CSV ou planilha e receba uma análise financeira completa:
          categorização automática, diagnóstico personalizado e recomendações reais
          para economizar dinheiro.
        </p>
        <div className="landing-cta">
          <Link to="/login" className="btn btn-primary btn-lg">
            Começar grátis →
          </Link>
          <span className="landing-cta-note">2 análises grátis · sem cartão</span>
        </div>

        <div className="landing-features">
          <div className="lf-card">
            <div className="lf-emoji">📄</div>
            <div className="lf-title">Aceita qualquer extrato</div>
            <div className="lf-text">
              PDF, CSV, XLSX, OFX e TXT — de qualquer banco brasileiro.
            </div>
          </div>
          <div className="lf-card">
            <div className="lf-emoji">✦</div>
            <div className="lf-title">IA de verdade</div>
            <div className="lf-text">
              Categoriza, diagnostica e te diz onde está sangrando dinheiro.
            </div>
          </div>
          <div className="lf-card">
            <div className="lf-emoji">🔒</div>
            <div className="lf-title">100% seguro</div>
            <div className="lf-text">
              Seus dados são processados com segurança e nunca compartilhados.
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} Finza · Feito com IA para sua vida financeira
      </footer>
    </main>
  );
}
