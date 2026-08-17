import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThermalReceipt } from "@/components/ThermalReceipt";

const selection = [{
  id: 1,
  selectionNumber: 1,
  createdAt: "2026-08-17T12:35:42.000Z",
  subtotal: 600,
  items: [{ id: 1, productName: "Frango Grelhado", quantity: 2, unitPrice: 300, subtotal: 600 }],
}];

describe("ThermalReceipt preview widths", () => {
  it.each(["58mm", "80mm"] as const)("renders a filled %s receipt", (width) => {
    const html = renderToStaticMarkup(<ThermalReceipt selections={selection} total={600} width={width} tableLabel="04" waiterName="João" waiterCode="GAR-001" />);
    expect(html).toContain(`receipt-${width}`);
    expect(html).toContain("Frango Grelhado");
    expect(html).toContain("GAR-001");
  });
});
