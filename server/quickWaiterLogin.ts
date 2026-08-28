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
  return code.replace(/\D/g, "").slice(0, CODE_LENGTH);
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
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomInt(100000, 1000000).toString();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.waiterCode, code)).limit(1);
    if (!existing[0]) return code;
  }
  throw new Error("WAITER_CODE_GENERATION_FAILED");
}

export async function assignNewWaiterCode(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [waiter] = await db.select({ id: users.id, role: users.role, waiterActive: users.waiterActive }).from(users).where(eq(users.id, userId)).limit(1);
  if (!waiter || waiter.role !== "garcom") throw new Error("WAITER_NOT_FOUND");
  const waiterCode = await generateWaiterCode();
  const [updated] = await db.update(users).set({ waiterCode, updatedAt: new Date() }).where(and(eq(users.id, userId), eq(users.role, "garcom"))).returning({ id: users.id, waiterCode: users.waiterCode });
  if (!updated) throw new Error("WAITER_CODE_UPDATE_FAILED");
  return updated;
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
  if (normalized.length !== CODE_LENGTH) throw new Error("WAITER_CODE_INVALID");

  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [row] = await db.select({ user: users, garcon: garcons }).from(users).innerJoin(garcons, eq(garcons.legacyUserId, users.id))
    .where(and(eq(users.waiterCode, normalized), eq(users.role, "garcom"), eq(users.waiterActive, 1), eq(garcons.status, "ATIVO"))).limit(1);
  if (!row) throw new Error("WAITER_CODE_INVALID");

  const sessionToken = await sdk.createSessionToken(row.user.openId, { name: row.user.name ?? row.garcon.fullName });
  attempts.delete(rateLimitKey);
  return { sessionToken, waiter: { id: row.user.id, name: row.user.name ?? row.garcon.fullName, role: "garcom" as const } };
}
