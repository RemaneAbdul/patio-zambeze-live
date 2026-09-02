import { describe, expect, it } from "vitest";
import { canUseStaffShell, canUseWaiterPanel, isAdminRole, isWaiterRole } from "./roles";

describe("role access matrix", () => {
  it("recognises administrator access", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(canUseWaiterPanel("admin", null, 0)).toBe(true);
  });

  it("recognises only an active garcom with a valid code", () => {
    expect(isWaiterRole("garcom", "123456")).toBe(true);
    expect(canUseWaiterPanel("garcom", "123456", 1)).toBe(true);
    expect(canUseWaiterPanel("garcom", "123456", 0)).toBe(false);
    expect(canUseWaiterPanel("waiter", "123456", 1)).toBe(false);
    expect(canUseWaiterPanel("user", "123456", 1)).toBe(false);
  });

  it("allows the staff shell without exposing the access code", () => {
    expect(canUseStaffShell("admin", 0)).toBe(true);
    expect(canUseStaffShell("garcom", 1)).toBe(true);
    expect(canUseStaffShell("garcom", 0)).toBe(false);
    expect(canUseStaffShell("user", 1)).toBe(false);
  });

  it("blocks disabled or invalid accounts", () => {
    expect(canUseWaiterPanel("garcom", "GAR-001", 1)).toBe(false);
    expect(canUseWaiterPanel("user", null, 1)).toBe(false);
    expect(canUseWaiterPanel(undefined, undefined, undefined)).toBe(false);
    expect(isWaiterRole("garcom", "12345")).toBe(false);
  });
});
