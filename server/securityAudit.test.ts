import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const app = fs.readFileSync(path.join(root, "server/_core/app.ts"), "utf8");
const router = fs.readFileSync(path.join(root, "server/routers.ts"), "utf8");
const roles = fs.readFileSync(path.join(root, "shared/roles.ts"), "utf8");

describe("security hardening audit", () => {
  it("sets baseline response security headers and same-origin mutation protection", () => {
    expect(app).toContain('app.disable("x-powered-by")');
    expect(app).toContain('X-Content-Type-Options');
    expect(app).toContain('Referrer-Policy');
    expect(app).toContain('X-Frame-Options');
    expect(app).toContain('Strict-Transport-Security');
    expect(app).toContain('Content-Security-Policy');
    expect(app).toContain('express.json({ limit: "10mb" })');
    expect(app).toContain('express.urlencoded({ limit: "1mb", extended: true })');
    expect(app).toContain('const origin = req.get("origin")');
    expect(app).toContain('res.status(403).json({ error: "Forbidden" })');
  });

  it("does not accept client-supplied order prices, names or totals", () => {
    expect(router).toContain('items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive().max(100) }))');
    expect(router).not.toContain('subtotal: z.number().nonnegative(), notes: z.string().trim().max(1000).optional(), items: z.array(z.object({ productId: z.number().int().positive().optional()');
    expect(router).toContain('subtotal: 0, items: input.items.map((item) => ({ productId: item.productId, productName: "", quantity: item.quantity, unitPrice: 0 }))');
  });

  it("does not allow ordinary users to cross the waiter authorization boundary", () => {
    expect(roles).toContain('return role === "garcom" && WAITER_ACCESS_CODE_PATTERN.test(waiterCode ?? "")');
    expect(roles).not.toContain('role === "user"');
  });

  it("does not write waiter access codes to audit metadata or quick-login responses", () => {
    expect(router).not.toContain('waiter_code: (result as { waiterCode?: string }).waiterCode');
    expect(router).toContain('return { waiter: result.waiter };');
  });

  it("does not expose server-only credentials to the browser bundle", () => {
    const clientSource = fs.readdirSync(path.join(root, "client/src"), { recursive: true }).filter((entry) => typeof entry === "string" && /\.(ts|tsx)$/.test(entry)).map((entry) => fs.readFileSync(path.join(root, "client/src", entry), "utf8")).join("\n");
    expect(clientSource).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|BUILT_IN_FORGE_API_KEY|SUPABASE_ADMIN_PASSWORD/);
  });
});
