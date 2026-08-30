import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { garcons, users } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";

const CODE_LENGTH = 6;
const WINDOW_MS = 30_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function normalizeCode(code: string) {
  return typeof code === "string" ? code : "";
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
    .where(and(eq(users.id, userId), eq(users.role, "garcom")))
    .returning({ id: users.id, waiterCode: users.waiterCode });
  if (!updated || updated.id !== userId || updated.waiterCode !== waiterCode) {
    throw new Error("WAITER_CODE_UPDATE_FAILED");
  }
  const [verified] = await db.select({ id: users.id, waiterCode: users.waiterCode }).from(users).where(eq(users.id, userId)).limit(1);
  if (!verified || verified.waiterCode !== waiterCode) throw new Error("WAITER_CODE_UPDATE_FAILED");
  return { id: userId, waiterCode: verified.waiterCode };
}

/** Convert existing legacy GAR-XXXXXX codes to secure random six-digit codes. */
export async function ensureNumericWaiterCodes() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ id: users.id, waiterCode: users.waiterCode }).from(users).where(eq(users.role, "garcom"));
  for (const row of rows) {
    if (!/^\d{6}$/.test(row.waiterCode ?? "")) await assignNewWaiterCode(row.id);
  }
}

export async function quickWaiterLogin(code: string, rateLimitKey: string) {
  if (!checkRateLimit(rateLimitKey)) throw new Error("WAITER_LOGIN_RATE_LIMITED");
  const normalized = normalizeCode(code);
  if (!/^\d{6}$/.test(normalized)) throw new Error("WAITER_CODE_INVALID");

  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  // The six-digit code stored in PostgreSQL is the single source of truth.
  // No email, frontend state, mock value, or secondary Auth password is used.
  const [match] = await db
    .select({ user: users, garcon: garcons })
    .from(users)
    .innerJoin(garcons, eq(garcons.legacyUserId, users.id))
    .where(and(eq(users.waiterCode, normalized), eq(users.role, "garcom")))
    .limit(1);

  if (!match) throw new Error("WAITER_CODE_INVALID");

  const isActive = match.user.waiterActive === 1 && match.garcon.status === "ATIVO";
  if (!isActive) throw new Error("WAITER_ACCOUNT_DISABLED");

  // Supabase Auth remains the identity/account system, while the application's
  // quick-login credential is verified directly against the persisted waiterCode.
  // This prevents an Auth password synchronization failure from rolling back a
  // successfully persisted code change.
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
