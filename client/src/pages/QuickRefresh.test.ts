import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "WaiterPanel.tsx"), "utf8");

describe("waiter quick refresh", () => {
  it("refreshes the existing tables query without a full page reload", () => {
    expect(source).toContain("await tables.refetch()");
    expect(source).toContain('aria-label="Actualizar lista de mesas"');
    expect(source).not.toContain("window.location.reload");
  });

  it("exposes loading and success feedback", () => {
    expect(source).toContain("A actualizar…");
    expect(source).toContain("Lista de mesas actualizada.");
    expect(source).toContain("waiter-refresh-confirmation");
  });
});
