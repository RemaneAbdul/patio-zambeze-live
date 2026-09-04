export type SupabaseBrowserConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabaseBrowserConfig(env: unknown): SupabaseBrowserConfig | null {
  const source = env as Record<string, unknown>;
  const url = String(source.VITE_SUPABASE_URL ?? "").trim();
  const publishableKey = String(source.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
  return url && publishableKey ? { url, publishableKey } : null;
}
