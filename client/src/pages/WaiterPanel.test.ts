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

describe("daily summary and viewed confirmation", () => {
  it("loads the daily summary only for administrators", () => {
    expect(source).toContain("dailySummary.useQuery");
    expect(source).toContain("enabled: isAdminRole(user?.role)");
    expect(source).toContain('aria-label="Resumo diário"');
    expect(source).toContain("totalProcessed");
    expect(source).toContain("byAction");
  });

  it("shows the visual confirmation after marking a table as viewed", () => {
    expect(source).toContain("setViewedConfirmation(true)");
    expect(source).toContain('role="status"');
    expect(source).toContain("viewed-confirmation");
  });
});

describe("special instructions visibility", () => {
  it("shows the persisted order note to authorized staff without changing the receipt flow", () => {
    expect(source).toContain('selection.notes && <p className="waiter-selection-notes"><strong>Nota:</strong> {selection.notes}</p>');
    expect(source).toContain("notes: selection.notes");
    expect(source).toContain("canUseStaffShell(user?.role, user?.waiterActive)");
  });
});

describe("selection item removal guard", () => {
  it("disables removal of the final item and keeps the server guard", () => {
    expect(source).toContain("selection.items.length <= 1");
    expect(source).toContain("Não é possível remover o último item");
  });
});
