import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "PasswordReset.tsx"), "utf8");
const loginSource = fs.readFileSync(path.resolve(import.meta.dirname, "WaiterLogin.tsx"), "utf8");
const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "../../../server/routers.ts"), "utf8");

describe("Supabase password recovery", () => {
  it("sends recovery links to the dedicated reset page", () => {
    expect(loginSource).toContain("resetPasswordForEmail");
    expect(loginSource).toContain("/redefinir-senha");
  });

  it("updates the password, records the sensitive action, and clears the session", () => {
    expect(source).toContain("supabase.auth.updateUser({ password })");
    expect(source).toContain("recordPasswordChange.mutateAsync()");
    expect(source).toContain("supabase.auth.signOut()");
    expect(source).toContain('sessionStorage.removeItem("supabase-access-token")');
  });

  it("exposes a protected server-side audit procedure", () => {
    expect(routerSource).toContain("recordPasswordChange: protectedProcedure");
    expect(routerSource).toContain('action: "AUTH_PASSWORD_CHANGED"');
  });
});
