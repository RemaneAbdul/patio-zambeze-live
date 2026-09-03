const databaseConnectionString =
  process.env.SUPABASE_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  "";

// Keep the existing Drizzle layer compatible with Vercel/Supabase deployments
// that expose the PostgreSQL connection under DATABASE_URL or another
// PostgreSQL connection alias. This value is server-only.
if (!process.env.SUPABASE_DATABASE_URL && databaseConnectionString) {
  process.env.SUPABASE_DATABASE_URL = databaseConnectionString;
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: databaseConnectionString,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
