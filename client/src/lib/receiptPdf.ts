import { jsPDF } from "jspdf";

export type ReceiptPdfState = "idle" | "preparing" | "sharing" | "error";

function getReceiptWidthMm(element: HTMLElement) {
  return element.classList.contains("receipt-80mm") ? 80 : 58;
}

function getReceiptText(element: HTMLElement) {
  const rawText = (element.innerText || element.textContent || "").replace(/\u00a0/g, " ");
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

async function renderReceiptPdf(selector: string) {
  const source = document.querySelector(selector) as HTMLElement | null;
  if (!source) throw new Error("RECEIPT_NOT_FOUND");

  const lines = getReceiptText(source);
  if (!lines.length || !lines.join(" ").includes("PÁTIO ZAMBEZE")) throw new Error("RECEIPT_EMPTY");

  const widthMm = getReceiptWidthMm(source);
  const margin = 4;
  const contentWidth = widthMm - margin * 2;
  const fontSize = widthMm === 58 ? 8.2 : 9;
  const lineHeight = widthMm === 58 ? 3.9 : 4.2;
  const pdfLines: string[] = [];

  for (const line of lines) {
    const wrapped = new jsPDF({ unit: "mm" }).splitTextToSize(line, contentWidth);
    pdfLines.push(...(wrapped.length ? wrapped : [" "]));
  }

  const heightMm = Math.max(42, margin * 2 + pdfLines.length * lineHeight + 2);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [widthMm, heightMm], compress: true });
  pdf.setFont("courier", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(0, 0, 0);
  pdf.text(pdfLines, margin, margin + lineHeight, { baseline: "top", maxWidth: contentWidth });

  return pdf.output("blob");
}

export async function downloadReceiptPdf(selector: string, filename = "RECIBO.pdf") {
  const blob = await renderReceiptPdf(selector);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareReceiptPdf(selector: string, filename = "RECIBO.pdf") {
  const blob = await renderReceiptPdf(selector);
  const file = new File([blob], filename, { type: "application/pdf" });
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ files: [file], title: filename });
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function receiptPdfTextForTesting(element: { innerText?: string; textContent?: string | null }) {
  return (element.innerText || element.textContent || "").replace(/\u00a0/g, " ").split(/\r?\n/).map((line) => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean);
}
