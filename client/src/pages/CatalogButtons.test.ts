import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const productsSource = fs.readFileSync(path.resolve(import.meta.dirname, "ProductsPanel.tsx"), "utf8");
const cssSource = fs.readFileSync(path.resolve(import.meta.dirname, "../index.css"), "utf8");

describe("catalog action buttons", () => {
  it("keeps category actions as visible accessible buttons", () => {
    expect(productsSource).toContain('aria-label={`Editar categoria ${item.name}`}');
    expect(productsSource).toContain('aria-label={`${item.status === "ACTIVE" ? "Desactivar" : "Activar"} categoria ${item.name}`}');
    expect(productsSource).toContain('aria-label={`Eliminar categoria ${item.name}`}');
    expect(cssSource).toContain(".category-management-row button");
    expect(cssSource).toContain("opacity: 1 !important");
    expect(cssSource).toContain("visibility: visible !important");
  });

  it("provides spacing and mobile touch sizing without hover-only visibility", () => {
    expect(cssSource).toContain("gap: 10px");
    expect(cssSource).toContain("min-height: 46px");
    expect(cssSource).toContain("flex-direction: column");
    expect(cssSource).not.toContain(".category-management-row button { opacity: 0");
  });
});
