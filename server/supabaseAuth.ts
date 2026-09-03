import { createHmac } from "node:crypto";
import { createClient, type SupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  "";
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "";

let adminClient: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_AUTH_SERVER_CONFIGURATION_MISSING");
  }
  adminClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return adminClient;
}

function getAuthClient() {
  if (!supabaseUrl || !publishableKey) {
    throw new Error("SUPABASE_AUTH_CLIENT_CONFIGURATION_MISSING");
  }
  authClient ??= createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return authClient;
}

function assertWaiterAccessCode(accessCode: string) {
  if (!/^\d{6}$/.test(accessCode)) {
    throw new Error("WAITER_CODE_MUST_BE_6_DIGITS");
  }
}

/**
 * Derives the private Supabase Auth password used internally for waiter code login.
 * The waiter never sees or enters this password. The six-digit access code remains
 * the only credential exposed by the application.
 */
export function deriveWaiterAuthPassword(authUserId: string, accessCode: string) {
  assertWaiterAccessCode(accessCode);
  if (!serviceRoleKey) throw new Error("SUPABASE_AUTH_SERVER_CONFIGURATION_MISSING");
  return createHmac("sha256", serviceRoleKey)
    .update(`patio-zambeze:waiter:${authUserId}:${accessCode}`)
    .digest("hex");
}

export async function setSupabaseWaiterAccessCode(authUserId: string, accessCode: string) {
  const password = deriveWaiterAuthPassword(authUserId, accessCode);
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { password });
  if (error) {
    throw new Error(`SUPABASE_WAITER_ACCESS_CODE_UPDATE_FAILED:${error.message}`);
  }
  if (!data.user) {
    throw new Error("SUPABASE_WAITER_ACCESS_CODE_UPDATE_FAILED:USER_MISSING");
  }
  return data.user;
}

export async function signInSupabaseWaiterByCode(input: { authUserId: string; email: string; accessCode: string }) {
  const password = deriveWaiterAuthPassword(input.authUserId, input.accessCode);
  const { data, error } = await getAuthClient().auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user || !data.session) {
    throw new Error(`SUPABASE_WAITER_LOGIN_FAILED:${error?.message ?? "SESSION_MISSING"}`);
  }
  if (data.user.id !== input.authUserId) {
    throw new Error("SUPABASE_WAITER_IDENTITY_MISMATCH");
  }
  return data;
}

export async function getSupabaseUserFromAccessToken(accessToken: string): Promise<SupabaseUser | null> {
  if (!accessToken) return null;
  const { data, error } = await getAdminClient().auth.getUser(accessToken);
  if (error) return null;
  return data.user;
}

export async function createSupabaseAdminUser(input: { email: string; password: string; fullName: string }) {
  const client = getAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const { data: usersPage, error: listError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error(listError.message);
  const existing = usersPage.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
  if (existing) throw new Error("ADMIN_EMAIL_ALREADY_EXISTS");
  const { data, error } = await client.auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName.trim(), role: "ADMIN" },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("SUPABASE_AUTH_ADMIN_CREATE_FAILED");
  return data.user;
}

export async function createSupabaseAdmin(input: { email: string; password: string; fullName: string }) {
  const client = getAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const { data: usersPage, error: listError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error(listError.message);
  const existing = usersPage.users.find((user) => user.email?.toLowerCase() === normalizedEmail);

  if (existing) {
    const { data, error } = await client.auth.admin.updateUserById(existing.id, {
      email: normalizedEmail,
      password: input.password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, full_name: input.fullName, role: "ADMIN" },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("SUPABASE_AUTH_ADMIN_UPDATE_FAILED");
    return data.user;
  }

  const { data, error } = await client.auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role: "ADMIN" },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("SUPABASE_AUTH_ADMIN_CREATE_FAILED");
  return data.user;
}

export async function createSupabaseWaiter(input: { email: string; password: string; fullName: string; phone?: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const { data, error } = await getAdminClient().auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      phone: input.phone ?? "",
      role: "GARCOM",
    },
  });
  if (error) throw new Error(`SUPABASE_WAITER_CREATE_FAILED:${error.message}`);
  if (!data.user) throw new Error("SUPABASE_WAITER_CREATE_FAILED:USER_MISSING");
  return data.user;
}

export async function deleteSupabaseUser(authUserId: string) {
  const { error } = await getAdminClient().auth.admin.deleteUser(authUserId);
  if (error) throw new Error(error.message);
}

export async function deleteSupabaseWaiter(authUserId: string) {
  return deleteSupabaseUser(authUserId);
}

export async function updateSupabaseAdmin(input: { authUserId: string; email: string; fullName: string; password?: string }) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(input.authUserId, {
    email: input.email.trim().toLowerCase(),
    ...(input.password ? { password: input.password } : {}),
    email_confirm: true,
    user_metadata: { full_name: input.fullName.trim(), role: "ADMIN" },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("SUPABASE_AUTH_ADMIN_UPDATE_FAILED");
  return data.user;
}

export async function disableSupabaseUser(authUserId: string) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { ban_duration: "876000h" });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function enableSupabaseUser(authUserId: string) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(authUserId, { ban_duration: "none" });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function updateSupabaseWaiter(input: { authUserId: string; email: string; password?: string; fullName: string; phone?: string }) {
  const { data, error } = await getAdminClient().auth.admin.updateUserById(input.authUserId, {
    email: input.email.trim().toLowerCase(),
    ...(input.password ? { password: input.password } : {}),
    user_metadata: {
      full_name: input.fullName,
      phone: input.phone ?? "",
      role: "GARCOM",
    },
  });
  if (error) throw new Error(`SUPABASE_WAITER_UPDATE_FAILED:${error.message}`);
  if (!data.user) throw new Error("SUPABASE_WAITER_UPDATE_FAILED:USER_MISSING");
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
