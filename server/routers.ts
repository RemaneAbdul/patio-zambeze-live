import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { storagePut } from "./storage";
import { assumeTableSession, closeTableSessionByStaff, releaseTableSessionByStaff, setTableSelectionStatus, createMenuCategory, createMenuProduct, createTableSelection, getStaffTables, getTableHistory, getTableHistoryForStaff, getTableSessionInfo, listMenuCategories, listMenuProducts, listTableQrCodes, listViewedReceipts, markTableViewedByStaff, setMenuProductStatus, updateMenuProduct, upsertTableQrCode } from "./db";

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

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  menu: router({
    active: publicProcedure.query(() => listMenuProducts(false)),
    categories: publicProcedure.query(() => listMenuCategories()),
    adminList: adminProcedure.input(z.object({ includeRemoved: z.boolean().default(false) })).query(({ input }) => listMenuProducts(input.includeRemoved)),
    createCategory: adminProcedure.input(z.object({ name: z.string().trim().min(1).max(100) })).mutation(({ input }) => createMenuCategory(input.name)),
    create: adminProcedure.input(z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().max(4000).optional(), preparation: z.string().max(1000).optional(), preparationEn: z.string().max(1000).optional(), price: z.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(async ({ input }) => createMenuProduct({ ...input, imageUrl: await persistMenuImage(input.imageUrl) })),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().max(4000).optional(), preparation: z.string().max(1000).optional(), preparationEn: z.string().max(1000).optional(), price: z.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(async ({ input }) => { const { id, ...data } = input; return updateMenuProduct(id, { ...data, imageUrl: await persistMenuImage(data.imageUrl) }); }),
    setStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["ACTIVE", "INACTIVE", "REMOVED"]) })).mutation(({ input }) => setMenuProductStatus(input.id, input.status)),
  }),

  tableHistory: router({
    list: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional() })).query(({ input }) => getTableHistory(input.sessionToken, input.tableNumber, input.tableId)),
    sessionInfo: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional() })).query(({ input }) => getTableSessionInfo(input.sessionToken, input.tableNumber, input.tableId)),
    staffTables: adminProcedure.query(() => getStaffTables()),
    qrCodes: adminProcedure.query(() => listTableQrCodes()),
    viewedReceipts: adminProcedure.query(() => listViewedReceipts()),
    generateQrCode: adminProcedure.input(z.object({ tableNumber: z.string().min(1).max(64) })).mutation(({ input }) => upsertTableQrCode(input.tableNumber)),
    assumeTable: adminProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => assumeTableSession(input.sessionToken, ctx.user.id)),
    markViewed: adminProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => markTableViewedByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin")),
    releaseTable: adminProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => releaseTableSessionByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin")),
    closeSession: adminProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input, ctx }) => closeTableSessionByStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin")),
    updateSelectionStatus: adminProcedure.input(z.object({ selectionId: z.number().int().positive(), status: selectionStatusSchema })).mutation(({ input, ctx }) => setTableSelectionStatus(input.selectionId, input.status, ctx.user.id, ctx.user.role === "admin")),
    staffLookup: adminProcedure
      .input(z.object({ sessionToken: z.string().min(32).max(128) }))
      .query(({ input, ctx }) => getTableHistoryForStaff(input.sessionToken, ctx.user.id, ctx.user.role === "admin")),
    staffIdentity: adminProcedure.query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, waiterCode: ctx.user.waiterCode ?? null, active: Boolean(ctx.user.waiterActive) })),
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
    })).mutation(({ input }) => createTableSelection(input)),
  }),
});

export type AppRouter = typeof appRouter;
