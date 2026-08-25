import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");
const authSource = fs.readFileSync(path.resolve(import.meta.dirname, "supabaseAuth.ts"), "utf8");
const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const panelSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/WaitersPanel.tsx"), "utf8");

describe("admin creation safeguards", () => {
  it("exposes creation only through adminProcedure with a backend-fixed admin role", () => {
    expect(routerSource).toContain("createAdmin: adminProcedure");
    expect(routerSource).toContain('"CREATE_ADMIN"');
    const createAdminBlock = dbSource.slice(dbSource.indexOf("export async function createAdminUser"), dbSource.indexOf("export async function updateGarcon"));
    expect(createAdminBlock).toContain('role: "admin"');
    expect(createAdminBlock).not.toContain("input.role");
  });

  it("rejects duplicate emails and rolls back Auth when the SQL profile fails", () => {
    expect(authSource).toContain('throw new Error("ADMIN_EMAIL_ALREADY_EXISTS")');
    expect(dbSource).toContain('throw new Error("ADMIN_EMAIL_ALREADY_EXISTS")');
    expect(dbSource).toContain('await deleteSupabaseWaiter(authUser.id)');
    expect(dbSource).toContain('throw new Error("ADMIN_PROFILE_CREATE_FAILED")');
  });

  it("keeps credentials out of audit metadata and reuses the staff management page", () => {
    expect(routerSource).toContain('(result) => ({ createdUserId: result.id })');
    expect(routerSource).not.toContain('password: result');
    expect(panelSource).toContain('aria-labelledby="create-admin-title"');
    expect(panelSource).toContain('trpc.staff.createAdmin.useMutation');
    expect(panelSource).toContain('value="Administrador"');
    expect(panelSource).toContain('Este email já está cadastrado.');
  });
});
