import { createApiApp } from "../server/_core/app";

// Vercel Node function entrypoint for the existing Express + tRPC API.
// Keeping the API under /api preserves the current client contract while
// removing the production dependency on the Manus hosting runtime.
const app = createApiApp();

export default app;
