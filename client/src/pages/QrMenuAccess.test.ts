import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("QR-only customer menu access", () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const homeSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("routes the root entry to the panel login", () => {
    expect(appSource).toContain('<Route path="/" component={WaiterLogin} />');
  });

  it("requires a table, mesa or qr query before rendering the customer menu", () => {
    expect(homeSource).toContain('params.get("table")?.trim()');
    expect(homeSource).toContain('params.get("mesa")?.trim()');
    expect(homeSource).toContain('params.get("qr")?.trim()');
    expect(homeSource).toContain('if (!hasQrAccess || invalidQrCode)');
    expect(homeSource).toContain("Aponte a câmara do telemóvel para o QR Code da sua mesa.");
  });
});
