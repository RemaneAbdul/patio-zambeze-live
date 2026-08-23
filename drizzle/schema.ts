import { index, integer, numeric, pgTable, serial, smallint, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  role: varchar("role", { length: 16 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: varchar("entityId", { length: 128 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  actionIdx: index("audit_logs_action_idx").on(table.action),
  createdIdx: index("audit_logs_created_idx").on(table.createdAt),
  userIdx: index("audit_logs_user_idx").on(table.userId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const tableSessions = pgTable("table_sessions", {
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
  attendingSince: timestamp("attendingSince", { withTimezone: true }),
}, (table) => ({
  statusIdx: index("table_sessions_status_idx").on(table.status),
  tableNumberIdx: index("table_sessions_table_number_idx").on(table.tableNumber),
  attendingWaiterIdx: index("table_sessions_attending_waiter_idx").on(table.attendingWaiterId),
}));

export const tableSelections = pgTable("table_selections", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  selectionNumber: integer("selectionNumber").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 16 }).default("PENDING").notNull(),
  notes: text("notes"),
  viewedAt: timestamp("viewedAt", { withTimezone: true }),
  sentAt: timestamp("sentAt", { withTimezone: true }),
  receivedAt: timestamp("receivedAt", { withTimezone: true }),
  finalizedAt: timestamp("finalizedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionNumberUnique: uniqueIndex("table_selections_session_number_idx").on(table.sessionId, table.selectionNumber),
  sessionCreatedIdx: index("table_selections_session_created_idx").on(table.sessionId, table.createdAt),
}));

export const tableSelectionItems = pgTable("table_selection_items", {
  id: serial("id").primaryKey(),
  selectionId: integer("selectionId").notNull(),
  productName: varchar("productName", { length: 160 }).notNull(),
  preparation: text("preparation"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unitPrice", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  selectionIdx: index("table_selection_items_selection_idx").on(table.selectionId),
}));

export type TableSession = typeof tableSessions.$inferSelect;
export type InsertTableSession = typeof tableSessions.$inferInsert;
export type TableSelection = typeof tableSelections.$inferSelect;
export type InsertTableSelection = typeof tableSelections.$inferInsert;
export type TableSelectionItem = typeof tableSelectionItems.$inferSelect;
export type InsertTableSelectionItem = typeof tableSelectionItems.$inferInsert;

export const tableQrCodes = pgTable("table_qr_codes", {
  id: serial("id").primaryKey(),
  tableNumber: varchar("tableNumber", { length: 64 }).notNull().unique(),
  qrToken: varchar("qrToken", { length: 128 }).notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type TableQrCode = typeof tableQrCodes.$inferSelect;
export type InsertTableQrCode = typeof tableQrCodes.$inferInsert;

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull().default("default"),
  name: varchar("name", { length: 100 }).notNull(),
  status: varchar("status", { length: 16 }).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  restaurantIdx: index("menu_categories_restaurant_idx").on(table.restaurantId),
}));

export const menuProducts = pgTable("menu_products", {
  id: serial("id").primaryKey(),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull().default("default"),
  categoryId: integer("categoryId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  preparation: text("preparation"),
  preparationEn: text("preparationEn"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  status: varchar("status", { length: 16 }).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deletedAt", { withTimezone: true }),
}, (table) => ({
  restaurantStatusIdx: index("menu_products_restaurant_status_idx").on(table.restaurantId, table.status),
  categoryIdx: index("menu_products_category_idx").on(table.categoryId),
}));

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;
export type MenuProduct = typeof menuProducts.$inferSelect;
export type InsertMenuProduct = typeof menuProducts.$inferInsert;
