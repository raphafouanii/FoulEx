import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { analyzeFile, getMyStatus } from "@/server/analyze.functions";
import { fileToBase64, fmtMoney, type AnalysisResult } from "@/lib/finza-utils";

export const Route = createFileRoute("/app/ai")({
  component: AIPage,
});

const ACCEPT = ".pdf,.csv,.xlsx,.xls,.txt,.ofx";

function AIPage() {
  const nav = useNavigate();
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [stage, setStage] = useState<"idle" | "loading" | "result" | "error">("idle");
  const [step, setStep] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<{ plan: string; used: number; limit: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyStatus({ data: { token } }).then(setStatus).catch(() => {});
  }, [token]);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Arquivo acima de 8 MB");
      return;
    }
    setFile(f);
    setStage("idle");
    setResult(null);
  };

  const submit = async () => {
    if (!file || !token) return;
    setStage("loading");
    setStep(0);
    const interval = setInterval(() => setStep((s) => (s < 4 ? s + 1 : s)), 1100);
    try {
      const fileBase64 = await fileToBase64(file);
      const res = await analyzeFile({
        data: { fileName: file.name, fileType: file.type, fileBase64, context, token },
      });

      clearInterval(interval);
      if (!res.ok) {
        if (res.code === "QUOTA_EXCEEDED") {
          toast.error(res.message);
          nav({ to: "/app/premium" });
          setStage("idle");
          return;
        }
        setErrMsg(res.message);
        setStage("error");
        return;
      }
      setResult(res.analysis);
      setStage("result");
      toast.success("Análise concluída!");
    } catch (e: any) {
      clearInterval(interval);
      setErrMsg(e.message || "Erro inesperado");
      setStage("error");
    }
  };

  const STEPS = [
    "📄 Lendo o arquivo",
    "🔍 Identificando transações",
    "🏷️ Categorizando gastos",
    "📊 Calculando métricas",
    "💡 Gerando recomendações",
  ];

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Análise <em>com IA</em>
          </h1>
          <p className="page-subtitle">
            Nossa IA lê seu extrato e gera insights reais
          </p>
        </div>
        {status && (
          <div className="ai-badge">
            <span className="ai-dot" />
            {status.plan === "premium" ? "Premium" : "Grátis"} · {status.used}/
            {status.limit}
          </div>
        )}
      </div>

      {stage === "idle" && (
        <>
          {!file ? (
            <div className="upload-zone">
              <input
                type="file"
                accept={ACCEPT}
                onChange={(e) => onPick(e.target.files?.[0] || null)}
              />
              <div className="upload-content">
                <div className="upload-anim-wrap">
                  <div className="upload-pulse" />
                  <span className="upload-emoji">📄</span>
                </div>
                <div className="upload-title">
                  Arraste ou clique para enviar
                </div>
                <div className="upload-sub">
                  Extrato bancário, fatura ou planilha (até 8 MB)
                </div>
                <div className="upload-tags">
                  <span className="utag">PDF</span>
                  <span className="utag">CSV</span>
                  <span className="utag">XLSX</span>
                  <span className="utag">TXT</span>
                  <span className="utag">OFX</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="file-preview">
                <div className="fp-icon">📄</div>
                <div className="fp-info">
                  <div className="fp-name">{file.name}</div>
                  <div className="fp-meta">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button className="fp-remove" onClick={() => setFile(null)}>
                  ✕
                </button>
              </div>
              <div className="context-box">
                <label className="ctx-label">
                  💬 Contexto adicional (opcional)
                </label>
                <textarea
                  className="ctx-textarea"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ex: Sou freelancer, moro em SP, recebi um bônus em março..."
                  maxLength={2000}
                />
              </div>
              <div className="action-row">
                <button className="btn btn-ghost" onClick={() => setFile(null)}>
                  Cancelar
                </button>
                <button className="btn btn-primary btn-lg" onClick={submit}>
                  ✦ Analisar com IA
                </button>
              </div>
            </>
          )}
        </>
      )}

      {stage === "loading" && (
        <div className="loading-wrap">
          <div className="ai-orb">
            <div className="orb-ring or1" />
            <div className="orb-ring or2" />
            <div className="orb-ring or3" />
            <span className="orb-glyph">✦</span>
          </div>
          <div className="loading-title">IA processando seu extrato…</div>
          <div className="loading-steps">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`lstep ${i < step ? "lstep--done" : i === step ? "lstep--active" : ""}`}
              >
                <span className="lstep-icon">{s.split(" ")[0]}</span>{" "}
                {s.substring(s.indexOf(" ") + 1)}
              </div>
            ))}
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="loading-wrap">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div className="loading-title">Erro na análise</div>
          <p
            style={{
              color: "var(--txt2)",
              maxWidth: 440,
              margin: "0 auto 20px",
            }}
          >
            {errMsg}
          </p>
          <button className="btn btn-ghost" onClick={() => setStage("idle")}>
            Tentar novamente
          </button>
        </div>
      )}

      {stage === "result" && result && (
        <div className="result-wrap">
          <div className="result-header">
            <div>
              <div className="card-title" style={{ fontSize: 20 }}>
                Análise Concluída
              </div>
              <div className="card-title-sub">{result.period}</div>
            </div>
            <div className="ai-badge">
              <span className="ai-dot" />
              IA Analisou
            </div>
          </div>

          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-emoji">💰</div>
              <div className="insight-label">Receitas</div>
              <div className="insight-val">
                {fmtMoney(result.metrics.income, result.currency)}
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-emoji">💸</div>
              <div className="insight-label">Gastos</div>
              <div className="insight-val">
                {fmtMoney(result.metrics.expense, result.currency)}
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-emoji">📊</div>
              <div className="insight-label">Economia</div>
              <div className="insight-val">
                {result.metrics.savings_rate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="ai-commentary">
            <div className="ai-comment-label">✦ Diagnóstico da IA</div>
            <div
              className="ai-comment-body"
              dangerouslySetInnerHTML={{
                __html: result.diagnosis.replace(
                  /\*\*(.+?)\*\*/g,
                  "<strong>$1</strong>"
                ),
              }}
            />
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">📋 Recomendações Personalizadas</div>
            </div>
            <ul className="rec-list">
              {result.recommendations.map((r, i) => (
                <li key={i} className="rec-item">
                  <span className="rec-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="result-footer">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setStage("idle");
                setFile(null);
                setContext("");
                setResult(null);
              }}
            >
              Nova análise
            </button>
            <Link to="/app" className="btn btn-primary">
              Ver painel →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}