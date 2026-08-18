import { describe, expect, it } from "vitest";
import { selectionStatusSchema } from "./routers";

describe("selection order status", () => {
  it("accepts the complete waiter lifecycle", () => {
    for (const status of ["PENDING", "PREPARING", "READY", "DELIVERED", "COMPLETED"] as const) {
      expect(selectionStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("rejects invalid statuses", () => {
    expect(selectionStatusSchema.safeParse("CANCELLED").success).toBe(false);
  });
});
