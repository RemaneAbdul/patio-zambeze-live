import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const integration = process.env.SUPABASE_URL && process.env.SUPABASE_ADMIN_EMAIL && process.env.SUPABASE_ADMIN_PASSWORD ? describe : describe.skip;

integration("admin email configuration", () => {
  it("authenticates with the configured admin email without changing the password", async () => {
    const client = createClient(process.env.SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.signInWithPassword({
      email: process.env.SUPABASE_ADMIN_EMAIL!,
      password: process.env.SUPABASE_ADMIN_PASSWORD!,
    });
    expect(error).toBeNull();
    expect(data.user?.email).toBe("yuranremane51@gmail.com");
    expect(data.session?.access_token).toBeTruthy();
    await client.auth.signOut();
  });
});
