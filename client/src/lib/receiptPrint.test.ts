import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { printRenderedReceipt, receiptHasContent, receiptPaperClass, receiptPrintPortalHasSingleReceipt } from "./receiptPrint";

describe("receipt print validation", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { window?: unknown }).window;
  });
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
      querySelectorAll: (selector: string) => selector === ".receipt-print-source" ? ["portal"] : [receipt],
    };
    expect(receiptPrintPortalHasSingleReceipt(documentLike)).toBe(true);
  });

  it("rejects a duplicated receipt portal or empty printable target", () => {
    const empty = { textContent: "" };
    const documentLike = {
      querySelector: () => empty,
      querySelectorAll: (selector: string) => selector === ".receipt-print-source" ? ["portal-a", "portal-b"] : [empty],
    };
    expect(receiptPrintPortalHasSingleReceipt(documentLike)).toBe(false);
  });

  it("accepts a previously opened preview as the source of a second print", () => {
    const receipt = { textContent: "PÁTIO ZAMBEZE HISTÓRICO MESA MESA 04 Seleção 1 Frango Grelhado 1 x 300 MT TOTAL ESTIMADO: 300 MT Obrigado!" };
    const documentLike = {
      querySelectorAll: (selector: string) => selector === ".receipt-print-source" ? ["temporary-portal"] : selector.includes(".receipt-print-source") ? [receipt] : [],
    };
    expect(receiptPrintPortalHasSingleReceipt(documentLike)).toBe(true);
  });

  it("reports the PDF preparation state while keeping the receipt isolated", () => {
    vi.useFakeTimers();
    const receipt = { textContent: "PÁTIO ZAMBEZE HISTÓRICO MESA MESA 01 Seleção 1 Coca-Cola 1 x 80 MT TOTAL ESTIMADO: 80 MT Obrigado!" };
    const body = { dataset: {} as Record<string, string> };
    let afterPrint: (() => void) | undefined;
    const documentLike = {
      body,
      querySelector: () => receipt,
      querySelectorAll: (selector: string) => selector === ".receipt-print-source" ? ["portal"] : [receipt],
    };
    const windowLike = {
      setTimeout,
      print: () => undefined,
      addEventListener: (_type: string, handler: () => void) => { afterPrint = handler; },
      removeEventListener: () => undefined,
    };
    (globalThis as { document: unknown }).document = documentLike;
    (globalThis as { window: unknown }).window = windowLike;
    const states: string[] = [];

    printRenderedReceipt(".receipt-preview-paper .receipt-print", (state) => states.push(state), "pdf");
    vi.advanceTimersByTime(50);
    vi.advanceTimersByTime(80);

    expect(body.dataset.receiptPrinting).toBe("true");
    expect(body.dataset.receiptPrintMode).toBe("pdf");
    expect(states).toEqual(["preparing", "saving-pdf"]);
    afterPrint?.();
    expect(states).toEqual(["preparing", "saving-pdf", "idle"]);
  });

  it("keeps the isolated print state until Safari fires afterprint", () => {
    vi.useFakeTimers();
    const receipt = { textContent: "PÁTIO ZAMBEZE HISTÓRICO MESA MESA 01 Seleção 1 Frango Grelhado 1 x 300 MT TOTAL ESTIMADO: 300 MT Obrigado!" };
    const body = { dataset: {} as Record<string, string> };
    let afterPrint: (() => void) | undefined;
    let printed = false;
    const documentLike = {
      body,
      querySelector: () => receipt,
      querySelectorAll: (selector: string) => selector === ".receipt-print-source" ? ["portal"] : [receipt],
    };
    const windowLike = {
      setTimeout,
      print: () => { printed = true; },
      addEventListener: (_type: string, handler: () => void) => { afterPrint = handler; },
      removeEventListener: () => undefined,
    };
    (globalThis as { document: unknown }).document = documentLike;
    (globalThis as { window: unknown }).window = windowLike;
    const states: string[] = [];

    printRenderedReceipt(".receipt-preview-paper .receipt-print", (state) => states.push(state));
    vi.advanceTimersByTime(50);
    vi.advanceTimersByTime(80);

    expect(printed).toBe(true);
    expect(body.dataset.receiptPrinting).toBe("true");
    expect(states).toEqual(["preparing", "printing"]);

    afterPrint?.();
    expect(body.dataset.receiptPrinting).toBeUndefined();
    expect(states).toEqual(["preparing", "printing", "idle"]);
  });

  it("defines mobile-only address hiding and named thermal pages", () => {
    const css = fs.readFileSync(path.resolve(import.meta.dirname, "../index.css"), "utf8");
    expect(css).toContain("@media screen and (max-width: 600px)");
    expect(css).toContain(".receipt-print .receipt-header-contact > span:last-child { display: none; }");
    expect(css).toContain("@page receipt58mm { size: 58mm auto; margin: 0; }");
    expect(css).toContain("@page receipt80mm { size: 80mm auto; margin: 0; }");
    expect(css).toContain("page: receipt58mm");
    expect(css).toContain("page: receipt80mm");
  });
});
