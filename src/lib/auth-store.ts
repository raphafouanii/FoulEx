// In-memory user store for authentication (server-side only)

export interface AppUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "admin" | "normal";
  plan: "free" | "premium";
  analysisCount: number;
  analysisResetMonth: number;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  fileName: string;
  result: any;
  createdAt: string;
}

// In-memory stores
const users: Map<string, AppUser> = new Map();
const analyses: AnalysisRecord[] = [];
let sessionTokens: Map<string, string> = new Map(); // token -> userId

// Seed admin user
function seedAdmin() {
  if (!users.has("admin-001")) {
    users.set("admin-001", {
      id: "admin-001",
      email: "fou@email.com",
      password: "fou12345",
      name: "Admin",
      role: "admin",
      plan: "premium",
      analysisCount: 0,
      analysisResetMonth: new Date().getMonth(),
    });
  }
}
seedAdmin();

export function findUserByEmail(email: string): AppUser | undefined {
  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) return u;
  }
  return undefined;
}

export function findUserById(id: string): AppUser | undefined {
  return users.get(id);
}

export function createUser(email: string, password: string, name: string): AppUser {
  const id = "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  const user: AppUser = {
    id,
    email: email.toLowerCase(),
    password,
    name,
    role: "normal",
    plan: "free",
    analysisCount: 0,
    analysisResetMonth: new Date().getMonth(),
  };
  users.set(id, user);
  return user;
}

export function createSessionToken(userId: string): string {
  const token = "tok_" + Date.now() + "_" + Math.random().toString(36).slice(2, 16);
  sessionTokens.set(token, userId);
  return token;
}

export function getUserIdFromToken(token: string): string | null {
  return sessionTokens.get(token) ?? null;
}

export function removeToken(token: string) {
  sessionTokens.delete(token);
}

export function getUserAnalysisCount(userId: string): number {
  const user = users.get(userId);
  if (!user) return 0;
  const currentMonth = new Date().getMonth();
  if (user.plan === "premium" && user.analysisResetMonth !== currentMonth) {
    user.analysisCount = 0;
    user.analysisResetMonth = currentMonth;
  }
  return user.analysisCount;
}

export function getAnalysisLimit(userId: string): number {
  const user = users.get(userId);
  if (!user) return 0;
  if (user.role === "admin") return 99999;
  return user.plan === "premium" ? 20 : 2;
}

export function incrementAnalysisCount(userId: string) {
  const user = users.get(userId);
  if (user) user.analysisCount++;
}

export function addAnalysis(userId: string, fileName: string, result: any): AnalysisRecord {
  const record: AnalysisRecord = {
    id: "an-" + Date.now(),
    userId,
    fileName,
    result,
    createdAt: new Date().toISOString(),
  };
  analyses.push(record);
  return record;
}

export function getLatestAnalysisForUser(userId: string): AnalysisRecord | null {
  for (let i = analyses.length - 1; i >= 0; i--) {
    if (analyses[i].userId === userId) return analyses[i];
  }
  return null;
}

export function getAllAnalysesForUser(userId: string): AnalysisRecord[] {
  return analyses.filter((a) => a.userId === userId).reverse();
}