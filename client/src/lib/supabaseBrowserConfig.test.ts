import { describe, expect, it } from "vitest";
import { getSupabaseBrowserConfig } from "./supabaseBrowserConfig";

describe("getSupabaseBrowserConfig", () => {
  it("returns null when public Supabase values are missing", () => {
    expect(getSupabaseBrowserConfig({})).toBeNull();
    expect(getSupabaseBrowserConfig({ VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "key" })).toBeNull();
    expect(getSupabaseBrowserConfig({ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "" })).toBeNull();
  });

  it("trims and returns both public values when configured", () => {
    expect(getSupabaseBrowserConfig({
      VITE_SUPABASE_URL: " https://example.supabase.co ",
      VITE_SUPABASE_PUBLISHABLE_KEY: " public-key ",
    })).toEqual({ url: "https://example.supabase.co", publishableKey: "public-key" });
  });

  it("rejects database URLs and non-Supabase browser URLs", () => {
    expect(getSupabaseBrowserConfig({
      VITE_SUPABASE_URL: "postgresql://user:password@db.example.com:5432/postgres",
      VITE_SUPABASE_PUBLISHABLE_KEY: "public-key",
    })).toBeNull();
    expect(getSupabaseBrowserConfig({
      VITE_SUPABASE_URL: "https://example.com",
      VITE_SUPABASE_PUBLISHABLE_KEY: "public-key",
    })).toBeNull();
    expect(getSupabaseBrowserConfig({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "postgresql://user:password@db.example.com:5432/postgres",
    })).toBeNull();
  });
});
