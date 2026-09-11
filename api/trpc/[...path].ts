import { createApiApp } from "../../server/_core/app";

// Use the same source application as the top-level API entrypoint so nested
// tRPC procedures never execute a stale checked-in bundle in Vercel.
const app = createApiApp();

export default app;
