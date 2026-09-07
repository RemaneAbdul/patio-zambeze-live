import { createApiApp } from "../app.bundle.mjs";

// Explicit nested entrypoint for tRPC procedure paths such as menu.active.
// Some Vercel routing configurations do not pass dotted procedure names through
// a top-level catch-all consistently, while health/auth-config remain reachable.
const app = createApiApp();

export default app;

