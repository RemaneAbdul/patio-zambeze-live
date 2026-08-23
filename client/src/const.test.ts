import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "const.ts"), "utf8");

describe("client OAuth configuration", () => {
  it("does not contain server-side database configuration", () => {
    expect(source).not.toContain("SUPABASE_DATABASE_URL");
    expect(source).not.toContain("postgresql://");
    expect(source).not.toContain("process.env");
  });

  it("keeps a public OAuth fallback and validates configured values", () => {
    expect(source).toContain('const PUBLIC_OAUTH_PORTAL = "https://manus.im"');
    expect(source).toContain('const PUBLIC_APP_ID = "8XUHoHCp7FLwnEffAV7Tmy"');
    expect(source).not.toContain("import.meta.env");
    expect(source).toContain("getPublicOAuthConfig");
    expect(source).toContain("window.location.assign");
  });
});
