import { describe, expect, it } from "vitest";

const connectionString = process.env.SUPABASE_DATABASE_URL;
const runSupabaseIntegration = process.env.RUN_SUPABASE_INTEGRATION === "1";

describe("Supabase PostgreSQL connection", () => {
  it("has a valid configured connection string", () => {
    expect(connectionString, "SUPABASE_DATABASE_URL must be configured").toBeTruthy();
    const url = new URL(connectionString!);
    expect(["postgres:", "postgresql:"]).toContain(url.protocol);
    expect(url.hostname).toContain("supabase.co");
    expect(url.searchParams.get("sslmode")).toBe("require");
  });

  it.skipIf(!runSupabaseIntegration)("can execute a lightweight SELECT 1 query", async () => {
    const { Client } = await import("pg");
    const testConnectionString = connectionString?.replace(/[?&]sslmode=require\b/, "");
    const client = new Client({
      connectionString: testConnectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10_000,
      query_timeout: 10_000,
    });
    await client.connect();
    try {
      const result = await client.query<{ value: number }>("SELECT 1 AS value");
      expect(result.rows[0]?.value).toBe(1);
    } finally {
      await client.end();
    }
  }, 20_000);
});
