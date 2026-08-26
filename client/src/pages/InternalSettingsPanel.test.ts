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

  it("normalizes and searches table, waiter name and waiter code variants", () => {
    expect(source).toContain("String(value ?? \"\")");
    expect(source).toContain("replace(/[^a-z0-9]+/g, \" \")");
    expect(source).toContain("tableWithoutLeadingZeros");
    expect(source).toContain("`mesa ${tableNumber}`");
    expect(source).toContain("`garcom ${waiterName}`");
    expect(source).toContain("`garcom ${waiterCode}`");
    expect(source).toContain("const matchesText = !query || searchableText.includes(query)");
  });

  it("keeps second-copy actions scoped to the receipt id", () => {
    expect(source).toContain("selectedReceipt.id");
    expect(source).toContain("viewed-receipt-${selectedReceipt.id}");
    expect(source).not.toContain("selectedReceipt.session.id} .receipt-print");
  });
});
