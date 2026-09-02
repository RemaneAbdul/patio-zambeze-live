import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");

describe("waiter management security contracts", () => {
  it("resolves the authenticated profile before role-based routing", () => {
    expect(routerSource).toContain("profile: publicProcedure");
    expect(routerSource).toContain("getGarconProfileByLegacyUserId(ctx.user.id)");
    expect(routerSource).toContain('profile.status !== "ATIVO"');
  });

  it("associates audit events with the persisted waiter restaurant", () => {
    expect(routerSource).toContain("const waiterProfile = ctx.user?.role === \"garcom\"");
    expect(routerSource).toContain("restaurantId: waiterProfile?.restaurantId ?? \"default\"");
  });

  it("keeps authentication events auditable server-side", () => {
    expect(routerSource).toContain('action: "AUTH_LOGIN_SUCCESS"');
    expect(routerSource).toContain('action: "AUTH_LOGOUT"');
    expect(routerSource).toContain("ctx.user.id");
  });

  it("keeps onboarding, activation, assignments, deletion and history admin-only", () => {
    expect(routerSource).toContain("candidates: adminProcedure");
    expect(routerSource).toContain("add: adminProcedure");
    expect(routerSource).toContain("setActive: adminProcedure");
    expect(routerSource).toContain("delete: adminProcedure");
    expect(routerSource).toContain('"WAITER_DELETED"');
    expect(routerSource).toContain("currentAssignments: adminProcedure");
    expect(routerSource).toContain("serviceHistory: adminProcedure");
  });

  it("requires a matching active Supabase waiter profile", () => {
    expect(fs.readFileSync(path.resolve(import.meta.dirname, "_core/context.ts"), "utf8")).toContain("garconProfile?.authUserId !== supabaseUser.id");
    expect(fs.readFileSync(path.resolve(import.meta.dirname, "_core/context.ts"), "utf8")).toContain('garconProfile.status !== "ATIVO"');
  });

  it("assigns the waiter restaurant server-side", () => {
    expect(routerSource).toContain("restaurantId: MENU_RESTAURANT_ID");
    expect(routerSource).not.toContain("restaurantId: z.string()");
    expect(fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/WaitersPanel.tsx"), "utf8")).not.toContain('restaurantId: "default"');
  });

  it("rolls back partial waiter creation across Auth and PostgreSQL", () => {
    expect(dbSource).toContain("db.delete(garcons)");
    expect(dbSource).toContain("db.delete(users)");
    expect(dbSource).toContain("deleteSupabaseWaiter(authUser.id)");
  });

  it("removes waiter identity without deleting historical users", () => {
    expect(dbSource).toContain("export async function deleteGarcon");
    expect(dbSource).toContain("await deleteSupabaseWaiter(current.authUserId)");
    expect(dbSource).toContain('role: "user", waiterCode: null, waiterActive: 0');
    expect(dbSource).toContain("tx.delete(garcons)");
  });

  it("uses fail-closed defaults for table operations", () => {
    expect(dbSource).toContain("markTableViewedByStaff(sessionToken: string, waiterId: number, isAdmin = false)");
    expect(dbSource).toContain("closeTableSessionByStaff(sessionToken: string, waiterId = 0, isAdmin = false)");
  });

  it("keeps operational table actions under staffProcedure", () => {
    expect(routerSource).toContain("assumeTable: staffProcedure");
    expect(routerSource).toContain("markViewed: staffProcedure");
    expect(routerSource).toContain("releaseTable: staffProcedure");
    expect(routerSource).toContain("closeSession: staffProcedure");
    expect(routerSource).toContain("updateSelectionStatus: staffProcedure");
    expect(routerSource).toContain("removeSelectionItem: staffProcedure");
  });

  it("preserves historical records when changing waiter state", () => {
    expect(dbSource).toContain("waiterActive: input.active ? 1 : 0");
    expect(dbSource).toContain("getWaiterServiceHistory");
    expect(dbSource).toContain("auditLogs");
    expect(dbSource).toContain("db.update(users).set");
  });

  it("requires and persists an administrator-selected six-digit code", () => {
    expect(routerSource).toContain("quickLogin: publicProcedure");
    expect(routerSource).toContain("waiterCode: z.string().max(64)");
    expect(dbSource).toContain("normalizeWaiterAccessCode(input.waiterCode)");
    expect(dbSource).toContain("WAITER_CODE_ALREADY_IN_USE");
    expect(dbSource).not.toContain("GAR-${authUser.id");
    expect(dbSource).not.toContain("GAR-${existing.openId");
  });

  it("creates the quick-login session through the existing signed cookie", () => {
    expect(routerSource).toContain("sdk.createSessionToken(waiter.openId");
    expect(routerSource).toContain("ctx.res.cookie(COOKIE_NAME, sessionToken");
    expect(routerSource).toContain("waiterCodeRateLimiter.check");
    expect(routerSource).toContain("AUTH_QUICK_LOGIN_SUCCESS");
  });

  it("normalizes every quick-login failure to the same user-facing message", () => {
    expect(routerSource).toContain('throw new Error(WAITER_ACCESS_CODE_MESSAGE)');
    expect(fs.readFileSync(path.resolve(import.meta.dirname, "waiterAccess.ts"), "utf8")).toContain('Código de acesso incorreto.');
  });
});
