import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "QrCodesPanel.tsx"), "utf8");

describe("table QR code destination", () => {
  it("uses the public Vercel menu origin", () => {
    expect(source).toContain('const PUBLIC_MENU_ORIGIN = "https://patio-zambeze-live.vercel.app"');
    expect(source).toContain("${PUBLIC_MENU_ORIGIN}/menu?table=");
    expect(source).not.toContain("window.location.origin}/menu?table=");
    expect(source).not.toContain("menudigital-8xuhohcp.manus.space/menu");
  });
});
