import { describe, expect, it } from "vitest";
import { persistSessionToken, sessionCookieKey, sessionStorageKey } from "./sessionToken";

describe("session token persistence", () => {
  it("persists a replacement token under the same table without reusing the previous history key", () => {
    const values = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => values.set(key, value) } as unknown as Storage;
    const documentRef = { cookie: "" } as Document;
    persistSessionToken("04", "new-token", storage, documentRef);
    expect(values.get(sessionStorageKey("04"))).toBe("new-token");
    expect(values.get(sessionStorageKey("03"))).toBeUndefined();
    expect(documentRef.cookie).toContain(`${sessionCookieKey("04")}=`);
  });
});
