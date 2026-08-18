export const allowedMenuImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxMenuImageBytes = 5 * 1024 * 1024;

export function menuProductFormIsValid(input: { name: string; categoryId: string; price: string }) {
  return Boolean(input.name.trim() && input.categoryId && input.price && Number(input.price.replace(",", ".")) >= 0);
}

export function menuImageIsAccepted(file: { type: string; size: number }) {
  return allowedMenuImageTypes.includes(file.type as (typeof allowedMenuImageTypes)[number]) && file.size <= maxMenuImageBytes;
}

export function nextMenuStatus(action: "activate" | "deactivate" | "remove") {
  return action === "activate" ? "ACTIVE" : action === "deactivate" ? "INACTIVE" : "REMOVED";
}
