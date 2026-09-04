import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");
const authSource = fs.readFileSync(path.resolve(import.meta.dirname, "supabaseAuth.ts"), "utf8");
const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");

describe("waiter email reconciliation", () => {
  it("looks up Auth email before creating and only accepts an orphan GARCOM account", () => {
    expect(dbSource).toContain("findSupabaseUserByEmail(email)");
    expect(dbSource).toContain('existingRole !== "GARCOM"');
    expect(dbSource).toContain('throw new Error("WAITER_EMAIL_ALREADY_EXISTS")');
    expect(dbSource).toContain("updateSupabaseWaiter({ authUserId: existingAuthUser.id");
  });

  it("does not delete a pre-existing Auth account during local rollback", () => {
    expect(dbSource).toContain("let ownsAuthUser = false");
    expect(dbSource).toContain("if (ownsAuthUser)");
    expect(dbSource).toContain("deleteSupabaseWaiter(authUser.id)");
  });

  it("uses the admin Auth client for the bounded email lookup", () => {
    expect(authSource).toContain("auth.admin.listUsers({ page: 1, perPage: 1000 })");
    expect(authSource).toContain("findSupabaseUserByEmail");
    expect(routerSource).toContain("Este email já está registado. Use outro email ou apague o garçom existente.");
  });
});
