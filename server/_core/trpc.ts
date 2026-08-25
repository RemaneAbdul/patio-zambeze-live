import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { canUseWaiterPanel } from "@shared/roles";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const staffProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!canUseWaiterPanel(ctx.user.role, ctx.user.waiterCode, ctx.user.waiterActive)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso ao painel do garçom não autorizado ou conta desactivada." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin' || ctx.user.waiterActive === 0) {
      throw new TRPCError({ code: "FORBIDDEN", message: ctx.user?.role === 'admin' ? "Esta conta está desactivada. Contacte um administrador." : NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
