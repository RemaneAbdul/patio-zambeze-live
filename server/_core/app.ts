import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

function getAllowedOrigins(req: express.Request) {
  const configured = (process.env.APP_ORIGIN ?? "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    ?.trim();
  const requestOrigin = `${forwardedProto || req.protocol}://${req.get("host")}`;
  return new Set([requestOrigin, ...configured]);
}

export function createApiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
    res.setHeader("X-Frame-Options", "DENY");

    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self' https://*.supabase.co; upgrade-insecure-requests",
      );
    }
    next();
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // CSRF protection for state-changing tRPC requests. The public Vercel
  // deployment is same-origin, while APP_ORIGIN can explicitly allow a custom
  // production domain or an additional trusted origin.
  app.use("/api/trpc", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
      const origin = req.get("origin");
      if (origin && !getAllowedOrigins(req).has(origin)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }
    next();
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
