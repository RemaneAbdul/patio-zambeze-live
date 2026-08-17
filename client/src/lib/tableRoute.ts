export function parseTableRoute(search: string) {
  const params = new URLSearchParams(search);
  const tableId = params.get("table")?.trim() || params.get("qr")?.trim() || "";
  const legacyNumber = params.get("mesa")?.trim();
  return {
    tableId: tableId || undefined,
    tableNumber: legacyNumber ? legacyNumber.padStart(2, "0") : "01",
  };
}
