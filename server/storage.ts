import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "";
const MENU_BUCKET = "menu-images";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseStorageAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_STORAGE_SERVER_CONFIGURATION_MISSING");
  }
  supabaseAdmin ??= createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return supabaseAdmin;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/** New uploads use Supabase Storage. Legacy reads remain compatible. */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const client = getSupabaseStorageAdmin();
  const { error } = await client.storage.from(MENU_BUCKET).upload(key, data, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`SUPABASE_STORAGE_UPLOAD_FAILED:${error.message}`);

  const { data: publicUrl } = client.storage.from(MENU_BUCKET).getPublicUrl(key);
  if (!publicUrl.publicUrl) throw new Error("SUPABASE_STORAGE_PUBLIC_URL_MISSING");
  return { key, url: publicUrl.publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (key.startsWith("menu-products/") && supabaseUrl && supabaseServiceKey) {
    const { data } = getSupabaseStorageAdmin().storage.from(MENU_BUCKET).getPublicUrl(key);
    return { key, url: data.publicUrl };
  }
  return { key, url: `/manus-storage/${key}` };
}

/** Legacy compatibility for assets previously uploaded through Manus/Forge. */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  if (key.startsWith("menu-products/") && supabaseUrl && supabaseServiceKey) {
    const { data } = getSupabaseStorageAdmin().storage.from(MENU_BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) throw new Error("Storage config missing: set Supabase Storage or legacy Forge storage configuration");

  const getUrl = new URL("v1/storage/presign/get", forgeUrl.replace(/\/+$/, "") + "/");
  getUrl.searchParams.set("path", key);
  const resp = await fetch(getUrl, { headers: { Authorization: `Bearer ${forgeKey}` } });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }
  const { url } = (await resp.json()) as { url: string };
  if (!url) throw new Error("Forge returned empty signed URL");
  return url;
}

export async function storageRemove(relKey: string): Promise<void> {
  const key = normalizeKey(relKey);
  if (!key || !supabaseUrl || !supabaseServiceKey || !key.startsWith("menu-products/")) return;
  const { error } = await getSupabaseStorageAdmin().storage.from(MENU_BUCKET).remove([key]);
  if (error) throw new Error(`SUPABASE_STORAGE_DELETE_FAILED:${error.message}`);
}
