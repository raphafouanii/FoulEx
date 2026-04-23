import { createFileRoute } from "@tanstack/react-router";
import { testAI } from "@/server/analyze.functions";

export const Route = createFileRoute("/api/test-ai")({
  server: {
    handlers: {
      GET: async () => {
        const result = await testAI();

        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});