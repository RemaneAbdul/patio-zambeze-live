import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "DashboardLayout.tsx"), "utf8");
const appSource = fs.readFileSync(path.resolve(import.meta.dirname, "../App.tsx"), "utf8");

describe("dashboard role routing", () => {
  it("exposes an explicit protected admin route", () => {
    expect(appSource).toContain('path="/painel/admin"');
    expect(source).toContain('"/painel/admin"');
  });

  it("keeps administrative paths restricted to administrators", () => {
    expect(source).toContain("const adminOnlyPaths");
    expect(source).toContain("isAdminOnlyRoute && !isAdmin");
    expect(source).toContain("exclusiva para administradores");
  });

  it("redirects Supabase waiter logout directly to the waiter login", () => {
    expect(source).toContain('provider === "supabase"');
    expect(source).toContain('setLocation("/painel/login")');
  });
});
