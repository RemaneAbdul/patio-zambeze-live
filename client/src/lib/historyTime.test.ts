import { describe, expect, it } from "vitest";
import { formatHistoryTime } from "./historyTime";

describe("history submission timestamps", () => {
  it("keeps seconds independent for each submission", () => {
    const first = formatHistoryTime("2026-08-17T10:35:42.000Z", "pt");
    const second = formatHistoryTime("2026-08-17T10:48:17.000Z", "pt");
    const third = formatHistoryTime("2026-08-17T11:02:31.000Z", "pt");

    expect(new Set([first, second, third]).size).toBe(3);
    expect(first).toMatch(/42$/);
    expect(second).toMatch(/17$/);
    expect(third).toMatch(/31$/);
  });
});
