import { decimal, index, int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const tableSessions = mysqlTable("table_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
}, (table) => ({ statusIdx: index("table_sessions_status_idx").on(table.status) }));

export const tableSelections = mysqlTable("table_selections", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  selectionNumber: int("selectionNumber").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  sessionNumberUnique: uniqueIndex("table_selections_session_number_idx").on(table.sessionId, table.selectionNumber),
  sessionCreatedIdx: index("table_selections_session_created_idx").on(table.sessionId, table.createdAt),
}));

export const tableSelectionItems = mysqlTable("table_selection_items", {
  id: int("id").autoincrement().primaryKey(),
  selectionId: int("selectionId").notNull(),
  productKey: varchar("productKey", { length: 160 }).notNull(),
  productName: varchar("productName", { length: 240 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({ selectionIdx: index("table_selection_items_selection_idx").on(table.selectionId) }));

export type TableSession = typeof tableSessions.$inferSelect;
export type InsertTableSession = typeof tableSessions.$inferInsert;
export type TableSelection = typeof tableSelections.$inferSelect;
export type InsertTableSelection = typeof tableSelections.$inferInsert;
export type TableSelectionItem = typeof tableSelectionItems.$inferSelect;
export type InsertTableSelectionItem = typeof tableSelectionItems.$inferInsert;