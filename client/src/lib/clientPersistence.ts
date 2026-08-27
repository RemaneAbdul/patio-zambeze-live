import type { ClientNavigation } from "@/lib/clientNavigation";

export type PersistedClientContext = {
  version: 1;
  restaurantId: string;
  tableKey: string;
  sessionToken: string;
  selection: Record<string, number>;
  orderNotes: string;
  navigation: ClientNavigation;
  savedAt: number;
};

const MAX_NOTES_LENGTH = 1000;
const MAX_SELECTION_UNITS = 100;

export function clientContextStorageKey(restaurantId: string, tableKey: string) {
  return `patio-zambeze-client-context:v1:${encodeURIComponent(restaurantId)}:${encodeURIComponent(tableKey)}`;
}

export function normalizePersistedSelection(value: unknown, validProductNames: ReadonlySet<string>) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const next: Record<string, number> = {};
  let units = 0;
  for (const [name, quantity] of Object.entries(value)) {
    if (!validProductNames.has(name) || !Number.isInteger(quantity) || quantity < 1) continue;
    const accepted = Math.min(quantity, MAX_SELECTION_UNITS - units);
    if (accepted > 0) {
      next[name] = accepted;
      units += accepted;
    }
    if (units >= MAX_SELECTION_UNITS) break;
  }
  return next;
}

export function getPersistedSessionToken(raw: string | null, expected: { restaurantId: string; tableKey: string }) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedClientContext>;
    return parsed.version === 1 && parsed.restaurantId === expected.restaurantId && parsed.tableKey === expected.tableKey && typeof parsed.sessionToken === "string" && parsed.sessionToken.length >= 32 ? parsed.sessionToken : null;
  } catch {
    return null;
  }
}

export function parsePersistedClientContext(raw: string | null, expected: { restaurantId: string; tableKey: string; validProductNames: ReadonlySet<string> }) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedClientContext>;
    if (parsed.version !== 1 || parsed.restaurantId !== expected.restaurantId || parsed.tableKey !== expected.tableKey || typeof parsed.sessionToken !== "string" || parsed.sessionToken.length < 32) return null;
    const navigation = parsed.navigation && typeof parsed.navigation === "object" ? parsed.navigation : { view: "menu" as const };
    const validViews = new Set(["menu", "product", "selection", "confirmation", "history"]);
    const safeNavigation: ClientNavigation = validViews.has(navigation.view) ? {
      view: navigation.view,
      ...(typeof navigation.productKey === "string" && navigation.view === "product" ? { productKey: navigation.productKey } : {}),
    } : { view: "menu" };
    return {
      version: 1 as const,
      restaurantId: expected.restaurantId,
      tableKey: expected.tableKey,
      sessionToken: parsed.sessionToken,
      selection: normalizePersistedSelection(parsed.selection, expected.validProductNames),
      orderNotes: typeof parsed.orderNotes === "string" ? parsed.orderNotes.slice(0, MAX_NOTES_LENGTH) : "",
      navigation: safeNavigation,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    } satisfies PersistedClientContext;
  } catch {
    return null;
  }
}

export function serializeClientContext(context: Omit<PersistedClientContext, "version">) {
  return JSON.stringify({ version: 1, ...context });
}
