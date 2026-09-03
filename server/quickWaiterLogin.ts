import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { garcons, users } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";

const WINDOW_MS = 30_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  "";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_AUTH_SERVER_CONFIGURATION_MISSING");
  }
  supabaseAdmin ??= createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return supabaseAdmin;
}

function normalizeCode(code: string) {
  return typeof code === "string" ? code.trim() : "";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}

export async function generateWaiterCode() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = randomInt(100000, 1000000).toString();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.waiterCode, code)).limit(1);
    if (!existing[0]) return code;
  }
  throw new Error("WAITER_CODE_GENERATION_FAILED");
}

export async function assignNewWaiterCode(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [waiter] = await db
    .select({ id: users.id, role: users.role, waiterActive: users.waiterActive, waiterCode: users.waiterCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!waiter || waiter.role !== "garcom") throw new Error("WAITER_NOT_FOUND");

  const waiterProfile = await db
    .select({ id: garcons.id })
    .from(garcons)
    .where(eq(garcons.legacyUserId, userId))
    .limit(1);
  if (!waiterProfile[0]) throw new Error("WAITER_NOT_FOUND");

  const waiterCode = await generateWaiterCode();
  const [updated] = await db.update(users)
    .set({ waiterCode, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id, waiterCode: users.waiterCode });
  if (!updated || updated.id !== userId || updated.waiterCode !== waiterCode) {
    throw new Error("WAITER_CODE_UPDATE_FAILED");
  }
  const [verified] = await db.select({ id: users.id, waiterCode: users.waiterCode }).from(users).where(eq(users.id, userId)).limit(1);
  if (!verified || verified.waiterCode !== waiterCode) throw new Error("WAITER_CODE_UPDATE_FAILED");
  return { id: userId, waiterCode: verified.waiterCode };
}

/**
 * One-shot migration helper for legacy codes. Valid six-digit credentials are
 * always preserved unchanged.
 */
export async function ensureNumericWaiterCodes() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ id: users.id, waiterCode: users.waiterCode }).from(users).where(eq(users.role, "garcom"));
  for (const row of rows) {
    const code = row.waiterCode ?? "";
    if (/^\d{6}$/.test(code)) continue;
    if (code === "" || /^GAR-/i.test(code) || !/^\d+$/.test(code)) {
      await assignNewWaiterCode(row.id);
    }
  }
}

/**
 * Authenticate the six-digit waiter credential against the Supabase database.
 * The legacy Drizzle connection is retained for the rest of the application,
 * but login no longer depends on SUPABASE_DATABASE_URL being present in the
 * runtime environment. Supabase public.users.waiterCode is the source of truth.
 */
async function findWaiterFromSupabase(code: string) {
  const client = getSupabaseAdmin();

  const { data: user, error: userError } = await client
    .from("users")
    .select("id, openId, name, role, waiterActive")
    .eq("waiterCode", code)
    .eq("role", "garcom")
    .maybeSingle();

  if (userError) {
    console.error("[quickWaiterLogin] Supabase users lookup failed", userError.message);
    throw new Error("SUPABASE_WAITER_LOGIN_DATABASE_FAILED");
  }
  if (!user) return null;

  const { data: garcon, error: garconError } = await client
    .from("garcons")
    .select("id, legacyUserId, fullName, status")
    .eq("legacyUserId", user.id)
    .maybeSingle();

  if (garconError) {
    console.error("[quickWaiterLogin] Supabase garcons lookup failed", garconError.message);
    throw new Error("SUPABASE_WAITER_LOGIN_DATABASE_FAILED");
  }
  if (!garcon) return null;

  return { user, garcon };
}

export async function quickWaiterLogin(code: string, rateLimitKey: string) {
  if (!checkRateLimit(rateLimitKey)) throw new Error("WAITER_LOGIN_RATE_LIMITED");
  const normalized = normalizeCode(code);
  if (!/^\d{6}$/.test(normalized)) throw new Error("WAITER_CODE_INVALID");

  let match: Awaited<ReturnType<typeof findWaiterFromSupabase>>;
  try {
    match = await findWaiterFromSupabase(normalized);
  } catch (supabaseError) {
    // Keep a controlled fallback for local/dev environments that only have the
    // PostgreSQL connection configured. Production with Supabase credentials
    // uses the direct Supabase path above.
    if (supabaseError instanceof Error && supabaseError.message === "SUPABASE_AUTH_SERVER_CONFIGURATION_MISSING") {
      const db = await getDb();
      if (!db) throw new Error("Database is not available");
      const [legacyMatch] = await db
        .select({ user: users, garcon: garcons })
        .from(users)
        .innerJoin(garcons, eq(garcons.legacyUserId, users.id))
        .where(and(eq(users.waiterCode, normalized), eq(users.role, "garcom")))
        .limit(1);
      if (!legacyMatch) throw new Error("WAITER_CODE_INVALID");
      match = legacyMatch as unknown as Awaited<ReturnType<typeof findWaiterFromSupabase>>;
    } else {
      throw supabaseError;
    }
  }

  if (!match) throw new Error("WAITER_CODE_INVALID");

  const isActive = match.user.waiterActive === 1 && match.garcon.status === "ATIVO";
  if (!isActive) throw new Error("WAITER_ACCOUNT_DISABLED");

  const sessionToken = await sdk.createSessionToken(match.user.openId, {
    name: match.user.name ?? match.garcon.fullName,
  });
  attempts.delete(rateLimitKey);
  return {
    sessionToken,
    waiter: {
      id: match.user.id,
      name: match.user.name ?? match.garcon.fullName,
      role: "garcom" as const,
    },
  };
}
