import { describe, expect, it } from "vitest";

describe("Supabase admin session integration", () => {
  it("resolves the authenticated admin profile through tRPC", async () => {
    const url = process.env.SUPABASE_URL;
    const email = process.env.SUPABASE_ADMIN_EMAIL;
    const password = process.env.SUPABASE_ADMIN_PASSWORD;
    const apiKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";

    if (!url || !email || !password || !apiKey) {
      throw new Error("Supabase admin integration test configuration is missing");
    }

    const authResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const authBody = await authResponse.json().catch(() => null) as { access_token?: string } | null;
    expect(authResponse.ok).toBe(true);
    expect(authBody?.access_token).toBeTruthy();

    const profileResponse = await fetch(`${baseUrl}/api/trpc/staff.profile?batch=1&input=%7B%7D`, {
      headers: {
        Authorization: `Bearer ${authBody!.access_token}`,
        "X-Auth-Provider": "supabase",
      },
    });
    expect(profileResponse.ok).toBe(true);
    const profileBody = await profileResponse.json() as Array<{ result?: { data?: { json?: { role?: string } } } }>;
    expect(profileBody[0]?.result?.data?.json?.role).toBe("admin");
  }, 30_000);
});
