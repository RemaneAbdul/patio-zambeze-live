import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "InternalSettingsPanel.tsx"), "utf8");

describe("prints archive filters", () => {
  it("provides text, date-range and waiter filters", () => {
    expect(source).toContain('aria-label="Pesquisar recibos vistos"');
    expect(source).toContain('aria-label="Filtrar recibos desde"');
    expect(source).toContain('aria-label="Filtrar recibos até"');
    expect(source).toContain('aria-label="Filtrar recibos por garçom"');
    expect(source).toContain("matchesFrom");
    expect(source).toContain("matchesTo");
    expect(source).toContain("matchesWaiter");
  });

  it("keeps second-copy actions scoped to the receipt id", () => {
    expect(source).toContain("selectedReceipt.id");
    expect(source).toContain("viewed-receipt-${selectedReceipt.id}");
    expect(source).not.toContain("selectedReceipt.session.id} .receipt-print");
  });
});
