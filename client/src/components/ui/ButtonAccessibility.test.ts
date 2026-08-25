import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const buttonSource = fs.readFileSync(path.resolve(import.meta.dirname, "button.tsx"), "utf8");
const cssSource = fs.readFileSync(path.resolve(import.meta.dirname, "../../index.css"), "utf8");

describe("button visibility and accessibility", () => {
  it("keeps base buttons visible and interactive across states", () => {
    expect(buttonSource).toContain("active:scale-[0.98]");
    expect(buttonSource).toContain("disabled:opacity-65");
    expect(buttonSource).toContain("focus-visible:ring-[3px]");
    expect(buttonSource).toContain('bg-background text-foreground');
    expect(buttonSource).toContain('min-h-10');
  });

  it("keeps internal action groups visible and touch-friendly", () => {
    expect(cssSource).toContain("manual-catalog-search-button");
    expect(cssSource).toContain("min-height: 44px");
    expect(cssSource).toContain("outline: 3px solid #c85a3f");
    expect(cssSource).toContain(".waiter-detail-actions");
  });
});
