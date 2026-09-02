import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { normalizeAccessCode } from "./waiterAccessCode";

describe("waiter access-code persistence contract", () => {
  const source = fs.readFileSync(path.resolve(import.meta.dirname, "waiterAccessCode.ts"), "utf8");

  it("accepts the code as an opaque six-character numeric value", () => {
    expect(normalizeAccessCode("123456")).toBe("123456");
    expect(normalizeAccessCode("12345")).toBe("12345");
    expect(normalizeAccessCode("ABC123")).toBe("ABC123");
  });

  it("persists waiterCode in users and verifies the exact database row", () => {
    expect(source).toContain(".update(users)");
    expect(source).toContain(".set({");
    expect(source).toContain("waiterCode: normalized");
    expect(source).toContain("eq(users.id, waiter.legacyUserId)");
    expect(source).toContain(".returning({ id: users.id, waiterCode: users.waiterCode })");
    expect(source).toContain("post-UPDATE SELECT mismatch");
  });

  it("does not make Supabase Auth password synchronization a prerequisite for persistence", () => {
    expect(source).not.toContain("setSupabaseWaiterAccessCode");
    expect(source).not.toContain("previousCode");
  });
});
