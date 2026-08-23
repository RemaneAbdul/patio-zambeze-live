import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSupabaseUserFromAccessToken } from "../supabaseAuth";
import { getGarconProfileByLegacyUserId, getUserByOpenId } from "../db";

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
        if (supabaseUser) {
          const legacyUser = await getUserByOpenId(`supabase:${supabaseUser.id}`);
          if (legacyUser?.role === "admin") {
            user = legacyUser;
          } else if (legacyUser) {
            const garconProfile = await getGarconProfileByLegacyUserId(legacyUser.id);
            user = garconProfile?.authUserId === supabaseUser.id && garconProfile.role === "GARCOM" && garconProfile.status === "ATIVO"
              ? { ...legacyUser, role: "garcom", waiterActive: 1 }
              : null;
          }
        }
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
