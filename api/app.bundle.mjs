var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  garcons: () => garcons,
  menuCategories: () => menuCategories,
  menuProducts: () => menuProducts,
  tableQrCodes: () => tableQrCodes,
  tableSelectionItems: () => tableSelectionItems,
  tableSelections: () => tableSelections,
  tableSessions: () => tableSessions,
  users: () => users
});
import { sql } from "drizzle-orm";
import { check, index, integer, numeric, pgTable, serial, smallint, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 16 }).default("user").notNull(),
  waiterCode: varchar("waiterCode", { length: 32 }).unique(),
  waiterActive: smallint("waiterActive").default(1).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  roleCheck: check("users_role_check", sql`${table.role} IN ('user', 'admin', 'garcom')`)
}));
var auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull().default("default"),
  role: varchar("role", { length: 16 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: varchar("entityId", { length: 128 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  actionIdx: index("audit_logs_action_idx").on(table.action),
  createdIdx: index("audit_logs_created_idx").on(table.createdAt),
  userIdx: index("audit_logs_user_idx").on(table.userId)
}));
var garcons = pgTable("garcons", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: uuid("authUserId").notNull().unique(),
  legacyUserId: integer("legacyUserId").notNull().unique(),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull().default("default"),
  fullName: text("fullName").notNull(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }),
  role: varchar("role", { length: 16 }).notNull().default("GARCOM"),
  status: varchar("status", { length: 16 }).notNull().default("ATIVO"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  disabledAt: timestamp("disabledAt", { withTimezone: true })
}, (table) => ({
  restaurantIdx: index("garcons_restaurant_idx").on(table.restaurantId),
  statusIdx: index("garcons_status_idx").on(table.status)
}));
var tableSessions = pgTable("table_sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("sessionToken", { length: 128 }).notNull().unique(),
  tableNumber: varchar("tableNumber", { length: 32 }).notNull().default("01"),
  status: varchar("status", { length: 16 }).default("open").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closedAt", { withTimezone: true }),
  waiterId: integer("waiterId"),
  viewedAt: timestamp("viewedAt", { withTimezone: true }),
  attendingWaiterId: integer("attendingWaiterId"),
  attendingSince: timestamp("attendingSince", { withTimezone: true })
}, (table) => ({
  statusIdx: index("table_sessions_status_idx").on(table.status),
  tableNumberIdx: index("table_sessions_table_number_idx").on(table.tableNumber),
  attendingWaiterIdx: index("table_sessions_attending_waiter_idx").on(table.attendingWaiterId)
}));
var tableSelections = pgTable("table_selections", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  selectionNumber: integer("selectionNumber").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 16 }).default("PENDING").notNull(),
  notes: text("notes"),
  viewedAt: timestamp("viewedAt", { withTimezone: true }),
  viewedByWaiterId: integer("viewedByWaiterId"),
  sentAt: timestamp("sentAt", { withTimezone: true }),
  receivedAt: timestamp("receivedAt", { withTimezone: true }),
  finalizedAt: timestamp("finalizedAt", { withTimezone: true }),
  source: varchar("source", { length: 16 }).default("customer").notNull(),
  createdByWaiterId: integer("createdByWaiterId"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  sessionNumberUnique: uniqueIndex("table_selections_session_number_idx").on(table.sessionId, table.selectionNumber),
  sessionCreatedIdx: index("table_selections_session_created_idx").on(table.sessionId, table.createdAt),
  creatorIdx: index("table_selections_creator_idx").on(table.createdByWaiterId)
}));
var tableSelectionItems = pgTable("table_selection_items", {
  id: serial("id").primaryKey(),
  selectionId: integer("selectionId").notNull(),
  productId: integer("productId"),
  productName: varchar("productName", { length: 160 }).notNull(),
  preparation: text("preparation"),
  status: varchar("status", { length: 16 }).default("PENDING").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unitPrice", { precision: 10, scale: 2 }).notNull()
}, (table) => ({
  selectionIdx: index("table_selection_items_selection_idx").on(table.selectionId),
  productIdx: index("table_selection_items_product_idx").on(table.productId)
}));
var tableQrCodes = pgTable("table_qr_codes", {
  id: serial("id").primaryKey(),
  tableNumber: varchar("tableNumber", { length: 64 }).notNull().unique(),
  qrToken: varchar("qrToken", { length: 128 }).notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
});
var menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull().default("default"),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  status: varchar("status", { length: 16 }).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  restaurantIdx: index("menu_categories_restaurant_idx").on(table.restaurantId)
}));
var menuProducts = pgTable("menu_products", {
  id: serial("id").primaryKey(),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull().default("default"),
  categoryId: integer("categoryId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  nameEn: varchar("nameEn", { length: 160 }),
  description: text("description"),
  descriptionEn: text("descriptionEn"),
  preparation: text("preparation"),
  preparationEn: text("preparationEn"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  status: varchar("status", { length: 16 }).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deletedAt", { withTimezone: true })
}, (table) => ({
  restaurantStatusIdx: index("menu_products_restaurant_status_idx").on(table.restaurantId, table.status),
  categoryIdx: index("menu_products_category_idx").on(table.categoryId)
}));

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/supabaseAuth.ts
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL ?? "";
var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
var publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
var adminClient = null;
var authClient = null;
function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_AUTH_SERVER_CONFIGURATION_MISSING");
  }
  adminClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
  return adminClient;
}
function getAuthClient() {
  if (!supabaseUrl || !publishableKey) {
    throw new Error("SUPABASE_AUTH_CLIENT_CONFIGURATION_MISSING");
  }
  authClient ??= createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
  return authClient;
}
function assertWaiterAccessCode(accessCode) {
  if (!/^\d{6}$/.test(accessCode)) {
    throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");
  }
}
function deriveWaiterAuthPassword(authUserId, accessCode) {
  assertWaiterAccessCode(accessCode);
  if (!serviceRoleKey) throw new Error("SUPABASE_AUTH_SERVER_CONFIGURATION_MISSING");
  return createHmac("sha256", serviceRoleKey).update(`patio-zambeze:waiter:${authUserId}:${accessCode}`).digest("hex");
}
async function setSupabaseWaiterAccessCode(authUserId, accessCode) {
  const password = deriveWaiterAuthPassword(authUserId, accessCode);
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { password });
  if (error) {
    throw new Error(`SUPABASE_WAITER_ACCESS_CODE_UPDATE_FAILED:${error.message}`);
  }
  if (!data.user) {
    throw new Error("SUPABASE_WAITER_ACCESS_CODE_UPDATE_FAILED:USER_MISSING");
  }
  return data.user;
}
async function getSupabaseUserFromAccessToken(accessToken) {
  if (!accessToken) return null;
  try {
    const { data, error } = await getAdminClient().auth.getUser(accessToken);
    if (!error && data.user) return data.user;
  } catch {
  }
  try {
    const { data, error } = await getAuthClient().auth.getUser(accessToken);
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
}
async function createSupabaseAdminUser(input) {
  const client = getAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const { data: usersPage, error: listError } = await client.auth.admin.listUsers({ page: 1, perPage: 1e3 });
  if (listError) throw new Error(listError.message);
  const existing = usersPage.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
  if (existing) throw new Error("ADMIN_EMAIL_ALREADY_EXISTS");
  const { data, error } = await client.auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName.trim(), role: "ADMIN" }
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("SUPABASE_AUTH_ADMIN_CREATE_FAILED");
  return data.user;
}
async function findSupabaseUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await getAdminClient().auth.admin.listUsers({ page: 1, perPage: 1e3 });
  if (error) throw new Error(`SUPABASE_AUTH_LOOKUP_FAILED:${error.message}`);
  return data.users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail) ?? null;
}
async function createSupabaseWaiter(input) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const { data, error } = await getAdminClient().auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      phone: input.phone ?? "",
      role: "GARCOM"
    }
  });
  if (error) throw new Error(`SUPABASE_WAITER_CREATE_FAILED:${error.message}`);
  if (!data.user) throw new Error("SUPABASE_WAITER_CREATE_FAILED:USER_MISSING");
  return data.user;
}
async function deleteSupabaseUser(authUserId) {
  const { error } = await getAdminClient().auth.admin.deleteUser(authUserId);
  if (error) throw new Error(error.message);
}
async function deleteSupabaseWaiter(authUserId) {
  return deleteSupabaseUser(authUserId);
}
async function updateSupabaseAdmin(input) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(input.authUserId, {
    email: input.email.trim().toLowerCase(),
    ...input.password ? { password: input.password } : {},
    email_confirm: true,
    user_metadata: { full_name: input.fullName.trim(), role: "ADMIN" }
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("SUPABASE_AUTH_ADMIN_UPDATE_FAILED");
  return data.user;
}
async function disableSupabaseUser(authUserId) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { ban_duration: "876000h" });
  if (error) throw new Error(error.message);
  return data.user;
}
async function enableSupabaseUser(authUserId) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { ban_duration: "none" });
  if (error) throw new Error(error.message);
  return data.user;
}
async function updateSupabaseWaiter(input) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(input.authUserId, {
    email: input.email.trim().toLowerCase(),
    ...input.password ? { password: input.password } : {},
    user_metadata: {
      full_name: input.fullName,
      phone: input.phone ?? "",
      role: "GARCOM"
    }
  });
  if (error) throw new Error(`SUPABASE_WAITER_UPDATE_FAILED:${error.message}`);
  if (!data.user) throw new Error("SUPABASE_WAITER_UPDATE_FAILED:USER_MISSING");
  return data.user;
}
async function disableSupabaseWaiter(authUserId) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { ban_duration: "876000h" });
  if (error) throw new Error(error.message);
  return data.user;
}
async function enableSupabaseWaiter(authUserId) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { ban_duration: "none" });
  if (error) throw new Error(error.message);
  return data.user;
}

// server/waiterAccess.ts
var WAITER_ACCESS_CODE_PATTERN = /^\d{6}$/;
function normalizeWaiterAccessCode(value) {
  if (typeof value !== "string") return null;
  const code = value.trim();
  return WAITER_ACCESS_CODE_PATTERN.test(code) ? code : null;
}
function createWaiterCodeRateLimiter(options = {}) {
  const maxFailures = options.maxFailures ?? 5;
  const windowMs = options.windowMs ?? 15 * 60 * 1e3;
  const lockoutMs = options.lockoutMs ?? 15 * 60 * 1e3;
  const maxEntries = options.maxEntries ?? 1e4;
  const attempts2 = /* @__PURE__ */ new Map();
  const prune = (now) => {
    for (const [key, state] of Array.from(attempts2.entries())) {
      if (state.blockedUntil <= now && now - state.windowStartedAt > windowMs) attempts2.delete(key);
    }
    while (attempts2.size > maxEntries) {
      const firstKey = attempts2.keys().next().value;
      if (firstKey === void 0) break;
      attempts2.delete(firstKey);
    }
  };
  const check2 = (key, now = Date.now()) => {
    prune(now);
    const state = attempts2.get(key);
    if (!state) return { allowed: true, retryAfterMs: 0 };
    if (state.blockedUntil > now) {
      return { allowed: false, retryAfterMs: state.blockedUntil - now };
    }
    if (now - state.windowStartedAt >= windowMs) {
      attempts2.delete(key);
      return { allowed: true, retryAfterMs: 0 };
    }
    return { allowed: true, retryAfterMs: 0 };
  };
  const registerFailure = (key, now = Date.now()) => {
    prune(now);
    const current = attempts2.get(key);
    const state = !current || now - current.windowStartedAt >= windowMs ? { failures: 0, windowStartedAt: now, blockedUntil: 0 } : current;
    state.failures += 1;
    if (state.failures >= maxFailures) state.blockedUntil = now + lockoutMs;
    attempts2.set(key, state);
    return {
      blocked: state.blockedUntil > now,
      retryAfterMs: Math.max(0, state.blockedUntil - now),
      failures: state.failures
    };
  };
  const reset = (key) => {
    attempts2.delete(key);
  };
  return { check: check2, registerFailure, reset };
}
var waiterCodeRateLimiter = createWaiterCodeRateLimiter();

// server/db.ts
import { and, asc, desc, eq, gte, inArray, isNull, isNotNull, lt, or, sql as sql2 } from "drizzle-orm";
var _db = null;
var _pool = null;
async function getDb() {
  const connectionString = process.env.SUPABASE_DATABASE_URL?.replace(/[?&]sslmode=require\b/, "").replace(/[?&]$/, "");
  if (!_db && connectionString) {
    try {
      _pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 5
      });
      _db = drizzle(_pool, { schema: schema_exports });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function recordAuditLog(input) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({ userId: input.userId ?? null, restaurantId: input.restaurantId ?? "default", role: input.role, action: input.action, entityType: input.entityType, entityId: input.entityId == null ? void 0 : String(input.entityId), metadata: input.metadata ? JSON.stringify(input.metadata) : void 0 });
  } catch (error) {
    console.warn("[Audit] Could not persist audit event", error);
  }
}
async function getDailyStaffSummary(date, restaurantId = "default") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const start = /* @__PURE__ */ new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) throw new Error("INVALID_SUMMARY_DATE");
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1e3);
  const staff = await db.select({ id: users.id, name: users.name, waiterCode: users.waiterCode }).from(users).where(eq(users.role, "garcom")).orderBy(users.name);
  const events = await db.select({ userId: auditLogs.userId, action: auditLogs.action }).from(auditLogs).where(and(eq(auditLogs.restaurantId, restaurantId), eq(auditLogs.role, "garcom"), gte(auditLogs.createdAt, start), lt(auditLogs.createdAt, end)));
  const processed = await db.select({ id: tableSelections.id, waiterId: tableSelections.viewedByWaiterId }).from(tableSelections).where(and(gte(tableSelections.viewedAt, start), lt(tableSelections.viewedAt, end), isNotNull(tableSelections.viewedByWaiterId)));
  const byStaff = /* @__PURE__ */ new Map();
  for (const member of staff) byStaff.set(member.id, { actions: 0, receiptsProcessed: 0, byAction: {} });
  for (const event of events) {
    if (event.userId == null) continue;
    const stats = byStaff.get(event.userId) ?? { actions: 0, receiptsProcessed: 0, byAction: {} };
    stats.actions += 1;
    stats.byAction[event.action] = (stats.byAction[event.action] ?? 0) + 1;
    byStaff.set(event.userId, stats);
  }
  for (const receipt of processed) {
    if (receipt.waiterId == null) continue;
    const stats = byStaff.get(receipt.waiterId) ?? { actions: 0, receiptsProcessed: 0, byAction: {} };
    stats.receiptsProcessed += 1;
    byStaff.set(receipt.waiterId, stats);
  }
  const waiters = staff.map((member) => ({ ...member, ...byStaff.get(member.id) ?? { actions: 0, receiptsProcessed: 0, byAction: {} } }));
  return { date, totalProcessed: processed.length, totalActions: events.length, waiters };
}
async function getGarconProfileByLegacyUserId(legacyUserId) {
  const db = await getDb();
  if (!db) return null;
  const [profile] = await db.select({ id: garcons.id, authUserId: garcons.authUserId, legacyUserId: garcons.legacyUserId, restaurantId: garcons.restaurantId, role: garcons.role, status: garcons.status, fullName: garcons.fullName, email: garcons.email }).from(garcons).where(eq(garcons.legacyUserId, legacyUserId)).limit(1);
  return profile ?? null;
}
async function listGarcons() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select({ garcon: garcons, user: { id: users.id, openId: users.openId, name: users.name, email: users.email, waiterCode: users.waiterCode, waiterActive: users.waiterActive, role: users.role } }).from(garcons).innerJoin(users, eq(garcons.legacyUserId, users.id)).orderBy(garcons.fullName);
}
async function listReceiptWaiterOptions() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [historicalSessionWaiters, historicalReceiptWaiters] = await Promise.all([
    db.select({ id: tableSessions.waiterId }).from(tableSessions).where(isNotNull(tableSessions.waiterId)),
    db.select({ id: tableSelections.viewedByWaiterId }).from(tableSelections).where(isNotNull(tableSelections.viewedByWaiterId))
  ]);
  const historicalIds = Array.from(new Set([
    ...historicalSessionWaiters.map(({ id }) => id),
    ...historicalReceiptWaiters.map(({ id }) => id)
  ].filter((id) => id !== null)));
  const waiterRows = await db.select({ id: users.id, name: users.name, email: users.email, waiterCode: users.waiterCode, waiterActive: users.waiterActive, role: users.role }).from(users).where(or(eq(users.role, "garcom"), historicalIds.length ? inArray(users.id, historicalIds) : sql2`FALSE`)).orderBy(asc(users.name), asc(users.id));
  return waiterRows.map((waiter) => ({ ...waiter, active: waiter.waiterActive === 1, hasReceiptHistory: historicalIds.includes(waiter.id) }));
}
async function createGarcon(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const waiterCode = normalizeWaiterAccessCode(input.waiterCode);
  if (!fullName || !username || !email || !input.password) throw new Error("WAITER_REQUIRED_FIELDS");
  if (!waiterCode) throw new Error("WAITER_CODE_INVALID");
  if (input.password.length < 6) throw new Error("WAITER_PASSWORD_TOO_SHORT");
  const [codeOwner] = await db.select({ id: users.id }).from(users).where(eq(users.waiterCode, waiterCode)).limit(1);
  if (codeOwner) throw new Error("WAITER_CODE_ALREADY_IN_USE");
  const [localEmailOwner] = await db.select({ id: users.id, role: users.role }).from(users).where(sql2`lower(${users.email}) = ${email}`).limit(1);
  if (localEmailOwner) throw new Error("WAITER_EMAIL_ALREADY_EXISTS");
  const existingAuthUser = await findSupabaseUserByEmail(email);
  let authUser;
  let ownsAuthUser = false;
  if (existingAuthUser) {
    const existingRole = String(existingAuthUser.user_metadata?.role ?? "").toUpperCase();
    if (existingRole !== "GARCOM") throw new Error("WAITER_EMAIL_ALREADY_EXISTS");
    authUser = await updateSupabaseWaiter({ authUserId: existingAuthUser.id, email, password: input.password, fullName, phone: input.phone });
  } else {
    authUser = await createSupabaseWaiter({ email, password: input.password, fullName, phone: input.phone });
    ownsAuthUser = true;
  }
  let legacyUserId;
  let createdGarconId;
  try {
    await setSupabaseWaiterAccessCode(authUser.id, waiterCode);
    const openId = `supabase:${authUser.id}`;
    const [legacyUser] = await db.insert(users).values({ openId, name: fullName, email, loginMethod: "supabase", role: "garcom", waiterCode, waiterActive: input.active ? 1 : 0 }).onConflictDoNothing({ target: users.openId }).returning();
    if (!legacyUser) throw new Error("WAITER_EMAIL_OR_USER_ALREADY_EXISTS");
    legacyUserId = legacyUser.id;
    const [created] = await db.insert(garcons).values({ authUserId: authUser.id, legacyUserId: legacyUser.id, restaurantId: input.restaurantId ?? "default", fullName, username, email, phone: input.phone ?? null, status: input.active ? "ATIVO" : "INATIVO", disabledAt: input.active ? null : /* @__PURE__ */ new Date() }).returning();
    if (!created) throw new Error("WAITER_PROFILE_CREATE_FAILED");
    createdGarconId = created.id;
    if (!input.active) await disableSupabaseWaiter(authUser.id);
    return { ...created, legacyUser };
  } catch (error) {
    try {
      if (createdGarconId) await db.delete(garcons).where(eq(garcons.id, createdGarconId));
    } catch (cleanupError) {
      console.error("[Database] Failed to rollback waiter profile", cleanupError);
    }
    try {
      if (legacyUserId) await db.delete(users).where(eq(users.id, legacyUserId));
    } catch (cleanupError) {
      console.error("[Database] Failed to rollback legacy waiter", cleanupError);
    }
    if (ownsAuthUser) {
      try {
        await deleteSupabaseWaiter(authUser.id);
      } catch (cleanupError) {
        console.error("[Auth] Failed to rollback orphan waiter", cleanupError);
      }
    }
    throw error;
  }
}
async function createAdminUser(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName || !email || !input.password) throw new Error("ADMIN_REQUIRED_FIELDS");
  if (input.password.length < 6) throw new Error("ADMIN_PASSWORD_TOO_SHORT");
  const [existingProfile] = await db.select({ id: users.id }).from(users).where(sql2`lower(${users.email}) = ${email}`).limit(1);
  if (existingProfile) throw new Error("ADMIN_EMAIL_ALREADY_EXISTS");
  const authUser = await createSupabaseAdminUser({ email, password: input.password, fullName });
  try {
    const [profile] = await db.insert(users).values({ openId: `supabase:${authUser.id}`, name: fullName, email, loginMethod: "supabase", role: "admin", waiterActive: 1 }).returning({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role });
    if (!profile) throw new Error("ADMIN_PROFILE_CREATE_FAILED");
    return profile;
  } catch (error) {
    try {
      await deleteSupabaseUser(authUser.id);
    } catch (cleanupError) {
      console.error("[Auth] Failed to rollback orphan admin", cleanupError);
    }
    throw error;
  }
}
async function updateGarcon(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [current] = await db.select().from(garcons).where(eq(garcons.id, input.id)).limit(1);
  if (!current) throw new Error("WAITER_NOT_FOUND");
  const waiterCode = normalizeWaiterAccessCode(input.waiterCode);
  if (!waiterCode) throw new Error("WAITER_CODE_INVALID");
  const [codeOwner] = await db.select({ id: users.id }).from(users).where(and(eq(users.waiterCode, waiterCode), sql2`${users.id} <> ${current.legacyUserId}`)).limit(1);
  if (codeOwner) throw new Error("WAITER_CODE_ALREADY_IN_USE");
  await updateSupabaseWaiter({ authUserId: current.authUserId, email: input.email.trim().toLowerCase(), password: input.password, fullName: input.fullName.trim(), phone: input.phone });
  await setSupabaseWaiterAccessCode(current.authUserId, waiterCode);
  if (input.active) await enableSupabaseWaiter(current.authUserId);
  else await disableSupabaseWaiter(current.authUserId);
  const [updated] = await db.update(garcons).set({ fullName: input.fullName.trim(), username: input.username.trim().toLowerCase(), email: input.email.trim().toLowerCase(), phone: input.phone ?? null, status: input.active ? "ATIVO" : "INATIVO", disabledAt: input.active ? null : current.disabledAt ?? /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(garcons.id, input.id)).returning();
  await db.update(users).set({ name: input.fullName.trim(), email: input.email.trim().toLowerCase(), waiterCode, waiterActive: input.active ? 1 : 0, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, current.legacyUserId));
  return updated;
}
async function deleteGarcon(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [current] = await db.select({ id: garcons.id, authUserId: garcons.authUserId, legacyUserId: garcons.legacyUserId, fullName: garcons.fullName, email: garcons.email, restaurantId: garcons.restaurantId }).from(garcons).where(eq(garcons.id, id)).limit(1);
  if (!current) throw new Error("WAITER_NOT_FOUND");
  await deleteSupabaseWaiter(current.authUserId);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ role: "user", waiterCode: null, waiterActive: 0, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, current.legacyUserId));
    await tx.delete(garcons).where(eq(garcons.id, id));
  });
  return current;
}
async function listAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role, waiterActive: users.waiterActive, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.role, "admin")).orderBy(users.name);
}
async function getAdminById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [admin] = await db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role, waiterActive: users.waiterActive }).from(users).where(and(eq(users.id, id), eq(users.role, "admin"))).limit(1);
  if (!admin) throw new Error("ADMIN_NOT_FOUND");
  if (!admin.openId.startsWith("supabase:")) throw new Error("ADMIN_AUTH_ID_MISSING");
  return { db, admin, authUserId: admin.openId.slice("supabase:".length) };
}
async function updateAdminUser(input) {
  const { db, admin, authUserId } = await getAdminById(input.id);
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName || !email) throw new Error("ADMIN_REQUIRED_FIELDS");
  const [duplicate] = await db.select({ id: users.id }).from(users).where(and(sql2`lower(${users.email}) = ${email}`, sql2`${users.id} <> ${input.id}`)).limit(1);
  if (duplicate) throw new Error("ADMIN_EMAIL_ALREADY_EXISTS");
  await updateSupabaseAdmin({ authUserId, email, fullName, password: input.password });
  try {
    const [updated] = await db.update(users).set({ name: fullName, email, role: "admin", updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(users.id, input.id), eq(users.role, "admin"))).returning({ id: users.id, name: users.name, email: users.email, role: users.role, waiterActive: users.waiterActive });
    if (!updated) throw new Error("ADMIN_UPDATE_FAILED");
    return updated;
  } catch (error) {
    try {
      await updateSupabaseAdmin({ authUserId, email: admin.email ?? email, fullName: admin.name ?? fullName });
    } catch (rollbackError) {
      console.error("[Auth] Failed to rollback admin update", rollbackError);
    }
    throw error;
  }
}
async function setAdminActive(id, active) {
  const { db, admin, authUserId } = await getAdminById(id);
  if (!active && admin.waiterActive === 1) {
    const [{ count }] = await db.select({ count: sql2`count(*)` }).from(users).where(and(eq(users.role, "admin"), eq(users.waiterActive, 1)));
    if (Number(count) <= 1) throw new Error("LAST_ACTIVE_ADMIN");
  }
  const syncAuth = active ? enableSupabaseUser : disableSupabaseUser;
  const rollbackAuth = active ? disableSupabaseUser : enableSupabaseUser;
  await syncAuth(authUserId);
  try {
    const [updated] = await db.update(users).set({ waiterActive: active ? 1 : 0, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(users.id, id), eq(users.role, "admin"))).returning({ id: users.id, name: users.name, email: users.email, role: users.role, waiterActive: users.waiterActive });
    if (!updated) throw new Error("ADMIN_UPDATE_FAILED");
    return updated;
  } catch (error) {
    try {
      await rollbackAuth(authUserId);
    } catch (rollbackError) {
      console.error("[Auth] Failed to rollback admin active state", rollbackError);
    }
    throw error;
  }
}
async function deleteAdminUser(id) {
  const { db, admin, authUserId } = await getAdminById(id);
  if (admin.waiterActive === 1) {
    const [{ count }] = await db.select({ count: sql2`count(*)` }).from(users).where(and(eq(users.role, "admin"), eq(users.waiterActive, 1)));
    if (Number(count) <= 1) throw new Error("LAST_ACTIVE_ADMIN");
  }
  await deleteSupabaseUser(authUserId);
  try {
    const [updated] = await db.update(users).set({ role: "user", waiterCode: null, waiterActive: 0, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(users.id, id), eq(users.role, "admin"))).returning({ id: users.id, name: users.name, email: users.email, role: users.role, waiterActive: users.waiterActive });
    if (!updated) throw new Error("ADMIN_DELETE_FAILED");
    return updated;
  } catch (error) {
    console.error("[Database] Admin Auth deleted but profile cleanup failed", error);
    throw error;
  }
}
async function listWaiterCurrentAssignments() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({
    session: tableSessions,
    waiter: { id: users.id, name: users.name, email: users.email }
  }).from(tableSessions).innerJoin(users, eq(tableSessions.attendingWaiterId, users.id)).where(and(eq(tableSessions.status, "open"), sql2`${tableSessions.attendingWaiterId} IS NOT NULL`)).orderBy(users.name, tableSessions.tableNumber);
  return rows.map(({ session, waiter }) => ({
    waiter,
    table: {
      sessionToken: session.sessionToken,
      tableNumber: session.tableNumber,
      status: session.status,
      assignedAt: session.attendingSince,
      lastActivityAt: session.lastActivityAt,
      viewedAt: session.viewedAt
    }
  }));
}
async function getWaiterServiceHistory(waiterId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [waiter] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, waiterActive: users.waiterActive }).from(users).where(eq(users.id, waiterId)).limit(1);
  if (!waiter) throw new Error("WAITER_NOT_FOUND");
  const sessions = await db.select().from(tableSessions).where(eq(tableSessions.waiterId, waiterId)).orderBy(desc(tableSessions.updatedAt));
  const selections = sessions.length ? await db.select().from(tableSelections).where(inArray(tableSelections.sessionId, sessions.map((session) => session.id))).orderBy(desc(tableSelections.createdAt)) : [];
  const events = await db.select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, metadata: auditLogs.metadata, createdAt: auditLogs.createdAt }).from(auditLogs).where(eq(auditLogs.userId, waiterId)).orderBy(desc(auditLogs.createdAt)).limit(200);
  const selectionsBySession = /* @__PURE__ */ new Map();
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
      orders: orders.map((order) => ({ id: order.id, selectionNumber: order.selectionNumber, status: order.status, subtotal: Number(order.subtotal), createdAt: order.createdAt, viewedAt: order.viewedAt, receivedAt: order.receivedAt, finalizedAt: order.finalizedAt }))
    };
  });
  return { waiter, sessions: sessionHistory, events };
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
var lastSessionCleanupAt = 0;
async function cleanupAbandonedTableSessions(db) {
  if (!db || Date.now() - lastSessionCleanupAt < 10 * 60 * 1e3) return;
  lastSessionCleanupAt = Date.now();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1e3);
  await db.delete(tableSessions).where(and(
    eq(tableSessions.status, "open"),
    lt(tableSessions.lastActivityAt, cutoff),
    sql2`NOT EXISTS (SELECT 1 FROM table_selections WHERE table_selections."sessionId" = ${tableSessions.id})`
  ));
}
async function ensureTableSession(sessionToken, tableNumber = "01") {
  if (!sessionToken || sessionToken.length < 32) throw new Error("A valid session token is required");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await cleanupAbandonedTableSessions(db);
  return db.transaction(async (tx) => {
    await tx.execute(sql2`SELECT pg_advisory_xact_lock(hashtext(${`table-session:${tableNumber}`}))`);
    const now = /* @__PURE__ */ new Date();
    const active = await tx.select().from(tableSessions).where(and(eq(tableSessions.tableNumber, tableNumber), eq(tableSessions.status, "open"))).orderBy(desc(tableSessions.lastActivityAt), desc(tableSessions.id)).limit(1);
    if (active[0]) {
      await tx.update(tableSessions).set({ lastActivityAt: now, updatedAt: now }).where(eq(tableSessions.id, active[0].id));
      return { ...active[0], lastActivityAt: now, updatedAt: now };
    }
    const existing = await tx.select().from(tableSessions).where(eq(tableSessions.sessionToken, sessionToken)).limit(1);
    const effectiveToken = existing[0] ? `${crypto.randomUUID()}${crypto.randomUUID()}` : sessionToken;
    await tx.insert(tableSessions).values({ sessionToken: effectiveToken, tableNumber, status: "open", lastActivityAt: now, updatedAt: now });
    const rows = await tx.select().from(tableSessions).where(eq(tableSessions.sessionToken, effectiveToken)).limit(1);
    if (!rows[0]) throw new Error("Could not create table session");
    return rows[0];
  });
}
async function resolveTableReference(db, tableReference, requireQr = false) {
  if (!db) throw new Error("Database is not available");
  const qr = await db.select().from(tableQrCodes).where(eq(tableQrCodes.qrToken, tableReference)).limit(1);
  if (qr[0]) return { tableNumber: qr[0].tableNumber, tableId: qr[0].qrToken };
  if (requireQr) throw new Error("TABLE_NOT_FOUND");
  return { tableNumber: tableReference, tableId: tableReference };
}
async function getTableHistory(sessionToken, tableNumber = "01", tableId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const table = await resolveTableReference(db, tableId || tableNumber, Boolean(tableId));
  const session = await ensureTableSession(sessionToken, table.tableNumber);
  const selections = await db.select().from(tableSelections).where(eq(tableSelections.sessionId, session.id)).orderBy(desc(tableSelections.createdAt));
  const items = selections.length ? await db.select().from(tableSelectionItems).where(inArray(tableSelectionItems.selectionId, selections.map((selection) => selection.id))) : [];
  const viewedWaiterIds = Array.from(new Set(selections.map((selection) => selection.viewedByWaiterId).filter((id) => Boolean(id))));
  const viewedWaiters = viewedWaiterIds.length ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, viewedWaiterIds)) : [];
  return selections.map((selection) => ({
    ...selection,
    subtotal: Number(selection.subtotal),
    viewedByWaiter: viewedWaiters.find((waiter) => waiter.id === selection.viewedByWaiterId) ?? null,
    items: items.filter((item) => item.selectionId === selection.id).map((item) => ({ ...item, unitPrice: Number(item.unitPrice), subtotal: Number(item.unitPrice) * item.quantity }))
  }));
}
async function getTableSessionInfo(sessionToken, tableNumber = "01", tableId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const table = await resolveTableReference(db, tableId || tableNumber, Boolean(tableId));
  const session = await ensureTableSession(sessionToken, table.tableNumber);
  const historicalWaiter = session.waiterId ? await db.select({ id: users.id, name: users.name, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session.waiterId)).limit(1) : [];
  const currentWaiter = session.attendingWaiterId ? await db.select({ id: users.id, name: users.name, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session.attendingWaiterId)).limit(1) : [];
  const waiter = session.status === "open" ? currentWaiter[0] ?? null : historicalWaiter[0] ?? null;
  return { session, waiter, currentWaiter: currentWaiter[0] ?? null, historicalWaiter: historicalWaiter[0] ?? null };
}
async function listTableQrCodes() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(tableQrCodes).orderBy(tableQrCodes.tableNumber);
}
async function upsertTableQrCode(tableNumber) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalized = tableNumber.trim();
  if (!normalized) throw new Error("Table number is required");
  const existing = await db.select().from(tableQrCodes).where(eq(tableQrCodes.tableNumber, normalized)).limit(1);
  if (existing[0]) return existing[0];
  const qrToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  await db.insert(tableQrCodes).values({ tableNumber: normalized, qrToken }).onConflictDoUpdate({ target: tableQrCodes.tableNumber, set: { updatedAt: /* @__PURE__ */ new Date() } });
  const rows = await db.select().from(tableQrCodes).where(eq(tableQrCodes.tableNumber, normalized)).limit(1);
  if (!rows[0]) throw new Error("Could not create QR code");
  return rows[0];
}
async function getStaffTables() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const sessions = await db.select().from(tableSessions).where(eq(tableSessions.status, "open")).orderBy(tableSessions.tableNumber, desc(tableSessions.lastActivityAt));
  const qrTables = await db.select({ tableNumber: tableQrCodes.tableNumber }).from(tableQrCodes).orderBy(tableQrCodes.tableNumber);
  const tableNumbers = Array.from(/* @__PURE__ */ new Set([...qrTables.map((table) => table.tableNumber), ...sessions.map((session) => session.tableNumber)])).sort((a, b) => a.localeCompare(b, "pt", { numeric: true }));
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
      result.push({ id: -Number(tableNumber), sessionToken: "", tableNumber, status: "open", attendingWaiter: null, attendingWaiterId: null, attendingSince: null, selectionCount: 0, unviewedCount: 0, statusLabel: "empty", total: 0, latestSelectionAt: null });
      continue;
    }
    const selections = sessionSelections;
    const unviewed = selections.filter((selection) => !selection.viewedAt).length;
    const attendingWaiter = session.attendingWaiterId ? await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, session.attendingWaiterId)).limit(1) : [];
    result.push({
      ...session,
      attendingWaiter: attendingWaiter[0] ?? null,
      selectionCount: selections.length,
      unviewedCount: unviewed,
      statusLabel: unviewed > 0 ? "new" : selections.length > 0 ? "viewed" : "empty",
      total: selections.reduce((sum, selection) => sum + Number(selection.subtotal), 0),
      latestSelectionAt: selections[0]?.createdAt ?? null
    });
  }
  return result;
}
async function assumeTableSession(sessionToken, waiterId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const now = /* @__PURE__ */ new Date();
  const updated = await db.update(tableSessions).set({ attendingWaiterId: waiterId, attendingSince: now, lastActivityAt: now, updatedAt: now }).where(and(eq(tableSessions.sessionToken, sessionToken), eq(tableSessions.status, "open"), isNull(tableSessions.attendingWaiterId)));
  if ((updated.rowCount ?? 0) === 0) {
    const current = await db.select({ attendingWaiterId: tableSessions.attendingWaiterId }).from(tableSessions).where(eq(tableSessions.sessionToken, sessionToken)).limit(1);
    if (current[0]?.attendingWaiterId && current[0].attendingWaiterId !== waiterId) throw new Error("TABLE_ALREADY_ASSIGNED");
    throw new Error("TABLE_NOT_AVAILABLE");
  }
  const history = await getTableHistoryForStaff(sessionToken, waiterId, false);
  return { ...history, previousAttendingWaiterId: null, newAttendingWaiterId: waiterId };
}
async function assertTableAccess(db, sessionToken, waiterId, isAdmin = false) {
  const rows = await db.select().from(tableSessions).where(and(eq(tableSessions.sessionToken, sessionToken), eq(tableSessions.status, "open"))).limit(1);
  if (!rows[0]) throw new Error("TABLE_NOT_FOUND");
  const session = rows[0];
  const canOperate = isAdmin || session.attendingWaiterId === waiterId;
  if (!canOperate) throw new Error(session.attendingWaiterId ? "TABLE_ALREADY_ASSIGNED" : "TABLE_NOT_ASSIGNED");
  return session;
}
async function markTableViewedByStaff(sessionToken, waiterId, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  const viewedAt = /* @__PURE__ */ new Date();
  const historicalWaiterId = session.waiterId ?? session.attendingWaiterId ?? (isAdmin ? null : waiterId);
  const pendingSelections = await db.select({ id: tableSelections.id }).from(tableSelections).where(and(eq(tableSelections.sessionId, session.id), isNull(tableSelections.viewedAt)));
  await db.update(tableSessions).set({ waiterId: historicalWaiterId, viewedAt, lastActivityAt: viewedAt, updatedAt: viewedAt }).where(eq(tableSessions.id, session.id));
  await db.update(tableSelections).set({ viewedAt, viewedByWaiterId: waiterId, receivedAt: viewedAt }).where(and(eq(tableSelections.sessionId, session.id), isNull(tableSelections.viewedAt)));
  return { success: true, waiterId: historicalWaiterId, viewedAt, selectionIds: pendingSelections.map((selection) => selection.id) };
}
async function closeTableSessionByStaff(sessionToken, waiterId = 0, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  const closedAt = /* @__PURE__ */ new Date();
  const historicalWaiterId = session.waiterId ?? session.attendingWaiterId ?? (isAdmin ? null : waiterId);
  const updated = await db.update(tableSessions).set({ status: "closed", closedAt, waiterId: historicalWaiterId, attendingWaiterId: null, attendingSince: null, updatedAt: closedAt }).where(and(eq(tableSessions.id, session.id), eq(tableSessions.status, "open")));
  return { success: (updated.rowCount ?? 0) > 0, waiterId: historicalWaiterId, closedAt };
}
async function releaseTableSessionByStaff(sessionToken, waiterId, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await assertTableAccess(db, sessionToken, waiterId, isAdmin);
  const releasedAt = /* @__PURE__ */ new Date();
  const updated = await db.update(tableSessions).set({ attendingWaiterId: null, attendingSince: null, lastActivityAt: releasedAt, updatedAt: releasedAt }).where(and(eq(tableSessions.id, session.id), eq(tableSessions.status, "open"), isAdmin ? sql2`TRUE` : eq(tableSessions.attendingWaiterId, waiterId)));
  if ((updated.rowCount ?? 0) === 0) throw new Error("TABLE_NOT_ASSIGNED");
  return { success: true, previousWaiterId: session.attendingWaiterId, newWaiterId: null, releasedAt };
}
async function getTableHistoryForStaff(sessionToken, waiterId, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, sessionToken)).limit(1);
  if (!session[0]) return null;
  if (isAdmin && waiterId && !session[0].waiterId) {
    await db.update(tableSessions).set({ waiterId }).where(eq(tableSessions.id, session[0].id));
    session[0].waiterId = waiterId;
  }
  const attendingWaiter = session[0].attendingWaiterId ? await db.select({ id: users.id, name: users.name, email: users.email, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session[0].attendingWaiterId)).limit(1) : [];
  const waiter = session[0].waiterId ? await db.select({ id: users.id, name: users.name, email: users.email, waiterActive: users.waiterActive }).from(users).where(eq(users.id, session[0].waiterId)).limit(1) : [];
  const canOperate = isAdmin || waiterId !== void 0 && session[0].attendingWaiterId === waiterId;
  const selections = await db.select().from(tableSelections).where(eq(tableSelections.sessionId, session[0].id)).orderBy(desc(tableSelections.createdAt));
  const items = selections.length ? await db.select().from(tableSelectionItems).where(inArray(tableSelectionItems.selectionId, selections.map((selection) => selection.id))) : [];
  const viewedWaiterIds = Array.from(new Set(selections.map((selection) => selection.viewedByWaiterId).filter((id) => Boolean(id))));
  const viewedWaiters = viewedWaiterIds.length ? await db.select({ id: users.id, name: users.name, email: users.email, waiterActive: users.waiterActive }).from(users).where(inArray(users.id, viewedWaiterIds)) : [];
  return {
    session: session[0],
    waiter: waiter[0] ?? null,
    attendingWaiter: attendingWaiter[0] ?? null,
    canOperate,
    selections: selections.map((selection) => ({
      ...selection,
      subtotal: Number(selection.subtotal),
      viewedByWaiter: viewedWaiters.find((waiter2) => waiter2.id === selection.viewedByWaiterId) ?? null,
      items: items.filter((item) => item.selectionId === selection.id).map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.unitPrice) * item.quantity
      }))
    }))
  };
}
async function listViewedReceipts(waiterId, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const sessions = await db.select().from(tableSessions).where(sql2`${tableSessions.viewedAt} IS NOT NULL`).orderBy(desc(tableSessions.viewedAt));
  const result = [];
  for (const session of sessions) {
    const selections = await db.select().from(tableSelections).where(and(eq(tableSelections.sessionId, session.id), sql2`${tableSelections.viewedAt} IS NOT NULL`)).orderBy(desc(tableSelections.viewedAt), tableSelections.selectionNumber);
    if (!selections.length) continue;
    const items = await db.select().from(tableSelectionItems).where(inArray(tableSelectionItems.selectionId, selections.map((selection) => selection.id)));
    for (const selection of selections) {
      const assignedWaiterId = selection.viewedByWaiterId;
      if (!isAdmin && (waiterId === void 0 || assignedWaiterId !== waiterId)) continue;
      const receiptWaiterId = assignedWaiterId ?? (isAdmin ? session.waiterId : null);
      const waiter = receiptWaiterId ? await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, receiptWaiterId)).limit(1) : [];
      const receiptSelection = {
        ...selection,
        subtotal: Number(selection.subtotal),
        items: items.filter((item) => item.selectionId === selection.id).map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.unitPrice) * item.quantity
        }))
      };
      result.push({
        id: selection.id,
        session,
        waiter: waiter[0] ?? null,
        total: receiptSelection.subtotal,
        selections: [receiptSelection]
      });
    }
  }
  return result;
}
async function getViewedReceiptForStaff(selectionId, waiterId, isAdmin = false) {
  const receipts = await listViewedReceipts(waiterId, isAdmin);
  return receipts.find((receipt) => receipt.id === selectionId) ?? null;
}
async function setTableSelectionStatus(selectionId, status, waiterId, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ sessionToken: tableSessions.sessionToken }).from(tableSelections).innerJoin(tableSessions, eq(tableSelections.sessionId, tableSessions.id)).where(eq(tableSelections.id, selectionId)).limit(1);
  if (!rows[0]) throw new Error("SELECTION_NOT_FOUND");
  await assertTableAccess(db, rows[0].sessionToken, waiterId, isAdmin);
  const selection = await db.select({ viewedAt: tableSelections.viewedAt }).from(tableSelections).where(eq(tableSelections.id, selectionId)).limit(1);
  if (selection[0]?.viewedAt && !isAdmin) throw new Error("SELECTION_ALREADY_VIEWED");
  await db.update(tableSelectionItems).set({ status }).where(eq(tableSelectionItems.selectionId, selectionId));
  const updated = await db.update(tableSelections).set({ status, finalizedAt: status === "COMPLETED" ? /* @__PURE__ */ new Date() : void 0 }).where(eq(tableSelections.id, selectionId));
  return { success: (updated.rowCount ?? 0) > 0, selectionId, status };
}
async function removeTableSelectionItem(itemId, waiterId, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const rows = await tx.select({ selection: tableSelections, session: tableSessions, item: tableSelectionItems }).from(tableSelectionItems).innerJoin(tableSelections, eq(tableSelectionItems.selectionId, tableSelections.id)).innerJoin(tableSessions, eq(tableSelections.sessionId, tableSessions.id)).where(eq(tableSelectionItems.id, itemId)).limit(1);
    if (!rows[0]) throw new Error("ITEM_NOT_FOUND");
    const { selection, session } = rows[0];
    if (selection.status !== "PENDING" || rows[0].item.status !== "PENDING") throw new Error("ITEM_NOT_PENDING");
    const canOperate = isAdmin || session.attendingWaiterId === waiterId;
    if (!canOperate) throw new Error(session.attendingWaiterId ? "TABLE_ALREADY_ASSIGNED" : "TABLE_NOT_ASSIGNED");
    const currentItems = await tx.select({ id: tableSelectionItems.id, quantity: tableSelectionItems.quantity, unitPrice: tableSelectionItems.unitPrice }).from(tableSelectionItems).where(eq(tableSelectionItems.selectionId, selection.id));
    if (currentItems.length <= 1) throw new Error("SELECTION_CANNOT_BE_EMPTY");
    const deleted = await tx.delete(tableSelectionItems).where(and(eq(tableSelectionItems.id, itemId), eq(tableSelectionItems.selectionId, selection.id), eq(tableSelectionItems.status, "PENDING")));
    if (deleted.rowCount === 0) throw new Error("ITEM_NOT_FOUND");
    const remaining = currentItems.filter((item) => item.id !== itemId);
    const subtotal = remaining.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    await tx.update(tableSelections).set({ subtotal: subtotal.toFixed(2) }).where(isAdmin ? eq(tableSelections.id, selection.id) : and(eq(tableSelections.id, selection.id), isNull(tableSelections.viewedAt)));
    await tx.update(tableSessions).set({ lastActivityAt: /* @__PURE__ */ new Date() }).where(eq(tableSessions.id, session.id));
    return { success: true, itemId, selectionId: selection.id, productName: rows[0].item.productName, quantity: rows[0].item.quantity, subtotal, removedAt: /* @__PURE__ */ new Date() };
  });
}
async function createTableSelection(input) {
  if (!input.items.length) throw new Error("Cannot persist an empty selection");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const table = await resolveTableReference(db, input.tableId || input.tableNumber || "01", Boolean(input.tableId));
  let effectiveToken = input.sessionToken;
  let session;
  try {
    session = await ensureTableSession(effectiveToken, table.tableNumber);
    effectiveToken = session.sessionToken;
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_CLOSED") {
      effectiveToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      session = await ensureTableSession(effectiveToken, table.tableNumber);
      effectiveToken = session.sessionToken;
    } else {
      throw error;
    }
  }
  return db.transaction(async (tx) => {
    const productIds = input.items.flatMap((item) => item.productId ? [item.productId] : []);
    let itemsToPersist = input.items;
    if (productIds.length) {
      const validProducts = await tx.select({ id: menuProducts.id, name: menuProducts.name, price: menuProducts.price, preparation: menuProducts.preparation }).from(menuProducts).where(and(eq(menuProducts.restaurantId, MENU_RESTAURANT_ID), inArray(menuProducts.id, productIds), eq(menuProducts.status, "ACTIVE")));
      if (validProducts.length !== new Set(productIds).size) throw new Error("PRODUCT_NOT_AVAILABLE");
      const byId = new Map(validProducts.map((product) => [product.id, product]));
      itemsToPersist = input.items.map((item) => {
        if (!item.productId) return item;
        const product = byId.get(item.productId);
        if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
        return { ...item, productName: product.name, unitPrice: Number(product.price), preparation: product.preparation ?? item.preparation };
      });
    }
    const persistedSubtotal = itemsToPersist.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const openOrders = input.mergeOpenOrder === false ? [] : await tx.select({ id: tableSelections.id, selectionNumber: tableSelections.selectionNumber, subtotal: tableSelections.subtotal }).from(tableSelections).where(and(eq(tableSelections.sessionId, session.id), isNull(tableSelections.viewedAt))).orderBy(desc(tableSelections.createdAt)).limit(1);
    const openOrder = openOrders[0];
    if (openOrder) {
      const nextSubtotal = Number(openOrder.subtotal) + persistedSubtotal;
      await tx.update(tableSelections).set({ subtotal: nextSubtotal.toFixed(2) }).where(eq(tableSelections.id, openOrder.id));
      await tx.insert(tableSelectionItems).values(itemsToPersist.map((item) => ({ ...item, selectionId: openOrder.id, unitPrice: item.unitPrice.toFixed(2) })));
      await tx.update(tableSessions).set({ lastActivityAt: /* @__PURE__ */ new Date() }).where(eq(tableSessions.id, session.id));
      return { id: openOrder.id, selectionNumber: openOrder.selectionNumber, sessionToken: effectiveToken, mergedIntoOpenOrder: true };
    }
    const existing = await tx.select({ id: tableSelections.id }).from(tableSelections).where(eq(tableSelections.sessionId, session.id));
    const selectionNumber = existing.length + 1;
    const now = /* @__PURE__ */ new Date();
    const inserted = await tx.insert(tableSelections).values({ sessionId: session.id, selectionNumber, subtotal: persistedSubtotal.toFixed(2), notes: input.notes?.trim() || null, source: input.source ?? "customer", createdByWaiterId: input.createdByWaiterId ?? null, sentAt: now }).returning({ id: tableSelections.id });
    const selectionId = inserted[0]?.id;
    if (!selectionId) throw new Error("SELECTION_CREATE_FAILED");
    await tx.insert(tableSelectionItems).values(itemsToPersist.map((item) => ({ ...item, selectionId, unitPrice: item.unitPrice.toFixed(2) })));
    await tx.update(tableSessions).set({ lastActivityAt: now }).where(eq(tableSessions.id, session.id));
    return { id: selectionId, selectionNumber, sessionToken: effectiveToken, mergedIntoOpenOrder: false };
  });
}
async function createManualTableSelection(input) {
  if (!input.items.length) throw new Error("SELECTION_CANNOT_BE_EMPTY");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const table = await resolveTableReference(db, input.tableId, true);
  const openSessions = await db.select().from(tableSessions).where(and(eq(tableSessions.tableNumber, table.tableNumber), eq(tableSessions.status, "open"))).orderBy(desc(tableSessions.updatedAt)).limit(1);
  let session = openSessions[0];
  if (session?.attendingWaiterId && session.attendingWaiterId !== input.waiterId) throw new Error("TABLE_ALREADY_ASSIGNED");
  if (!session) {
    const sessionToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    session = await ensureTableSession(sessionToken, table.tableNumber);
  }
  if (!session.attendingWaiterId) {
    await assumeTableSession(session.sessionToken, input.waiterId);
    const claimed = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, session.sessionToken)).limit(1);
    session = claimed[0] ?? session;
  }
  const productIds = input.items.map((item) => item.productId);
  const products = await db.select({ id: menuProducts.id, name: menuProducts.name, price: menuProducts.price, preparation: menuProducts.preparation }).from(menuProducts).where(and(eq(menuProducts.restaurantId, MENU_RESTAURANT_ID), inArray(menuProducts.id, productIds), eq(menuProducts.status, "ACTIVE")));
  const byId = new Map(products.map((product) => [product.id, product]));
  if (products.length !== new Set(productIds).size) throw new Error("PRODUCT_NOT_AVAILABLE");
  const items = input.items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
    return { productId: product.id, productName: product.name, preparation: product.preparation ?? void 0, quantity: item.quantity, unitPrice: Number(product.price) };
  });
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const result = await createTableSelection({ sessionToken: session.sessionToken, tableNumber: table.tableNumber, items, subtotal, notes: input.notes, source: "waiter", createdByWaiterId: input.waiterId, mergeOpenOrder: false });
  return { ...result, tableNumber: table.tableNumber, waiterId: input.waiterId };
}
var MENU_RESTAURANT_ID = "default";
async function listMenuCategories(includeInactive = true) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const conditions = includeInactive ? eq(menuCategories.restaurantId, MENU_RESTAURANT_ID) : and(eq(menuCategories.restaurantId, MENU_RESTAURANT_ID), eq(menuCategories.status, "ACTIVE"));
  return db.select().from(menuCategories).where(conditions).orderBy(asc(menuCategories.displayOrder), asc(menuCategories.name));
}
async function createMenuCategory(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalized = input.name.trim();
  if (!normalized) throw new Error("Category name is required");
  const inserted = await db.insert(menuCategories).values({ restaurantId: MENU_RESTAURANT_ID, name: normalized, description: input.description?.trim() || null, displayOrder: input.displayOrder ?? 0 }).returning({ id: menuCategories.id });
  const rows = await db.select().from(menuCategories).where(eq(menuCategories.id, inserted[0].id)).limit(1);
  return rows[0];
}
async function updateMenuCategory(id, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalized = input.name.trim();
  if (!normalized) throw new Error("Category name is required");
  const existing = await db.select({ id: menuCategories.id }).from(menuCategories).where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, MENU_RESTAURANT_ID))).limit(1);
  if (!existing[0]) throw new Error("CATEGORY_NOT_FOUND");
  await db.update(menuCategories).set({ name: normalized, description: input.description?.trim() || null, displayOrder: input.displayOrder ?? 0, status: input.status ?? "ACTIVE", updatedAt: /* @__PURE__ */ new Date() }).where(eq(menuCategories.id, id));
  const rows = await db.select().from(menuCategories).where(eq(menuCategories.id, id)).limit(1);
  return rows[0];
}
async function deleteMenuCategory(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const category = await db.select({ id: menuCategories.id }).from(menuCategories).where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, MENU_RESTAURANT_ID))).limit(1);
  if (!category[0]) throw new Error("CATEGORY_NOT_FOUND");
  const linked = await db.select({ id: menuProducts.id }).from(menuProducts).where(and(eq(menuProducts.categoryId, id), inArray(menuProducts.status, ["ACTIVE", "INACTIVE"]))).limit(1);
  if (linked[0]) throw new Error("CATEGORY_HAS_PRODUCTS");
  await db.update(menuCategories).set({ status: "REMOVED", updatedAt: /* @__PURE__ */ new Date() }).where(eq(menuCategories.id, id));
  return { success: true };
}
async function listMenuProducts(includeRemoved = false, publicOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const statuses = includeRemoved ? ["ACTIVE", "INACTIVE", "REMOVED"] : publicOnly ? ["ACTIVE"] : ["ACTIVE", "INACTIVE"];
  const categoryStatus = publicOnly ? eq(menuCategories.status, "ACTIVE") : sql2`TRUE`;
  return db.select({ product: menuProducts, category: menuCategories }).from(menuProducts).innerJoin(menuCategories, eq(menuProducts.categoryId, menuCategories.id)).where(and(eq(menuProducts.restaurantId, MENU_RESTAURANT_ID), eq(menuCategories.restaurantId, MENU_RESTAURANT_ID), categoryStatus, inArray(menuProducts.status, statuses))).orderBy(asc(menuCategories.displayOrder), asc(menuProducts.displayOrder), asc(menuProducts.name));
}
async function assertMenuCategory(db, categoryId) {
  const rows = await db.select({ id: menuCategories.id }).from(menuCategories).where(and(eq(menuCategories.id, categoryId), eq(menuCategories.restaurantId, MENU_RESTAURANT_ID), eq(menuCategories.status, "ACTIVE"))).limit(1);
  if (!rows[0]) throw new Error("CATEGORY_NOT_FOUND");
}
async function createMenuProduct(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const name = input.name.trim();
  if (!name) throw new Error("PRODUCT_NAME_REQUIRED");
  await assertMenuCategory(db, input.categoryId);
  const inserted = await db.insert(menuProducts).values({ categoryId: input.categoryId, name, description: input.description?.trim() || null, preparation: input.preparation?.trim() || null, restaurantId: MENU_RESTAURANT_ID, price: input.price.toFixed(2), status: "ACTIVE", imageUrl: input.imageUrl ?? null }).returning({ id: menuProducts.id });
  const productId = inserted[0]?.id;
  if (!productId) throw new Error("PRODUCT_CREATE_FAILED");
  const rows = await db.select().from(menuProducts).where(eq(menuProducts.id, productId)).limit(1);
  if (!rows[0]) throw new Error("PRODUCT_CREATE_FAILED");
  return rows[0];
}
async function updateMenuProduct(id, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const name = input.name.trim();
  if (!name) throw new Error("PRODUCT_NAME_REQUIRED");
  await assertMenuCategory(db, input.categoryId);
  const existing = await db.select({ id: menuProducts.id }).from(menuProducts).where(and(eq(menuProducts.id, id), eq(menuProducts.restaurantId, MENU_RESTAURANT_ID), inArray(menuProducts.status, ["ACTIVE", "INACTIVE"]))).limit(1);
  if (!existing[0]) throw new Error("PRODUCT_NOT_FOUND");
  await db.update(menuProducts).set({ categoryId: input.categoryId, name, description: input.description?.trim() || null, preparation: input.preparation?.trim() || null, price: input.price.toFixed(2), imageUrl: input.imageUrl, updatedAt: /* @__PURE__ */ new Date() }).where(eq(menuProducts.id, id));
  const rows = await db.select().from(menuProducts).where(eq(menuProducts.id, id)).limit(1);
  if (!rows[0]) throw new Error("PRODUCT_UPDATE_FAILED");
  return rows[0];
}
async function setMenuProductStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const updated = await db.update(menuProducts).set({ status, deletedAt: status === "REMOVED" ? /* @__PURE__ */ new Date() : null, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(menuProducts.id, id), eq(menuProducts.restaurantId, MENU_RESTAURANT_ID), inArray(menuProducts.status, ["ACTIVE", "INACTIVE"])));
  if (updated.rowCount === 0) throw new Error("PRODUCT_NOT_FOUND");
  const rows = await db.select().from(menuProducts).where(eq(menuProducts.id, id)).limit(1);
  if (!rows[0]) throw new Error("PRODUCT_STATUS_UPDATE_FAILED");
  return rows[0];
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const persistedUser = await getUserByOpenId(userInfo.openId);
      if (persistedUser) {
        await recordAuditLog({ userId: persistedUser.id, role: persistedUser.role, action: "AUTH_LOGIN_SUCCESS", entityType: "auth_session", entityId: persistedUser.openId });
      }
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
async function serveStorageKey(key, res) {
  const normalizedKey = key.replace(/^\/+/, "");
  if (!normalizedKey) {
    res.status(400).send("Missing storage key");
    return;
  }
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    res.status(500).send("Storage proxy not configured");
    return;
  }
  try {
    const forgeUrl = new URL(
      "v1/storage/presign/get",
      ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
    );
    forgeUrl.searchParams.set("path", normalizedKey);
    const forgeResp = await fetch(forgeUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
    });
    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => "");
      console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
      res.status(forgeResp.status === 404 ? 404 : 502).send("Storage object unavailable");
      return;
    }
    const { url } = await forgeResp.json();
    if (!url) {
      res.status(502).send("Empty signed URL from backend");
      return;
    }
    res.set("Cache-Control", "public, max-age=300");
    res.redirect(307, url);
  } catch (err) {
    console.error("[StorageProxy] failed:", err);
    res.status(502).send("Storage proxy unavailable");
  }
}
function registerStorageProxy(app) {
  app.get("/api/storage", (req, res) => {
    const queryPath = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;
    void serveStorageKey(String(queryPath ?? ""), res);
  });
  app.get(["/manus-storage/*", "/api/manus-storage/*"], (req, res) => {
    const rawKey = req.params[0] ?? "";
    const key = rawKey.replace(/^api\/manus-storage\//, "");
    void serveStorageKey(key, res);
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";

// shared/roles.ts
function isAdminRole(role) {
  return role === "admin";
}
var WAITER_ACCESS_CODE_PATTERN2 = /^\d{6}$/;
function isWaiterRole(role, waiterCode) {
  return role === "garcom" && WAITER_ACCESS_CODE_PATTERN2.test(waiterCode ?? "");
}
function canUseWaiterPanel(role, waiterCode, waiterActive) {
  return isAdminRole(role) || isWaiterRole(role, waiterCode) && waiterActive !== 0;
}

// server/_core/trpc.ts
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var staffProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!canUseWaiterPanel(ctx.user.role, ctx.user.waiterCode, ctx.user.waiterActive)) {
      throw new TRPCError2({ code: "FORBIDDEN", message: "Acesso ao painel do gar\xE7om n\xE3o autorizado ou conta desactivada." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin" || ctx.user.waiterActive === 0) {
      throw new TRPCError2({ code: "FORBIDDEN", message: ctx.user?.role === "admin" ? "Esta conta est\xE1 desactivada. Contacte um administrador." : NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";

// server/menuTranslation.ts
import { createHash } from "node:crypto";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/menuTranslation.ts
var cache = /* @__PURE__ */ new Map();
var MAX_CACHE_ENTRIES = 64;
var sourcePayload = (products, categories) => ({
  categories: categories.filter((category) => category.status === "ACTIVE").map((category) => ({ id: String(category.id), name: category.name })),
  products: products.map(({ product, category }) => ({
    id: String(product.id),
    name: product.name,
    description: product.description ?? "",
    preparation: product.preparation ?? "",
    category: category?.name ?? ""
  }))
});
var emptyResult = (cacheKey) => ({ available: false, cacheKey, categories: {}, products: {} });
async function translateActiveMenu() {
  const [products, categories] = await Promise.all([listMenuProducts(false, true), listMenuCategories(false)]);
  const payload = sourcePayload(products, categories);
  const cacheKey = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  try {
    const response = await invokeLLM({
      model: "gpt-5-mini",
      maxTokens: 5e3,
      messages: [
        { role: "system", content: "You are a restaurant menu translator. Translate Mozambican Portuguese to natural, concise English. Preserve proper names when appropriate. Return only the requested JSON. Never translate prices, IDs, quantities, dates, codes, or numbers; those are not included in the output." },
        { role: "user", content: `Translate the following restaurant catalog from Portuguese to English. Keep every id exactly unchanged and return one entry for every category and product. For empty source text, return an empty string. Source catalog JSON:
${JSON.stringify(payload)}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translated_menu_catalog",
          strict: true,
          schema: {
            type: "object",
            properties: {
              categories: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } }, required: ["id", "name"], additionalProperties: false } },
              products: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, description: { type: "string" }, preparation: { type: "string" } }, required: ["id", "name", "description", "preparation"], additionalProperties: false } }
            },
            required: ["categories", "products"],
            additionalProperties: false
          }
        }
      }
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("TRANSLATION_EMPTY_RESPONSE");
    const translated = JSON.parse(content);
    const result = {
      available: true,
      cacheKey,
      categories: Object.fromEntries(translated.categories.map((item) => [item.id, item.name])),
      products: Object.fromEntries(translated.products.map((item) => [item.id, { name: item.name, description: item.description, preparation: item.preparation }]))
    };
    cache.set(cacheKey, result);
    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
    return result;
  } catch (error) {
    console.warn("[MenuTranslation] Translation unavailable; using Portuguese fallback", error);
    const result = emptyResult(cacheKey);
    cache.set(cacheKey, result);
    return result;
  }
}

// server/routers.ts
import { randomBytes, randomUUID } from "node:crypto";

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/quickWaiterLogin.ts
import { and as and2, eq as eq2 } from "drizzle-orm";
var WINDOW_MS = 3e4;
var MAX_ATTEMPTS = 5;
var attempts = /* @__PURE__ */ new Map();
function normalizeCode(code) {
  return typeof code === "string" ? code : "";
}
function checkRateLimit(key) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}
async function quickWaiterLogin(code, rateLimitKey) {
  if (!checkRateLimit(rateLimitKey)) throw new Error("WAITER_LOGIN_RATE_LIMITED");
  const normalized = normalizeCode(code);
  if (!/^\d{6}$/.test(normalized)) throw new Error("WAITER_CODE_INVALID");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [match] = await db.select({ user: users, garcon: garcons }).from(users).innerJoin(garcons, eq2(garcons.legacyUserId, users.id)).where(and2(eq2(users.waiterCode, normalized), eq2(users.role, "garcom"))).limit(1);
  if (!match) throw new Error("WAITER_CODE_INVALID");
  const isActive = match.user.waiterActive === 1 && match.garcon.status === "ATIVO";
  if (!isActive) throw new Error("WAITER_ACCOUNT_DISABLED");
  const sessionToken = await sdk.createSessionToken(match.user.openId, {
    name: match.user.name ?? match.garcon.fullName
  });
  attempts.delete(rateLimitKey);
  return {
    sessionToken,
    waiter: {
      id: match.user.id,
      name: match.user.name ?? match.garcon.fullName,
      role: "garcom"
    }
  };
}

// server/waiterAccessCode.ts
import { and as and3, eq as eq3, ne } from "drizzle-orm";
var CODE_PATTERN = /^\d{6}$/;
function normalizeAccessCode(code) {
  if (typeof code !== "string") return "";
  return code;
}
async function assertAccessCodeAvailable(code, excludeLegacyUserId) {
  const normalized = normalizeAccessCode(code);
  if (!CODE_PATTERN.test(normalized)) {
    if (normalized.length > 0 && !/^\d+$/.test(normalized)) throw new Error("WAITER_CODE_MUST_BE_NUMERIC");
    throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");
  }
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const conditions = excludeLegacyUserId != null ? and3(eq3(users.waiterCode, normalized), ne(users.id, excludeLegacyUserId)) : eq3(users.waiterCode, normalized);
  const [existing] = await db.select({ id: users.id }).from(users).where(conditions).limit(1);
  if (existing) throw new Error("WAITER_CODE_ALREADY_IN_USE");
  return normalized;
}
async function updateWaiterAccessCode(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [waiter] = await db.select({
    id: garcons.id,
    legacyUserId: garcons.legacyUserId,
    currentCode: users.waiterCode,
    userRole: users.role
  }).from(garcons).innerJoin(users, eq3(garcons.legacyUserId, users.id)).where(eq3(garcons.id, input.waiterId)).limit(1);
  if (!waiter || waiter.legacyUserId == null) throw new Error("WAITER_NOT_FOUND");
  const normalized = await assertAccessCodeAvailable(input.code, waiter.legacyUserId);
  if (waiter.currentCode === normalized) {
    return { waiterId: waiter.id, waiterCode: normalized, affectedRows: 0, unchanged: true };
  }
  let updated;
  try {
    [updated] = await db.update(users).set({
      waiterCode: normalized,
      role: "garcom",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.id, waiter.legacyUserId)).returning({ id: users.id, waiterCode: users.waiterCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[waiter-code] UPDATE failed", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      error: message
    });
    if (/duplicate key|unique constraint|waiterCode/i.test(message)) {
      throw new Error("WAITER_CODE_ALREADY_IN_USE");
    }
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }
  if (!updated || updated.id !== waiter.legacyUserId || updated.waiterCode !== normalized) {
    console.error("[waiter-code] UPDATE affected unexpected row or value", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      affectedUserId: updated?.id ?? null,
      returnedCode: updated?.waiterCode ?? null
    });
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }
  const [verified] = await db.select({ id: users.id, waiterCode: users.waiterCode }).from(users).where(eq3(users.id, waiter.legacyUserId)).limit(1);
  if (!verified || verified.id !== waiter.legacyUserId || verified.waiterCode !== normalized) {
    console.error("[waiter-code] post-UPDATE SELECT mismatch", {
      waiterId: input.waiterId,
      legacyUserId: waiter.legacyUserId,
      verifiedCode: verified?.waiterCode ?? null
    });
    throw new Error("WAITER_CODE_SAVE_FAILED");
  }
  const [viaGarcon] = await db.select({ waiterCode: users.waiterCode }).from(garcons).innerJoin(users, eq3(garcons.legacyUserId, users.id)).where(eq3(garcons.id, input.waiterId)).limit(1);
  if (!viaGarcon || viaGarcon.waiterCode !== normalized) {
    console.error("[waiter-code] join verification mismatch", {
      waiterId: input.waiterId,
      joinCode: viaGarcon?.waiterCode ?? null
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
      affectedRows: 1
    });
  }
  return {
    waiterId: waiter.id,
    waiterCode: verified.waiterCode,
    affectedRows: 1,
    unchanged: false
  };
}

// server/routers.ts
var allowedMenuImageUrl = /^(https?:\/\/|\/|data:image\/(jpeg|jpg|png|webp|avif);base64,)/;
var menuImageUrlSchema = z2.union([z2.literal(""), z2.string().max(8e6).refine((value) => allowedMenuImageUrl.test(value), "Formato de imagem inv\xE1lido")]).optional();
var selectionStatusSchema = z2.enum(["PENDING", "PREPARING", "READY", "DELIVERED", "COMPLETED"]);
function mapAccessCodeError(error) {
  const message = error instanceof Error ? error.message : "";
  if (message === "WAITER_CODE_ALREADY_IN_USE") throw new Error("Este c\xF3digo de acesso j\xE1 est\xE1 a ser utilizado.");
  if (message === "WAITER_CODE_MUST_BE_6_DIGITS") throw new Error("O c\xF3digo de acesso deve conter exatamente 6 d\xEDgitos.");
  if (message === "WAITER_CODE_MUST_BE_NUMERIC") throw new Error("O c\xF3digo de acesso deve conter apenas n\xFAmeros.");
  if (message === "WAITER_CODE_SAVE_FAILED") throw new Error("N\xE3o foi poss\xEDvel guardar o c\xF3digo de acesso. Tente novamente.");
  throw error instanceof Error ? error : new Error(String(error));
}
function mapWaiterPersistError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "WAITER_CODE_ALREADY_IN_USE" || message === "WAITER_CODE_MUST_BE_6_DIGITS" || message === "WAITER_CODE_MUST_BE_NUMERIC" || message === "WAITER_CODE_SAVE_FAILED") {
    mapAccessCodeError(error);
  }
  if (message === "WAITER_EMAIL_ALREADY_EXISTS" || message === "WAITER_EMAIL_OR_USER_ALREADY_EXISTS" || /already been registered|already exists|User already registered|duplicate key.*email/i.test(message)) {
    throw new Error("Este email j\xE1 est\xE1 registado. Use outro email ou apague o gar\xE7om existente.");
  }
  if (message === "WAITER_USERNAME_ALREADY_EXISTS" || /duplicate key.*username/i.test(message)) {
    throw new Error("Este nome de utilizador j\xE1 est\xE1 em uso. Escolha outro.");
  }
  if (message.startsWith("SUPABASE_WAITER_CREATE_FAILED:") || message.startsWith("SUPABASE_WAITER_UPDATE_FAILED:") || /supabase|auth\.admin|service.?role|configuration is missing/i.test(message)) {
    throw new Error("Falha ao sincronizar com o Supabase. Verifique as configura\xE7\xF5es e se o email \xE9 v\xE1lido.");
  }
  if (message === "WAITER_NOT_FOUND") throw new Error("Gar\xE7om n\xE3o encontrado.");
  if (message === "Database is not available") throw new Error("Base de dados indispon\xEDvel. Tente novamente dentro de momentos.");
  console.error("[staff] waiter persist failed:", message);
  throw new Error("N\xE3o foi poss\xEDvel guardar o gar\xE7om. Verifique os dados e o c\xF3digo de acesso.");
}
async function persistMenuImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("data:")) return imageUrl;
  const match = imageUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|avif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Formato de imagem inv\xE1lido");
  const [, contentType, encoded] = match;
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.byteLength > 6 * 1024 * 1024) throw new Error("A imagem excede o limite permitido");
  const extension = contentType.split("/")[1].replace("jpeg", "jpg");
  const stored = await storagePut(`menu-products/${randomUUID()}.${extension}`, bytes, contentType);
  return stored.url;
}
async function auditMutation(ctx, action, entityType, entityId, operation, metadataFromResult) {
  const result = await operation();
  const waiterProfile = ctx.user?.role === "garcom" ? await getGarconProfileByLegacyUserId(ctx.user.id) : null;
  await recordAuditLog({ userId: ctx.user?.id ?? null, restaurantId: waiterProfile?.restaurantId ?? "default", role: ctx.user?.role ?? "customer", action, entityType, entityId, metadata: metadataFromResult?.(result) });
  return result;
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => {
      const user = opts.ctx.user;
      if (!user) return null;
      const { waiterCode: _hiddenWaiterCode, ...safeUser } = user;
      return safeUser;
    }),
    recordLogin: protectedProcedure.mutation(({ ctx }) => recordAuditLog({ userId: ctx.user.id, role: ctx.user.role, action: "AUTH_LOGIN_SUCCESS", entityType: "auth_session", entityId: ctx.user.openId }).then(() => ({ success: true }))),
    recordPasswordChange: protectedProcedure.mutation(({ ctx }) => recordAuditLog({ userId: ctx.user.id, role: ctx.user.role, action: "AUTH_PASSWORD_CHANGED", entityType: "auth_user", entityId: ctx.user.openId }).then(() => ({ success: true }))),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user) await recordAuditLog({ userId: ctx.user.id, role: ctx.user.role, action: "AUTH_LOGOUT", entityType: "auth_session", entityId: ctx.user.openId });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  staff: router({
    profile: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      if (ctx.user.role === "admin") return { role: "admin", restaurantId: "default", status: ctx.user.waiterActive === 1 ? "ATIVO" : "INACTIVO", userId: ctx.user.id };
      const profile = await getGarconProfileByLegacyUserId(ctx.user.id);
      if (!profile || profile.status !== "ATIVO" || ctx.user.role !== "garcom" || ctx.user.waiterActive === 0) return null;
      return { role: "garcom", restaurantId: profile.restaurantId, status: profile.status, userId: ctx.user.id };
    }),
    loginStatus: publicProcedure.query(async ({ ctx }) => {
      const authorization = ctx.req.headers.authorization;
      const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!accessToken) return { status: "UNAUTHENTICATED" };
      const supabaseUser = await getSupabaseUserFromAccessToken(accessToken);
      if (!supabaseUser) return { status: "INVALID_SESSION" };
      const profile = await getUserByOpenId(`supabase:${supabaseUser.id}`);
      if (!profile) return { status: "PROFILE_MISSING" };
      if (profile.role === "admin" && profile.waiterActive === 0) return { status: "ADMIN_INACTIVE" };
      if (profile.role !== "admin" && profile.role !== "garcom") return { status: "ROLE_NOT_ALLOWED" };
      return { status: "ACTIVE" };
    }),
    quickLogin: publicProcedure.input(z2.object({ code: z2.string().max(64) })).mutation(async ({ input, ctx }) => {
      try {
        const result = await quickWaiterLogin(input.code, ctx.req.ip || ctx.req.socket.remoteAddress || "unknown");
        ctx.res.cookie(COOKIE_NAME, result.sessionToken, getSessionCookieOptions(ctx.req));
        await recordAuditLog({ userId: result.waiter.id, role: "garcom", action: "AUTH_QUICK_LOGIN_SUCCESS", entityType: "auth_session", entityId: result.sessionToken.slice(0, 16) });
        return { waiter: result.waiter };
      } catch (error) {
        const message = error instanceof Error ? error.message : "WAITER_CODE_INVALID";
        if (message === "WAITER_LOGIN_RATE_LIMITED") {
          throw new Error("Muitas tentativas de login. Aguarde alguns segundos antes de tentar novamente.");
        }
        if (message === "WAITER_ACCOUNT_DISABLED") {
          throw new Error("Esta conta est\xE1 desativada. Contacte o administrador.");
        }
        throw new Error("C\xF3digo de acesso incorreto.");
      }
    }),
    // list reads users.waiterCode via join — never regenerates codes on read
    list: adminProcedure.query(async () => listGarcons()),
    admins: adminProcedure.query(() => listAdminUsers()),
    candidates: adminProcedure.query(() => []),
    add: adminProcedure.input(z2.object({
      fullName: z2.string().trim().min(1).max(160),
      username: z2.string().trim().toLowerCase().min(1).max(64),
      email: z2.string().email().max(320),
      phone: z2.string().trim().max(32).optional().transform((value) => value ? value.replace(/(?!^)\+/g, "").replace(/[^\d+]/g, "") : void 0).refine((value) => !value || /^\+?\d{7,15}$/.test(value), "TELEFONE_INVALIDO"),
      accessCode: z2.string().regex(/^\d{6}$/, "O c\xF3digo de acesso deve conter exatamente 6 d\xEDgitos."),
      active: z2.boolean().default(true)
    })).mutation(async ({ input, ctx }) => {
      return auditMutation(ctx, "WAITER_CREATED", "garcon", void 0, async () => {
        try {
          await assertAccessCodeAvailable(input.accessCode);
        } catch (error) {
          mapAccessCodeError(error);
        }
        const internalPassword = randomBytes(32).toString("base64url");
        let created;
        try {
          created = await createGarcon({
            fullName: input.fullName,
            username: input.username,
            email: input.email,
            phone: input.phone,
            password: internalPassword,
            waiterCode: input.accessCode,
            active: input.active,
            restaurantId: MENU_RESTAURANT_ID
          });
        } catch (error) {
          mapWaiterPersistError(error);
        }
        try {
          const codeResult = await updateWaiterAccessCode({ waiterId: created.id, code: input.accessCode });
          return { id: created.id, fullName: created.fullName, username: created.username, email: created.email, active: created.status === "ATIVO", updated: true };
        } catch (error) {
          try {
            await deleteGarcon(created.id);
          } catch {
          }
          mapWaiterPersistError(error);
        }
      }, () => void 0);
    }),
    createAdmin: adminProcedure.input(z2.object({ fullName: z2.string().trim().min(1).max(160), email: z2.string().email().max(320), password: z2.string().min(6).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "CREATE_ADMIN", "admin", void 0, () => createAdminUser(input), (result) => ({ affectedUserId: result.id }))),
    updateAdmin: adminProcedure.input(z2.object({ id: z2.number().int().positive(), fullName: z2.string().trim().min(1).max(160), email: z2.string().email().max(320), password: z2.string().min(8).max(128).optional() })).mutation(({ input, ctx }) => auditMutation(ctx, "UPDATE_ADMIN", "admin", input.id, () => updateAdminUser(input), (result) => ({ affectedUserId: result.id }))),
    setAdminActive: adminProcedure.input(z2.object({ id: z2.number().int().positive(), active: z2.boolean() })).mutation(async ({ input, ctx }) => {
      const target = await getAdminById(input.id);
      const sameIdentity = input.id === ctx.user.id || !!ctx.user.email && target.admin.email?.toLowerCase() === ctx.user.email.toLowerCase();
      if (sameIdentity && !input.active) throw new Error("ADMIN_CANNOT_DEACTIVATE_SELF");
      return auditMutation(ctx, input.active ? "ACTIVATE_ADMIN" : "DEACTIVATE_ADMIN", "admin", input.id, () => setAdminActive(input.id, input.active), (result) => ({ affectedUserId: result.id }));
    }),
    deleteAdmin: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const target = await getAdminById(input.id);
      const sameIdentity = input.id === ctx.user.id || !!ctx.user.email && target.admin.email?.toLowerCase() === ctx.user.email.toLowerCase();
      if (sameIdentity) throw new Error("ADMIN_CANNOT_DELETE_SELF");
      return auditMutation(ctx, "DELETE_ADMIN", "admin", input.id, () => deleteAdminUser(input.id), (result) => ({ affectedUserId: result.id }));
    }),
    update: adminProcedure.input(z2.object({
      id: z2.string().uuid(),
      fullName: z2.string().trim().min(1).max(160),
      username: z2.string().trim().toLowerCase().min(1).max(64),
      email: z2.string().email().max(320),
      phone: z2.string().trim().max(32).optional().transform((value) => value ? value.replace(/(?!^)\+/g, "").replace(/[^\d+]/g, "") : void 0).refine((value) => !value || /^\+?\d{7,15}$/.test(value), "TELEFONE_INVALIDO"),
      password: z2.string().min(6).max(128).optional(),
      accessCode: z2.string().regex(/^\d{6}$/, "O c\xF3digo de acesso deve conter exatamente 6 d\xEDgitos."),
      active: z2.boolean()
    })).mutation(async ({ input, ctx }) => {
      return auditMutation(ctx, "WAITER_UPDATED", "garcon", input.id, async () => {
        let codeResult;
        try {
          codeResult = await updateWaiterAccessCode({ waiterId: input.id, code: input.accessCode });
        } catch (error) {
          mapWaiterPersistError(error);
        }
        let updated;
        try {
          updated = await updateGarcon({
            id: input.id,
            fullName: input.fullName,
            username: input.username,
            email: input.email,
            phone: input.phone,
            password: input.password,
            waiterCode: codeResult.waiterCode,
            active: input.active
          });
        } catch (error) {
          console.error("[staff.update] profile update failed after code persist", {
            waiterId: input.id,
            waiterCodePersisted: true
          });
          mapWaiterPersistError(error);
        }
        return updated;
      }, () => void 0);
    }),
    setActive: adminProcedure.input(z2.object({ id: z2.string().uuid(), active: z2.boolean() })).mutation(({ input, ctx }) => auditMutation(ctx, input.active ? "WAITER_ACTIVATED" : "WAITER_DEACTIVATED", "garcon", input.id, async () => {
      const current = (await listGarcons()).find(({ garcon }) => garcon.id === input.id);
      if (!current) throw new Error("WAITER_NOT_FOUND");
      return updateGarcon({ id: input.id, fullName: current.garcon.fullName, username: current.garcon.username, email: current.garcon.email, phone: current.garcon.phone ?? void 0, waiterCode: current.user.waiterCode ?? "", active: input.active });
    })),
    delete: adminProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(({ input, ctx }) => auditMutation(ctx, "WAITER_DELETED", "garcon", input.id, () => deleteGarcon(input.id))),
    currentAssignments: adminProcedure.query(() => listWaiterCurrentAssignments()),
    serviceHistory: adminProcedure.input(z2.object({ userId: z2.number().int().positive() })).query(({ input }) => getWaiterServiceHistory(input.userId))
  }),
  menu: router({
    active: publicProcedure.query(() => listMenuProducts(false, true)),
    staffCatalog: staffProcedure.query(() => listMenuProducts(false, false)),
    categories: adminProcedure.query(() => listMenuCategories(true)),
    publicCategories: publicProcedure.query(() => listMenuCategories(false)),
    translations: publicProcedure.query(() => translateActiveMenu()),
    adminList: adminProcedure.input(z2.object({ includeRemoved: z2.boolean().default(false) })).query(({ input }) => listMenuProducts(input.includeRemoved)),
    createCategory: adminProcedure.input(z2.object({ name: z2.string().trim().min(1).max(100), description: z2.string().max(1e3).optional(), displayOrder: z2.number().int().nonnegative().default(0) })).mutation(({ input, ctx }) => auditMutation(ctx, "CATEGORY_CREATED", "menu_category", void 0, () => createMenuCategory(input))),
    updateCategory: adminProcedure.input(z2.object({ id: z2.number().int().positive(), name: z2.string().trim().min(1).max(100), description: z2.string().max(1e3).optional(), displayOrder: z2.number().int().nonnegative().default(0), status: z2.enum(["ACTIVE", "INACTIVE", "REMOVED"]).default("ACTIVE") })).mutation(({ input, ctx }) => auditMutation(ctx, input.status === "INACTIVE" ? "CATEGORY_DISABLED" : "CATEGORY_UPDATED", "menu_category", input.id, () => updateMenuCategory(input.id, input))),
    deleteCategory: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ input, ctx }) => auditMutation(ctx, "CATEGORY_DELETED", "menu_category", input.id, () => deleteMenuCategory(input.id))),
    create: adminProcedure.input(z2.object({ categoryId: z2.number().int().positive(), name: z2.string().trim().min(1).max(160), description: z2.string().max(4e3).optional(), preparation: z2.string().max(1e3).optional(), price: z2.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(async ({ input, ctx }) => auditMutation(ctx, "PRODUCT_CREATED", "menu_product", void 0, async () => createMenuProduct({ ...input, imageUrl: input.imageUrl ? await persistMenuImage(input.imageUrl) : void 0 }))),
    update: adminProcedure.input(z2.object({ id: z2.number().int().positive(), categoryId: z2.number().int().positive(), name: z2.string().trim().min(1).max(160), description: z2.string().max(4e3).optional(), preparation: z2.string().max(1e3).optional(), price: z2.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return auditMutation(ctx, "PRODUCT_UPDATED", "menu_product", id, async () => updateMenuProduct(id, { ...data, imageUrl: data.imageUrl === "" ? null : await persistMenuImage(data.imageUrl) }));
    }),
    setStatus: adminProcedure.input(z2.object({ id: z2.number().int().positive(), status: z2.enum(["ACTIVE", "INACTIVE", "REMOVED"]) })).mutation(({ input, ctx }) => auditMutation(ctx, "PRODUCT_STATUS_CHANGED", "menu_product", input.id, () => setMenuProductStatus(input.id, input.status)))
  }),
  tableHistory: router({
    list: publicProcedure.input(z2.object({ sessionToken: z2.string().min(32).max(128), tableNumber: z2.string().min(1).max(64).default("01"), tableId: z2.string().min(1).max(128).optional() })).query(({ input }) => getTableHistory(input.sessionToken, input.tableNumber, input.tableId)),
    sessionInfo: publicProcedure.input(z2.object({ sessionToken: z2.string().min(32).max(128), tableNumber: z2.string().min(1).max(64).default("01"), tableId: z2.string().min(1).max(128).optional() })).query(({ input }) => getTableSessionInfo(input.sessionToken, input.tableNumber, input.tableId)),
    staffTables: staffProcedure.query(() => getStaffTables()),
    qrCodes: staffProcedure.query(() => listTableQrCodes()),
    viewedReceipts: staffProcedure.query(({ ctx }) => listViewedReceipts(ctx.user.role === "admin" ? void 0 : ctx.user.id, ctx.user.role === "admin")),
    receiptWaiters: adminProcedure.query(() => listReceiptWaiterOptions()),
    viewedReceipt: staffProcedure.input(z2.object({ selectionId: z2.number().int().positive() })).query(({ input, ctx }) => getViewedReceiptForStaff(input.selectionId, ctx.user.id, ctx.user.role === "admin")),
    dailySummary: adminProcedure.input(z2.object({ date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(({ input }) => getDailyStaffSummary(input.date, MENU_RESTAURANT_ID)),
    generateQrCode: adminProcedure.input(z2.object({ tableNumber: z2.string().min(1).max(64) })).mutation(({ input, ctx }) => auditMutation(ctx, "QR_CODE_CREATED", "table_qr_code", input.tableNumber, () => upsertTableQrCode(input.tableNumber))),
    assumeTable: staffProcedure.input(z2.object({ sessionToken: z2.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "TABLE_ASSIGNED", "table_session", input.sessionToken, () => assumeTableSession(input.sessionToken, ctx.user.id), (result) => ({ table_id: input.sessionToken, previous_waiter_id: result?.previousAttendingWaiterId ?? null, new_waiter_id: result?.newAttendingWaiterId ?? ctx.user.id }))),
    markViewed: staffProcedure.input(z2.object({ sessionToken: z2.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "MARK_AS_SEEN", "table_session", input.sessionToken, () => markTableViewedByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"), (result) => ({ receipt_ids: result.selectionIds, viewed_at: result.viewedAt, waiter_id: result.waiterId }))),
    releaseTable: staffProcedure.input(z2.object({ sessionToken: z2.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "TABLE_RELEASED", "table_session", input.sessionToken, () => releaseTableSessionByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"), (result) => ({ table_id: input.sessionToken, previous_waiter_id: result.previousWaiterId, new_waiter_id: result.newWaiterId }))),
    closeSession: staffProcedure.input(z2.object({ sessionToken: z2.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "RECEIPT_CLOSED", "table_session", input.sessionToken, () => closeTableSessionByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"))),
    updateSelectionStatus: staffProcedure.input(z2.object({ selectionId: z2.number().int().positive(), status: selectionStatusSchema })).mutation(({ input, ctx }) => auditMutation(ctx, "RECEIPT_STATUS_CHANGE", "table_selection", input.selectionId, () => setTableSelectionStatus(input.selectionId, input.status, ctx.user.id, ctx.user.role === "admin"))),
    removeSelectionItem: staffProcedure.input(z2.object({ itemId: z2.number().int().positive() })).mutation(({ input, ctx }) => auditMutation(ctx, "RECEIPT_ITEM_REMOVED", "table_selection_item", input.itemId, () => removeTableSelectionItem(input.itemId, ctx.user.id, ctx.user.role === "admin"), (result) => ({ selection_id: result.selectionId, item_id: result.itemId, product_name: result.productName, quantity: result.quantity, subtotal_after: result.subtotal, removed_at: result.removedAt }))),
    staffLookup: staffProcedure.input(z2.object({ sessionToken: z2.string().min(32).max(128) })).query(({ input, ctx }) => getTableHistoryForStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin")),
    staffIdentity: staffProcedure.query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, active: Boolean(ctx.user.waiterActive) })),
    createManualOrder: staffProcedure.input(z2.object({ tableId: z2.string().trim().min(1).max(128), notes: z2.string().trim().max(1e3).optional(), items: z2.array(z2.object({ productId: z2.number().int().positive(), quantity: z2.number().int().positive().max(100) })).min(1).max(100) })).mutation(({ input, ctx }) => auditMutation(ctx, "CREATE_MANUAL_ORDER", "table_selection", void 0, () => createManualTableSelection({ ...input, waiterId: ctx.user.id }), (result) => ({ waiter_id: result.waiterId, table_id: result.tableNumber, selection_id: result.id }))),
    addSelection: publicProcedure.input(z2.object({ sessionToken: z2.string().min(32).max(128), tableNumber: z2.string().min(1).max(64).default("01"), tableId: z2.string().min(1).max(128).optional(), notes: z2.string().trim().max(1e3).optional(), items: z2.array(z2.object({ productId: z2.number().int().positive(), quantity: z2.number().int().positive().max(100) })).min(1).max(100) })).mutation(({ input, ctx }) => auditMutation(ctx, "ORDER_CREATED", "table_selection", void 0, () => createTableSelection({ sessionToken: input.sessionToken, tableNumber: input.tableNumber, tableId: input.tableId, notes: input.notes, subtotal: 0, items: input.items.map((item) => ({ productId: item.productId, productName: "", quantity: item.quantity, unitPrice: 0 })), mergeOpenOrder: false })))
  })
});

// server/_core/context.ts
async function resolveSupabaseUser(accessToken) {
  const supabaseUser = await getSupabaseUserFromAccessToken(accessToken);
  if (!supabaseUser) return null;
  const legacyUser = await getUserByOpenId(`supabase:${supabaseUser.id}`);
  if (legacyUser?.role === "admin") return legacyUser.waiterActive === 1 ? legacyUser : null;
  if (!legacyUser) return null;
  const garconProfile = await getGarconProfileByLegacyUserId(legacyUser.id);
  if (garconProfile?.authUserId !== supabaseUser.id || garconProfile.role !== "GARCOM" || garconProfile.status !== "ATIVO") return null;
  return { ...legacyUser, role: "garcom", waiterActive: 1 };
}
async function createContext(opts) {
  const authorization = opts.req.headers.authorization;
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (accessToken) {
    const isSupabaseToken = opts.req.headers["x-auth-provider"] === "supabase";
    try {
      const supabaseUser = await resolveSupabaseUser(accessToken);
      if (supabaseUser || isSupabaseToken) return { req: opts.req, res: opts.res, user: supabaseUser };
    } catch {
      if (isSupabaseToken) return { req: opts.req, res: opts.res, user: null };
    }
  }
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user: user?.role === "admin" && user.waiterActive === 0 ? null : user
  };
}

// server/_core/app.ts
function getAllowedOrigins(req) {
  const configured = (process.env.APP_ORIGIN ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0]?.trim();
  const requestOrigin = `${forwardedProto || req.protocol}://${req.get("host")}`;
  return /* @__PURE__ */ new Set([requestOrigin, ...configured]);
}
function createApiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
    res.setHeader("X-Frame-Options", "DENY");
    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self' https://*.supabase.co; upgrade-insecure-requests"
      );
    }
    next();
  });
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.get("/api/auth-config", (_req, res) => {
    const rawSupabaseUrl = String(process.env.SUPABASE_URL ?? "").trim();
    const supabaseUrl2 = rawSupabaseUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
    const publishableKey2 = String(
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? ""
    ).trim();
    const isValidSupabaseUrl = /^https:\/\/[^/]+\.supabase\.co$/i.test(supabaseUrl2);
    if (!isValidSupabaseUrl || !publishableKey2 || /^postgres(?:ql)?:\/\//i.test(publishableKey2)) {
      res.status(503).json({ code: "SUPABASE_AUTH_CLIENT_CONFIGURATION_INVALID" });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.json({ supabaseUrl: supabaseUrl2, publishableKey: publishableKey2 });
  });
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "patio-zambeze-api" });
  });
  app.use("/api/trpc", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
      const origin = req.get("origin");
      if (origin && !getAllowedOrigins(req).has(origin)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }
    next();
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}
export {
  createApiApp
};
