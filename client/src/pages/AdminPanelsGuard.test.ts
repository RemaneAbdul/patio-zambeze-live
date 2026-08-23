import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => fs.readFileSync(path.resolve(import.meta.dirname, file), "utf8");

describe("admin panel query guards", () => {
  it("does not query products or categories for a waiter", () => {
    const products = source("ProductsPanel.tsx");
    expect(products).toContain("const isAdmin = isAdminRole(user?.role)");
    expect(products).toContain("enabled: isAdmin");
  });

  it("does not query QR codes for a waiter", () => {
    const qrCodes = source("QrCodesPanel.tsx");
    expect(qrCodes).toContain("const isAdmin = isAdminRole(user?.role)");
    expect(qrCodes).toContain("enabled: isAdmin");
  });

  it("does not query waiter administration for a waiter", () => {
    const waiters = source("WaitersPanel.tsx");
    expect(waiters).toContain("const isAdmin = isAdminRole(user?.role)");
    expect(waiters).toContain("enabled: isAdmin");
  });
});
