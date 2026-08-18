import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { closeTableSessionByStaff, createMenuCategory, createMenuProduct, createTableSelection, getStaffTables, getTableHistory, getTableHistoryForStaff, getTableSessionInfo, listMenuCategories, listMenuProducts, listTableQrCodes, markTableViewedByStaff, setMenuProductStatus, updateMenuProduct, upsertTableQrCode } from "./db";

export const menuImageUrlSchema = z.string().max(8_000_000).refine((value) => /^(https?:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(value), "Formato de imagem inválido").optional();

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
    create: adminProcedure.input(z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().max(4000).optional(), preparation: z.string().max(1000).optional(), preparationEn: z.string().max(1000).optional(), price: z.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(({ input }) => createMenuProduct(input)),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().max(4000).optional(), preparation: z.string().max(1000).optional(), preparationEn: z.string().max(1000).optional(), price: z.number().nonnegative(), imageUrl: menuImageUrlSchema })).mutation(({ input }) => { const { id, ...data } = input; return updateMenuProduct(id, data); }),
    setStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["ACTIVE", "INACTIVE", "REMOVED"]) })).mutation(({ input }) => setMenuProductStatus(input.id, input.status)),
  }),

  tableHistory: router({
    list: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional() })).query(({ input }) => getTableHistory(input.sessionToken, input.tableNumber, input.tableId)),
    sessionInfo: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128), tableNumber: z.string().min(1).max(64).default("01"), tableId: z.string().min(1).max(128).optional() })).query(({ input }) => getTableSessionInfo(input.sessionToken, input.tableNumber, input.tableId)),
    staffTables: adminProcedure.query(() => getStaffTables()),
    qrCodes: adminProcedure.query(() => listTableQrCodes()),
    generateQrCode: adminProcedure.input(z.object({ tableNumber: z.string().min(1).max(64) })).mutation(({ input }) => upsertTableQrCode(input.tableNumber)),
    markViewed: adminProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input }) => markTableViewedByStaff(input.sessionToken)),
    closeSession: adminProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).mutation(({ input }) => closeTableSessionByStaff(input.sessionToken)),
    staffLookup: adminProcedure
      .input(z.object({ sessionToken: z.string().min(32).max(128) }))
      .query(({ input, ctx }) => getTableHistoryForStaff(input.sessionToken, ctx.user.id)),
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
