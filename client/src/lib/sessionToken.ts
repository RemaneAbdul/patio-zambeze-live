export function sessionStorageKey(tableNumber: string) {
  return `patio-zambeze-session-token-${tableNumber}`;
}

export function sessionCookieKey(tableNumber: string) {
  return `patio_zambeze_session_${tableNumber}`;
}

export function persistSessionToken(tableNumber: string, token: string, storage: Storage = window.localStorage, documentRef: Document = document) {
  storage.setItem(sessionStorageKey(tableNumber), token);
  documentRef.cookie = `${sessionCookieKey(tableNumber)}=${token}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
