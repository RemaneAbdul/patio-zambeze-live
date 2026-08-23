import { describe, expect, it } from "vitest";

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
});
