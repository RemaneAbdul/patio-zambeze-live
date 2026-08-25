import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("security hardening and route splitting", () => {
  it("revokes public anon execution while retaining authenticated policy access", () => {
    const migration = readFileSync(resolve(process.cwd(), "drizzle/0017_restrict_security_definer_functions.sql"), "utf8");

    expect(migration).toContain("REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon;");
    expect(migration).toContain("REVOKE EXECUTE ON FUNCTION public.get_current_restaurant_id() FROM anon;");
    expect(migration).toContain("TO authenticated, service_role");
  });

  it("uses lazy-loaded internal routes and an accessible loading fallback", () => {
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

    expect(app).toContain('lazy(() => import("./pages/WaiterPanel"))');
    expect(app).toContain('lazy(() => import("./pages/ProductsPanel"))');
    expect(home).toContain('const { shareReceiptPdf } = await import("@/lib/receiptPdf")');
    expect(home).toContain('const { downloadReceiptPdf } = await import("@/lib/receiptPdf")');
    expect(app).toContain("<Suspense fallback={<PanelLoading />}>");
    expect(app).toContain('aria-busy="true"');
  });
});
