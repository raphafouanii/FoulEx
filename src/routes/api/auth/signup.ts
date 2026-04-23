import { createFileRoute } from "@tanstack/react-router";
import { findUserByEmail, createUser, createSessionToken } from "@/lib/auth-store";

export const Route = createFileRoute("/api/auth/signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, password, name } = body;
          if (!email || !password) {
            return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          if (password.length < 6) {
            return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const existing = findUserByEmail(email);
          if (existing) {
            return new Response(JSON.stringify({ error: "Este email já está cadastrado" }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            });
          }
          const user = createUser(email, password, name || email.split("@")[0]);
          const token = createSessionToken(user.id);
          return new Response(
            JSON.stringify({
              user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan },
              token,
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
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