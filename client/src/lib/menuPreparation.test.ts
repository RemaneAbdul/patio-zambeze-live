import { describe, expect, it } from "vitest";
import { getMenuPreparation, menuPreparationsEn, menuPreparationsPt } from "./menuPreparation";

describe("menu item preparation", () => {
  it("defines preparation for every menu item in Portuguese and English", () => {
    const ptNames = Object.keys(menuPreparationsPt);
    const enNames = Object.keys(menuPreparationsEn);
    expect(ptNames).toHaveLength(15);
    expect(enNames).toEqual(expect.arrayContaining(ptNames));
    expect(ptNames.every((name) => menuPreparationsPt[name as keyof typeof menuPreparationsPt].length > 0)).toBe(true);
    expect(ptNames.every((name) => menuPreparationsEn[name as keyof typeof menuPreparationsEn].length > 0)).toBe(true);
  });

  it("returns the preparation in the selected language", () => {
    expect(getMenuPreparation("Frango à Zambeziana", "pt")).toContain("20–30 min");
    expect(getMenuPreparation("Frango à Zambeziana", "en")).toContain("20–30 min");
    expect(getMenuPreparation("Coca-Cola", "en")).toBe("Served chilled immediately.");
  });
});
