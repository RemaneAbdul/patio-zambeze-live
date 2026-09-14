import { createApiApp } from "./app.bundle.mjs";

// Vercel Node function entrypoint. The checked-in bundle avoids runtime
// resolution failures from source aliases and server-only imports in the
// serverless environment.
const app = createApiApp();

export default app;
