import { eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import { garcons, users } from "../drizzle/schema";

const CODE_PATTERN = /^\d{6}$/;

export async function updateWaiterAccessCode(input: { waiterId: string; code: string }) {
  const code = input.code.trim();
  if (!CODE_PATTERN.test(code)) throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");

  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [waiter] = await db.select({ legacyUserId: garcons.legacyUserId }).from(garcons).where(eq(garcons.id, input.waiterId)).limit(1);
  if (!waiter) throw new Error("WAITER_NOT_FOUND");

  const [existing] = await db.select({ id: users.id }).from(users)
    .where(eq(users.waiterCode, code)).limit(1);
  if (existing && existing.id !== waiter.legacyUserId) throw new Error("WAITER_CODE_ALREADY_IN_USE");

  const [updated] = await db.update(users)
    .set({ waiterCode: code, role: "garcom", updatedAt: new Date() })
    .where(eq(users.id, waiter.legacyUserId))
    .returning({ waiterCode: users.waiterCode });

  if (!updated?.waiterCode || updated.waiterCode !== code) throw new Error("WAITER_CODE_SAVE_FAILED");
  return updated;
}
