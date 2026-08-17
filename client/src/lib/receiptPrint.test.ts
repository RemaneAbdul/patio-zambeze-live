import { describe, expect, it } from "vitest";
import { receiptHasContent, receiptPaperClass } from "./receiptPrint";

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
});
