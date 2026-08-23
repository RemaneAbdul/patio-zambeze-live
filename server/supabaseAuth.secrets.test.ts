import { describe, expect, it } from "vitest";

describe("Supabase Auth configuration", () => {
  it("accepts the configured server credentials without exposing them", async () => {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toMatch(/^https:\/\/[^/]+\.supabase\.co\/?$/);
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${url!.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    });

    const responseText = await response.text();
    expect(response.ok, `Supabase Auth returned HTTP ${response.status}: ${responseText.slice(0, 240)}`).toBe(true);
    const body = JSON.parse(responseText) as { external?: Record<string, unknown> };
    expect(body).toHaveProperty("external");
  }, 15_000);
});
