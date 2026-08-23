import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");

describe("waiter management security contracts", () => {
  it("keeps onboarding, activation, assignments and history admin-only", () => {
    expect(routerSource).toContain("candidates: adminProcedure");
    expect(routerSource).toContain("add: adminProcedure");
    expect(routerSource).toContain("setActive: adminProcedure");
    expect(routerSource).toContain("currentAssignments: adminProcedure");
    expect(routerSource).toContain("serviceHistory: adminProcedure");
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
    expect(dbSource).toContain("waiterActive: active ? 1 : 0");
    expect(dbSource).toContain("getWaiterServiceHistory");
    expect(dbSource).toContain("auditLogs");
    expect(dbSource).not.toContain("delete(users)");
  });
});
