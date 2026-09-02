import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "@shared/const";

vi.mock("./quickWaiterLogin", () => ({
  quickWaiterLogin: vi.fn(),
}));

import { appRouter } from "./routers";
import { quickWaiterLogin } from "./quickWaiterLogin";

const login = vi.mocked(quickWaiterLogin);

function createContext(ip: string) {
  return {
    req: { ip, protocol: "https", headers: {}, socket: { remoteAddress: ip } },
    res: { cookie: vi.fn(), clearCookie: vi.fn() },
    user: null,
  } as any;
}

describe("staff.quickLogin", () => {
  beforeEach(() => login.mockReset());

  it("creates the existing signed panel cookie for an active waiter", async () => {
    login.mockResolvedValue({
      sessionToken: "signed-session-token",
      waiter: { id: 77, name: "Garçom de Teste", role: "garcom" },
    });
    const context = createContext("10.10.0.3");
    const result = await appRouter.createCaller(context).staff.quickLogin({ code: "123456" });

    expect(result.waiter).toMatchObject({ id: 77, role: "garcom" });
    expect(login).toHaveBeenCalledWith("123456", "10.10.0.3");
    expect(context.res.cookie).toHaveBeenCalledWith(COOKIE_NAME, "signed-session-token", expect.objectContaining({ httpOnly: true }));
  });
});
