import { describe, expect, it } from "vitest";
import { menuImageIsAccepted, menuProductFormIsValid, nextMenuStatus, maxMenuImageBytes } from "./menuProductRules";

describe("menu product management rules", () => {
  it("requires name, category and a non-negative MT price", () => {
    expect(menuProductFormIsValid({ name: " Frango ", categoryId: "1", price: "300" })).toBe(true);
    expect(menuProductFormIsValid({ name: "", categoryId: "1", price: "300" })).toBe(false);
    expect(menuProductFormIsValid({ name: "Frango", categoryId: "", price: "300" })).toBe(false);
    expect(menuProductFormIsValid({ name: "Frango", categoryId: "1", price: "-1" })).toBe(false);
  });

  it("accepts JPG, PNG and WEBP up to the configured limit", () => {
    expect(menuImageIsAccepted({ type: "image/jpeg", size: maxMenuImageBytes })).toBe(true);
    expect(menuImageIsAccepted({ type: "image/png", size: maxMenuImageBytes + 1 })).toBe(false);
    expect(menuImageIsAccepted({ type: "image/gif", size: 100 })).toBe(false);
  });

  it("keeps deactivation reversible and removal distinct", () => {
    expect(nextMenuStatus("deactivate")).toBe("INACTIVE");
    expect(nextMenuStatus("activate")).toBe("ACTIVE");
    expect(nextMenuStatus("remove")).toBe("REMOVED");
  });
});
