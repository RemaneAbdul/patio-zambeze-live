import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Supabase token propagation", () => {
  it("persists a Supabase access token and forwards it as a Bearer token", () => {
    const mainSource = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
    const loginSource = readFileSync(resolve(process.cwd(), "client/src/pages/WaiterLogin.tsx"), "utf8");

    expect(loginSource).toContain('sessionStorage.setItem("supabase-access-token", data.session.access_token)');
    expect(mainSource).toContain('Authorization: `Bearer ${supabaseToken}`');
    expect(mainSource).toContain('"X-Auth-Provider": "supabase"');
    expect(mainSource).toContain('localStorage.setItem(SUPABASE_TOKEN_KEY, sessionToken)');
  });
});
