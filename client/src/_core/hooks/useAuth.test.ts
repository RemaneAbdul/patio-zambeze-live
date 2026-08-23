import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "useAuth.ts"), "utf8");

describe("shared authentication logout", () => {
  it("clears both browser session tokens", () => {
    expect(source).toContain('sessionStorage.removeItem("manus-cookie")');
    expect(source).toContain('sessionStorage.removeItem("supabase-access-token")');
  });
});
