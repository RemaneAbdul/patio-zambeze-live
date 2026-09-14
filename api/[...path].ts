import { createApiApp } from "../server/_core/app";

// Vercel Node function entrypoint for the existing Express + tRPC API.
// Import the source application directly so production always uses the same
// server code committed to GitHub instead of a potentially stale checked-in
// bundle artifact.
const app = createApiApp();

export default app;
