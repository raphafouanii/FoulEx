import { createFileRoute } from "@tanstack/react-router";
import { findUserByEmail, createSessionToken } from "@/lib/auth-store";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, password } = body;
          if (!email || !password) {
            return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const user = findUserByEmail(email);
          if (!user || user.password !== password) {
            return new Response(JSON.stringify({ error: "Email ou senha incorretos" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
          const token = createSessionToken(user.id);
          return new Response(
            JSON.stringify({
              user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan },
              token,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch {
          return new Response(JSON.stringify({ error: "Erro interno" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});