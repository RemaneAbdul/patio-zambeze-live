import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => fs.readFileSync(path.resolve(import.meta.dirname, "..", relativePath), "utf8");
const routerSource = read("server/routers.ts");
const dbSource = read("server/db.ts");
const waiterPanelSource = read("client/src/pages/WaiterPanel.tsx");
const dashboardSource = read("client/src/components/DashboardLayout.tsx");
const waitersPanelSource = read("client/src/pages/WaitersPanel.tsx");
const quickLoginSource = read("server/quickWaiterLogin.ts");

describe("Anexo 48 — ocultação do código de acesso", () => {
  it("remove waiterCode from auth.me and staffIdentity responses", () => {
    expect(routerSource).toContain("const { waiterCode: _hiddenWaiterCode, ...safeUser } = user;");
    expect(routerSource).toContain("staffIdentity: staffProcedure.query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, active: Boolean(ctx.user.waiterActive) }))");
  });

  it("does not select access codes in operational history, sessions, assignments or receipts", () => {
    expect(dbSource).toContain("waiter: { id: users.id, name: users.name, email: users.email }");
    expect(dbSource).toContain("const historicalWaiter = session.waiterId ? await db.select({ id: users.id, name: users.name, waiterActive: users.waiterActive })");
    expect(dbSource).toContain("const currentWaiter = session.attendingWaiterId ? await db.select({ id: users.id, name: users.name, waiterActive: users.waiterActive })");
    expect(dbSource).toContain("await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, receiptWaiterId))");
  });

  it("keeps the six-digit code only in Admin waiter management", () => {
    expect(waitersPanelSource).toContain("accessCodeField");
    expect(waitersPanelSource).toContain("accessCode: code");
    expect(waitersPanelSource).not.toContain("GAR-001");
  });

  it("does not render the code in the waiter shell, dashboard identity or waiter receipt", () => {
    expect(waiterPanelSource).not.toContain("user?.waiterCode");
    expect(waiterPanelSource).not.toContain("waiter.waiterCode");
    expect(waiterPanelSource).not.toContain("viewedByWaiter?.waiterCode");
    expect(dashboardSource).not.toContain("user?.waiterCode");
    expect(dashboardSource).toContain("<span>Acesso interno</span>");
  });

  it("does not return the access code from quick login", () => {
    expect(quickLoginSource).toContain("waiter: {");
    expect(quickLoginSource).toContain("id: match.user.id");
    expect(quickLoginSource).not.toContain("waiterCode: waiter.waiterCode");
  });
});
