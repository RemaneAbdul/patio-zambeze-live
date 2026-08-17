export type ReceiptPrintState = "idle" | "preparing" | "printing" | "error";
export type ReceiptWidth = "58mm" | "80mm";

export function receiptPaperClass(width: ReceiptWidth) {
  return `receipt-${width}`;
}

export function receiptHasContent(element: { textContent: string | null } | null) {
  const text = element?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return text.includes("PÁTIO ZAMBEZE") && text.length > 80;
}

export function printRenderedReceipt(selector: string, onState: (state: ReceiptPrintState) => void) {
  onState("preparing");
  const render = () => {
    const element = document.querySelector(selector);
    if (!receiptHasContent(element)) {
      onState("error");
      return;
    }
    onState("printing");
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => onState("idle"), 120);
    }, 80);
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(render));
  } else {
    window.setTimeout(render, 50);
  }
}
