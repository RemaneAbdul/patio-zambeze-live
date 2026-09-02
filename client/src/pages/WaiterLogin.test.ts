import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "WaiterLogin.tsx"), "utf8");
const appSource = fs.readFileSync(path.resolve(import.meta.dirname, "../App.tsx"), "utf8");

describe("Supabase waiter login routing", () => {
  it("loads the persisted profile before navigating", () => {
    expect(source).toContain("loginStatusQuery.refetch()");
    expect(source).toContain('statusResult.data?.status === "ADMIN_INACTIVE"');
    expect(source).toContain("profileQuery.refetch()");
    expect(source).toContain('navigate("/painel/garcom");');
    expect(source).toContain('navigate(profile.role === "admin" ? "/painel/admin" : "/painel/garcom");');
    expect(source).toContain("recordLogin.mutateAsync()");
    expect(source).toContain("utils.auth.me.invalidate()");
  });

  it("exposes the official login routes and the six-digit waiter flow", () => {
    expect(appSource).toContain('<Route path="/login" component={WaiterLogin} />');
    expect(appSource).toContain('<Route path="/painel/login" component={WaiterLogin} />');
    expect(appSource).toContain('<Route path="/menu" component={Home} />');
    expect(source).toContain("quickLogin.mutateAsync({ code })");
    expect(source).toContain('pattern="[0-9]{6}"');
    expect(source).toContain('maxLength={6}');
    expect(source).toContain('return "Código de acesso incorreto.";');
  });

  it("rejects accounts without an active configured profile", () => {
    expect(source).toContain("Esta conta está desactivada. Contacte um administrador.");
    expect(source).toContain("O seu perfil não está configurado. Contacte o administrador.");
    expect(source).toContain("supabase.auth.signOut()");
  });
});
