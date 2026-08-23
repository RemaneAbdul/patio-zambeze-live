import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "DashboardLayout.tsx"), "utf8");

describe("dashboard role routing", () => {
  it("keeps administrative paths restricted to administrators", () => {
    expect(source).toContain("const adminOnlyPaths");
    expect(source).toContain("isAdminOnlyRoute && !isAdmin");
    expect(source).toContain("exclusiva para administradores");
  });
});
