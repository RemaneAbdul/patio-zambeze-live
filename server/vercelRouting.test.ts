import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vercelConfig = JSON.parse(
  readFileSync(resolve(projectRoot, "vercel.json"), "utf8"),
) as {
  redirects?: Array<{ source?: string; destination?: string }>;
  rewrites?: Array<{ source?: string; destination?: string }>;
};

describe("Vercel routing", () => {
  it("keeps internal panel routes on the Vercel SPA", () => {
    expect(vercelConfig.redirects ?? []).not.toContainEqual(
      expect.objectContaining({
        source: "/painel/:path*",
        destination: expect.stringContaining("manus.space"),
      }),
    );

    expect(vercelConfig.rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/api/:path*",
          destination: expect.stringContaining("/api/:path*"),
        }),
        expect.objectContaining({
          source: "/((?!api(?:/|$)).*)",
          destination: "/index.html",
        }),
      ]),
    );
  });
});
