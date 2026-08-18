export type ReceiptPrintState = "idle" | "preparing" | "printing" | "error";
export type ReceiptWidth = "58mm" | "80mm";

export function receiptPaperClass(width: ReceiptWidth) {
  return `receipt-${width}`;
}

export function receiptHasContent(element: { textContent: string | null } | null) {
  const text = element?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return text.includes("PÁTIO ZAMBEZE") && text.length > 80;
}

type PrintDocumentLike = {
  querySelector: (selector: string) => { textContent: string | null } | null;
  querySelectorAll: (selector: string) => ArrayLike<{ textContent: string | null }>;
};

export function receiptPrintPortalHasSingleReceipt(documentLike: PrintDocumentLike) {
  const portals = documentLike.querySelectorAll(".receipt-preview-backdrop");
  const receipts = documentLike.querySelectorAll(".receipt-preview-paper .receipt-print");
  const receipt = receipts.length === 1 ? receipts[0] : null;
  return portals.length === 1 && receipts.length === 1 && receiptHasContent(receipt);
}

export function printRenderedReceipt(selector: string, onState: (state: ReceiptPrintState) => void) {
  onState("preparing");
  const render = () => {
    const element = document.querySelector(selector);
    if (!receiptHasContent(element) || !receiptPrintPortalHasSingleReceipt(document)) {
      onState("error");
      return;
    }
    onState("printing");
    window.setTimeout(() => {
      document.body.dataset.receiptPrinting = "true";
      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        delete document.body.dataset.receiptPrinting;
        window.removeEventListener("afterprint", cleanup);
        onState("idle");
      };
      // Safari/iOS can return from window.print() before the preview is captured.
      // Keep the print-only portal visible until afterprint, with a safe fallback.
      window.addEventListener("afterprint", cleanup, { once: true });
      window.print();
      window.setTimeout(cleanup, 10_000);
    }, 80);
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(render));
  } else {
    window.setTimeout(render, 50);
  }
}
