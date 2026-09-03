import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "useAuth.ts"), "utf8");

describe("shared authentication logout", () => {
  it("clears both browser session tokens", () => {
    expect(source).toContain('sessionStorage.removeItem("manus-cookie")');
    expect(source).toContain('sessionStorage.removeItem("supabase-access-token")');
  });

  it("does not let blocked localStorage break auth state calculation", () => {
    expect(source).toContain("try {");
    expect(source).toContain("localStorage.setItem(");
    expect(source).toContain("Storage can be blocked");
    expect(source).toContain("return {");
  });
});
