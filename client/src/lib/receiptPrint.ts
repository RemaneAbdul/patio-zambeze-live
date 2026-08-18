export type ReceiptPrintState = "idle" | "preparing" | "printing" | "saving-pdf" | "error";
export type ReceiptPrintMode = "print" | "pdf";
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

type ReceiptElement = HTMLElement & { textContent: string | null };

function createIsolatedReceiptPortal(source: ReceiptElement) {
  const existing = document.querySelectorAll(".receipt-preview-backdrop");
  if (existing.length > 0 || !source.outerHTML || !document.body?.appendChild) return null;

  const sourceWidth = source.closest(".receipt-modal")?.className.match(/receipt-(58mm|80mm)/)?.[1] ?? "58mm";
  const backdrop = document.createElement("div");
  backdrop.className = `receipt-preview-backdrop receipt-print-source receipt-${sourceWidth}`;
  const dialog = document.createElement("div");
  dialog.className = "receipt-preview-dialog";
  const paper = document.createElement("div");
  paper.className = `receipt-preview-paper receipt-${sourceWidth}`;
  paper.innerHTML = source.outerHTML;
  dialog.appendChild(paper);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  return backdrop;
}

export function receiptPrintPortalHasSingleReceipt(documentLike: PrintDocumentLike) {
  const portals = documentLike.querySelectorAll(".receipt-preview-backdrop");
  const receipts = documentLike.querySelectorAll(".receipt-preview-backdrop .receipt-preview-paper .receipt-print");
  const receipt = receipts.length === 1 ? receipts[0] : null;
  return portals.length === 1 && receipts.length === 1 && receiptHasContent(receipt);
}

export function printRenderedReceipt(selector: string, onState: (state: ReceiptPrintState) => void, mode: ReceiptPrintMode = "print") {
  onState("preparing");
  document.body.dataset.receiptPreparing = "true";
  const render = () => {
    const element = document.querySelector(selector) as ReceiptElement | null;
    if (!element || !receiptHasContent(element)) {
      delete document.body.dataset.receiptPreparing;
      onState("error");
      return;
    }
    const temporaryPortal = createIsolatedReceiptPortal(element);
    if (!receiptPrintPortalHasSingleReceipt(document)) {
      temporaryPortal?.remove();
      delete document.body.dataset.receiptPreparing;
      onState("error");
      return;
    }
    onState(mode === "pdf" ? "saving-pdf" : "printing");
    window.setTimeout(() => {
      delete document.body.dataset.receiptPreparing;
      document.body.dataset.receiptPrinting = "true";
      document.body.dataset.receiptPrintMode = mode;
      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        delete document.body.dataset.receiptPreparing;
        delete document.body.dataset.receiptPrinting;
        delete document.body.dataset.receiptPrintMode;
        temporaryPortal?.remove();
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
