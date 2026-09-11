export type SupabaseBrowserConfig = {
  url: string;
  publishableKey: string;
};

function isBrowserSupabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const isLocalDevelopment = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const isSupabaseProject = parsed.hostname.endsWith(".supabase.co");
    return (parsed.protocol === "https:" && isSupabaseProject) || (parsed.protocol === "http:" && isLocalDevelopment);
  } catch {
    return false;
  }
}

export function getSupabaseBrowserConfig(env: unknown): SupabaseBrowserConfig | null {
  const source = env as Record<string, unknown>;
  const url = String(source.VITE_SUPABASE_URL ?? source.SUPABASE_URL ?? "").trim();
  const publishableKey = String(
    source.VITE_SUPABASE_PUBLISHABLE_KEY ??
      source.VITE_SUPABASE_ANON_KEY ??
      source.SUPABASE_PUBLISHABLE_KEY ??
      source.SUPABASE_ANON_KEY ??
      "",
  ).trim();
  return isBrowserSupabaseUrl(url) && publishableKey && !/^postgres(?:ql)?:\/\//i.test(publishableKey)
    ? { url, publishableKey }
    : null;
}
