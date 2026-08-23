export type AppRole = "admin" | "waiter" | "garcom" | "user";

export function isAdminRole(role: string | null | undefined) {
  return role === "admin";
}

export function isWaiterRole(role: string | null | undefined, waiterCode?: string | null) {
  return role === "waiter" || role === "garcom" || (role === "user" && Boolean(waiterCode));
}

export function isStaffRole(role: string | null | undefined, waiterCode?: string | null) {
  return isAdminRole(role) || isWaiterRole(role, waiterCode);
}

export function canUseWaiterPanel(role: string | null | undefined, waiterCode?: string | null, waiterActive?: number | null) {
  return isAdminRole(role) || (isWaiterRole(role, waiterCode) && waiterActive !== 0);
}
