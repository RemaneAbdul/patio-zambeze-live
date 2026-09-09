import type { Express, Request, Response } from "express";
import { ENV } from "./env";

async function serveStorageKey(key: string, res: Response) {
  const normalizedKey = key.replace(/^\/+/, "");
  if (!normalizedKey) {
    res.status(400).send("Missing storage key");
    return;
  }

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    res.status(500).send("Storage proxy not configured");
    return;
  }

  try {
    const forgeUrl = new URL(
      "v1/storage/presign/get",
      ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
    );
    forgeUrl.searchParams.set("path", normalizedKey);

    const forgeResp = await fetch(forgeUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => "");
      console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
      res.status(forgeResp.status === 404 ? 404 : 502).send("Storage object unavailable");
      return;
    }

    const { url } = (await forgeResp.json()) as { url?: string };
    if (!url) {
      res.status(502).send("Empty signed URL from backend");
      return;
    }

    res.set("Cache-Control", "public, max-age=300");
    res.redirect(307, url);
  } catch (err) {
    console.error("[StorageProxy] failed:", err);
    res.status(502).send("Storage proxy unavailable");
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/api/storage", (req: Request, res: Response) => {
    const queryPath = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;
    void serveStorageKey(String(queryPath ?? ""), res);
  });

  app.get(["/manus-storage/*", "/api/manus-storage/*"], (req: Request, res: Response) => {
    const rawKey = (req.params as Record<string, string>)[0] ?? "";
    const key = rawKey.replace(/^api\/manus-storage\//, "");
    void serveStorageKey(key, res);
  });
}
