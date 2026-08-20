import { decimal, index, int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, tinyint, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
  waiterCode: varchar("waiterCode", { length: 32 }).unique(),
  waiterActive: tinyint("waiterActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const tableSessions = mysqlTable("table_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 128 }).notNull().unique(),
  tableNumber: varchar("tableNumber", { length: 32 }).notNull().default("01"),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
  waiterId: int("waiterId"),
  viewedAt: timestamp("viewedAt"),
  attendingWaiterId: int("attendingWaiterId"),
  attendingSince: timestamp("attendingSince"),
}, (table) => ({ statusIdx: index("table_sessions_status_idx").on(table.status), tableNumberIdx: index("table_sessions_table_number_idx").on(table.tableNumber), attendingWaiterIdx: index("table_sessions_attending_waiter_idx").on(table.attendingWaiterId) }));

export const tableSelections = mysqlTable("table_selections", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  selectionNumber: int("selectionNumber").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "PREPARING", "READY", "DELIVERED", "COMPLETED"]).default("PENDING").notNull(),
  notes: text("notes"),
  viewedAt: timestamp("viewedAt"),
  sentAt: timestamp("sentAt"),
  receivedAt: timestamp("receivedAt"),
  finalizedAt: timestamp("finalizedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  sessionNumberUnique: uniqueIndex("table_selections_session_number_idx").on(table.sessionId, table.selectionNumber),
  sessionCreatedIdx: index("table_selections_session_created_idx").on(table.sessionId, table.createdAt),
}));

export const tableSelectionItems = mysqlTable("table_selection_items", {
  id: int("id").autoincrement().primaryKey(),
  selectionId: int("selectionId").notNull(),
  productName: varchar("productName", { length: 160 }).notNull(),
  preparation: text("preparation"),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({ selectionIdx: index("table_selection_items_selection_idx").on(table.selectionId) }));

export type TableSession = typeof tableSessions.$inferSelect;
export type InsertTableSession = typeof tableSessions.$inferInsert;
export type TableSelection = typeof tableSelections.$inferSelect;
export type InsertTableSelection = typeof tableSelections.$inferInsert;
export type TableSelectionItem = typeof tableSelectionItems.$inferSelect;
export type InsertTableSelectionItem = typeof tableSelectionItems.$inferInsert;

export const tableQrCodes = mysqlTable("table_qr_codes", {
  id: int("id").autoincrement().primaryKey(),
  tableNumber: varchar("tableNumber", { length: 64 }).notNull().unique(),
  qrToken: varchar("qrToken", { length: 128 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TableQrCode = typeof tableQrCodes.$inferSelect;
export type InsertTableQrCode = typeof tableQrCodes.$inferInsert;

export const menuCategories = mysqlTable("menu_categories", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull().default("default"),
  name: varchar("name", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["ACTIVE", "REMOVED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ restaurantIdx: index("menu_categories_restaurant_idx").on(table.restaurantId) }));

export const menuProducts = mysqlTable("menu_products", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull().default("default"),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  preparation: text("preparation"),
  preparationEn: text("preparationEn"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE", "REMOVED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
}, (table) => ({ restaurantStatusIdx: index("menu_products_restaurant_status_idx").on(table.restaurantId, table.status), categoryIdx: index("menu_products_category_idx").on(table.categoryId) }));

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;
export type MenuProduct = typeof menuProducts.$inferSelect;
export type InsertMenuProduct = typeof menuProducts.$inferInsert;