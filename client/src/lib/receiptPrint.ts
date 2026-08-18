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
  const existing = document.querySelectorAll(".receipt-print-source");
  if (existing.length > 0 || !source.outerHTML || !document.body?.appendChild) return null;

  const receiptContainer = source.closest(".receipt-modal, .receipt-preview-paper");
  const sourceWidth = receiptContainer?.className.match(/receipt-(58mm|80mm)/)?.[1] ?? "58mm";
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
  const portals = documentLike.querySelectorAll(".receipt-print-source");
  const receipts = documentLike.querySelectorAll(".receipt-print-source .receipt-preview-paper .receipt-print");
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
    // Keep window.print in the original click call stack for Safari/iOS.
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 10_000);
  };
  // Do not defer this: mobile Safari may reject a print call outside the user gesture.
  render();
}
