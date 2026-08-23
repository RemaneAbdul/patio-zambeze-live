import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
const migrationSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/0012_allow_garcom_user_role.sql"), "utf8");
const rlsMigrationSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/0013_auth_profile_rls.sql"), "utf8");

describe("waiter role database contract", () => {
  it("allows the garcom role while preserving the existing roles", () => {
    expect(schemaSource).toContain("'user', 'admin', 'garcom'");
    expect(migrationSource).toContain("role IN ('user', 'admin', 'garcom')");
  });

  it("declares role and restaurant helpers with RLS policies", () => {
    expect(rlsMigrationSource).toContain("get_current_user_role");
    expect(rlsMigrationSource).toContain("get_current_restaurant_id");
    expect(rlsMigrationSource).toContain("garcons_self_select");
    expect(rlsMigrationSource).toContain("garcons_admin_manage");
    expect(rlsMigrationSource).toContain("auth.uid()");
  });

  it("keeps Supabase Auth credentials outside the users application table", () => {
    expect(schemaSource).not.toMatch(/password/i);
    expect(schemaSource).toContain("authUserId");
  });
});
