import { and, eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import { garcons, users } from "../drizzle/schema";
import { setSupabaseWaiterAccessCode } from "./supabaseAuth";

const CODE_PATTERN = /^\d{6}$/;

/**
 * Keep the value intact so invalid characters are rejected instead of being
 * silently stripped. The backend is the final validation boundary.
 */
export function normalizeAccessCode(code: string) {
  return typeof code === "string" ? code : "";
}

/** Throws WAITER_CODE_MUST_BE_6_DIGITS or WAITER_CODE_ALREADY_IN_USE. Returns the exact code. */
export async function assertAccessCodeAvailable(code: string, excludeLegacyUserId?: number) {
  const normalized = normalizeAccessCode(code);

  if (normalized.length !== 6) {
    throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");
  }
  if (!/^\d+$/.test(normalized)) {
    throw new Error("WAITER_CODE_MUST_BE_NUMERIC");
  }
  if (!CODE_PATTERN.test(normalized)) {
    throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");
  }

  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const conditions =
    excludeLegacyUserId != null
      ? and(eq(users.waiterCode, normalized), ne(users.id, excludeLegacyUserId))
      : eq(users.waiterCode, normalized);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(conditions)
    .limit(1);

  if (existing) throw new Error("WAITER_CODE_ALREADY_IN_USE");
  return normalized;
}

/**
 * Changes the credential used by quick waiter login.
 *
 * The operation has two persistence points that must remain synchronized:
 * 1. users.waiterCode in the real database;
 * 2. the private Supabase Auth credential derived from the same code.
 *
 * If Supabase Auth rejects the new credential, the database value is rolled
 * back to the previous value. The code is never considered saved until the
 * Auth update and a fresh database read both succeed.
 */
export async function updateWaiterAccessCode(input: { waiterId: string; code: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [waiter] = await db
    .select({
      id: garcons.id,
      legacyUserId: garcons.legacyUserId,
      authUserId: garcons.authUserId,
      email: garcons.email,
      currentCode: users.waiterCode,
    })
    .from(garcons)
    .innerJoin(users, eq(garcons.legacyUserId, users.id))
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!waiter || !waiter.legacyUserId || !waiter.authUserId) {
    throw new Error("WAITER_NOT_FOUND");
  }

  const normalized = await assertAccessCodeAvailable(input.code, waiter.legacyUserId);

  let updated: { id: number; waiterCode: string | null } | undefined;
  try {
    [updated] = await db
      .update(users)
      .set({ waiterCode: normalized, role: "garcom", updatedAt: new Date() })
      .where(eq(users.id, waiter.legacyUserId))
      .returning({ id: users.id, waiterCode: users.waiterCode });
  } catch (error) {
    // The UNIQUE constraint is the final protection against concurrent writes.
    // A duplicate-key failure means no new code was persisted.
    const message = error instanceof Error ? error.message : String(error);
    if (/duplicate key|unique constraint|users.*waiterCode|waiterCode/i.test(message)) {
      throw new Error("WAITER_CODE_ALREADY_IN_USE");
    }
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  if (!updated || updated.waiterCode !== normalized) {
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  try {
    await setSupabaseWaiterAccessCode(waiter.authUserId, normalized);
  } catch (error) {
    // Keep the real database credential aligned with Supabase Auth.
    try {
      await db
        .update(users)
        .set({ waiterCode: waiter.currentCode ?? null, updatedAt: new Date() })
        .where(eq(users.id, waiter.legacyUserId));
    } catch (rollbackError) {
      console.error("[Database] Failed to rollback waiter access code", rollbackError);
    }
    console.error("[Auth] Failed to synchronize waiter access code", error);
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  // Do not report success from in-memory state. Re-read the persisted value.
  const [verified] = await db
    .select({ waiterCode: users.waiterCode })
    .from(garcons)
    .innerJoin(users, eq(garcons.legacyUserId, users.id))
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!verified || verified.waiterCode !== normalized) {
    try {
      await db
        .update(users)
        .set({ waiterCode: waiter.currentCode ?? null, updatedAt: new Date() })
        .where(eq(users.id, waiter.legacyUserId));
    } catch (rollbackError) {
      console.error("[Database] Failed to rollback unverified waiter access code", rollbackError);
    }
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  return { waiterId: waiter.id, waiterCode: verified.waiterCode };
}
