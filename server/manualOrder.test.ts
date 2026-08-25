import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");
const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const schemaSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
const panelSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/WaiterPanel.tsx"), "utf8");


describe("manual waiter orders", () => {
  it("uses the shared selection model and server-side catalogue prices", () => {
    expect(dbSource).toContain("createManualTableSelection");
    expect(dbSource).toContain('eq(menuProducts.status, "ACTIVE")');
    expect(dbSource).toContain('source: "waiter"');
    expect(dbSource).toContain("createdByWaiterId: input.waiterId");
    expect(dbSource).toContain("mergeOpenOrder: false");
    expect(schemaSource).toContain('source: varchar("source"');
    expect(schemaSource).toContain('createdByWaiterId: integer("createdByWaiterId")');
    expect(schemaSource).not.toContain("manual_orders");
  });

  it("restricts creation to authenticated staff and records the audit event", () => {
    expect(routerSource).toContain("createManualOrder: staffProcedure");
    expect(routerSource).toContain('"CREATE_MANUAL_ORDER"');
    expect(routerSource).toContain("waiterId: ctx.user.id");
    expect(routerSource).toContain("tableId: z.string().trim().min(1)");
    expect(routerSource).toContain("items: z.array");
  });

  it("offers table, category, product, quantity, notes and confirmation in the existing waiter panel", () => {
    expect(panelSource).toContain('Novo Pedido (pedido feito pelo cliente)');
    expect(panelSource).toContain('manualFiltersOpen');
    expect(panelSource).toContain('Filtrar pratos');
    expect(panelSource).toContain('Ocultar filtros');
    expect(panelSource).toContain('Limpar filtros');
    expect(panelSource).toContain('trpc.menu.staffCatalog.useQuery');
    expect(panelSource).toContain('enabled: Boolean(isAuthorized && manualOpen)');
    expect(panelSource).toContain('manualOrderRef.current?.scrollIntoView');
    expect(panelSource).toContain('ref={manualOrderRef}');
    expect(panelSource).toContain('id="manual-order-title"');
    expect(panelSource).toContain("Seleccione a mesa");
    expect(panelSource).toContain("Todas as categorias");
    expect(panelSource).toContain("Seleccione o prato");
    expect(panelSource).toContain("Observação");
    expect(panelSource).toContain("Confirmar Pedido");
    expect(panelSource).toContain("trpc.tableHistory.createManualOrder.useMutation");
  });
});
