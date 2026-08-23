import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router, staffProcedure } from "./_core/trpc";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { storagePut } from "./storage";
import {   assumeTableSession, closeTableSessionByStaff, releaseTableSessionByStaff, setTableSelectionStatus, createMenuCategory, createMenuProduct, createTableSelection, getStaffTables, listWaiterUsers, recordAuditLog, setWaiterActive, getTableHistory, getTableHistoryForStaff, getTableSessionInfo, getWaiterServiceHistory, listMenuCategories, listMenuProducts, listWaiterCandidates, listWaiterCurrentAssignments, promoteUserToWaiter, listTableQrCodes, listViewedReceipts, markTableViewedByStaff, removeTableSelectionItem, setMenuProductStatus, updateMenuProduct, upsertTableQrCode, listGarcons, createGarcon, updateGarcon, getGarconProfileByLegacyUserId } from "./db";

const allowedMenuImageUrl = /^(https?:\/\/|\/|data:image\/(jpeg|jpg|png|webp|avif);base64,)/;
export const menuImageUrlSchema = z.string().max(8_000_000).refine((value) => allowedMenuImageUrl.test(value), "Formato de imagem inválido").optional();
export const selectionStatusSchema = z.enum(["PENDING", "PREPARING", "READY", "DELIVERED", "COMPLETED"]);

async function persistMenuImage(imageUrl?: string) {
  if (!imageUrl || !imageUrl.startsWith("data:")) return imageUrl;
  const match = imageUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|avif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Formato de imagem inválido");
  const [, contentType, encoded] = match;
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.byteLength > 6 * 1024 * 1024) throw new Error("A imagem excede o limite permitido");
  const extension = contentType.split("/")[1].replace("jpeg", "jpg");
  const stored = await storagePut(`menu-products/${randomUUID()}.${extension}`, bytes, contentType);
  return stored.url;
}

async function auditMutation<T>(ctx: { user?: { id: number; role: string } | null }, action: string, entityType: string, entityId: string | number | undefined, operation: () => Promise<T> | T) {
  const result = await operation();
  const waiterProfile = ctx.user?.role === "garcom" ? await getGarconProfileByLegacyUserId(ctx.user.id) : null;
  await recordAuditLog({ userId: ctx.user?.id ?? null, restaurantId: waiterProfile?.restaurantId ?? "default", role: ctx.user?.role ?? "customer", action, entityType, entityId });
  return result;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    recordLogin: protectedProcedure.mutation(({ ctx }) => recordAuditLog({ userId: ctx.user.id, role: ctx.user.role, action: "AUTH_LOGIN_SUCCESS", entityType: "auth_session", entityId: ctx.user.openId }).then(() => ({ success: true as const }))),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user) await recordAuditLog({ userId: ctx.user.id, role: ctx.user.role, action: "AUTH_LOGOUT", entityType: "auth_session", entityId: ctx.user.openId });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  staff: router({
    profile: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      if (ctx.user.role === "admin") return { role: "admin" as const, restaurantId: "default", status: "ATIVO" as const, userId: ctx.user.id };
      const profile = await getGarconProfileByLegacyUserId(ctx.user.id);
      if (!profile || profile.status !== "ATIVO" || ctx.user.role !== "garcom" || ctx.user.waiterActive === 0) return null;
      return { role: "garcom" as const, restaurantId: profile.restaurantId, status: profile.status, userId: ctx.user.id };
    }),
    list: adminProcedure.query(() => listGarcons()),
    candidates: adminProcedure.query(() => []),
    add: adminProcedure.input(z.object({ fullName: z.string().trim().min(1).max(160), username: z.string().trim().min(3).max(64).regex(/^[a-z0-9._-]+$/), email: z.string().email().max(320), phone: z.string().max(32).optional(), password: z.string().min(6).max(128), active: z.boolean().default(true), restaurantId: z.string().trim().min(1).max(64).default("default") })).mutation(({ input, ctx }) => auditMutation(ctx, "WAITER_CREATED", "garcon", undefined, () => createGarcon(input))),
    update: adminProcedure.input(z.object({ id: z.string().uuid(), fullName: z.string().trim().min(1).max(160), username: z.string().trim().min(3).max(64).regex(/^[a-z0-9._-]+$/), email: z.string().email().max(320), phone: z.string().max(32).optional(), password: z.string().min(6).max(128).optional(), active: z.boolean() })).mutation(({ input, ctx }) => auditMutation(ctx, "WAITER_UPDATED", "garcon", input.id, () => updateGarcon(input))),
    setActive: adminProcedure.input(z.object({ id: z.string().uuid(), active: z.boolean() })).mutation(({ input, ctx }) => auditMutation(ctx, input.active ? "WAITER_ACTIVATED" : "WAITER_DEACTIVATED", "garcon", input.id, async () => { const current = (await listGarcons()).find(({ garcon }) => garcon.id === input.id); if (!current) throw new Error("WAITER_NOT_FOUND"); return updateGarcon({ id: input.id, fullName: current.garcon.fullName, username: current.garcon.username, email: current.garcon.email, phone: current.garcon.phone ?? undefined, active: input.active }); })),
    currentAssignments: adminProcedure.query(() => listWaiterCurrentAssignments()),
    serviceHistory: adminProcedure.input(z.object({ userId: z.number().int().positive() })).query(({ input }) => getWaiterServiceHistory(input.userId)),
  }),

  menu: router({
    active: publicProcedure.query(() => listMenuProducts(false)),
    categories: publicProcedure.query(() => listMenuCategories()),
    adminList: adminProcedure.input(z.object({ includeRemoved: z.boolean().default(false) })).query(({ input }) => listMenuProducts(input.includeRemoved)),
    createCategory: adminProcedure.input(z.object({ name: z.string().trim().min(1).max(100) })).mutation(({ input, ctx }) => auditMutation(ctx, "CATEGORY_CREATED", "menu_category", undefined, () => createMenuCategory(input.name))),
    create: adminProcedure.input(z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().max(4000).optional(), preparation: z.string().max(1000).optional(), preparationEn: z.string().max(1000).optional(), price: z.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(async ({ input, ctx }) => auditMutation(ctx, "PRODUCT_CREATED", "menu_product", undefined, async () => createMenuProduct({ ...input, imageUrl: await persistMenuImage(input.imageUrl) }))),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().max(4000).optional(), preparation: z.string().max(1000).optional(), preparationEn: z.string().max(1000).optional(), price: z.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(async ({ input, ctx }) => { const { id, ...data } = input; return auditMutation(ctx, "PRODUCT_UPDATED", "menu_product", id, async () => updateMenuProduct(id, { ...data, imageUrl: await persistMenuImage(data.imageUrl) })); }),
    setStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["ACTIVE", "INACTIVE", "REMOVED"]) })).mutation(({ input, ctx }) => auditMutation(ctx, "PRODUCT_STATUS_CHANGED", "menu_product", input.id, () => setMenuProductStatus(input.id, input.status))),
  }),

  tableHistory: router({
    list: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional() })).query(({ input }) => getTableHistory(input.sessionToken, input.tableNumber, input.tableId)),
    sessionInfo: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional() })).query(({ input }) => getTableSessionInfo(input.sessionToken, input.tableNumber, input.tableId)),
    staffTables: staffProcedure.query(() => getStaffTables()),
    qrCodes: adminProcedure.query(() => listTableQrCodes()),
    viewedReceipts: staffProcedure.query(() => listViewedReceipts()),
    generateQrCode: adminProcedure.input(z.object({ tableNumber: z.string().min(1).max(64) })).mutation(({ input, ctx }) => auditMutation(ctx, "QR_CODE_CREATED", "table_qr_code", input.tableNumber, () => upsertTableQrCode(input.tableNumber))),
    assumeTable: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "TABLE_ASSIGNED", "table_session", input.sessionToken, () => assumeTableSession(input.sessionToken, ctx.user.id))),
    markViewed: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "SELECTION_VIEWED", "table_session", input.sessionToken, () => markTableViewedByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"))),
    releaseTable: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "TABLE_RELEASED", "table_session", input.sessionToken, () => releaseTableSessionByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"))),
    closeSession: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "TABLE_CLOSED", "table_session", input.sessionToken, () => closeTableSessionByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"))),
    updateSelectionStatus: staffProcedure.input(z.object({ selectionId: z.number().int().positive(), status: selectionStatusSchema })).mutation(({ input, ctx }) => auditMutation(ctx, "ORDER_STATUS_CHANGED", "table_selection", input.selectionId, () => setTableSelectionStatus(input.selectionId, input.status, ctx.user.id, ctx.user.role === "admin"))),
    removeSelectionItem: staffProcedure.input(z.object({ itemId: z.number().int().positive() })).mutation(({ input, ctx }) => auditMutation(ctx, "SELECTION_ITEM_REMOVED", "table_selection_item", input.itemId, () => removeTableSelectionItem(input.itemId, ctx.user.id, ctx.user.role === "admin"))),
    staffLookup: staffProcedure
      .input(z.object({ sessionToken: z.string().min(32).max(128) }))
      .query(({ input, ctx }) => getTableHistoryForStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin")),
    staffIdentity: staffProcedure.query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, waiterCode: ctx.user.waiterCode ?? null, active: Boolean(ctx.user.waiterActive) })),
    addSelection: publicProcedure.input(z.object({
      sessionToken: z.string().min(32).max(128),
      tableNumber: z.string().min(1).max(64).default("01"),
      tableId: z.string().min(1).max(128).optional(),
      subtotal: z.number().nonnegative(),
      items: z.array(
        z.object({
          productName: z.string().min(1).max(160),
          preparation: z.string().max(1000).optional(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().nonnegative(),
        }),
      ).min(1),
    })).mutation(({ input, ctx }) => auditMutation(ctx, "ORDER_CREATED", "table_selection", undefined, () => createTableSelection(input))),
  }),
});

export type AppRouter = typeof appRouter;
