import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "supabaseAuth.ts"), "utf8");

describe("Supabase Auth service credentials", () => {
  it("accepts the configured service-role key for the admin API", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();
    expect(key).not.toMatch(/^sb_publishable/);
    const response = await fetch(`${url}/auth/v1/admin/users?per_page=1`, { headers: { apikey: key!, Authorization: `Bearer ${key}` } });
    expect(response.status).toBe(200);
  }, 15_000);

  it("never falls back from the public client key to the service-role key", () => {
    expect(source).toContain('process.env.SUPABASE_PUBLISHABLE_KEY');
    expect(source).toContain('process.env.SUPABASE_ANON_KEY');
    expect(source).toContain('  "";');
    expect(source).not.toContain('process.env.SUPABASE_ANON_KEY ??\n  serviceRoleKey');
  });
});
