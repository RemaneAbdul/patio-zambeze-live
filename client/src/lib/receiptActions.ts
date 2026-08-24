export function receiptSelectorFor(tableKey: string | undefined, receiptId: number) {
  return `#client-receipt-${tableKey || "mesa"}-order-${receiptId} .receipt-print`;
}

export function receiptFilenameFor(tableLabel: string | undefined, receiptId: number) {
  return `RECIBO-MESA-${tableLabel || "mesa"}-PEDIDO-${receiptId}.pdf`;
}

export function canExportReceipt(viewedAt: string | Date | null | undefined) {
  return Boolean(viewedAt);
}
