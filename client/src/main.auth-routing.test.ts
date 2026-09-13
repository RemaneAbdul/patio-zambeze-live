import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("direct panel access", () => {
  it("does not force a login redirect or clear the Supabase token on API auth errors", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");

    expect(source).toContain("sem redireccionamento automático");
    expect(source).not.toContain('window.location.assign("/painel/login")');
    expect(source).not.toContain('sessionStorage.removeItem("supabase-access-token")');
  });
});
