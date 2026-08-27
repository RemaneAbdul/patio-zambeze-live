import { describe, expect, it } from "vitest";
import { clientContextStorageKey, getPersistedSessionToken, normalizePersistedSelection, parsePersistedClientContext, serializeClientContext } from "@/lib/clientPersistence";

const token = "a".repeat(64);
const validNames = new Set(["Frango", "Sumo"]);

function context(overrides: Partial<Parameters<typeof serializeClientContext>[0]> = {}) {
  return {
    restaurantId: "default",
    tableKey: "qr-table-05",
    sessionToken: token,
    selection: { Frango: 1, Sumo: 2 },
    orderNotes: "Pouco sal",
    navigation: { view: "selection" as const },
    savedAt: 100,
    ...overrides,
  };
}

describe("clientPersistence", () => {
  it("creates a storage key isolated by restaurant and table", () => {
    expect(clientContextStorageKey("default", "qr-table-05")).not.toBe(clientContextStorageKey("default", "qr-table-08"));
    expect(clientContextStorageKey("restaurant-b", "qr-table-05")).not.toBe(clientContextStorageKey("default", "qr-table-05"));
  });

  it("restores only a valid context for the expected table and token", () => {
    const raw = serializeClientContext(context());
    expect(getPersistedSessionToken(raw, { restaurantId: "default", tableKey: "qr-table-05" })).toBe(token);
    expect(getPersistedSessionToken(raw, { restaurantId: "default", tableKey: "qr-table-08" })).toBeNull();
    expect(parsePersistedClientContext(raw, { restaurantId: "default", tableKey: "qr-table-05", validProductNames: validNames })?.selection).toEqual({ Frango: 1, Sumo: 2 });
  });

  it("drops unknown products and invalid quantities without mixing cart data", () => {
    const selection = normalizePersistedSelection({ Frango: 1, Sumo: 2, "Outra mesa": 4, Mau: -1, Texto: "2" }, validNames);
    expect(selection).toEqual({ Frango: 1, Sumo: 2 });
  });

  it("does not restore malformed, wrong-version or wrong-restaurant data", () => {
    expect(parsePersistedClientContext("not-json", { restaurantId: "default", tableKey: "qr-table-05", validProductNames: validNames })).toBeNull();
    expect(parsePersistedClientContext(serializeClientContext(context({ restaurantId: "other" })), { restaurantId: "default", tableKey: "qr-table-05", validProductNames: validNames })).toBeNull();
    expect(parsePersistedClientContext(JSON.stringify({ ...context(), version: 2 }), { restaurantId: "default", tableKey: "qr-table-05", validProductNames: validNames })).toBeNull();
  });

  it("keeps a closed-session replacement separate from the previous token", () => {
    const oldRaw = serializeClientContext(context());
    const replacement = "b".repeat(64);
    expect(getPersistedSessionToken(oldRaw, { restaurantId: "default", tableKey: "qr-table-05" })).not.toBe(replacement);
  });
});
