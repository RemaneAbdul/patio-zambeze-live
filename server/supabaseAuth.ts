import { createClient, type SupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let adminClient: SupabaseClient | null = null;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase Auth server configuration is missing");
  }
  adminClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export async function getSupabaseUserFromAccessToken(accessToken: string): Promise<SupabaseUser | null> {
  if (!accessToken) return null;
  const { data, error } = await getAdminClient().auth.getUser(accessToken);
  if (error) return null;
  return data.user;
}

export async function createSupabaseWaiter(input: { email: string; password: string; fullName: string; phone?: string }) {
  const { data, error } = await getAdminClient().auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      phone: input.phone ?? "",
      role: "GARCOM",
    },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("SUPABASE_AUTH_USER_CREATE_FAILED");
  return data.user;
}

export async function deleteSupabaseWaiter(authUserId: string) {
  const { error } = await getAdminClient().auth.admin.deleteUser(authUserId);
  if (error) throw new Error(error.message);
}

export async function updateSupabaseWaiter(input: { authUserId: string; email: string; password?: string; fullName: string; phone?: string }) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(input.authUserId, {
    email: input.email,
    ...(input.password ? { password: input.password } : {}),
    user_metadata: {
      full_name: input.fullName,
      phone: input.phone ?? "",
      role: "GARCOM",
    },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("SUPABASE_AUTH_USER_UPDATE_FAILED");
  return data.user;
}

export async function disableSupabaseWaiter(authUserId: string) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { ban_duration: "876000h" });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function enableSupabaseWaiter(authUserId: string) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { ban_duration: "none" });
  if (error) throw new Error(error.message);
  return data.user;
}
