import { describe, expect, it } from "vitest";
import { canUseWaiterPanel, isAdminRole, isWaiterRole } from "./roles";

describe("role access matrix", () => {
  it("recognises administrator access", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(canUseWaiterPanel("admin", null, 0)).toBe(true);
  });

  it("recognises an active waiter", () => {
    expect(isWaiterRole("waiter", "123456")).toBe(true);
    expect(canUseWaiterPanel("waiter", "123456", 1)).toBe(true);
    expect(canUseWaiterPanel("user", "123456", 1)).toBe(true);
  });

  it("blocks disabled or ordinary accounts", () => {
    expect(canUseWaiterPanel("waiter", "123456", 0)).toBe(false);
    expect(canUseWaiterPanel("garcom", "GAR-001", 1)).toBe(false);
    expect(canUseWaiterPanel("user", null, 1)).toBe(false);
    expect(canUseWaiterPanel(undefined, undefined, undefined)).toBe(false);
    expect(isWaiterRole("garcom", "12345")).toBe(false);
  });
});
