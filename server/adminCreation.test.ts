import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");
const authSource = fs.readFileSync(path.resolve(import.meta.dirname, "supabaseAuth.ts"), "utf8");
const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const panelSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/WaitersPanel.tsx"), "utf8");
const trpcSource = fs.readFileSync(path.resolve(import.meta.dirname, "_core/trpc.ts"), "utf8");
const contextSource = fs.readFileSync(path.resolve(import.meta.dirname, "_core/context.ts"), "utf8");
const rlsSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/0015_users_profile_rls.sql"), "utf8");

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
    expect(routerSource).toContain('(result) => ({ affectedUserId: result.id })');
    expect(routerSource).not.toContain('password: result');
    expect(panelSource).toContain('aria-labelledby="create-admin-title"');
    expect(panelSource).toContain('trpc.staff.createAdmin.useMutation');
    expect(panelSource).toContain('value="Administrador"');
    expect(panelSource).toContain('Este email já está cadastrado.');
  });

  it("updates only permitted admin profile data and preserves the role", () => {
    expect(routerSource).toContain('updateAdmin: adminProcedure');
    expect(dbSource).toContain('updateSupabaseAdmin({ authUserId, email, fullName })');
    expect(dbSource).toContain('role: "admin"');
    expect(dbSource).toContain('ADMIN_EMAIL_ALREADY_EXISTS');
  });

  it("protects status changes and deletion from self-action and last-active-admin removal", () => {
    expect(routerSource).toContain('ADMIN_CANNOT_DEACTIVATE_SELF');
    expect(routerSource).toContain('ADMIN_CANNOT_DELETE_SELF');
    expect(dbSource).toContain('setAdminActive(id: number, active: boolean)');
    expect(dbSource).toContain('LAST_ACTIVE_ADMIN');
    expect(dbSource).toContain('waiterActive: active ? 1 : 0');
    expect(dbSource).toContain('where(and(eq(users.role, "admin"), eq(users.waiterActive, 1)))');
  });

  it("deletes the Auth identity while retaining the historical users row", () => {
    expect(routerSource).toContain('deleteAdmin: adminProcedure');
    expect(dbSource).toContain('await deleteSupabaseUser(authUserId)');
    expect(dbSource).toContain('role: "user", waiterCode: null, waiterActive: 0');
    expect(routerSource).toContain('"DELETE_ADMIN"');
    expect(routerSource).toContain('"UPDATE_ADMIN"');
    expect(routerSource).toContain('"ACTIVATE_ADMIN"');
    expect(routerSource).toContain('"DEACTIVATE_ADMIN"');
  });

  it("blocks inactive admins in both Supabase and legacy session resolution", () => {
    expect(contextSource).toContain('legacyUser.waiterActive === 1 ? legacyUser : null');
    expect(contextSource).toContain('user?.role === "admin" && user.waiterActive === 0 ? null : user');
    expect(trpcSource).toContain('ctx.user.waiterActive === 0');
    expect(trpcSource).toContain('Esta conta está desactivada. Contacte um administrador.');
    expect(routerSource).toContain('loginStatus: publicProcedure');
    expect(routerSource).toContain('status: "ADMIN_INACTIVE" as const');
    expect(rlsSource).toContain('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY');
    expect(rlsSource).toContain('users_self_select');
  });

  it("keeps critical admin actions visible and confirmed on mobile layouts", () => {
    expect(panelSource).toContain('> Editar</Button>');
    expect(panelSource).toContain('active ? "Desactivar" : "Activar"');
    expect(panelSource).toContain('"Apagar"');
    expect(panelSource).toContain('Tem certeza que deseja apagar permanentemente');
    expect(panelSource).toContain('A sua própria conta não pode ser desactivada ou apagada enquanto está autenticado.');
    expect(panelSource).toContain('user?.email?.trim().toLowerCase()');
    expect(panelSource).toContain('admin.email?.trim().toLowerCase()');
    expect(panelSource).toContain('Boolean(currentEmail && adminEmail && currentEmail === adminEmail)');
});

});
