import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export type ReceiptPdfState = "idle" | "preparing" | "sharing" | "error";

function getReceiptWidthMm(element: HTMLElement) {
  return element.classList.contains("receipt-80mm") ? 80 : 58;
}

async function renderReceiptPdf(selector: string) {
  const source = document.querySelector(selector) as HTMLElement | null;
  if (!source || !source.textContent?.replace(/\s+/g, " ").trim()) throw new Error("RECEIPT_EMPTY");

  const widthMm = getReceiptWidthMm(source);
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-receipt-pdf-source", "true");
  wrapper.style.cssText = `position:absolute;left:-100000px;top:0;width:${widthMm}mm;background:#fff;color:#000;z-index:9999;pointer-events:none;overflow:visible;`;
  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.add("receipt-pdf-render");
  clone.style.cssText = `display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;width:${widthMm}mm!important;max-width:${widthMm}mm!important;min-height:1px!important;height:auto!important;margin:0!important;padding:3mm!important;background:#fff!important;color:#000!important;overflow:visible!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important;`;
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(Array.from(clone.querySelectorAll("img")).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.addEventListener("load", () => resolve(), { once: true }); image.addEventListener("error", () => resolve(), { once: true }); })));
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    const bounds = clone.getBoundingClientRect();
    const renderWidth = Math.ceil(Math.max(clone.scrollWidth, bounds.width));
    const renderHeight = Math.ceil(Math.max(clone.scrollHeight, bounds.height));
    if (!renderWidth || !renderHeight) throw new Error("RECEIPT_EMPTY");
    const canvas = await html2canvas(clone, { backgroundColor: "#ffffff", scale: 2, useCORS: true, allowTaint: false, logging: false, width: renderWidth, height: renderHeight, windowWidth: renderWidth, windowHeight: renderHeight });
    if (!canvas.width || !canvas.height) throw new Error("RECEIPT_EMPTY");
    const contentWidth = widthMm - 6;
    const contentHeight = (canvas.height / canvas.width) * contentWidth;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [widthMm, contentHeight + 6], compress: true });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 3, 3, contentWidth, contentHeight, undefined, "FAST");
    return pdf.output("blob");
  } finally {
    wrapper.remove();
  }
}

export async function downloadReceiptPdf(selector: string, filename = "RECIBO.pdf") {
  const blob = await renderReceiptPdf(selector);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareReceiptPdf(selector: string, filename = "RECIBO.pdf") {
  const blob = await renderReceiptPdf(selector);
  const file = new File([blob], filename, { type: "application/pdf" });
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ files: [file], title: filename });
    return;
  }
  await downloadReceiptPdf(selector, filename);
}
