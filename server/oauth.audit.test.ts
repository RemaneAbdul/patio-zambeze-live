import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "_core/oauth.ts"), "utf8");

describe("OAuth authentication audit", () => {
  it("audits the persisted OAuth user after callback upsert", () => {
    expect(source).toContain("const persistedUser = await db.getUserByOpenId(userInfo.openId)");
    expect(source).toContain('action: "AUTH_LOGIN_SUCCESS"');
    expect(source).toContain("userId: persistedUser.id");
  });
});
