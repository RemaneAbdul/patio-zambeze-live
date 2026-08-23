import { describe, expect, it } from "vitest";
import { canUseWaiterPanel, isAdminRole, isWaiterRole } from "./roles";

describe("role access matrix", () => {
  it("recognises administrator access", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(canUseWaiterPanel("admin", null, 0)).toBe(true);
  });

  it("recognises an active waiter", () => {
    expect(isWaiterRole("waiter", "GAR-001")).toBe(true);
    expect(canUseWaiterPanel("waiter", "GAR-001", 1)).toBe(true);
    expect(canUseWaiterPanel("user", "GAR-001", 1)).toBe(true);
  });

  it("blocks disabled or ordinary accounts", () => {
    expect(canUseWaiterPanel("waiter", "GAR-001", 0)).toBe(false);
    expect(canUseWaiterPanel("user", null, 1)).toBe(false);
    expect(canUseWaiterPanel(undefined, undefined, undefined)).toBe(false);
  });
});
