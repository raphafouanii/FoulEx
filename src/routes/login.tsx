import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { user, loading, login, signup, googleLogin } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/app" });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (tab === "signup") {
        await signup(email, password, name || email.split("@")[0]);
        toast.success("Conta criada com sucesso!");
      } else {
        await login(email, password);
      }
      nav({ to: "/app" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await googleLogin();
      toast.success("Login com Google realizado!");
      nav({ to: "/app" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar com Google");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-dot" />
          Finza
        </div>
        <div className="auth-sub">Controle financeiro inteligente</div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => setTab("signup")}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={submit}>
          {tab === "signup" && (
            <div className="sfield">
              <label className="slabel">Nome</label>
              <input
                className="filter-input no-icon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
          )}
          <div className="sfield">
            <label className="slabel">Email</label>
            <input
              type="email"
              required
              className="filter-input no-icon"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="sfield">
            <label className="slabel">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              className="filter-input no-icon"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={busy}
          >
            {busy
              ? "Aguarde..."
              : tab === "login"
                ? "Entrar"
                : "Criar conta grátis"}
          </button>
        </form>

        <div className="auth-divider">ou</div>

        <button type="button" className="google-btn" onClick={handleGoogle} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.5 34.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.5 5.5C41 35 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"
            />
          </svg>
          Continuar com Google
        </button>

        <p
          style={{
            marginTop: 20,
            fontSize: 11.5,
            color: "var(--muted-c)",
            textAlign: "center",
          }}
        >
          Plano grátis: 2 análises de IA. Premium: 20 análises por mês.
        </p>
      </div>
    </div>
  );
}