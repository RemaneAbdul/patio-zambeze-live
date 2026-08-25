import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");
const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const schemaSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
const panelSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/WaiterPanel.tsx"), "utf8");
const homeSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
const productsPanelSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/ProductsPanel.tsx"), "utf8");


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

  it("keeps the public menu and admin mutations on the shared Supabase catalog", () => {
    expect(routerSource).toContain('active: publicProcedure.query(() => listMenuProducts(false, true))');
    expect(routerSource).toContain('staffCatalog: staffProcedure.query(() => listMenuProducts(false, false))');
    expect(dbSource).toContain('publicOnly ? ["ACTIVE"]');
    expect(homeSource).toContain('trpc.menu.active.useQuery');
    expect(homeSource).toContain('refetchInterval: 15000');
    expect(productsPanelSource).toContain('utils.menu.staffCatalog.invalidate()');
    expect(productsPanelSource).toContain('utils.menu.publicCategories.invalidate()');
    expect(productsPanelSource).toContain('utils.menu.active.refetch()');
  });

  it("offers table, category, product, quantity, notes and confirmation in the existing waiter panel", () => {
    expect(panelSource).toContain('Novo Pedido (pedido feito pelo cliente)');
    expect(panelSource).toContain('manualFiltersOpen');
    expect(panelSource).toContain('Pesquisar no catálogo');
    expect(panelSource).toContain('manual-catalog-search-button');
    expect(panelSource).toContain('aria-label={manualFiltersOpen ? "Ocultar filtros do catálogo" : "Pesquisar no catálogo"}');
    expect(panelSource).toContain('Ocultar filtros');
    expect(panelSource).toContain('Limpar filtros');
    expect(panelSource).toContain('trpc.menu.staffCatalog.useQuery');
    expect(panelSource).toContain('enabled: Boolean(isAuthorized && manualOpen)');
    expect(panelSource).toContain('refetchInterval: manualOpen ? 15000 : false');
    expect(panelSource).toContain('manualOrderRef.current?.scrollIntoView');
    expect(panelSource).toContain('ref={manualOrderRef}');
    expect(panelSource).toContain('id="manual-order-title"');
    expect(panelSource).toContain("Seleccione a mesa");
    expect(panelSource).toContain("Todas as categorias");
    expect(panelSource).toContain("Seleccione o prato");
    expect(panelSource).toContain("Observação");
    expect(panelSource).toContain("Confirmar Pedido");
    expect(panelSource).toContain("trpc.tableHistory.createManualOrder.useMutation");
    expect(panelSource).toContain('manualSuccess');
    expect(panelSource).toContain('aria-busy={createManualOrder.isPending}');
    expect(panelSource).toContain('Pedido criado com sucesso e associado à mesa seleccionada.');
  });

  it("shows immediate QR recognition and customer order feedback", () => {
    expect(homeSource).toContain('const qrFeedback = tableId ?');
    expect(homeSource).toContain('QR Code reconhecido');
    expect(homeSource).toContain('A reconhecer o QR Code');
    expect(homeSource).toContain('aria-live="polite"');
    expect(homeSource).toContain('aria-busy={historyMutation.isPending}');
    expect(homeSource).toContain('A criar o pedido');
    expect(homeSource).toContain('Pedido criado com sucesso e adicionado ao histórico da mesa.');
  });
});
