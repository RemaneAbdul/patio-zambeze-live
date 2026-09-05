import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "ResilientImage.tsx"), "utf8");

describe("ResilientImage", () => {
  it("renders an accessible fallback when the source is absent or fails", () => {
    expect(source).toContain("if (!src || failed)");
    expect(source).toContain('role="img"');
    expect(source).toContain("imagem indisponível");
    expect(source).toContain("onError={() => setFailed(true)}");
  });

  it("resets the failed state when a new source is provided", () => {
    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("setFailed(!src);");
    expect(source).toContain("[src]");
  });
});
