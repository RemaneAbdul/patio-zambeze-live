import { and, eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import { garcons, users } from "../drizzle/schema";
import { setSupabaseWaiterAccessCode } from "./supabaseAuth";

const CODE_PATTERN = /^\d{6}$/;

export function normalizeAccessCode(code: string) {
  return typeof code === "string" ? code : "";
}

export async function assertAccessCodeAvailable(code: string, excludeLegacyUserId?: number) {
  const normalized = normalizeAccessCode(code);
  if (normalized.length !== 6) throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");
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
 * Persists the waiter access code as a single source of truth in users.waiterCode
 * and synchronizes the private Supabase Auth credential. The database write is
 * verified by reading the exact users row back by its primary key.
 */
export async function updateWaiterAccessCode(input: { waiterId: string; code: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [waiter] = await db
    .select({
      id: garcons.id,
      legacyUserId: garcons.legacyUserId,
      authUserId: garcons.authUserId,
      currentCode: users.waiterCode,
    })
    .from(garcons)
    .innerJoin(users, eq(garcons.legacyUserId, users.id))
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!waiter || !waiter.legacyUserId || !waiter.authUserId) throw new Error("WAITER_NOT_FOUND");

  const normalized = await assertAccessCodeAvailable(input.code, waiter.legacyUserId);
  const previousCode = waiter.currentCode ?? null;

  let updated: { id: number; waiterCode: string | null } | undefined;
  try {
    [updated] = await db
      .update(users)
      .set({ waiterCode: normalized, role: "garcom", updatedAt: new Date() })
      .where(eq(users.id, waiter.legacyUserId))
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

  if (!updated || updated.id !== waiter.legacyUserId || updated.waiterCode !== normalized) {
    console.error("[waiter-code] database update affected unexpected row", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      affectedUserId: updated?.id ?? null,
      persistedCode: updated?.waiterCode ?? null,
    });
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  // Confirm the persisted value from the database, using the exact primary key.
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

  try {
    await setSupabaseWaiterAccessCode(waiter.authUserId, normalized);
  } catch (error) {
    // Auth must never leave a different credential from the database. Roll back
    // only after the database has first been proven to contain the new value.
    try {
      await db
        .update(users)
        .set({ waiterCode: previousCode, updatedAt: new Date() })
        .where(eq(users.id, waiter.legacyUserId));
    } catch (rollbackError) {
      console.error("[waiter-code] database rollback failed after Auth error", rollbackError);
    }
    console.error("[waiter-code] Supabase Auth synchronization failed", error);
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  // Final verification after Auth synchronization. No in-memory value is used.
  const [finalRow] = await db
    .select({ id: users.id, waiterCode: users.waiterCode })
    .from(users)
    .where(eq(users.id, waiter.legacyUserId))
    .limit(1);
  if (!finalRow || finalRow.id !== waiter.legacyUserId || finalRow.waiterCode !== normalized) {
    try {
      await db
        .update(users)
        .set({ waiterCode: previousCode, updatedAt: new Date() })
        .where(eq(users.id, waiter.legacyUserId));
    } catch (rollbackError) {
      console.error("[waiter-code] database rollback failed after final verification", rollbackError);
    }
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  return { waiterId: waiter.id, waiterCode: finalRow.waiterCode };
}
