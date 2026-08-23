
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, auditLogs, garcons } from "../drizzle/schema";
import * as schema from "../drizzle/schema";
import { ENV } from './_core/env';
import { createSupabaseWaiter, deleteSupabaseWaiter, disableSupabaseWaiter, enableSupabaseWaiter, updateSupabaseWaiter } from './supabaseAuth';

let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

// Lazily create the Drizzle PostgreSQL instance so local tooling can run without a DB.
export async function getDb() {
  const connectionString = process.env.SUPABASE_DATABASE_URL?.replace(/[?&]sslmode=require\b/, "").replace(/[?&]$/, "");
  if (!_db && connectionString) {
    try {
      _pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 5,
      });
      _db = drizzle(_pool, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
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

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function recordAuditLog(input: { userId?: number | null; restaurantId?: string | null; role: string; action: string; entityType?: string; entityId?: string | number; metadata?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({ userId: input.userId ?? null, restaurantId: input.restaurantId ?? "default", role: input.role, action: input.action, entityType: input.entityType, entityId: input.entityId == null ? undefined : String(input.entityId), metadata: input.metadata ? JSON.stringify(input.metadata) : undefined });
  } catch (error) {
    console.warn("[Audit] Could not persist audit event", error);
  }
}

export async function getGarconProfileByLegacyUserId(legacyUserId: number) {
  const db = await getDb();
  if (!db) return null;
  const [profile] = await db.select({ id: garcons.id, authUserId: garcons.authUserId, legacyUserId: garcons.legacyUserId, restaurantId: garcons.restaurantId, role: garcons.role, status: garcons.status, fullName: garcons.fullName, email: garcons.email }).from(garcons).where(eq(garcons.legacyUserId, legacyUserId)).limit(1);
  return profile ?? null;
}

export async function listGarcons() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select({ garcon: garcons, user: { id: users.id, openId: users.openId, name: users.name, email: users.email, waiterCode: users.waiterCode, waiterActive: users.waiterActive, role: users.role } })
    .from(garcons).innerJoin(users, eq(garcons.legacyUserId, users.id)).orderBy(garcons.fullName);
}

export async function createGarcon(input: { fullName: string; username: string; email: string; phone?: string; password: string; active: boolean; restaurantId?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  if (!fullName || !username || !email || !input.password) throw new Error("WAITER_REQUIRED_FIELDS");
  if (input.password.length < 6) throw new Error("WAITER_PASSWORD_TOO_SHORT");
  const authUser = await createSupabaseWaiter({ email, password: input.password, fullName, phone: input.phone });
  let legacyUserId: number | undefined;
  let createdGarconId: string | undefined;
  try {
    const openId = `supabase:${authUser.id}`;
    const waiterCode = `GAR-${authUser.id.replace(/-/g, "").slice(-6).toUpperCase()}`;
    const [legacyUser] = await db.insert(users).values({ openId, name: fullName, email, loginMethod: "supabase", role: "garcom", waiterCode, waiterActive: input.active ? 1 : 0 }).onConflictDoNothing({ target: users.openId }).returning();
    if (!legacyUser) throw new Error("WAITER_EMAIL_OR_USER_ALREADY_EXISTS");
    legacyUserId = legacyUser.id;
    const [created] = await db.insert(garcons).values({ authUserId: authUser.id, legacyUserId: legacyUser.id, restaurantId: input.restaurantId ?? "default", fullName, username, email, phone: input.phone ?? null, status: input.active ? "ATIVO" : "INATIVO", disabledAt: input.active ? null : new Date() }).returning();
    if (!created) throw new Error("WAITER_PROFILE_CREATE_FAILED");
    createdGarconId = created.id;
    if (!input.active) await disableSupabaseWaiter(authUser.id);
    return { ...created, legacyUser };
  } catch (error) {
    try { if (createdGarconId) await db.delete(garcons).where(eq(garcons.id, createdGarconId)); } catch (cleanupError) { console.error("[Database] Failed to rollback waiter profile", cleanupError); }
    try { if (legacyUserId) await db.delete(users).where(eq(users.id, legacyUserId)); } catch (cleanupError) { console.error("[Database] Failed to rollback legacy waiter", cleanupError); }
    try { await deleteSupabaseWaiter(authUser.id); } catch (cleanupError) { console.error("[Auth] Failed to rollback orphan waiter", cleanupError); }
    throw error;
  }
}

export async function updateGarcon(input: { id: string; fullName: string; username: string; email: string; phone?: string; active: boolean; password?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [current] = await db.select().from(garcons).where(eq(garcons.id, input.id)).limit(1);
  if (!current) throw new Error("WAITER_NOT_FOUND");
  await updateSupabaseWaiter({ authUserId: current.authUserId, email: input.email.trim().toLowerCase(), password: input.password, fullName: input.fullName.trim(), phone: input.phone });
  if (input.active) await enableSupabaseWaiter(current.authUserId); else await disableSupabaseWaiter(current.authUserId);
  const [updated] = await db.update(garcons).set({ fullName: input.fullName.trim(), username: input.username.trim().toLowerCase(), email: input.email.trim().toLowerCase(), phone: input.phone ?? null, status: input.active ? "ATIVO" : "INATIVO", disabledAt: input.active ? null : (current.disabledAt ?? new Date()), updatedAt: new Date() }).where(eq(garcons.id, input.id)).returning();
  await db.update(users).set({ name: input.fullName.trim(), email: input.email.trim().toLowerCase(), waiterActive: input.active ? 1 : 0, updatedAt: new Date() }).where(eq(users.id, current.legacyUserId));
  return updated;
}

export async function deleteGarcon(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [current] = await db.select({ id: garcons.id, authUserId: garcons.authUserId, legacyUserId: garcons.legacyUserId, fullName: garcons.fullName, email: garcons.email, restaurantId: garcons.restaurantId }).from(garcons).where(eq(garcons.id, id)).limit(1);
  if (!current) throw new Error("WAITER_NOT_FOUND");

  // Remove login access first. If this fails, keep the local profile intact.
  await deleteSupabaseWaiter(current.authUserId);
  await db.transaction(async (tx) => {
    // Keep users and historical foreign-key references; remove only waiter identity.
    await tx.update(users).set({ role: "user", waiterCode: null, waiterActive: 0, updatedAt: new Date() }).where(eq(users.id, current.legacyUserId));
    await tx.delete(garcons).where(eq(garcons.id, id));
  });
  return current;
}

export async function listWaiterCandidates() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, openId: users.openId, waiterCode: users.waiterCode, waiterActive: users.waiterActive })
    .from(users)
    .where(and(eq(users.role, "user"), isNull(users.waiterCode)))
    .orderBy(users.name);
}

export async function promoteUserToWaiter(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [existing] = await db.select({ id: users.id, openId: users.openId, role: users.role, name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (!existing) throw new Error("USER_NOT_FOUND");
  if (existing.role === "admin") throw new Error("ADMIN_CANNOT_BE_WAITER");
  const waiterCode = `GAR-${existing.openId.slice(-6).toUpperCase()}`;
  const [updated] = await db.update(users).set({ role: "garcom", waiterCode, waiterActive: 1, updatedAt: new Date() }).where(eq(users.id, userId)).returning({ id: users.id, name: users.name, email: users.email, role: users.role, waiterCode: users.waiterCode, waiterActive: users.waiterActive });
  if (!updated) throw new Error("WAITER_NOT_CREATED");
  return updated;
}

export async function listWaiterUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role, waiterCode: users.waiterCode, waiterActive: users.waiterActive, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(sql`(${users.waiterCode} is not null OR ${users.role} in ('waiter', 'garcom'))`).orderBy(users.name);
}

export async function listWaiterCurrentAssignments() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({
    session: tableSessions,
    waiter: { id: users.id, name: users.name, email: users.email, waiterCode: users.waiterCode },
  }).from(tableSessions)
    .innerJoin(users, eq(tableSessions.attendingWaiterId, users.id))
    .where(and(eq(tableSessions.status, "open"), sql`${tableSessions.attendingWaiterId} IS NOT NULL`))
    .orderBy(users.name, tableSessions.tableNumber);
  return rows.map(({ session, waiter }) => ({
    waiter,
    table: {
      sessionToken: session.sessionToken,
      tableNumber: session.tableNumber,
      status: session.status,
      assignedAt: session.attendingSince,
      lastActivityAt: session.lastActivityAt,
      viewedAt: session.viewedAt,
    },
  }));
}

export async function getWaiterServiceHistory(waiterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [waiter] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, waiterCode: users.waiterCode, waiterActive: users.waiterActive })
    .from(users).where(eq(users.id, waiterId)).limit(1);
  if (!waiter) throw new Error("WAITER_NOT_FOUND");

  const sessions = await db.select().from(tableSessions)
    .where(eq(tableSessions.waiterId, waiterId))
    .orderBy(desc(tableSessions.updatedAt));
  const selections = sessions.length
    ? await db.select().from(tableSelections).where(inArray(tableSelections.sessionId, sessions.map((session) => session.id))).orderBy(desc(tableSelections.createdAt))
    : [];
  const events = await db.select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, metadata: auditLogs.metadata, createdAt: auditLogs.createdAt })
    .from(auditLogs).where(eq(auditLogs.userId, waiterId)).orderBy(desc(auditLogs.createdAt)).limit(200);

  const selectionsBySession = new Map<number, typeof selections>();
  for (const selection of selections) {
    const current = selectionsBySession.get(selection.sessionId) ?? [];
    current.push(selection);
    selectionsBySession.set(selection.sessionId, current);
  }
  const sessionHistory = sessions.map((session) => {
    const orders = selectionsBySession.get(session.id) ?? [];
    return {
      sessionToken: session.sessionToken,
      tableNumber: session.tableNumber,
      status: session.status,
      createdAt: session.createdAt,
      closedAt: session.closedAt,
      viewedAt: session.viewedAt,
      attendingSince: session.attendingSince,
      orderCount: orders.length,
      viewedOrderCount: orders.filter((order) => order.viewedAt).length,
      total: orders.reduce((sum, order) => sum + Number(order.subtotal), 0),
      orders: orders.map((order) => ({ id: order.id, selectionNumber: order.selectionNumber, status: order.status, subtotal: Number(order.subtotal), createdAt: order.createdAt, viewedAt: order.viewedAt, receivedAt: order.receivedAt, finalizedAt: order.finalizedAt })),
    };
  });
  return { waiter, sessions: sessionHistory, events };
}

export async function setWaiterActive(userId: number, active: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const [updated] = await db.update(users).set({ waiterActive: active ? 1 : 0, updatedAt: new Date() }).where(eq(users.id, userId)).returning({ id: users.id, name: users.name, email: users.email, waiterCode: users.waiterCode, waiterActive: users.waiterActive });
  if (!updated) throw new Error("WAITER_NOT_FOUND");
  return updated;
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
    sql`NOT EXISTS (SELECT 1 FROM table_selections WHERE table_selections."sessionId" = ${tableSessions.id})`,
  ));
}

export async function ensureTableSession(sessionToken: string, tableNumber = "01") {
  if (!sessionToken || sessionToken.length < 32) throw new Error("A valid session token is required");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await cleanupAbandonedTableSessions(db);
  const existing = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, sessionToken)).limit(1);
  if (existing[0]?.status === "closed") throw new Error("SESSION_CLOSED");
  await db.insert(tableSessions).values({ sessionToken, tableNumber }).onConflictDoUpdate({ target: tableSessions.sessionToken, set: { lastActivityAt: new Date(), status: "open", tableNumber } });
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
  const historicalWaiter = session.waiterId ? await db.select({ id: users.id, name: users.name, waiterCode: users.waiterCode, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session.waiterId)).limit(1) : [];
  const currentWaiter = session.attendingWaiterId ? await db.select({ id: users.id, name: users.name, waiterCode: users.waiterCode, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session.attendingWaiterId)).limit(1) : [];
  const waiter = session.status === "open" ? currentWaiter[0] ?? null : historicalWaiter[0] ?? null;
  return { session, waiter, currentWaiter: currentWaiter[0] ?? null, historicalWaiter: historicalWaiter[0] ?? null };
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
  const existing = await db.select().from(tableQrCodes).where(eq(tableQrCodes.tableNumber, normalized)).limit(1);
  if (existing[0]) return existing[0];
  const qrToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  await db.insert(tableQrCodes).values({ tableNumber: normalized, qrToken }).onConflictDoUpdate({ target: tableQrCodes.tableNumber, set: { updatedAt: new Date() } });
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
  const tableNumbers = Array.from(new Set([...qrTables.map((table) => table.tableNumber), ...sessions.map((session) => session.tableNumber)])).sort((a, b) => a.localeCompare(b, "pt", { numeric: true }));
  const result = [];
  for (const tableNumber of tableNumbers) {
    const sessionCandidates = sessions.filter((candidate) => candidate.tableNumber === tableNumber);
    let session = sessionCandidates[0];
    let sessionSelections = session ? await db.select().from(tableSelections).where(eq(tableSelections.sessionId, session.id)).orderBy(desc(tableSelections.createdAt)) : [];
    for (const candidate of sessionCandidates) {
      const candidateSelections = candidate.id === session?.id ? sessionSelections : await db.select().from(tableSelections).where(eq(tableSelections.sessionId, candidate.id)).orderBy(desc(tableSelections.createdAt));
      if (candidateSelections.some((selection) => !selection.viewedAt)) {
        session = candidate;
        sessionSelections = candidateSelections;
        break;
      }
    }
    if (!session) {
      result.push({ id: -Number(tableNumber), sessionToken: "", tableNumber, status: "open" as const, attendingWaiter: null, attendingWaiterId: null, attendingSince: null, selectionCount: 0, unviewedCount: 0, statusLabel: "empty" as const, total: 0, latestSelectionAt: null });
      continue;
    }
    const selections = sessionSelections;
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
  const updated = await db.update(tableSessions).set({ attendingWaiterId: waiterId, attendingSince: now, lastActivityAt: now, updatedAt: now })
    .where(and(eq(tableSessions.sessionToken, sessionToken), eq(tableSessions.status, "open"), isNull(tableSessions.attendingWaiterId)));
  if ((updated.rowCount ?? 0) === 0) {
    const current = await db.select({ attendingWaiterId: tableSessions.attendingWaiterId }).from(tableSessions).where(eq(tableSessions.sessionToken, sessionToken)).limit(1);
    if (current[0]?.attendingWaiterId && current[0].attendingWaiterId !== waiterId) throw new Error("TABLE_ALREADY_ASSIGNED");
    throw new Error("TABLE_NOT_AVAILABLE");
  }
  const history = await getTableHistoryForStaff(sessionToken, waiterId, false);
  return { ...history, previousAttendingWaiterId: null, newAttendingWaiterId: waiterId };
}

async function assertTableAccess(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, sessionToken: string, waiterId: number, isAdmin = false) {
  const rows = await db.select().from(tableSessions).where(and(eq(tableSessions.sessionToken, sessionToken), eq(tableSessions.status, "open"))).limit(1);
  if (!rows[0]) throw new Error("TABLE_NOT_FOUND");
  const session = rows[0];
  const canOperate = isAdmin || session.attendingWaiterId === waiterId;
  if (!canOperate) throw new Error(session.attendingWaiterId ? "TABLE_ALREADY_ASSIGNED" : "TABLE_NOT_ASSIGNED");
  return session;
}

export async function markTableViewedByStaff(sessionToken: string, waiterId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  const viewedAt = new Date();
  const historicalWaiterId = session.waiterId ?? session.attendingWaiterId ?? (isAdmin ? null : waiterId);
  await db.update(tableSessions).set({ waiterId: historicalWaiterId, viewedAt, lastActivityAt: viewedAt, updatedAt: viewedAt }).where(eq(tableSessions.id, session.id));
  await db.update(tableSelections).set({ viewedAt, receivedAt: viewedAt })
    .where(and(eq(tableSelections.sessionId, session.id), isNull(tableSelections.viewedAt)));
  return { success: true, waiterId: historicalWaiterId, viewedAt } as const;
}

export async function closeTableSessionByStaff(sessionToken: string, waiterId = 0, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  const closedAt = new Date();
  const historicalWaiterId = session.waiterId ?? session.attendingWaiterId ?? (isAdmin ? null : waiterId);
  const updated = await db.update(tableSessions).set({ status: "closed", closedAt, waiterId: historicalWaiterId, attendingWaiterId: null, attendingSince: null, updatedAt: closedAt })
    .where(and(eq(tableSessions.id, session.id), eq(tableSessions.status, "open")));
  return { success: (updated.rowCount ?? 0) > 0, waiterId: historicalWaiterId, closedAt } as const;
}

export async function releaseTableSessionByStaff(sessionToken: string, waiterId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  const releasedAt = new Date();
  const updated = await db.update(tableSessions).set({ attendingWaiterId: null, attendingSince: null, lastActivityAt: releasedAt, updatedAt: releasedAt })
    .where(and(eq(tableSessions.id, session.id), eq(tableSessions.status, "open"), isAdmin ? sql`TRUE` : eq(tableSessions.attendingWaiterId, waiterId)));
  if ((updated.rowCount ?? 0) === 0) throw new Error("TABLE_NOT_ASSIGNED");
  return { success: true, previousWaiterId: session.attendingWaiterId, newWaiterId: null, releasedAt } as const;
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
  const updated = await db.update(tableSelections).set({ status, finalizedAt: status === "COMPLETED" ? new Date() : undefined }).where(eq(tableSelections.id, selectionId));
  return { success: (updated.rowCount ?? 0) > 0, selectionId, status } as const;
}

export async function removeTableSelectionItem(itemId: number, waiterId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const rows = await tx.select({ selection: tableSelections, session: tableSessions, item: tableSelectionItems })
      .from(tableSelectionItems)
      .innerJoin(tableSelections, eq(tableSelectionItems.selectionId, tableSelections.id))
      .innerJoin(tableSessions, eq(tableSelections.sessionId, tableSessions.id))
      .where(eq(tableSelectionItems.id, itemId))
      .limit(1);
    if (!rows[0]) throw new Error("ITEM_NOT_FOUND");
    const { selection, session } = rows[0];
    if (selection.viewedAt) throw new Error("SELECTION_ALREADY_VIEWED");
    const canOperate = isAdmin || session.attendingWaiterId === waiterId;
    if (!canOperate) throw new Error(session.attendingWaiterId ? "TABLE_ALREADY_ASSIGNED" : "TABLE_NOT_ASSIGNED");
    const deleted = await tx.delete(tableSelectionItems).where(and(eq(tableSelectionItems.id, itemId), eq(tableSelectionItems.selectionId, selection.id)));
    if (deleted.rowCount === 0) throw new Error("ITEM_NOT_FOUND");
    const remaining = await tx.select({ quantity: tableSelectionItems.quantity, unitPrice: tableSelectionItems.unitPrice })
      .from(tableSelectionItems)
      .where(eq(tableSelectionItems.selectionId, selection.id));
    if (!remaining.length) throw new Error("SELECTION_CANNOT_BE_EMPTY");
    const subtotal = remaining.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    await tx.update(tableSelections).set({ subtotal: subtotal.toFixed(2) }).where(and(eq(tableSelections.id, selection.id), isNull(tableSelections.viewedAt)));
    await tx.update(tableSessions).set({ lastActivityAt: new Date() }).where(eq(tableSessions.id, session.id));
    return { success: true, itemId, selectionId: selection.id, subtotal } as const;
  });
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
  const table = await resolveTableReference(db, input.tableId || input.tableNumber || "01", Boolean(input.tableId));
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
    const openOrders = await tx.select({ id: tableSelections.id, selectionNumber: tableSelections.selectionNumber, subtotal: tableSelections.subtotal })
      .from(tableSelections)
      .where(and(eq(tableSelections.sessionId, session.id), isNull(tableSelections.viewedAt)))
      .orderBy(desc(tableSelections.createdAt))
      .limit(1);
    const openOrder = openOrders[0];
    if (openOrder) {
      const nextSubtotal = Number(openOrder.subtotal) + input.subtotal;
      await tx.update(tableSelections).set({ subtotal: nextSubtotal.toFixed(2) }).where(eq(tableSelections.id, openOrder.id));
      await tx.insert(tableSelectionItems).values(input.items.map((item) => ({ ...item, selectionId: openOrder.id, unitPrice: item.unitPrice.toFixed(2) })));
      await tx.update(tableSessions).set({ lastActivityAt: new Date() }).where(eq(tableSessions.id, session.id));
      return { id: openOrder.id, selectionNumber: openOrder.selectionNumber, sessionToken: effectiveToken, mergedIntoOpenOrder: true };
    }
    const existing = await tx.select({ id: tableSelections.id }).from(tableSelections).where(eq(tableSelections.sessionId, session.id));
    const selectionNumber = existing.length + 1;
    const now = new Date();
    const inserted = await tx.insert(tableSelections).values({ sessionId: session.id, selectionNumber, subtotal: input.subtotal.toFixed(2), sentAt: now }).returning({ id: tableSelections.id });
    const selectionId = inserted[0]?.id;
    if (!selectionId) throw new Error("SELECTION_CREATE_FAILED");
    await tx.insert(tableSelectionItems).values(input.items.map((item) => ({ ...item, selectionId, unitPrice: item.unitPrice.toFixed(2) })));
    await tx.update(tableSessions).set({ lastActivityAt: now }).where(eq(tableSessions.id, session.id));
    return { id: selectionId, selectionNumber, sessionToken: effectiveToken, mergedIntoOpenOrder: false };
  });
}


export const MENU_RESTAURANT_ID = "default";

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
  const inserted = await db.insert(menuProducts).values({ ...input, name, description: input.description?.trim() || null, preparation: input.preparation?.trim() || null, preparationEn: input.preparationEn?.trim() || null, restaurantId: MENU_RESTAURANT_ID, price: input.price.toFixed(2), status: "ACTIVE" }).returning({ id: menuProducts.id });
  const productId = inserted[0]?.id;
  if (!productId) throw new Error("PRODUCT_CREATE_FAILED");
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
  if (updated.rowCount === 0) throw new Error("PRODUCT_NOT_FOUND");
  const rows = await db.select().from(menuProducts).where(eq(menuProducts.id, id)).limit(1);
  if (!rows[0]) throw new Error("PRODUCT_STATUS_UPDATE_FAILED");
  return rows[0];
}
