import { describe, expect, it } from "vitest";
import { isValidStaffSessionToken, shouldQueryStaffLookup, staffLookupInput } from "./staffLookupGuard";

describe("staff lookup token guard", () => {
  it("rejects an empty or short token", () => {
    expect(isValidStaffSessionToken("")).toBe(false);
    expect(isValidStaffSessionToken("mesa-01")).toBe(false);
    expect(shouldQueryStaffLookup(true, "mesa-01")).toBe(false);
    expect(staffLookupInput("mesa-01")).toBeNull();
  });

  it("requires authorization and accepts a real session token", () => {
    const token = "a".repeat(32);
    expect(isValidStaffSessionToken(token)).toBe(true);
    expect(shouldQueryStaffLookup(false, token)).toBe(false);
    expect(shouldQueryStaffLookup(true, token)).toBe(true);
    expect(staffLookupInput(token)).toEqual({ sessionToken: token });
  });
});

