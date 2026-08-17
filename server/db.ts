
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.


import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { tableQrCodes, tableSelectionItems, tableSelections, tableSessions, InsertTableSelectionItem } from "../drizzle/schema";

let lastSessionCleanupAt = 0;

async function cleanupAbandonedTableSessions(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db || Date.now() - lastSessionCleanupAt < 10 * 60 * 1000) return;
  lastSessionCleanupAt = Date.now();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.delete(tableSessions).where(and(
    eq(tableSessions.status, "open"),
    lt(tableSessions.lastActivityAt, cutoff),
    sql`NOT EXISTS (SELECT 1 FROM table_selections WHERE table_selections.sessionId = ${tableSessions.id})`,
  ));
}

export async function ensureTableSession(sessionToken: string, tableNumber = "01") {
  if (!sessionToken || sessionToken.length < 32) throw new Error("A valid session token is required");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await cleanupAbandonedTableSessions(db);
  const existing = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, sessionToken)).limit(1);
  if (existing[0]?.status === "closed") throw new Error("SESSION_CLOSED");
  await db.insert(tableSessions).values({ sessionToken, tableNumber }).onDuplicateKeyUpdate({ set: { lastActivityAt: new Date(), status: "open", tableNumber } });
  const rows = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, sessionToken)).limit(1);
  if (!rows[0]) throw new Error("Could not create table session");
  return rows[0];
}

export async function getTableHistory(sessionToken: string, tableNumber = "01") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await ensureTableSession(sessionToken, tableNumber);
  const selections = await db.select().from(tableSelections).where(eq(tableSelections.sessionId, session.id)).orderBy(desc(tableSelections.createdAt));
  const items = selections.length
    ? await db.select().from(tableSelectionItems).where(inArray(tableSelectionItems.selectionId, selections.map((selection) => selection.id)))
    : [];
  return selections.map((selection) => ({
    ...selection,
    subtotal: Number(selection.subtotal),
    items: items.filter((item) => item.selectionId === selection.id).map((item) => ({ ...item, unitPrice: Number(item.unitPrice), subtotal: Number(item.unitPrice) * item.quantity })),
  }));
}

export async function listTableQrCodes() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(tableQrCodes).orderBy(tableQrCodes.tableNumber);
}

export async function upsertTableQrCode(tableNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalized = tableNumber.trim();
  if (!normalized) throw new Error("Table number is required");
  const qrToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  await db.insert(tableQrCodes).values({ tableNumber: normalized, qrToken }).onDuplicateKeyUpdate({ set: { qrToken, updatedAt: new Date() } });
  const rows = await db.select().from(tableQrCodes).where(eq(tableQrCodes.tableNumber, normalized)).limit(1);
  if (!rows[0]) throw new Error("Could not create QR code");
  return rows[0];
}

export async function getStaffTables() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const sessions = await db.select().from(tableSessions)
    .where(eq(tableSessions.status, "open"))
    .orderBy(tableSessions.tableNumber, desc(tableSessions.lastActivityAt));
  const tableNumbers = Array.from(new Set([...Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")), ...sessions.map((session) => session.tableNumber)])).sort();
  const result = [];
  for (const tableNumber of tableNumbers) {
    const session = sessions.find((candidate) => candidate.tableNumber === tableNumber);
    if (!session) {
      result.push({ id: -Number(tableNumber), sessionToken: "", tableNumber, status: "open" as const, selectionCount: 0, unviewedCount: 0, statusLabel: "empty" as const, total: 0, latestSelectionAt: null });
      continue;
    }
    const selections = await db.select().from(tableSelections)
      .where(eq(tableSelections.sessionId, session.id))
      .orderBy(desc(tableSelections.createdAt));
    const unviewed = selections.filter((selection) => !selection.viewedAt).length;
    result.push({
      ...session,
      selectionCount: selections.length,
      unviewedCount: unviewed,
      statusLabel: unviewed > 0 ? "new" as const : selections.length > 0 ? "viewed" as const : "empty" as const,
      total: selections.reduce((sum, selection) => sum + Number(selection.subtotal), 0),
      latestSelectionAt: selections[0]?.createdAt ?? null,
    });
  }
  return result;
}

export async function markTableViewedByStaff(sessionToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await db.select({ id: tableSessions.id }).from(tableSessions)
    .where(and(eq(tableSessions.sessionToken, sessionToken), eq(tableSessions.status, "open")))
    .limit(1);
  if (!session[0]) return null;
  await db.update(tableSelections).set({ viewedAt: new Date() })
    .where(and(eq(tableSelections.sessionId, session[0].id), isNull(tableSelections.viewedAt)));
  return { success: true } as const;
}

export async function closeTableSessionByStaff(sessionToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const updated = await db.update(tableSessions).set({ status: "closed", closedAt: new Date() })
    .where(and(eq(tableSessions.sessionToken, sessionToken), eq(tableSessions.status, "open")));
  return { success: Number(updated[0]?.affectedRows ?? 0) > 0 } as const;
}

export async function getTableHistoryForStaff(sessionToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const session = await db.select().from(tableSessions)
    .where(eq(tableSessions.sessionToken, sessionToken))
    .limit(1);
  if (!session[0]) return null;

  const selections = await db.select().from(tableSelections)
    .where(eq(tableSelections.sessionId, session[0].id))
    .orderBy(desc(tableSelections.createdAt));
  const items = selections.length
    ? await db.select().from(tableSelectionItems)
      .where(inArray(tableSelectionItems.selectionId, selections.map((selection) => selection.id)))
    : [];

  return {
    session: session[0],
    selections: selections.map((selection) => ({
      ...selection,
      subtotal: Number(selection.subtotal),
      items: items
        .filter((item) => item.selectionId === selection.id)
        .map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.unitPrice) * item.quantity,
        })),
    })),
  };
}

export async function createTableSelection(input: {
  sessionToken: string;
  tableNumber?: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
  subtotal: number;
}) {
  if (!input.items.length) throw new Error("Cannot persist an empty selection");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  let effectiveToken = input.sessionToken;
  let session;
  try {
    session = await ensureTableSession(effectiveToken, input.tableNumber || "01");
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_CLOSED") {
      effectiveToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      session = await ensureTableSession(effectiveToken, input.tableNumber || "01");
    } else {
      throw error;
    }
  }
  return db.transaction(async (tx) => {
    const existing = await tx.select({ id: tableSelections.id }).from(tableSelections).where(eq(tableSelections.sessionId, session.id));
    const selectionNumber = existing.length + 1;
    const inserted = await tx.insert(tableSelections).values({ sessionId: session.id, selectionNumber, subtotal: input.subtotal.toFixed(2) });
    const selectionId = Number(inserted[0].insertId);
    await tx.insert(tableSelectionItems).values(input.items.map((item) => ({ ...item, selectionId, unitPrice: item.unitPrice.toFixed(2) })));
    await tx.update(tableSessions).set({ lastActivityAt: new Date() }).where(eq(tableSessions.id, session.id));
    return { id: selectionId, selectionNumber, sessionToken: effectiveToken };
  });
}
