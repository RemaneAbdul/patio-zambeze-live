import { createSupabaseAdmin } from "../server/supabaseAuth.ts";
import { upsertUser, recordAuditLog } from "../server/db.ts";

const email = process.env.SUPABASE_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPABASE_ADMIN_PASSWORD;
const fullName = process.env.SUPABASE_ADMIN_NAME?.trim() || "Administrador Pátio Zambeze";

if (!email || !password) {
  throw new Error("SUPABASE_ADMIN_EMAIL and SUPABASE_ADMIN_PASSWORD are required");
}

const authUser = await createSupabaseAdmin({ email, password, fullName });
const openId = `supabase:${authUser.id}`;
await upsertUser({
  openId,
  name: fullName,
  email,
  loginMethod: "supabase",
  role: "admin",
  waiterActive: 1,
});

const dbUser = await import("../server/db.ts").then(({ getUserByOpenId }) => getUserByOpenId(openId));
await recordAuditLog({
  userId: dbUser?.id ?? null,
  restaurantId: "default",
  role: "admin",
  action: "ADMIN_PROVISIONED",
  entityType: "auth_user",
  entityId: authUser.id,
  metadata: { provider: "supabase", email },
});

console.log(JSON.stringify({ success: true, authUserId: authUser.id, userId: dbUser?.id ?? null, email }));
