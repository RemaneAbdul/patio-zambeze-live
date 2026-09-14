type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  redirect(code: number, url: string): void;
  end(body?: string): void;
};

function firstPath(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.filter(Boolean).join("/");
  return value ?? "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).setHeader("Allow", "GET, HEAD").end("Method not allowed");
    return;
  }

  const path = firstPath(req.query.path).replace(/^\/+/, "");
  const forgeBase = String(process.env.BUILT_IN_FORGE_API_URL ?? "").replace(/\/+$/, "");
  const forgeKey = String(process.env.BUILT_IN_FORGE_API_KEY ?? "").trim();
  if (!path || !forgeBase || !forgeKey) {
    res.status(404).end("Not found");
    return;
  }

  try {
    const url = new URL(`${forgeBase}/v1/storage/presign/get`);
    url.searchParams.set("path", path);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${forgeKey}` },
    });
    if (!response.ok) {
      res.status(response.status === 404 ? 404 : 502).end("Storage object unavailable");
      return;
    }
    const payload = (await response.json()) as { url?: string };
    if (!payload.url) {
      res.status(502).end("Storage object unavailable");
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=300");
    res.redirect(307, payload.url);
  } catch {
    res.status(502).end("Storage backend unavailable");
  }
}
