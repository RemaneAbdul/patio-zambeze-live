import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const schema = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
const db = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");
const router = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const panel = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/WaiterPanel.tsx"), "utf8");

describe("Anexo 50 — remoção de itens pendentes", () => {
  it("persists a status per selection item with PENDING as the default", () => {
    expect(schema).toContain('status: varchar("status", { length: 16 }).default("PENDING").notNull()');
  });

  it("checks both selection and item state before deleting", () => {
    expect(db).toContain('selection.status !== "PENDING"');
    expect(db).toContain('rows[0].item.status !== "PENDING"');
    expect(db).toContain('throw new Error("ITEM_NOT_PENDING")');
    expect(db).toContain('eq(tableSelectionItems.status, "PENDING")');
    expect(db).toContain('await db.update(tableSelectionItems).set({ status }).where(eq(tableSelectionItems.selectionId, selectionId))');
  });

  it("audits item, selection, product and quantity after removal", () => {
    expect(router).toContain('"RECEIPT_ITEM_REMOVED"');
    expect(router).toContain('product_name: result.productName');
    expect(router).toContain('quantity: result.quantity');
    expect(router).toContain('removed_at: result.removedAt');
  });

  it("only renders the removal action for pending items and uses the required confirmation", () => {
    expect(panel).toContain('selection.status === "PENDING" && item.status === "PENDING"');
    expect(panel).toContain('window.confirm("Tem certeza que deseja remover este prato do pedido?")');
    expect(panel).toContain('"Este prato já entrou em preparação e não pode ser removido."');
  });
});
