import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
const migrationSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/0012_allow_garcom_user_role.sql"), "utf8");

describe("waiter role database contract", () => {
  it("allows the garcom role while preserving the existing roles", () => {
    expect(schemaSource).toContain("'user', 'admin', 'garcom'");
    expect(migrationSource).toContain("role IN ('user', 'admin', 'garcom')");
  });

  it("keeps Supabase Auth credentials outside the users application table", () => {
    expect(schemaSource).not.toMatch(/password/i);
    expect(schemaSource).toContain("authUserId");
  });
});
