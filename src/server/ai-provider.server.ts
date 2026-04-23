// AI Provider abstraction — supports Lovable Gateway, OpenAI, and Groq

interface AIProviderConfig {
  url: string;
  model: string;
  apiKey: string;
  name: string;
}

export function getAIProvider(): AIProviderConfig | null {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  const apiKey = process.env.API_KEY || "";
  const lovableKey = process.env.LOVABLE_API_KEY || "";

  console.log("[AI DEBUG] AI_PROVIDER env:", provider || "(não definido)");
  console.log("[AI DEBUG] API_KEY presente:", apiKey ? "SIM" : "NÃO");
  console.log("[AI DEBUG] LOVABLE_API_KEY presente:", lovableKey ? "SIM" : "NÃO");

  if (provider === "groq" && apiKey) {
    console.log("[AI DEBUG] Usando provider: Groq (llama-3.3-70b-versatile)");
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      model: "llama-3.3-70b-versatile",
      apiKey,
      name: "Groq",
    };
  }

  if (provider === "openai" && apiKey) {
    console.log("[AI DEBUG] Usando provider: OpenAI (gpt-4o-mini)");
    return {
      url: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      apiKey,
      name: "OpenAI",
    };
  }

  // Fallback: Lovable AI Gateway
  if (lovableKey) {
    console.log("[AI DEBUG] Usando provider: Lovable AI Gateway (gemini-2.5-flash)");
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      model: "google/gemini-2.5-flash",
      apiKey: lovableKey,
      name: "Lovable",
    };
  }

  console.error("[AI DEBUG] Nenhum provider configurado!");
  return null;
}

export async function callAI(opts: {
  systemPrompt: string;
  userMessage: string;
  tools?: any[];
  toolChoice?: any;
}): Promise<{ ok: true; data: any } | { ok: false; code: string; message: string }> {
  const provider = getAIProvider();
  if (!provider) {
    return { ok: false, code: "NO_AI", message: "IA não configurada. Defina AI_PROVIDER e API_KEY, ou LOVABLE_API_KEY." };
  }

  const body: any = {
    model: provider.model,
    messages: [
      { role: "system", content: opts.systemPrompt },
      { role: "user", content: opts.userMessage },
    ],
  };

  if (opts.tools && opts.toolChoice && provider.name === "Lovable") {
    body.tools = opts.tools;
    body.tool_choice = opts.toolChoice;
  }

  let resp: Response;
  try {
    resp = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    console.error(`[AI DEBUG] Fetch falhou (${provider.name}):`, e.message);
    return { ok: false, code: "AI_DOWN", message: `Serviço de IA (${provider.name}) indisponível.` };
  }

  if (resp.status === 401 || resp.status === 403) {
    const t = await resp.text().catch(() => "");
    console.error(`[AI DEBUG] Token inválido (${provider.name}):`, resp.status, t);
    return { ok: false, code: "AUTH_FAIL", message: `Chave de API inválida para ${provider.name}. Verifique API_KEY.` };
  }

  if (resp.status === 429) {
    console.error(`[AI DEBUG] Rate limit (${provider.name})`);
    return { ok: false, code: "RATE", message: "Muitas requisições. Tente novamente em alguns segundos." };
  }

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    console.error(`[AI DEBUG] Erro API (${provider.name}):`, resp.status, t);
    return { ok: false, code: "AI_ERR", message: `Erro na IA (${provider.name}): ${resp.status}. Tente novamente.` };
  }

  const json = await resp.json();
  console.log("[AI DEBUG] Resposta recebida com sucesso");

  const choice = json.choices?.[0];
  if (!choice) {
    return { ok: false, code: "AI_PARSE", message: "Resposta vazia da IA." };
  }

  const toolCall = choice.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      return { ok: true, data: JSON.parse(toolCall.function.arguments) };
    } catch {
      return { ok: true, data: toolCall.function.arguments };
    }
  }

  const content = choice.message?.content || "";
  if (!content) {
    return { ok: false, code: "AI_PARSE", message: "Resposta vazia da IA." };
  }

  // Try to parse as JSON, otherwise return raw content
  try {
    return { ok: true, data: JSON.parse(content) };
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return { ok: true, data: JSON.parse(jsonMatch[1].trim()) };
      } catch {}
    }
    const braceStart = content.indexOf("{");
    const braceEnd = content.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
      try {
        return { ok: true, data: JSON.parse(content.slice(braceStart, braceEnd + 1)) };
      } catch {}
    }
    // Return raw text content when not JSON
    return { ok: true, data: { raw: content } };
  }
}