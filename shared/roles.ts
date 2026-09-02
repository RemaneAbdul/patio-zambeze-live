export type AppRole = "admin" | "waiter" | "garcom" | "user";

export function isAdminRole(role: string | null | undefined) {
  return role === "admin";
}

const WAITER_ACCESS_CODE_PATTERN = /^\d{6}$/;

export function isWaiterRole(role: string | null | undefined, waiterCode?: string | null) {
  return role === "garcom" && WAITER_ACCESS_CODE_PATTERN.test(waiterCode ?? "");
}

export function isStaffRole(role: string | null | undefined, waiterCode?: string | null) {
  return isAdminRole(role) || isWaiterRole(role, waiterCode);
}

export function canUseWaiterPanel(role: string | null | undefined, waiterCode?: string | null, waiterActive?: number | null) {
  return isAdminRole(role) || (isWaiterRole(role, waiterCode) && waiterActive !== 0);
}

// Client shell guard: the access code is a login credential and must not be
// required or exposed after authentication. Server procedures remain the
// authoritative authorization boundary.
export function canUseStaffShell(role: string | null | undefined, waiterActive?: number | null) {
  return isAdminRole(role) || (role === "garcom" && waiterActive !== 0);
}
