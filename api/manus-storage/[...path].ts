import app from "../app.bundle.mjs";

// Dedicated function for the /manus-storage/* rewrite.
// The Express app already registers the storage proxy route.
export default app;

export const config = {
  api: {
    bodyParser: false,
  },
};
