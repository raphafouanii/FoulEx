import { createFileRoute } from "@tanstack/react-router";
import { removeToken } from "@/lib/auth-store";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") || "";
        if (auth.startsWith("Bearer ")) {
          removeToken(auth.slice(7));
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});