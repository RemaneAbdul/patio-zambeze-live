import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "@shared/const";

vi.mock("./_core/sdk", () => ({
  sdk: { createSessionToken: vi.fn() },
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getActiveWaiterByAccessCode: vi.fn(),
    recordAuditLog: vi.fn(),
  };
});

import { appRouter } from "./routers";
import { getActiveWaiterByAccessCode } from "./db";
import { sdk } from "./_core/sdk";

const lookup = vi.mocked(getActiveWaiterByAccessCode);
const createSessionToken = vi.mocked(sdk.createSessionToken);

const waiter = {
  id: 77,
  openId: "supabase:waiter-77",
  name: "Garçom de Teste",
  email: "waiter@example.com",
  loginMethod: "supabase",
  role: "garcom",
  waiterCode: "123456",
  waiterActive: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createContext(ip: string) {
  return {
    req: { ip, protocol: "https", headers: {}, socket: { remoteAddress: ip } },
    res: { cookie: vi.fn(), clearCookie: vi.fn() },
    user: null,
  } as any;
}

describe("staff.quickLogin", () => {
  beforeEach(() => {
    lookup.mockReset();
    createSessionToken.mockReset();
    createSessionToken.mockResolvedValue("signed-session-token");
  });

  it("returns the same safe error for malformed and unknown codes", async () => {
    const malformed = appRouter.createCaller(createContext("10.10.0.1"));
    await expect(malformed.staff.quickLogin({ code: "GAR-123456" })).rejects.toThrow("Código de acesso incorreto.");

    lookup.mockResolvedValue(undefined);
    const unknown = appRouter.createCaller(createContext("10.10.0.2"));
    await expect(unknown.staff.quickLogin({ code: "654321" })).rejects.toThrow("Código de acesso incorreto.");
  });

  it("creates the existing signed panel cookie for an active waiter", async () => {
    lookup.mockResolvedValue(waiter as any);
    const context = createContext("10.10.0.3");
    const result = await appRouter.createCaller(context).staff.quickLogin({ code: "123456" });

    expect(result).toEqual({ success: true, role: "garcom" });
    expect(lookup).toHaveBeenCalledWith("123456");
    expect(createSessionToken).toHaveBeenCalledWith("supabase:waiter-77", expect.objectContaining({ name: "Garçom de Teste" }));
    expect(context.res.cookie).toHaveBeenCalledWith(COOKIE_NAME, "signed-session-token", expect.objectContaining({ httpOnly: true, maxAge: 12 * 60 * 60 * 1000 }));
  });
});
