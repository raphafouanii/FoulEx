export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
}

export interface AnalysisResult {
  period: string;
  currency: "BRL" | "USD" | "EUR";
  metrics: {
    income: number;
    expense: number;
    balance: number;
    savings_rate: number;
    transactions_count: number;
  };
  transactions: Transaction[];
  categories: { name: string; amount: number; percentage: number }[];
  diagnosis: string;
  recommendations: string[];
}

export function fmtMoney(v: number, currency = "BRL") {
  const sym: Record<string, string> = { BRL: "R$", USD: "$", EUR: "€" };
  return `${sym[currency] || "R$"} ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const CAT_COLORS = [
  "#b8f050", "#50f0c8", "#f0c850", "#f05050",
  "#80a0f0", "#c850f0", "#f08050", "#50d0f0",
];

export const CAT_ICONS: Record<string, string> = {
  Alimentação: "🍔", Transporte: "🚗", Moradia: "🏠", Saúde: "⚕️",
  Educação: "📚", Lazer: "🎬", Compras: "🛍️", Assinaturas: "📺",
  Serviços: "🔧", Investimentos: "📈", Transferências: "↔️",
  Salário: "💰", Outros: "💳",
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      res(s.split(",")[1] || "");
    };
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}