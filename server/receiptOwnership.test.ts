import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");
const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const archiveSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/InternalSettingsPanel.tsx"), "utf8");

describe("receipt ownership authorization", () => {
  it("filters waiter receipt archives by viewedByWaiterId and preserves admin access", () => {
    expect(dbSource).toContain("export async function listViewedReceipts(waiterId?: number, isAdmin = false)");
    expect(dbSource).toContain("assignedWaiterId !== waiterId");
    expect(dbSource).toContain("if (!isAdmin && (waiterId === undefined || assignedWaiterId !== waiterId)) continue;");
    expect(dbSource).toContain("const receiptWaiterId = assignedWaiterId ?? (isAdmin ? session.waiterId : null);");
    expect(routerSource).toContain('ctx.user.role === "admin" ? undefined : ctx.user.id');
  });

  it("protects direct receipt lookup with the same ownership rule", () => {
    expect(dbSource).toContain("getViewedReceiptForStaff(selectionId: number, waiterId: number, isAdmin = false)");
    expect(routerSource).toContain("viewedReceipt: staffProcedure");
    expect(routerSource).toContain("getViewedReceiptForStaff(input.selectionId, ctx.user.id, ctx.user.role === \"admin\")");
  });

  it("does not add a second client-side ownership system", () => {
    expect(archiveSource).toContain("viewedReceipts.useQuery");
    expect(archiveSource).toContain("Apenas equipa autorizada");
    expect(archiveSource).not.toContain("receipt.waiter.id === user.id");
  });

  it("loads receipt waiter options from real users and preserves historical IDs", () => {
    expect(dbSource).toContain("export async function listReceiptWaiterOptions()");
    expect(dbSource).toContain("tableSelections.viewedByWaiterId");
    expect(dbSource).toContain('eq(users.role, "garcom")');
    expect(dbSource).toContain("hasReceiptHistory");
    expect(routerSource).toContain("receiptWaiters: adminProcedure");
  });

  it("filters the admin archive by waiter ID and supports unassigned receipts", () => {
    expect(archiveSource).toContain("receiptWaiters.useQuery");
    expect(archiveSource).toContain('String(receipt.waiter?.id ?? \"\") === waiterFilter');
    expect(archiveSource).toContain('waiterFilter === \"unassigned\" ? !receipt.waiter');
    expect(archiveSource).toContain("filteredReceipts.length");
    expect(archiveSource).toContain("normalize(\"NFD\")");
  });

  it("refreshes the admin receipt waiter filter after waiter changes", () => {
    const waitersSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/WaitersPanel.tsx"), "utf8");
    expect(waitersSource).toContain("utils.tableHistory.receiptWaiters.invalidate()");
  });
});
