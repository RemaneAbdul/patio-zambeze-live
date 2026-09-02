export const WAITER_ACCESS_CODE_MESSAGE = "Código de acesso incorreto.";
export const WAITER_ACCESS_CODE_PATTERN = /^\d{6}$/;

export function normalizeWaiterAccessCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim();
  return WAITER_ACCESS_CODE_PATTERN.test(code) ? code : null;
}

type AttemptState = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
};

export type WaiterCodeRateLimiter = ReturnType<typeof createWaiterCodeRateLimiter>;

export function createWaiterCodeRateLimiter(options: {
  maxFailures?: number;
  windowMs?: number;
  lockoutMs?: number;
  maxEntries?: number;
} = {}) {
  const maxFailures = options.maxFailures ?? 5;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const lockoutMs = options.lockoutMs ?? 15 * 60 * 1000;
  const maxEntries = options.maxEntries ?? 10_000;
  const attempts = new Map<string, AttemptState>();

  const prune = (now: number) => {
    for (const [key, state] of Array.from(attempts.entries())) {
      if (state.blockedUntil <= now && now - state.windowStartedAt > windowMs) attempts.delete(key);
    }
    while (attempts.size > maxEntries) {
      const firstKey = attempts.keys().next().value;
      if (firstKey === undefined) break;
      attempts.delete(firstKey);
    }
  };

  const check = (key: string, now = Date.now()) => {
    prune(now);
    const state = attempts.get(key);
    if (!state) return { allowed: true as const, retryAfterMs: 0 };
    if (state.blockedUntil > now) {
      return { allowed: false as const, retryAfterMs: state.blockedUntil - now };
    }
    if (now - state.windowStartedAt >= windowMs) {
      attempts.delete(key);
      return { allowed: true as const, retryAfterMs: 0 };
    }
    return { allowed: true as const, retryAfterMs: 0 };
  };

  const registerFailure = (key: string, now = Date.now()) => {
    prune(now);
    const current = attempts.get(key);
    const state = !current || now - current.windowStartedAt >= windowMs
      ? { failures: 0, windowStartedAt: now, blockedUntil: 0 }
      : current;
    state.failures += 1;
    if (state.failures >= maxFailures) state.blockedUntil = now + lockoutMs;
    attempts.set(key, state);
    return {
      blocked: state.blockedUntil > now,
      retryAfterMs: Math.max(0, state.blockedUntil - now),
      failures: state.failures,
    };
  };

  const reset = (key: string) => {
    attempts.delete(key);
  };

  return { check, registerFailure, reset };
}

export const waiterCodeRateLimiter = createWaiterCodeRateLimiter();
