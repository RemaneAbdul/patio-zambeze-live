import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router, staffProcedure } from "./_core/trpc";
import { z } from "zod";
import { translateActiveMenu } from "./menuTranslation";
import { randomUUID } from "node:crypto";
import { storagePut } from "./storage";
import { getSupabaseUserFromAccessToken } from "./supabaseAuth";
import { quickWaiterLogin, assignNewWaiterCode, ensureNumericWaiterCodes } from "./quickWaiterLogin";
import { updateWaiterAccessCode } from "./waiterAccessCode";
import { assumeTableSession, closeTableSessionByStaff, releaseTableSessionByStaff, setTableSelectionStatus, createMenuCategory, updateMenuCategory, deleteMenuCategory, createMenuProduct, createTableSelection, getStaffTables, recordAuditLog, getTableHistory, getTableHistoryForStaff, getTableSessionInfo, getWaiterServiceHistory, listMenuCategories, listMenuProducts, listWaiterCurrentAssignments, listTableQrCodes, listViewedReceipts, listReceiptWaiterOptions, getViewedReceiptForStaff, markTableViewedByStaff, removeTableSelectionItem, setMenuProductStatus, updateMenuProduct, upsertTableQrCode, listGarcons, createGarcon, createAdminUser, updateAdminUser, setAdminActive, deleteAdminUser, updateGarcon, deleteGarcon, getGarconProfileByLegacyUserId, getUserByOpenId, getAdminById, listAdminUsers, getDailyStaffSummary, createManualTableSelection, MENU_RESTAURANT_ID } from "./db";

const allowedMenuImageUrl = /^(https?:\/\/|\/|data:image\/(jpeg|jpg|png|webp|avif);base64,)/;
export const menuImageUrlSchema = z.union([z.literal(""), z.string().max(8_000_000).refine((value) => allowedMenuImageUrl.test(value), "Formato de imagem inválido")]).optional();
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

async function auditMutation<T>(ctx: { user?: { id: number; role: string } | null }, action: string, entityType: string, entityId: string | number | undefined, operation: () => Promise<T> | T, metadataFromResult?: (result: T) => Record<string, unknown> | undefined) {
  const result = await operation();
  const waiterProfile = ctx.user?.role === "garcom" ? await getGarconProfileByLegacyUserId(ctx.user.id) : null;
  await recordAuditLog({ userId: ctx.user?.id ?? null, restaurantId: waiterProfile?.restaurantId ?? "default", role: ctx.user?.role ?? "customer", action, entityType, entityId, metadata: metadataFromResult?.(result) });
  return result;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    recordLogin: protectedProcedure.mutation(({ ctx }) => recordAuditLog({ userId: ctx.user.id, role: ctx.user.role, action: "AUTH_LOGIN_SUCCESS", entityType: "auth_session", entityId: ctx.user.openId }).then(() => ({ success: true as const }))),
    recordPasswordChange: protectedProcedure.mutation(({ ctx }) => recordAuditLog({ userId: ctx.user.id, role: ctx.user.role, action: "AUTH_PASSWORD_CHANGED", entityType: "auth_user", entityId: ctx.user.openId }).then(() => ({ success: true as const }))),
    logout: publicProcedure.mutation(async ({ ctx }) => { if (ctx.user) await recordAuditLog({ userId: ctx.user.id, role: ctx.user.role, action: "AUTH_LOGOUT", entityType: "auth_session", entityId: ctx.user.openId }); const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),

  staff: router({
    profile: publicProcedure.query(async ({ ctx }) => { if (!ctx.user) return null; if (ctx.user.role === "admin") return { role: "admin" as const, restaurantId: "default", status: ctx.user.waiterActive === 1 ? "ATIVO" as const : "INACTIVO" as const, userId: ctx.user.id }; const profile = await getGarconProfileByLegacyUserId(ctx.user.id); if (!profile || profile.status !== "ATIVO" || ctx.user.role !== "garcom" || ctx.user.waiterActive === 0) return null; return { role: "garcom" as const, restaurantId: profile.restaurantId, status: profile.status, userId: ctx.user.id }; }),
    loginStatus: publicProcedure.query(async ({ ctx }) => { const authorization = ctx.req.headers.authorization; const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : ""; if (!accessToken) return { status: "UNAUTHENTICATED" as const }; const supabaseUser = await getSupabaseUserFromAccessToken(accessToken); if (!supabaseUser) return { status: "INVALID_SESSION" as const }; const profile = await getUserByOpenId(`supabase:${supabaseUser.id}`); if (!profile) return { status: "PROFILE_MISSING" as const }; if (profile.role === "admin" && profile.waiterActive === 0) return { status: "ADMIN_INACTIVE" as const }; if (profile.role !== "admin" && profile.role !== "garcom") return { status: "ROLE_NOT_ALLOWED" as const }; return { status: "ACTIVE" as const }; }),
    quickLogin: publicProcedure.input(z.object({ code: z.string().regex(/^\d{6}$/) })).mutation(async ({ input, ctx }) => {
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
          throw new Error("Esta conta está desativada. Contacte o administrador.");
        }
        throw new Error("Código de acesso incorreto.");
      }
    }),
    list: adminProcedure.query(async () => { await ensureNumericWaiterCodes(); return listGarcons(); }),
    admins: adminProcedure.query(() => listAdminUsers()),
    candidates: adminProcedure.query(() => []),
    add: adminProcedure.input(z.object({ fullName: z.string().trim().min(1).max(160), username: z.string().trim().min(3).max(64).regex(/^[a-z0-9._-]+$/), email: z.string().email().max(320), phone: z.string().max(32).optional(), password: z.string().min(6).max(128), active: z.boolean().default(true) })).mutation(async ({ input, ctx }) => auditMutation(ctx, "WAITER_CREATED", "garcon", undefined, async () => { const created = await createGarcon({ ...input, restaurantId: MENU_RESTAURANT_ID }); return { ...created, quickCode: await assignNewWaiterCode(created.legacyUser.id) }; })),
    createAdmin: adminProcedure.input(z.object({ fullName: z.string().trim().min(1).max(160), email: z.string().email().max(320), password: z.string().min(6).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "CREATE_ADMIN", "admin", undefined, () => createAdminUser(input), result => ({ affectedUserId: result.id }))),
    updateAdmin: adminProcedure.input(z.object({ id: z.number().int().positive(), fullName: z.string().trim().min(1).max(160), email: z.string().email().max(320), password: z.string().min(8).max(128).optional() })).mutation(({ input, ctx }) => auditMutation(ctx, "UPDATE_ADMIN", "admin", input.id, () => updateAdminUser(input), result => ({ affectedUserId: result.id }))),
    setAdminActive: adminProcedure.input(z.object({ id: z.number().int().positive(), active: z.boolean() })).mutation(async ({ input, ctx }) => { const target = await getAdminById(input.id); const sameIdentity = input.id === ctx.user.id || (!!ctx.user.email && target.admin.email?.toLowerCase() === ctx.user.email.toLowerCase()); if (sameIdentity && !input.active) throw new Error("ADMIN_CANNOT_DEACTIVATE_SELF"); return auditMutation(ctx, input.active ? "ACTIVATE_ADMIN" : "DEACTIVATE_ADMIN", "admin", input.id, () => setAdminActive(input.id, input.active), result => ({ affectedUserId: result.id })); }),
    deleteAdmin: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => { const target = await getAdminById(input.id); const sameIdentity = input.id === ctx.user.id || (!!ctx.user.email && target.admin.email?.toLowerCase() === ctx.user.email.toLowerCase()); if (sameIdentity) throw new Error("ADMIN_CANNOT_DELETE_SELF"); return auditMutation(ctx, "DELETE_ADMIN", "admin", input.id, () => deleteAdminUser(input.id), result => ({ affectedUserId: result.id })); }),
    update: adminProcedure
      .input(z.object({
        id: z.string().uuid(),
        fullName: z.string().trim().min(1).max(160),
        username: z.string().trim().min(3).max(64).regex(/^[a-z0-9._-]+$/),
        email: z.string().email().max(320),
        phone: z.string().max(32).optional(),
        password: z.string().min(6).max(128).optional(),
        // Required on edit from the admin panel: the credential used by quick login.
        accessCode: z.string().regex(/^\d{6}$/, "O código deve conter 6 dígitos."),
        active: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        return auditMutation(ctx, "WAITER_UPDATED", "garcon", input.id, async () => {
          const { accessCode, ...rest } = input;
          const updated = await updateGarcon(rest);
          let savedCode: string;
          try {
            const codeResult = await updateWaiterAccessCode({ waiterId: input.id, code: accessCode });
            savedCode = codeResult.waiterCode;
          } catch (error) {
            const message = error instanceof Error ? error.message : "";
            if (message === "WAITER_CODE_ALREADY_IN_USE") throw new Error("Este código já está em uso. Escolha outro.");
            if (message === "WAITER_CODE_MUST_BE_6_DIGITS") throw new Error("O código deve conter 6 dígitos.");
            if (message === "WAITER_CODE_SAVE_FAILED") throw new Error("Não foi possível guardar o código de acesso. Tente novamente.");
            throw error;
          }
          return { ...updated, waiterCode: savedCode };
        }, result => ({ waiter_code: (result as { waiterCode?: string }).waiterCode }));
      }),
    setActive: adminProcedure.input(z.object({ id: z.string().uuid(), active: z.boolean() })).mutation(({ input, ctx }) => auditMutation(ctx, input.active ? "WAITER_ACTIVATED" : "WAITER_DEACTIVATED", "garcon", input.id, async () => { const current = (await listGarcons()).find(({ garcon }) => garcon.id === input.id); if (!current) throw new Error("WAITER_NOT_FOUND"); return updateGarcon({ id: input.id, fullName: current.garcon.fullName, username: current.garcon.username, email: current.garcon.email, phone: current.garcon.phone ?? undefined, active: input.active }); })),
    delete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ input, ctx }) => auditMutation(ctx, "WAITER_DELETED", "garcon", input.id, () => deleteGarcon(input.id))),
    currentAssignments: adminProcedure.query(() => listWaiterCurrentAssignments()),
    serviceHistory: adminProcedure.input(z.object({ userId: z.number().int().positive() })).query(({ input }) => getWaiterServiceHistory(input.userId)),
  }),

  menu: router({
    active: publicProcedure.query(() => listMenuProducts(false, true)),
    staffCatalog: staffProcedure.query(() => listMenuProducts(false, false)),
    categories: adminProcedure.query(() => listMenuCategories(true)),
    publicCategories: publicProcedure.query(() => listMenuCategories(false)),
    translations: publicProcedure.query(() => translateActiveMenu()),
    adminList: adminProcedure.input(z.object({ includeRemoved: z.boolean().default(false) })).query(({ input }) => listMenuProducts(input.includeRemoved)),
    createCategory: adminProcedure.input(z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(1000).optional(), displayOrder: z.number().int().nonnegative().default(0) })).mutation(({ input, ctx }) => auditMutation(ctx, "CATEGORY_CREATED", "menu_category", undefined, () => createMenuCategory(input))),
    updateCategory: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(100), description: z.string().max(1000).optional(), displayOrder: z.number().int().nonnegative().default(0), status: z.enum(["ACTIVE", "INACTIVE", "REMOVED"]).default("ACTIVE") })).mutation(({ input, ctx }) => auditMutation(ctx, input.status === "INACTIVE" ? "CATEGORY_DISABLED" : "CATEGORY_UPDATED", "menu_category", input.id, () => updateMenuCategory(input.id, input))),
    deleteCategory: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => auditMutation(ctx, "CATEGORY_DELETED", "menu_category", input.id, () => deleteMenuCategory(input.id))),
    create: adminProcedure.input(z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().max(4000).optional(), preparation: z.string().max(1000).optional(), price: z.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(async ({ input, ctx }) => auditMutation(ctx, "PRODUCT_CREATED", "menu_product", undefined, async () => createMenuProduct({ ...input, imageUrl: input.imageUrl ? await persistMenuImage(input.imageUrl) : undefined }))),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().max(4000).optional(), preparation: z.string().max(1000).optional(), price: z.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(async ({ input, ctx }) => { const { id, ...data } = input; return auditMutation(ctx, "PRODUCT_UPDATED", "menu_product", id, async () => updateMenuProduct(id, { ...data, imageUrl: data.imageUrl === "" ? null : await persistMenuImage(data.imageUrl) })); }),
    setStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["ACTIVE", "INACTIVE", "REMOVED"]) })).mutation(({ input, ctx }) => auditMutation(ctx, "PRODUCT_STATUS_CHANGED", "menu_product", input.id, () => setMenuProductStatus(input.id, input.status))),
  }),

  tableHistory: router({
    list: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional() })).query(({ input }) => getTableHistory(input.sessionToken, input.tableNumber, input.tableId)),
    sessionInfo: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional() })).query(({ input }) => getTableSessionInfo(input.sessionToken, input.tableNumber, input.tableId)),
    staffTables: staffProcedure.query(() => getStaffTables()),
    qrCodes: staffProcedure.query(() => listTableQrCodes()),
    viewedReceipts: staffProcedure.query(({ ctx }) => listViewedReceipts(ctx.user.role === "admin" ? undefined : ctx.user.id, ctx.user.role === "admin")),
    receiptWaiters: adminProcedure.query(() => listReceiptWaiterOptions()),
    viewedReceipt: staffProcedure.input(z.object({ selectionId: z.number().int().positive() })).query(({ input, ctx }) => getViewedReceiptForStaff(input.selectionId, ctx.user.id, ctx.user.role === "admin")),
    dailySummary: adminProcedure.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(({ input }) => getDailyStaffSummary(input.date, MENU_RESTAURANT_ID)),
    generateQrCode: adminProcedure.input(z.object({ tableNumber: z.string().min(1).max(64) })).mutation(({ input, ctx }) => auditMutation(ctx, "QR_CODE_CREATED", "table_qr_code", input.tableNumber, () => upsertTableQrCode(input.tableNumber))),
    assumeTable: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "TABLE_ASSIGNED", "table_session", input.sessionToken, () => assumeTableSession(input.sessionToken, ctx.user.id), result => ({ table_id: input.sessionToken, previous_waiter_id: result?.previousAttendingWaiterId ?? null, new_waiter_id: result?.newAttendingWaiterId ?? ctx.user.id }))),
    markViewed: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "MARK_AS_SEEN", "table_session", input.sessionToken, () => markTableViewedByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"), result => ({ receipt_ids: result.selectionIds, viewed_at: result.viewedAt, waiter_id: result.waiterId }))),
    releaseTable: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "TABLE_RELEASED", "table_session", input.sessionToken, () => releaseTableSessionByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"), result => ({ table_id: input.sessionToken, previous_waiter_id: result.previousWaiterId, new_waiter_id: result.newWaiterId }))),
    closeSession: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => auditMutation(ctx, "RECEIPT_CLOSED", "table_session", input.sessionToken, () => closeTableSessionByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin"))),
    updateSelectionStatus: staffProcedure.input(z.object({ selectionId: z.number().int().positive(), status: selectionStatusSchema })).mutation(({ input, ctx }) => auditMutation(ctx, "RECEIPT_STATUS_CHANGE", "table_selection", input.selectionId, () => setTableSelectionStatus(input.selectionId, input.status, ctx.user.id, ctx.user.role === "admin"))),
    removeSelectionItem: staffProcedure.input(z.object({ itemId: z.number().int().positive() })).mutation(({ input, ctx }) => auditMutation(ctx, "RECEIPT_EDIT", "table_selection_item", input.itemId, () => removeTableSelectionItem(input.itemId, ctx.user.id, ctx.user.role === "admin"))),
    staffLookup: staffProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).query(({ input, ctx }) => getTableHistoryForStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin")),
    staffIdentity: staffProcedure.query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, waiterCode: ctx.user.waiterCode ?? null, active: Boolean(ctx.user.waiterActive) })),
    createManualOrder: staffProcedure.input(z.object({ tableId: z.string().trim().min(1).max(128), notes: z.string().trim().max(1000).optional(), items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive().max(100) })).min(1).max(100) })).mutation(({ input, ctx }) => auditMutation(ctx, "CREATE_MANUAL_ORDER", "table_selection", undefined, () => createManualTableSelection({ ...input, waiterId: ctx.user.id }), result => ({ waiter_id: result.waiterId, table_id: result.tableNumber, selection_id: result.id }))),
    addSelection: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional(), subtotal: z.number().nonnegative(), notes: z.string().trim().max(1000).optional(), items: z.array(z.object({ productId: z.number().int().positive().optional(), productName: z.string().min(1).max(160), preparation: z.string().max(1000).optional(), quantity: z.number().int().positive(), unitPrice: z.number().nonnegative() })).min(1) })).mutation(({ input, ctx }) => auditMutation(ctx, "ORDER_CREATED", "table_selection", undefined, () => createTableSelection({ ...input, mergeOpenOrder: false }))),
  }),
});

export type AppRouter = typeof appRouter;
