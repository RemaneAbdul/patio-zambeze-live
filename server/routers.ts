import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createTableSelection, getTableHistory } from "./db";

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

  tableHistory: router({
    list: publicProcedure.input(z.object({ sessionToken: z.string().min(32).max(128) })).query(({ input }) => getTableHistory(input.sessionToken)),
    addSelection: publicProcedure.input(z.object({
      sessionToken: z.string().min(32).max(128),
      subtotal: z.number().nonnegative(),
      items: z.array(z.object({
        productKey: z.string().min(1).max(160),
        productName: z.string().min(1).max(240),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
        subtotal: z.number().nonnegative(),
      })).min(1).max(100),
    })).mutation(({ input }) => createTableSelection(input)),
  }),
});

export type AppRouter = typeof appRouter;
