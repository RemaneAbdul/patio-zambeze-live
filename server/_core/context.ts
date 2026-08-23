import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSupabaseUserFromAccessToken } from "../supabaseAuth";
import { getUserByOpenId } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  if (!user) {
    const authorization = opts.req.headers.authorization;
    const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (accessToken) {
      try {
        const supabaseUser = await getSupabaseUserFromAccessToken(accessToken);
        if (supabaseUser) user = await getUserByOpenId(`supabase:${supabaseUser.id}`) ?? null;
      } catch {
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
