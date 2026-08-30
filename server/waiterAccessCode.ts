import { and, eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import { garcons, users } from "../drizzle/schema";

const CODE_PATTERN = /^\d{6}$/;

export function normalizeAccessCode(code: string) {
  return typeof code === "string" ? code : "";
}

export async function assertAccessCodeAvailable(code: string, excludeLegacyUserId?: number) {
  const normalized = normalizeAccessCode(code);
  if (!/^\d+$/.test(normalized)) throw new Error("WAITER_CODE_MUST_BE_NUMERIC");
  if (!CODE_PATTERN.test(normalized)) throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");

  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const conditions = excludeLegacyUserId != null
    ? and(eq(users.waiterCode, normalized), ne(users.id, excludeLegacyUserId))
    : eq(users.waiterCode, normalized);
  const [existing] = await db.select({ id: users.id }).from(users).where(conditions).limit(1);
  if (existing) throw new Error("WAITER_CODE_ALREADY_IN_USE");
  return normalized;
}

/**
 * The database column users.waiterCode is the single source of truth for the
 * six-digit waiter credential. Authentication does not depend on a second
 * password value in Supabase Auth, so changing the code cannot be rolled back
 * by an unrelated Auth synchronization failure.
 */
export async function updateWaiterAccessCode(input: { waiterId: string; code: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [waiter] = await db
    .select({
      id: garcons.id,
      legacyUserId: garcons.legacyUserId,
      currentCode: users.waiterCode,
    })
    .from(garcons)
    .innerJoin(users, eq(garcons.legacyUserId, users.id))
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!waiter || !waiter.legacyUserId) throw new Error("WAITER_NOT_FOUND");

  const normalized = await assertAccessCodeAvailable(input.code, waiter.legacyUserId);

  let updated: { id: number; waiterCode: string | null } | undefined;
  try {
    [updated] = await db
      .update(users)
      .set({ waiterCode: normalized, role: "garcom", updatedAt: new Date() })
      .where(and(eq(users.id, waiter.legacyUserId), eq(users.role, "garcom")))
      .returning({ id: users.id, waiterCode: users.waiterCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[waiter-code] database update failed", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      error: message,
    });
    if (/duplicate key|unique constraint|waiterCode/i.test(message)) throw new Error("WAITER_CODE_ALREADY_IN_USE");
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  // Zero affected rows is never success.
  if (!updated || updated.id !== waiter.legacyUserId || updated.waiterCode !== normalized) {
    console.error("[waiter-code] database update affected unexpected row", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      affectedUserId: updated?.id ?? null,
      persistedCode: updated?.waiterCode ?? null,
    });
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  // Read the exact row again from PostgreSQL. The returned value, not the
  // submitted frontend value, is the only value returned as successful.
  const [verified] = await db
    .select({ id: users.id, waiterCode: users.waiterCode })
    .from(users)
    .where(eq(users.id, waiter.legacyUserId))
    .limit(1);

  if (!verified || verified.id !== waiter.legacyUserId || verified.waiterCode !== normalized) {
    console.error("[waiter-code] persistence verification failed", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      persistedCode: verified?.waiterCode ?? null,
    });
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  return { waiterId: waiter.id, waiterCode: verified.waiterCode };
}
