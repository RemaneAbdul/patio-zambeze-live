import { describe, expect, it } from "vitest";
import { receiptHasContent, receiptPaperClass, receiptPrintPortalHasSingleReceipt } from "./receiptPrint";

describe("receipt print validation", () => {
  it("rejects an empty print target", () => {
    const target = { textContent: "" };
    expect(receiptHasContent(target)).toBe(false);
  });

  it("maps both supported thermal widths to the print target", () => {
    expect(receiptPaperClass("58mm")).toBe("receipt-58mm");
    expect(receiptPaperClass("80mm")).toBe("receipt-80mm");
  });

  it("accepts a rendered thermal receipt with real content", () => {
    const target = { textContent: "PÁTIO ZAMBEZE HISTÓRICO MESA MESA 04 GARÇOM: João ID: GAR-001 Seleção 1 Frango Grelhado 2 x 300 MT 600 MT TOTAL ESTIMADO: 600.00 MT Obrigado!" };
    expect(receiptHasContent(target)).toBe(true);
  });

  it("requires exactly one populated receipt inside the isolated portal", () => {
    const receipt = { textContent: "PÁTIO ZAMBEZE HISTÓRICO MESA MESA 01 GARÇOM: João Seleção 1 Frango Grelhado 1 x 350 MT 350 MT TOTAL ESTIMADO: 350 MT Obrigado!" };
    const documentLike = {
      querySelector: () => receipt,
      querySelectorAll: (selector: string) => selector === ".receipt-preview-backdrop" ? ["portal"] : [receipt],
    };
    expect(receiptPrintPortalHasSingleReceipt(documentLike)).toBe(true);
  });

  it("rejects a duplicated receipt portal or empty printable target", () => {
    const empty = { textContent: "" };
    const documentLike = {
      querySelector: () => empty,
      querySelectorAll: (selector: string) => selector === ".receipt-preview-backdrop" ? ["portal-a", "portal-b"] : [empty],
    };
    expect(receiptPrintPortalHasSingleReceipt(documentLike)).toBe(false);
  });
});
