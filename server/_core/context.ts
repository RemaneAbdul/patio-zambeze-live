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

/**
 * The product is intentionally configured for public/direct panel access.
 * This synthetic context identity is not a Supabase user, credential, or
 * database account; it only prevents the existing tRPC authorization layer
 * from turning the public panel into a 401/403 before its UI can load.
 *
 * IMPORTANT: because the panel is public, admin/staff tRPC procedures are
 * reachable without authentication. This is an explicit product decision.
 */
const PUBLIC_PANEL_USER: User = {
  id: 0,
  openId: "public:panel",
  name: "Acesso directo ao painel",
  email: null,
  loginMethod: "public-panel",
  role: "admin",
  waiterCode: null,
  waiterActive: 1,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  lastSignedIn: new Date(),
};

function getBearerToken(authorization: unknown): string {
  if (typeof authorization !== "string") return "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

async function resolveSupabaseUser(accessToken: string): Promise<User | null> {
  const supabaseUser = await getSupabaseUserFromAccessToken(accessToken);
  if (!supabaseUser?.id) return null;

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

  // If a real Supabase session is supplied, keep using the real mapped user.
  if (accessToken && authProvider === "supabase") {
    try {
      const user = await resolveSupabaseUser(accessToken);
      if (user) return { req: opts.req, res: opts.res, user };
    } catch (error) {
      console.error("[Auth] Supabase session validation failed", error);
    }
  }

  if (accessToken) {
    try {
      const user = await resolveSupabaseUser(accessToken);
      if (user) return { req: opts.req, res: opts.res, user };
    } catch {
      // Continue with legacy authentication, then public panel access.
    }
  }

  try {
    const user = await sdk.authenticateRequest(opts.req);
    if (user && !(user.role === "admin" && user.waiterActive === 0)) {
      return { req: opts.req, res: opts.res, user };
    }
  } catch {
    // Anonymous/direct panel access is intentionally allowed below.
  }

  // No session is required for the panel in the current product configuration.
  return { req: opts.req, res: opts.res, user: PUBLIC_PANEL_USER };
}
