import { describe, expect, it } from "vitest";
import { prepareMenuImage } from "./menuImage";

describe("menu image preparation", () => {
  it("rejects unsupported formats", async () => {
    await expect(prepareMenuImage(new File(["x"], "dish.gif", { type: "image/gif" }))).rejects.toThrow("IMAGE_FORMAT_INVALID");
  });

  it("rejects oversized files before decoding", async () => {
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "dish.jpg", { type: "image/jpeg" });
    await expect(prepareMenuImage(oversized)).rejects.toThrow("IMAGE_TOO_LARGE");
  });
});
