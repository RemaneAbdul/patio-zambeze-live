import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "./db";
import { garcons, users } from "../drizzle/schema";

const CODE_PATTERN = /^\d{6}$/;

/**
 * Official source of truth for the waiter access credential:
 *   table: users
 *   column: waiterCode (varchar, UNIQUE)
 *
 * Relation used by admin edit:
 *   garcons.id (UUID sent by frontend)
 *     → garcons.legacyUserId
 *     → users.id
 *     → users.waiterCode
 */
export function normalizeAccessCode(code: string) {
  if (typeof code !== "string") return "";
  // Reject anything that is not exactly six ASCII digits. Do not silently strip.
  return code;
}

export async function assertAccessCodeAvailable(code: string, excludeLegacyUserId?: number) {
  const normalized = normalizeAccessCode(code);
  if (!CODE_PATTERN.test(normalized)) {
    if (normalized.length > 0 && !/^\d+$/.test(normalized)) throw new Error("WAITER_CODE_MUST_BE_NUMERIC");
    throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");
  }

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
 * Persist the six-digit access code on users.waiterCode for the selected waiter.
 *
 * - Resolves identity exclusively via garcons.id → legacyUserId → users.id
 * - Does NOT filter by role in the UPDATE WHERE (avoids 0-row updates when role drifts)
 * - Confirms with RETURNING and a subsequent SELECT on the same primary key
 * - Never rolls back a successful code write because of Supabase Auth issues
 */
export async function updateWaiterAccessCode(input: { waiterId: string; code: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [waiter] = await db
    .select({
      id: garcons.id,
      legacyUserId: garcons.legacyUserId,
      currentCode: users.waiterCode,
      userRole: users.role,
    })
    .from(garcons)
    .innerJoin(users, eq(garcons.legacyUserId, users.id))
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!waiter || waiter.legacyUserId == null) throw new Error("WAITER_NOT_FOUND");

  const normalized = await assertAccessCodeAvailable(input.code, waiter.legacyUserId);

  // Idempotent: already the value in the DB.
  if (waiter.currentCode === normalized) {
    return { waiterId: waiter.id, waiterCode: normalized, affectedRows: 0 as const, unchanged: true as const };
  }

  // Single-row UPDATE by primary key only. Role is forced to "garcom" in SET
  // so the credential remains usable by quickLogin, but role is not a WHERE filter.
  let updated: { id: number; waiterCode: string | null } | undefined;
  try {
    [updated] = await db
      .update(users)
      .set({
        waiterCode: normalized,
        role: "garcom",
        updatedAt: new Date(),
      })
      .where(eq(users.id, waiter.legacyUserId))
      .returning({ id: users.id, waiterCode: users.waiterCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[waiter-code] UPDATE failed", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      error: message,
    });
    if (/duplicate key|unique constraint|waiterCode/i.test(message)) {
      throw new Error("WAITER_CODE_ALREADY_IN_USE");
    }
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  // Exactly one row must be affected and the returned value must match the payload.
  if (!updated || updated.id !== waiter.legacyUserId || updated.waiterCode !== normalized) {
    console.error("[waiter-code] UPDATE affected unexpected row or value", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      affectedUserId: updated?.id ?? null,
      returnedCode: updated?.waiterCode ?? null,
    });
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  // Independent SELECT verification — database is the source of truth, not RETURNING alone.
  const [verified] = await db
    .select({ id: users.id, waiterCode: users.waiterCode })
    .from(users)
    .where(eq(users.id, waiter.legacyUserId))
    .limit(1);

  if (!verified || verified.id !== waiter.legacyUserId || verified.waiterCode !== normalized) {
    console.error("[waiter-code] post-UPDATE SELECT mismatch", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      verifiedCode: verified?.waiterCode ?? null,
    });
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  // Cross-check via the same join the list endpoint uses.
  const [viaGarcon] = await db
    .select({ waiterCode: users.waiterCode })
    .from(garcons)
    .innerJoin(users, eq(garcons.legacyUserId, users.id))
    .where(eq(garcons.id, input.waiterId))
    .limit(1);

  if (!viaGarcon || viaGarcon.waiterCode !== normalized) {
    console.error("[waiter-code] join verification mismatch", {
      waiterId: input.waiterId,
      joinCode: viaGarcon?.waiterCode ?? null,
    });
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[WAITER UPDATE] verified", {
      garconId: input.waiterId,
      usersId: waiter.legacyUserId,
      // Do not log full codes in production; development only and truncated.
      oldCodePrefix: (waiter.currentCode ?? "").slice(0, 2),
      newCodePrefix: normalized.slice(0, 2),
      affectedRows: 1,
    });
  }

  return {
    waiterId: waiter.id,
    waiterCode: verified.waiterCode,
    affectedRows: 1 as const,
    unchanged: false as const,
  };
}
