import { createServerFn } from "@tanstack/react-start";
import {
  findUserById,
  getUserIdFromToken,
  getUserAnalysisCount,
  getAnalysisLimit,
  incrementAnalysisCount,
  addAnalysis,
  getLatestAnalysisForUser,
  getAllAnalysesForUser,
} from "@/lib/auth-store";
import { extractFileText } from "@/lib/file-extract";
import { callAI } from "@/server/ai-provider.server";

const SYSTEM_PROMPT = `Analise o texto abaixo como um extrato financeiro.

Sua tarefa é:
1. Calcular: total de entradas, total de saídas, saldo final
2. Listar transações identificáveis com data, descrição, valor, tipo (credit/debit) e categoria
3. Gerar análise: resumo financeiro e comportamento de gastos (campo "diagnosis")
4. Sugestões: apontar excessos e sugerir melhorias sem dar ordens (campo "recommendations")
5. Categorizar gastos por categoria com valor e percentual

REGRAS:
- NÃO inventar dados. NÃO assumir informações não presentes. Se não tiver certeza, ignore.
- Datas no formato YYYY-MM-DD. Se só houver dia/mês, use o ano mais provável.
- Valores SEMPRE positivos; o tipo ("credit" para entradas, "debit" para saídas) define o sinal.
- Categorias: "Alimentação", "Transporte", "Moradia", "Saúde", "Educação", "Lazer", "Compras", "Assinaturas", "Serviços", "Investimentos", "Transferências", "Salário", "Outros".
- "savings_rate" = (receitas - gastos) / receitas * 100. Se receitas = 0, retorne 0.
- Diagnóstico em português claro, 3-5 frases, falando diretamente com o usuário. Use **negrito** em pontos críticos.
- 4 a 6 recomendações acionáveis e específicas.

Retorne APENAS JSON válido com esta estrutura:
{
  "period": "string com período coberto",
  "currency": "BRL",
  "metrics": { "income": number, "expense": number, "balance": number, "savings_rate": number, "transactions_count": number },
  "transactions": [{ "date": "YYYY-MM-DD", "description": "string", "amount": number, "type": "credit|debit", "category": "string" }],
  "categories": [{ "name": "string", "amount": number, "percentage": number }],
  "diagnosis": "string com resumo e análise",
  "recommendations": ["string"]
}`;

export const analyzeFile = createServerFn({ method: "POST" })
  .inputValidator((input: { fileName: string; fileType: string; fileBase64: string; context?: string; token: string }) => input)
  .handler(async ({ data }) => {
    // Auth check
    const userId = getUserIdFromToken(data.token);
    if (!userId) {
      return { ok: false as const, code: "UNAUTHORIZED", message: "Sessão expirada. Faça login novamente." };
    }

    const user = findUserById(userId);
    if (!user) {
      return { ok: false as const, code: "UNAUTHORIZED", message: "Usuário não encontrado." };
    }

    // Quota check
    const used = getUserAnalysisCount(userId);
    const limit = getAnalysisLimit(userId);
    if (used >= limit) {
      return {
        ok: false as const,
        code: "QUOTA_EXCEEDED",
        plan: user.plan,
        used,
        limit,
        message: user.plan === "free"
          ? "Você usou suas 2 análises gratuitas. Faça upgrade para o Premium e tenha 20 análises por mês."
          : "Você atingiu o limite de 20 análises deste mês. O contador reinicia no início do próximo mês.",
      };
    }

    // Decode file
    let buffer: ArrayBuffer;
    try {
      const bin = atob(data.fileBase64);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      buffer = u8.buffer;
    } catch {
      return { ok: false as const, code: "BAD_FILE", message: "Arquivo inválido." };
    }

    if (buffer.byteLength > 8 * 1024 * 1024) {
      return { ok: false as const, code: "TOO_LARGE", message: "Arquivo acima de 8 MB." };
    }

    // Extract text
    let text = "";
    try {
      text = await extractFileText({ name: data.fileName, type: data.fileType, data: buffer });
    } catch (e) {
      console.error("extract failed", e);
      return { ok: false as const, code: "EXTRACT_FAILED", message: "Não foi possível ler este arquivo." };
    }

    text = text.trim();
    if (text.length < 30) {
      return { ok: false as const, code: "EMPTY", message: "O arquivo parece vazio ou ilegível." };
    }
    if (text.length > 80_000) text = text.slice(0, 80_000);

    const userMsg = `CONTEXTO DO USUÁRIO:\n${data.context || "(sem contexto adicional)"}\n\n=== CONTEÚDO DO ARQUIVO (${data.fileName}) ===\n${text}\n=== FIM DO ARQUIVO ===`;

    const aiResult = await callAI({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: userMsg,
    });

    if (!aiResult.ok) {
      return { ok: false as const, code: aiResult.code, message: aiResult.message };
    }

    const result = aiResult.data;

    // Save analysis
    incrementAnalysisCount(userId);
    const record = addAnalysis(userId, data.fileName, result);

    return {
      ok: true as const,
      analysis: { id: record.id, created_at: record.createdAt, ...result },
      quota: { plan: user.plan, used: used + 1, limit },
    };
  });

export const getMyStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const userId = getUserIdFromToken(data.token);
    if (!userId) return { plan: "free", used: 0, limit: 2 };
    const user = findUserById(userId);
    if (!user) return { plan: "free", used: 0, limit: 2 };
    return {
      plan: user.plan,
      used: getUserAnalysisCount(userId),
      limit: getAnalysisLimit(userId),
    };
  });

export const getLatestAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const userId = getUserIdFromToken(data.token);
    if (!userId) return { result: null };
    const record = getLatestAnalysisForUser(userId);
    return { result: record?.result || null };
  });

export const testAI = createServerFn({ method: "GET" })
  .handler(async () => {
    const result = await callAI({
      systemPrompt: 'Responda apenas em JSON: { "status": "ok" }',
      userMessage: "diga apenas ok",
    });
    return result;
  });

export const getAnalysisHistory = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const userId = getUserIdFromToken(data.token);
    if (!userId) return { ok: false as const, history: [] };
    const records = getAllAnalysesForUser(userId);
    return {
      ok: true as const,
      history: records.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        createdAt: r.createdAt,
        result: r.result,
      })),
    };
  });