import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "#fff",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 440, textAlign: "center" }}>
        <h1
          style={{ fontSize: 64, fontWeight: 800, color: "#b8f050" }}
        >
          404
        </h1>
        <h2 style={{ fontSize: 20, marginTop: 8 }}>
          Página não encontrada
        </h2>
        <p style={{ opacity: 0.7, marginTop: 8, fontSize: 14 }}>
          O endereço que você tentou acessar não existe.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            marginTop: 16,
            padding: "10px 18px",
            borderRadius: 10,
            background: "#b8f050",
            color: "#0a0a0a",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "Finza — Controle financeiro inteligente com IA" },
      {
        name: "description",
        content:
          "Envie seu extrato e receba uma análise financeira completa feita por IA. Categorização automática, diagnóstico e recomendações personalizadas.",
      },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:title", content: "Finza — Análise financeira com IA" },
      {
        property: "og:description",
        content: "Suba seu extrato e veja a IA analisar seus gastos, categorizar e recomendar onde economizar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="top-right" theme="dark" richColors closeButton />
    </AuthProvider>
  );
}
