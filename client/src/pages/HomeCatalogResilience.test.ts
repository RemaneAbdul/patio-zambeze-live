import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "Home.tsx"), "utf8");

describe("Home catalog resilience", () => {
  it("does not present API failures as an empty catalogue", () => {
    expect(source).toContain("const catalogLoading = activeMenuQuery.isLoading || publicCategoriesQuery.isLoading;");
    expect(source).toContain("const catalogIssue = activeMenuQuery.isError || publicCategoriesQuery.isError;");
    expect(source).toContain("Não foi possível carregar o menu neste momento.");
    expect(source).toContain("activeMenuQuery.refetch()");
    expect(source).toContain("publicCategoriesQuery.refetch()");
  });

  it("uses the resilient image for logo, cards and details", () => {
    expect(source).toContain('import ResilientImage from "@/components/ResilientImage";');
    expect(source).toContain('alt="Símbolo Pátio Zambeze"');
    expect(source).toContain("fallbackClassName=\"product-image-placeholder\"");
    expect(source.match(/<ResilientImage/g)?.length).toBe(3);
  });
});
