import { and, eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import { garcons, users } from "../drizzle/schema";

const CODE_PATTERN = /^\d{6}$/;

/**
 * Changes the credential used by quick waiter login.
 * The code is stored on the linked users row (the row queried by quickWaiterLogin),
 * not merely in UI state. A read-back verification prevents reporting success when
 * the database value did not actually change.
 */
export async function updateWaiterAccessCode(input: { waiterId: string; code: string }) {
  const code = input.code.trim();
  if (!CODE_PATTERN.test(code)) throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");

  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [waiter] = await db
    .select({ id: garcons.id, legacyUserId: garcons.legacyUserId })
    .from(garcons)
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!waiter || !waiter.legacyUserId) throw new Error("WAITER_NOT_FOUND");

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.waiterCode, code), ne(users.id, waiter.legacyUserId)))
    .limit(1);

  if (existing) throw new Error("WAITER_CODE_ALREADY_IN_USE");

  const [updated] = await db
    .update(users)
    .set({ waiterCode: code, role: "garcom", updatedAt: new Date() })
    .where(and(eq(users.id, waiter.legacyUserId), eq(users.role, "garcom")))
    .returning({ id: users.id, waiterCode: users.waiterCode });

  if (!updated || updated.waiterCode !== code) throw new Error("WAITER_CODE_SAVE_FAILED");

  // Read from the exact relation used by the Admin waiter list. This guarantees that
  // reopening Edit Garçom receives the same value that was just persisted.
  const [verified] = await db
    .select({ waiterCode: users.waiterCode })
    .from(garcons)
    .innerJoin(users, eq(garcons.legacyUserId, users.id))
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!verified || verified.waiterCode !== code) throw new Error("WAITER_CODE_SAVE_FAILED");

  return { waiterId: waiter.id, waiterCode: verified.waiterCode };
}
