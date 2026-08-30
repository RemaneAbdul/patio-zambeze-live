import { and, eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import { garcons, users } from "../drizzle/schema";
import { setSupabaseWaiterAccessCode } from "./supabaseAuth";

const CODE_PATTERN = /^\d{6}$/;

export function normalizeAccessCode(code: string) {
  return code.replace(/\D/g, "").trim();
}

/** Throws WAITER_CODE_MUST_BE_6_DIGITS or WAITER_CODE_ALREADY_IN_USE. Returns normalized code. */
export async function assertAccessCodeAvailable(code: string, excludeLegacyUserId?: number) {
  const normalized = normalizeAccessCode(code);
  if (!CODE_PATTERN.test(normalized)) throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");

  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const conditions =
    excludeLegacyUserId != null
      ? and(eq(users.waiterCode, normalized), ne(users.id, excludeLegacyUserId))
      : eq(users.waiterCode, normalized);

  const [existing] = await db.select({ id: users.id }).from(users).where(conditions).limit(1);
  if (existing) throw new Error("WAITER_CODE_ALREADY_IN_USE");
  return normalized;
}

/**
 * Changes the credential used by quick waiter login.
 * The six-digit code is stored on users.waiterCode and the corresponding
 * private Supabase Auth password is updated server-side from the same code.
 * The password is never exposed to the admin UI or the waiter.
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

  if (!waiter || !waiter.legacyUserId || !waiter.authUserId) throw new Error("WAITER_NOT_FOUND");

  const normalized = await assertAccessCodeAvailable(input.code, waiter.legacyUserId);

  const [updated] = await db
    .update(users)
    .set({ waiterCode: normalized, role: "garcom", updatedAt: new Date() })
    .where(eq(users.id, waiter.legacyUserId))
    .returning({ id: users.id, waiterCode: users.waiterCode });

  if (!updated || updated.waiterCode !== normalized) throw new Error("WAITER_CODE_SAVE_FAILED");

  try {
    await setSupabaseWaiterAccessCode(waiter.authUserId, normalized);
  } catch (error) {
    // Keep the database and Supabase Auth credential in sync if Auth rejects the update.
    if (waiter.currentCode) {
      await db.update(users)
        .set({ waiterCode: waiter.currentCode, updatedAt: new Date() })
        .where(eq(users.id, waiter.legacyUserId));
    } else {
      await db.update(users)
        .set({ waiterCode: null, updatedAt: new Date() })
        .where(eq(users.id, waiter.legacyUserId));
    }
    console.error("[Auth] Failed to synchronize waiter access code", error);
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  const [verified] = await db
    .select({ waiterCode: users.waiterCode })
    .from(garcons)
    .innerJoin(users, eq(garcons.legacyUserId, users.id))
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!verified || verified.waiterCode !== normalized) throw new Error("WAITER_CODE_SAVE_FAILED");

  return { waiterId: waiter.id, waiterCode: verified.waiterCode };
}
