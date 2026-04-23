import { createServerFn } from "@tanstack/react-start";
import {
  findUserByEmail,
  findUserById,
  createUser,
  createSessionToken,
  getUserIdFromToken,
  removeToken,
} from "@/lib/auth-store";

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const user = findUserByEmail(data.email);
    if (!user || user.password !== data.password) {
      throw new Error("Email ou senha incorretos");
    }
    const token = createSessionToken(user.id);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan },
      token,
    };
  });

export const signupFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string; name: string }) => input)
  .handler(async ({ data }) => {
    if (data.password.length < 6) throw new Error("Senha deve ter no mínimo 6 caracteres");
    const existing = findUserByEmail(data.email);
    if (existing) throw new Error("Este email já está cadastrado");
    const user = createUser(data.email, data.password, data.name);
    const token = createSessionToken(user.id);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan },
      token,
    };
  });

export const googleSimulateFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; name: string }) => input)
  .handler(async ({ data }) => {
    let user = findUserByEmail(data.email);
    if (!user) {
      user = createUser(data.email, "google-oauth-" + Date.now(), data.name);
    }
    const token = createSessionToken(user.id);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan },
      token,
    };
  });