import { describe, expect, it } from "vitest";

describe("Supabase admin credentials", () => {
  it("validates the provisioned new admin credentials without exposing the token", async () => {
    const url = process.env.SUPABASE_URL;
    const email = process.env.SUPABASE_ADMIN_EMAIL;
    const password = process.env.SUPABASE_ADMIN_PASSWORD;
    const apiKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !email || !password || !apiKey) {
      throw new Error("Supabase admin credential test configuration is missing");
    }

    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => null) as { access_token?: string } | null;

    expect(response.ok).toBe(true);
    expect(typeof body?.access_token).toBe("string");
    expect(body?.access_token?.length ?? 0).toBeGreaterThan(20);
  }, 20_000);
});
