import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const contextSource = fs.readFileSync(path.resolve(import.meta.dirname, "_core/context.ts"), "utf8");
const clientSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/main.tsx"), "utf8");

describe("Supabase and Manus session isolation", () => {
  it("marks Supabase bearer requests explicitly", () => {
    expect(clientSource).toContain('"X-Auth-Provider": "supabase"');
  });

  it("does not fall back to a stale Manus cookie for Supabase requests", () => {
    expect(contextSource).toContain('const isSupabaseToken = opts.req.headers["x-auth-provider"] === "supabase"');
    expect(contextSource).toContain("if (supabaseUser || isSupabaseToken)");
    expect(contextSource).toContain("user: null");
  });
});
