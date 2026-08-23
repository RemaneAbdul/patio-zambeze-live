import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "WaiterPanel.tsx"), "utf8");

describe("waiter staff lookup query", () => {
  it("uses a valid disabled-query input instead of passing skipToken to tRPC", () => {
    expect(source).toContain('const EMPTY_LOOKUP_TOKEN = "0".repeat(32)');
    expect(source).toContain("staffLookupInput(selectedToken) ?? { sessionToken: EMPTY_LOOKUP_TOKEN }");
    expect(source).not.toContain('from "@tanstack/react-query"');
    expect(source).not.toContain(": skipToken");
  });
});
