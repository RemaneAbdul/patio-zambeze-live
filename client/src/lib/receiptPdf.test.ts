import { describe, expect, it } from "vitest";
import { receiptPdfTextForTesting } from "./receiptPdf";

describe("receipt PDF source", () => {
  it("preserves the rendered receipt text and ignores empty lines", () => {
    const lines = receiptPdfTextForTesting({ innerText: "PÁTIO ZAMBEZE\n\nMESA 04\nTOTAL ESTIMADO: 300.00 MT" });
    expect(lines).toEqual(["PÁTIO ZAMBEZE", "MESA 04", "TOTAL ESTIMADO: 300.00 MT"]);
  });

  it("falls back to textContent when innerText is unavailable", () => {
    const lines = receiptPdfTextForTesting({ textContent: "PÁTIO ZAMBEZE MESA 04 TOTAL ESTIMADO: 300.00 MT" });
    expect(lines.join(" ")).toContain("PÁTIO ZAMBEZE");
    expect(lines.join(" ")).toContain("300.00 MT");
  });

  it("does not manufacture content for an empty receipt", () => {
    expect(receiptPdfTextForTesting({ innerText: "  \n  " })).toEqual([]);
  });
});
