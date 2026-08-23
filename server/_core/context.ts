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

async function resolveSupabaseUser(accessToken: string): Promise<User | null> {
  const supabaseUser = await getSupabaseUserFromAccessToken(accessToken);
  if (!supabaseUser) return null;

  const legacyUser = await getUserByOpenId(`supabase:${supabaseUser.id}`);
  if (legacyUser?.role === "admin") return legacyUser;
  if (!legacyUser) return null;

  const garconProfile = await getGarconProfileByLegacyUserId(legacyUser.id);
  if (garconProfile?.authUserId !== supabaseUser.id || garconProfile.role !== "GARCOM" || garconProfile.status !== "ATIVO") return null;
  return { ...legacyUser, role: "garcom", waiterActive: 1 };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const authorization = opts.req.headers.authorization;
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  // Prefer a valid Supabase bearer identity over a stale Manus cookie. This is
  // essential when an administrator and a waiter use the same browser session.
  if (accessToken) {
    const isSupabaseToken = opts.req.headers["x-auth-provider"] === "supabase";
    try {
      const supabaseUser = await resolveSupabaseUser(accessToken);
      if (supabaseUser || isSupabaseToken) return { req: opts.req, res: opts.res, user: supabaseUser };
    } catch {
      if (isSupabaseToken) return { req: opts.req, res: opts.res, user: null };
      // The token may be a legacy Manus bearer token; let the Manus SDK try it.
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
    user,
  };
}
