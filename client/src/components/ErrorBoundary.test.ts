import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "ErrorBoundary.tsx"), "utf8");

describe("ErrorBoundary", () => {
  it("shows a safe visible recovery screen", () => {
    expect(source).toContain("Não foi possível carregar esta página.");
    expect(source).toContain("Recarregar página");
    expect(source).toContain('role="alert"');
    expect(source).not.toContain("this.state.error?.stack");
  });

  it("recognises stale dynamic chunks", () => {
    expect(source).toContain("dynamically imported module");
    expect(source).toContain("A versão da aplicação foi actualizada.");
  });
});
