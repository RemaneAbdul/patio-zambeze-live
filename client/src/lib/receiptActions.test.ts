import { describe, expect, it } from "vitest";
import { canExportReceipt, receiptFilenameFor, receiptSelectorFor } from "./receiptActions";

describe("receipt actions are independent", () => {
  it("builds a different selector and filename for each receipt", () => {
    expect(receiptSelectorFor("05", 1)).not.toBe(receiptSelectorFor("05", 2));
    expect(receiptFilenameFor("05", 1)).toContain("PEDIDO-1.pdf");
    expect(receiptFilenameFor("05", 2)).toContain("PEDIDO-2.pdf");
  });

  it("allows export only after that receipt was viewed", () => {
    expect(canExportReceipt(null)).toBe(false);
    expect(canExportReceipt(undefined)).toBe(false);
    expect(canExportReceipt("2026-08-24T06:00:00.000Z")).toBe(true);
  });
});
