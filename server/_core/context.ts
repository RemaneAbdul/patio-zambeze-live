import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSupabaseUserFromAccessToken } from "../supabaseAuth";
import { getGarconProfileByLegacyUserId, getUserByOpenId } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function getBearerToken(authorization: unknown): string {
  if (typeof authorization !== "string") return "";
  const match = authorization.match(/^Bearer\\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

async function resolveSupabaseUser(accessToken: string): Promise<User | null> {
  const supabaseUser = await getSupabaseUserFromAccessToken(accessToken);
  if (!supabaseUser?.id) return null;

  // The database identity is deliberately bound to the exact Supabase Auth UUID.
  // Never fall back to email/name matching: the canonical key is supabase:<UUID>.
  const expectedOpenId = `supabase:${supabaseUser.id}`;
  const legacyUser = await getUserByOpenId(expectedOpenId);
  if (!legacyUser || legacyUser.openId !== expectedOpenId) return null;

  if (legacyUser.role === "admin") {
    return legacyUser.waiterActive === 1 ? legacyUser : null;
  }

  const garconProfile = await getGarconProfileByLegacyUserId(legacyUser.id);
  if (
    !garconProfile ||
    garconProfile.authUserId !== supabaseUser.id ||
    garconProfile.role !== "GARCOM" ||
    garconProfile.status !== "ATIVO"
  ) {
    return null;
  }

  return { ...legacyUser, role: "garcom", waiterActive: 1 };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const accessToken = getBearerToken(opts.req.headers.authorization);
  const authProvider = String(opts.req.headers["x-auth-provider"] ?? "").trim().toLowerCase();

  // A Supabase bearer is authoritative when the client explicitly identifies
  // the provider. This prevents a stale legacy cookie from masking a valid
  // Supabase session in production.
  if (accessToken && authProvider === "supabase") {
    try {
      return {
        req: opts.req,
        res: opts.res,
        user: await resolveSupabaseUser(accessToken),
      };
    } catch (error) {
      console.error("[Auth] Supabase session validation failed", error);
      return { req: opts.req, res: opts.res, user: null };
    }
  }

  // Also accept a valid Supabase bearer without the optional provider header.
  // This keeps the API interoperable with clients/proxies that preserve only
  // the standard Authorization header.
  if (accessToken) {
    try {
      const supabaseUser = await resolveSupabaseUser(accessToken);
      if (supabaseUser) return { req: opts.req, res: opts.res, user: supabaseUser };
    } catch (error) {
      console.warn("[Auth] Bearer is not a valid Supabase session; trying legacy auth", error);
    }
  }

  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user: user?.role === "admin" && user.waiterActive === 0 ? null : user,
  };
}
