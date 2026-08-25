import { describe, expect, it } from "vitest";
import { menuImageUrlSchema } from "./routers";

describe("menu product image validation", () => {
  it("accepts local gallery/camera data URLs and remote image URLs", () => {
    expect(menuImageUrlSchema.safeParse("data:image/png;base64,AAAA").success).toBe(true);
    expect(menuImageUrlSchema.safeParse("https://example.com/prato.webp").success).toBe(true);
  });

  it("accepts an explicit empty value for removing an existing image", () => {
    expect(menuImageUrlSchema.safeParse("").success).toBe(true);
  });

  it("rejects unsupported image formats", () => {
    expect(menuImageUrlSchema.safeParse("data:image/gif;base64,AAAA").success).toBe(false);
    expect(menuImageUrlSchema.safeParse("texto sem imagem").success).toBe(false);
  });
});
