import { createApiApp } from "../../server/_core/app";

// Keep the dedicated storage entrypoint on the current source application.
// This prevents direct /api/manus-storage/* requests from using a stale bundle.
const app = createApiApp();

export default app;

export const config = {
  api: {
    bodyParser: false,
  },
};
