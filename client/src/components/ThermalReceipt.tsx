import React from "react";

type ReceiptItem = { id?: number | string; productName: string; quantity: number; unitPrice: number; subtotal: number };
type ReceiptSelection = { id: number | string; selectionNumber: number; createdAt: Date | string | number; subtotal: number; items: ReceiptItem[] };

export function ThermalReceipt({ selections, total, width = "58mm", language = "pt" }: { selections: ReceiptSelection[]; total: number; width?: "58mm" | "80mm"; language?: "pt" | "en" }) {
  const money = (value: number) => `${value.toFixed(2)} MT`;
  const dateTime = (value: Date | string | number) => new Date(value).toLocaleString(language === "pt" ? "pt-PT" : "en-GB", { dateStyle: "short", timeStyle: "medium" });
  const now = new Date().toLocaleString(language === "pt" ? "pt-PT" : "en-GB", { dateStyle: "short", timeStyle: "short" });
  const copy = language === "pt" ? { history: "HISTÓRICO MESA", selection: "Seleção", subtotal: "Subtotal:", total: "TOTAL ESTIMADO:", confirm: "Confirme os valores com o garçom.", thanks: "Obrigado!" } : { history: "TABLE HISTORY", selection: "Selection", subtotal: "Subtotal:", total: "ESTIMATED TOTAL:", confirm: "Confirm the amounts with the waiter.", thanks: "Thank you!" };

  return <section className={`receipt-print receipt-${width}`} aria-label={language === "pt" ? "Recibo térmico" : "Thermal receipt"}><header><strong>PÁTIO ZAMBEZE</strong><span>{copy.history}</span><time>{now}</time></header>{selections.map((selection) => <section key={selection.id} className="receipt-selection"><strong>{copy.selection} {selection.selectionNumber}</strong><time className="receipt-selection-time">{dateTime(selection.createdAt)}</time><span className="receipt-rule">--------------------------------</span>{selection.items.map((item, index) => <div key={`${selection.id}-${item.id ?? index}`} className="receipt-item"><span>{item.productName}</span><span>{item.quantity} × {money(item.unitPrice)} <b>{money(item.subtotal)}</b></span></div>)}<div className="receipt-subtotal"><span>{copy.subtotal}</span><b>{money(selection.subtotal)}</b></div></section>)}<div className="receipt-total"><span>{copy.total}</span><strong>{money(total)}</strong></div><p>{copy.confirm}</p><footer>{copy.thanks}</footer></section>;
}
