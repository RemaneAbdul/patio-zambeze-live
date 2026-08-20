
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

    if ((values.role === 'admin' || user.openId === ENV.ownerOpenId) && !user.waiterCode) {
      const generatedWaiterCode = `GAR-${user.openId.slice(-6).toUpperCase()}`;
      values.waiterCode = generatedWaiterCode;
      updateSet.waiterCode = generatedWaiterCode;
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
import { menuCategories, menuProducts, tableQrCodes, tableSelectionItems, tableSelections, tableSessions, InsertTableSelectionItem } from "../drizzle/schema";

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

async function resolveTableReference(db: Awaited<ReturnType<typeof getDb>>, tableReference: string, requireQr = false) {
  if (!db) throw new Error("Database is not available");
  const qr = await db.select().from(tableQrCodes).where(eq(tableQrCodes.qrToken, tableReference)).limit(1);
  if (qr[0]) return { tableNumber: qr[0].tableNumber, tableId: qr[0].qrToken };
  if (requireQr) throw new Error("TABLE_NOT_FOUND");
  return { tableNumber: tableReference, tableId: tableReference };
}

export async function getTableHistory(sessionToken: string, tableNumber = "01", tableId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const table = await resolveTableReference(db, tableId || tableNumber, Boolean(tableId));
  const session = await ensureTableSession(sessionToken, table.tableNumber);
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

export async function getTableSessionInfo(sessionToken: string, tableNumber = "01", tableId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const table = await resolveTableReference(db, tableId || tableNumber, Boolean(tableId));
  const session = await ensureTableSession(sessionToken, table.tableNumber);
  const waiter = session.waiterId ? await db.select({ id: users.id, name: users.name, waiterCode: users.waiterCode, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session.waiterId)).limit(1) : [];
  return { session, waiter: waiter[0] ?? null };
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
  const qrTables = await db.select({ tableNumber: tableQrCodes.tableNumber }).from(tableQrCodes).orderBy(tableQrCodes.tableNumber);
  const tableNumbers = Array.from(new Set([...Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")), ...qrTables.map((table) => table.tableNumber), ...sessions.map((session) => session.tableNumber)])).sort((a, b) => a.localeCompare(b, "pt", { numeric: true }));
  const result = [];
  for (const tableNumber of tableNumbers) {
    const session = sessions.find((candidate) => candidate.tableNumber === tableNumber);
    if (!session) {
      result.push({ id: -Number(tableNumber), sessionToken: "", tableNumber, status: "open" as const, attendingWaiter: null, attendingWaiterId: null, attendingSince: null, selectionCount: 0, unviewedCount: 0, statusLabel: "empty" as const, total: 0, latestSelectionAt: null });
      continue;
    }
    const selections = await db.select().from(tableSelections)
      .where(eq(tableSelections.sessionId, session.id))
      .orderBy(desc(tableSelections.createdAt));
    const unviewed = selections.filter((selection) => !selection.viewedAt).length;
    const attendingWaiter = session.attendingWaiterId
      ? await db.select({ id: users.id, name: users.name, waiterCode: users.waiterCode }).from(users).where(eq(users.id, session.attendingWaiterId)).limit(1)
      : [];
    result.push({
      ...session,
      attendingWaiter: attendingWaiter[0] ?? null,
      selectionCount: selections.length,
      unviewedCount: unviewed,
      statusLabel: unviewed > 0 ? "new" as const : selections.length > 0 ? "viewed" as const : "empty" as const,
      total: selections.reduce((sum, selection) => sum + Number(selection.subtotal), 0),
      latestSelectionAt: selections[0]?.createdAt ?? null,
    });
  }
  return result;
}

export async function assumeTableSession(sessionToken: string, waiterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const now = new Date();
  const updated = await db.update(tableSessions).set({ attendingWaiterId: waiterId, attendingSince: now, lastActivityAt: now })
    .where(and(eq(tableSessions.sessionToken, sessionToken), eq(tableSessions.status, "open"), isNull(tableSessions.attendingWaiterId)));
  if (Number(updated[0]?.affectedRows ?? 0) === 0) {
    const current = await db.select({ attendingWaiterId: tableSessions.attendingWaiterId }).from(tableSessions).where(eq(tableSessions.sessionToken, sessionToken)).limit(1);
    if (current[0]?.attendingWaiterId && current[0].attendingWaiterId !== waiterId) throw new Error("TABLE_ALREADY_ASSIGNED");
    throw new Error("TABLE_NOT_AVAILABLE");
  }
  return getTableHistoryForStaff(sessionToken, waiterId, false);
}

async function assertTableAccess(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, sessionToken: string, waiterId: number, isAdmin = false) {
  const rows = await db.select().from(tableSessions).where(and(eq(tableSessions.sessionToken, sessionToken), eq(tableSessions.status, "open"))).limit(1);
  if (!rows[0]) throw new Error("TABLE_NOT_FOUND");
  const session = rows[0];
  const canOperate = isAdmin || session.attendingWaiterId === waiterId;
  if (!canOperate) throw new Error(session.attendingWaiterId ? "TABLE_ALREADY_ASSIGNED" : "TABLE_NOT_ASSIGNED");
  return session;
}

export async function markTableViewedByStaff(sessionToken: string, waiterId: number, isAdmin = true) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  const viewedAt = new Date();
  await db.update(tableSessions).set({ waiterId, viewedAt, lastActivityAt: viewedAt }).where(eq(tableSessions.id, session.id));
  await db.update(tableSelections).set({ viewedAt })
    .where(and(eq(tableSelections.sessionId, session.id), isNull(tableSelections.viewedAt)));
  return { success: true, waiterId, viewedAt } as const;
}

export async function closeTableSessionByStaff(sessionToken: string, waiterId = 0, isAdmin = true) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  const updated = await db.update(tableSessions).set({ status: "closed", closedAt: new Date(), attendingWaiterId: null, attendingSince: null })
    .where(and(eq(tableSessions.id, session.id), eq(tableSessions.status, "open")));
  return { success: Number(updated[0]?.affectedRows ?? 0) > 0 } as const;
}

export async function releaseTableSessionByStaff(sessionToken: string, waiterId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  await db.update(tableSessions).set({ attendingWaiterId: null, attendingSince: null, lastActivityAt: new Date() }).where(eq(tableSessions.id, session.id));
  return { success: true } as const;
}

export async function getTableHistoryForStaff(sessionToken: string, waiterId?: number, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const session = await db.select().from(tableSessions)
    .where(eq(tableSessions.sessionToken, sessionToken))
    .limit(1);
  if (!session[0]) return null;
  if (isAdmin && waiterId && !session[0].waiterId) {
    await db.update(tableSessions).set({ waiterId }).where(eq(tableSessions.id, session[0].id));
    session[0].waiterId = waiterId;
  }
  const attendingWaiter = session[0].attendingWaiterId ? await db.select({ id: users.id, name: users.name, email: users.email, waiterCode: users.waiterCode, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session[0].attendingWaiterId)).limit(1) : [];
  const waiter = session[0].waiterId ? await db.select({ id: users.id, name: users.name, email: users.email, waiterCode: users.waiterCode, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session[0].waiterId)).limit(1) : [];
  const canOperate = isAdmin || (waiterId !== undefined && session[0].attendingWaiterId === waiterId);

  const selections = await db.select().from(tableSelections)
    .where(eq(tableSelections.sessionId, session[0].id))
    .orderBy(desc(tableSelections.createdAt));
  const items = selections.length
    ? await db.select().from(tableSelectionItems)
      .where(inArray(tableSelectionItems.selectionId, selections.map((selection) => selection.id)))
    : [];

  return {
    session: session[0],
    waiter: waiter[0] ?? null,
    attendingWaiter: attendingWaiter[0] ?? null,
    canOperate,
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

export async function listViewedReceipts() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const sessions = await db.select().from(tableSessions)
    .where(sql`${tableSessions.viewedAt} IS NOT NULL`)
    .orderBy(desc(tableSessions.viewedAt));
  const result = [];
  for (const session of sessions) {
    const selections = await db.select().from(tableSelections)
      .where(eq(tableSelections.sessionId, session.id))
      .orderBy(tableSelections.selectionNumber);
    if (!selections.length) continue;
    const items = await db.select().from(tableSelectionItems)
      .where(inArray(tableSelectionItems.selectionId, selections.map((selection) => selection.id)));
    const waiter = session.waiterId
      ? await db.select({ id: users.id, name: users.name, waiterCode: users.waiterCode }).from(users).where(eq(users.id, session.waiterId)).limit(1)
      : [];
    result.push({
      session,
      waiter: waiter[0] ?? null,
      total: selections.reduce((sum, selection) => sum + Number(selection.subtotal), 0),
      selections: selections.map((selection) => ({
        ...selection,
        subtotal: Number(selection.subtotal),
        items: items.filter((item) => item.selectionId === selection.id).map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.unitPrice) * item.quantity,
        })),
      })),
    });
  }
  return result;
}

export async function setTableSelectionStatus(selectionId: number, status: "PENDING" | "PREPARING" | "READY" | "DELIVERED" | "COMPLETED", waiterId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ sessionToken: tableSessions.sessionToken }).from(tableSelections).innerJoin(tableSessions, eq(tableSelections.sessionId, tableSessions.id)).where(eq(tableSelections.id, selectionId)).limit(1);
  if (!rows[0]) throw new Error("SELECTION_NOT_FOUND");
  await assertTableAccess(db, rows[0].sessionToken, waiterId, isAdmin);
  const updated = await db.update(tableSelections).set({ status }).where(eq(tableSelections.id, selectionId));
  return { success: Number(updated[0]?.affectedRows ?? 0) > 0, selectionId, status } as const;
}

export async function createTableSelection(input: {
  sessionToken: string;
  tableNumber?: string;
  tableId?: string;
  items: Array<{ productName: string; preparation?: string; quantity: number; unitPrice: number }>;
  subtotal: number;
}) {
  if (!input.items.length) throw new Error("Cannot persist an empty selection");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const table = await resolveTableReference(db, input.tableId || input.tableNumber || "01");
  let effectiveToken = input.sessionToken;
  let session;
  try {
    session = await ensureTableSession(effectiveToken, table.tableNumber);
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_CLOSED") {
      effectiveToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      session = await ensureTableSession(effectiveToken, table.tableNumber);
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


const MENU_RESTAURANT_ID = "default";

export async function listMenuCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(menuCategories).where(eq(menuCategories.restaurantId, MENU_RESTAURANT_ID)).orderBy(menuCategories.name);
}

export async function createMenuCategory(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalized = name.trim();
  if (!normalized) throw new Error("Category name is required");
  await db.insert(menuCategories).values({ restaurantId: MENU_RESTAURANT_ID, name: normalized });
  const rows = await db.select().from(menuCategories).where(and(eq(menuCategories.restaurantId, MENU_RESTAURANT_ID), eq(menuCategories.name, normalized))).orderBy(desc(menuCategories.id)).limit(1);
  return rows[0];
}

export async function listMenuProducts(includeRemoved = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const statuses = includeRemoved ? ["ACTIVE", "INACTIVE", "REMOVED"] as const : ["ACTIVE", "INACTIVE"] as const;
  return db.select({ product: menuProducts, category: menuCategories }).from(menuProducts).leftJoin(menuCategories, eq(menuProducts.categoryId, menuCategories.id)).where(and(eq(menuProducts.restaurantId, MENU_RESTAURANT_ID), inArray(menuProducts.status, statuses))).orderBy(desc(menuProducts.updatedAt));
}

async function assertMenuCategory(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, categoryId: number) {
  const rows = await db.select({ id: menuCategories.id }).from(menuCategories).where(and(eq(menuCategories.id, categoryId), eq(menuCategories.restaurantId, MENU_RESTAURANT_ID), eq(menuCategories.status, "ACTIVE"))).limit(1);
  if (!rows[0]) throw new Error("CATEGORY_NOT_FOUND");
}

export async function createMenuProduct(input: { categoryId: number; name: string; description?: string; preparation?: string; preparationEn?: string; price: number; imageUrl?: string; }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const name = input.name.trim();
  if (!name) throw new Error("PRODUCT_NAME_REQUIRED");
  await assertMenuCategory(db, input.categoryId);
  const inserted = await db.insert(menuProducts).values({ ...input, name, description: input.description?.trim() || null, preparation: input.preparation?.trim() || null, preparationEn: input.preparationEn?.trim() || null, restaurantId: MENU_RESTAURANT_ID, price: input.price.toFixed(2), status: "ACTIVE" });
  const productId = Number(inserted[0].insertId);
  const rows = await db.select().from(menuProducts).where(eq(menuProducts.id, productId)).limit(1);
  if (!rows[0]) throw new Error("PRODUCT_CREATE_FAILED");
  return rows[0];
}

export async function updateMenuProduct(id: number, input: { categoryId: number; name: string; description?: string; preparation?: string; preparationEn?: string; price: number; imageUrl?: string; }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const name = input.name.trim();
  if (!name) throw new Error("PRODUCT_NAME_REQUIRED");
  await assertMenuCategory(db, input.categoryId);
  const existing = await db.select({ id: menuProducts.id }).from(menuProducts).where(and(eq(menuProducts.id, id), eq(menuProducts.restaurantId, MENU_RESTAURANT_ID), inArray(menuProducts.status, ["ACTIVE", "INACTIVE"]))).limit(1);
  if (!existing[0]) throw new Error("PRODUCT_NOT_FOUND");
  await db.update(menuProducts).set({ ...input, name, description: input.description?.trim() || null, preparation: input.preparation?.trim() || null, preparationEn: input.preparationEn?.trim() || null, price: input.price.toFixed(2), updatedAt: new Date() }).where(eq(menuProducts.id, id));
  const rows = await db.select().from(menuProducts).where(eq(menuProducts.id, id)).limit(1);
  if (!rows[0]) throw new Error("PRODUCT_UPDATE_FAILED");
  return rows[0];
}

export async function setMenuProductStatus(id: number, status: "ACTIVE" | "INACTIVE" | "REMOVED") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const updated = await db.update(menuProducts).set({ status, deletedAt: status === "REMOVED" ? new Date() : null, updatedAt: new Date() }).where(and(eq(menuProducts.id, id), eq(menuProducts.restaurantId, MENU_RESTAURANT_ID), inArray(menuProducts.status, ["ACTIVE", "INACTIVE"])));
  if (Number(updated[0]?.affectedRows ?? 0) === 0) throw new Error("PRODUCT_NOT_FOUND");
  const rows = await db.select().from(menuProducts).where(eq(menuProducts.id, id)).limit(1);
  if (!rows[0]) throw new Error("PRODUCT_STATUS_UPDATE_FAILED");
  return rows[0];
}
