import { describe, expect, it } from "vitest";
import { createWaiterCodeRateLimiter, normalizeWaiterAccessCode } from "./waiterAccess";

describe("waiter access codes", () => {
  it("accepts only exactly six numeric digits", () => {
    expect(normalizeWaiterAccessCode("123456")).toBe("123456");
    expect(normalizeWaiterAccessCode(" 001204 ")).toBe("001204");
    expect(normalizeWaiterAccessCode("12345")).toBeNull();
    expect(normalizeWaiterAccessCode("1234567")).toBeNull();
    expect(normalizeWaiterAccessCode("12-3456")).toBeNull();
    expect(normalizeWaiterAccessCode("GAR-123456")).toBeNull();
    expect(normalizeWaiterAccessCode(123456)).toBeNull();
  });

  it("blocks repeated failures and resets after a valid login", () => {
    const limiter = createWaiterCodeRateLimiter({ maxFailures: 3, windowMs: 1_000, lockoutMs: 5_000 });
    const key = "waiter-code:test-ip";
    expect(limiter.check(key, 0).allowed).toBe(true);
    limiter.registerFailure(key, 0);
    limiter.registerFailure(key, 1);
    const blocked = limiter.registerFailure(key, 2);
    expect(blocked.blocked).toBe(true);
    expect(limiter.check(key, 3).allowed).toBe(false);
    limiter.reset(key);
    expect(limiter.check(key, 4).allowed).toBe(true);
  });

  it("opens a new attempt window after the failure window expires", () => {
    const limiter = createWaiterCodeRateLimiter({ maxFailures: 2, windowMs: 100, lockoutMs: 200 });
    const key = "waiter-code:window";
    limiter.registerFailure(key, 0);
    expect(limiter.check(key, 101).allowed).toBe(true);
    expect(limiter.registerFailure(key, 101).failures).toBe(1);
  });
});
