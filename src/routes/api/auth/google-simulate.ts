import { createFileRoute } from "@tanstack/react-router";
import { findUserByEmail, createUser, createSessionToken } from "@/lib/auth-store";

export const Route = createFileRoute("/api/auth/google-simulate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, name } = body;
          let user = findUserByEmail(email || `google.${Date.now()}@gmail.com`);
          if (!user) {
            user = createUser(
              email || `google.${Date.now()}@gmail.com`,
              "google-oauth-" + Date.now(),
              name || "Usuário Google"
            );
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