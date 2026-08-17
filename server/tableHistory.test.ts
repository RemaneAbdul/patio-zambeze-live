import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { createTableSelection, ensureTableSession, getDb, getTableHistory } from "./db";
import { tableSelectionItems, tableSelections, tableSessions } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

const ctx: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

describe("tableHistory validation", () => {
  it("rejects a session token that is too short", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tableHistory.list({ sessionToken: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an empty confirmed selection before persistence", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tableHistory.addSelection({ sessionToken: "a".repeat(64), subtotal: 0, items: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

const integration = process.env.DATABASE_URL ? describe : describe.skip;
integration("tableHistory persistence", () => {
  it("persists a selection, isolates sessions and exposes a read-only history view", async () => {
    const tokenA = `vitest-${crypto.randomUUID()}${crypto.randomUUID()}`;
    const tokenB = `vitest-${crypto.randomUUID()}${crypto.randomUUID()}`;
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is required for this integration test");

    try {
      const [firstSession, secondSession] = await Promise.all([
        ensureTableSession(tokenA),
        ensureTableSession(tokenA),
      ]);
      expect(secondSession.id).toBe(firstSession.id);

      const created = await createTableSelection({
        sessionToken: tokenA,
        subtotal: 600,
        items: [{ productName: "Frango Grelhado", quantity: 2, unitPrice: 300 }],
      });
      const historyA = await getTableHistory(tokenA);
      const historyB = await getTableHistory(tokenB);

      expect(created.selectionNumber).toBe(1);
      expect(historyA).toHaveLength(1);
      expect(historyA[0]?.subtotal).toBe(600);
      expect(historyA[0]?.items).toEqual([expect.objectContaining({ productName: "Frango Grelhado", quantity: 2, unitPrice: 300, subtotal: 600 })]);
      expect(historyB).toHaveLength(0);
      expect(typeof historyA[0]?.createdAt).toBe("object");
    } finally {
      const sessionA = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, tokenA)).limit(1);
      const sessionB = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, tokenB)).limit(1);
      const sessionIds = [...sessionA, ...sessionB].map((session) => session.id);
      if (sessionIds.length) {
        const selections = await db.select().from(tableSelections).where(eq(tableSelections.sessionId, sessionIds[0]!));
        for (const selection of selections) await db.delete(tableSelectionItems).where(eq(tableSelectionItems.selectionId, selection.id));
        for (const sessionId of sessionIds) await db.delete(tableSelections).where(eq(tableSelections.sessionId, sessionId));
        for (const sessionId of sessionIds) await db.delete(tableSessions).where(eq(tableSessions.id, sessionId));
      }
    }
  });
});
