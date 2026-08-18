import { describe, expect, it } from "vitest";
import { menuImageUrlSchema } from "./routers";

describe("menu image URL schema", () => {
  it("accepts camera data URLs and persisted paths", () => {
    expect(menuImageUrlSchema.parse("data:image/jpg;base64,abc")).toBe("data:image/jpg;base64,abc");
    expect(menuImageUrlSchema.parse("data:image/avif;base64,abc")).toBe("data:image/avif;base64,abc");
    expect(menuImageUrlSchema.parse("/manus-storage/menu/dish.jpg")).toBe("/manus-storage/menu/dish.jpg");
  });

  it("rejects non-image text", () => {
    expect(() => menuImageUrlSchema.parse("not-an-image")).toThrow("Formato de imagem inválido");
  });
});
