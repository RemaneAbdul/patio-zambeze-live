import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { assumeTableSession, closeTableSessionByStaff, createTableSelection, ensureTableSession, getDb, getStaffTables, getTableHistory, getTableHistoryForStaff, getTableSessionInfo, listTableQrCodes, markTableViewedByStaff, removeTableSelectionItem, upsertTableQrCode } from "./db";
import { tableQrCodes, tableSelectionItems, tableSelections, tableSessions } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

const ctx: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

describe("tableHistory validation", () => {
  it("rejects staff lookup for an anonymous customer", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tableHistory.staffLookup({ sessionToken: "a".repeat(64) })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects QR code management for an anonymous customer", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tableHistory.qrCodes()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.tableHistory.generateQrCode({ tableNumber: "04" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects staff lookup for a regular authenticated user", async () => {
    const caller = appRouter.createCaller({
      ...ctx,
      user: {
        id: 42,
        openId: "regular-user",
        email: "regular@example.com",
        name: "Regular User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });
    await expect(caller.tableHistory.staffLookup({ sessionToken: "a".repeat(64) })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects QR code management for a waiter", async () => {
    const caller = appRouter.createCaller({ ...ctx, user: { id: 42, openId: "waiter-user", email: "waiter@example.com", name: "Waiter User", loginMethod: "manus", role: "user", waiterCode: "GAR-TEST", waiterActive: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } });
    await expect(caller.tableHistory.qrCodes()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.tableHistory.generateQrCode({ tableNumber: "04" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a session token that is too short", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tableHistory.list({ sessionToken: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an empty confirmed selection before persistence", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tableHistory.addSelection({ sessionToken: "a".repeat(64), subtotal: 0, items: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

const integration = process.env.SUPABASE_DATABASE_URL ? describe : describe.skip;
integration("tableHistory persistence", () => {
  it("persists a selection, isolates sessions and exposes a read-only history view", async () => {
    const tokenA = `vitest-${crypto.randomUUID()}${crypto.randomUUID()}`;
    const tokenB = `vitest-${crypto.randomUUID()}${crypto.randomUUID()}`;
    let replacementToken = "";
    const db = await getDb();
    if (!db) throw new Error("SUPABASE_DATABASE_URL is required for this integration test");

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
      const historyB = await getTableHistory(tokenB, "02");
      const staffCaller = appRouter.createCaller({
        ...ctx,
        user: {
          id: 1,
          openId: "admin-user",
          email: "admin@example.com",
          name: "Admin User",
          loginMethod: "manus",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
      });
      const staffResult = await staffCaller.tableHistory.staffLookup({ sessionToken: tokenA });

      expect(created.selectionNumber).toBe(1);
      expect(historyA).toHaveLength(1);
      expect(historyA[0]?.subtotal).toBe(600);
      expect(historyA[0]?.items).toEqual([expect.objectContaining({ productName: "Frango Grelhado", quantity: 2, unitPrice: 300, subtotal: 600 })]);
      expect(historyB).toHaveLength(0);
      expect(typeof historyA[0]?.createdAt).toBe("object");
      expect(staffResult?.session.sessionToken).toBe(tokenA);
      const concurrentClaims = await Promise.allSettled([assumeTableSession(tokenA, 1), assumeTableSession(tokenA, 2)]);
      expect(concurrentClaims.filter((claim) => claim.status === "fulfilled")).toHaveLength(1);
      expect(concurrentClaims.filter((claim) => claim.status === "rejected").map((claim) => claim.reason?.message)).toContain("TABLE_ALREADY_ASSIGNED");
      expect(staffResult?.session.waiterId).toBe(1);
      expect(staffResult?.selections[0]?.items[0]).toEqual(expect.objectContaining({ productName: "Frango Grelhado", quantity: 2, unitPrice: 300, subtotal: 600 }));
      const beforeViewed = await getStaffTables();
      expect(beforeViewed.find((table) => table.sessionToken === tokenA)?.statusLabel).toBe("new");
      await markTableViewedByStaff(tokenA, 1);
      const afterViewed = await getStaffTables();
      expect(afterViewed.find((table) => table.sessionToken === tokenA)?.statusLabel).toBe("viewed");
      const nextOrder = await createTableSelection({ sessionToken: tokenA, tableNumber: "01", subtotal: 80, items: [{ productName: "Coca-Cola", quantity: 1, unitPrice: 80 }] });
      expect(nextOrder.selectionNumber).toBe(2);
      const separatedHistory = await getTableHistoryForStaff(tokenA);
      expect(separatedHistory?.selections).toHaveLength(2);
      expect(separatedHistory?.selections.find((selection) => selection.selectionNumber === 1)?.subtotal).toBe(600);
      expect(separatedHistory?.selections.find((selection) => selection.selectionNumber === 2)?.subtotal).toBe(80);
      const viewedHistory = await getTableHistoryForStaff(tokenA);
      expect(viewedHistory?.session.waiterId).toBe(1);
      expect((await closeTableSessionByStaff(tokenA)).success).toBe(true);
      const closedHistory = await getTableHistoryForStaff(tokenA);
      expect(closedHistory?.session.status).toBe("closed");
      expect(closedHistory?.selections).toHaveLength(2);
      const replacement = await createTableSelection({ sessionToken: tokenA, tableNumber: "04", subtotal: 80, items: [{ productName: "Coca-Cola", quantity: 1, unitPrice: 80 }] });
      replacementToken = replacement.sessionToken;
      expect(replacementToken).not.toBe(tokenA);
      expect(replacement.selectionNumber).toBe(1);
      const newHistory = await getTableHistoryForStaff(replacementToken);
      expect(newHistory?.session.tableNumber).toBe("04");
      expect(newHistory?.selections).toHaveLength(1);
      expect(newHistory?.selections[0]?.items[0]?.productName).toBe("Coca-Cola");
      expect((await getTableHistoryForStaff(tokenA))?.selections).toHaveLength(2);
    } finally {
      const sessionA = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, tokenA)).limit(1);
      const sessionB = await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, tokenB)).limit(1);
      const sessionC = replacementToken ? await db.select().from(tableSessions).where(eq(tableSessions.sessionToken, replacementToken)).limit(1) : [];
      const sessionIds = [...sessionA, ...sessionB, ...sessionC].map((session) => session.id);
      for (const sessionId of sessionIds) {
        const selections = await db.select().from(tableSelections).where(eq(tableSelections.sessionId, sessionId));
        for (const selection of selections) await db.delete(tableSelectionItems).where(eq(tableSelectionItems.selectionId, selection.id));
        await db.delete(tableSelections).where(eq(tableSelections.sessionId, sessionId));
        await db.delete(tableSessions).where(eq(tableSessions.id, sessionId));
      }
    }
  }, 30_000);

  it("removes an open item, recalculates subtotal and blocks removal after viewed", async () => {
    const token = `vitest-remove-${crypto.randomUUID()}${crypto.randomUUID()}`;
    const db = await getDb();
    if (!db) throw new Error("SUPABASE_DATABASE_URL is required for this integration test");
    try {
      const created = await createTableSelection({ sessionToken: token, tableNumber: "06", subtotal: 450, items: [{ productName: "Frango", quantity: 1, unitPrice: 300 }, { productName: "Batata", quantity: 1, unitPrice: 150 }] });
      await assumeTableSession(token, 1);
      const staff = await getTableHistoryForStaff(token, 1, true);
      const itemToRemove = staff?.selections.find((selection) => selection.id === created.id)?.items.find((item) => item.productName === "Batata");
      expect(itemToRemove).toBeDefined();
      await expect(removeTableSelectionItem(itemToRemove!.id, 1, true)).resolves.toMatchObject({ success: true, subtotal: 300 });
      const afterRemoval = await getTableHistoryForStaff(token, 1, true);
      expect(afterRemoval?.selections[0]?.subtotal).toBe(300);
      expect(afterRemoval?.selections[0]?.items).toHaveLength(1);
      await markTableViewedByStaff(token, 1, true);
      await expect(removeTableSelectionItem(afterRemoval!.selections[0]!.items[0]!.id, 1, true)).rejects.toThrow("SELECTION_ALREADY_VIEWED");
    } finally {
      const session = await db.select({ id: tableSessions.id }).from(tableSessions).where(eq(tableSessions.sessionToken, token)).limit(1);
      if (session[0]) {
        const selections = await db.select({ id: tableSelections.id }).from(tableSelections).where(eq(tableSelections.sessionId, session[0].id));
        for (const selection of selections) await db.delete(tableSelectionItems).where(eq(tableSelectionItems.selectionId, selection.id));
        await db.delete(tableSelections).where(eq(tableSelections.sessionId, session[0].id));
        await db.delete(tableSessions).where(eq(tableSessions.id, session[0].id));
      }
    }
  }, 30_000);
});


(process.env.SUPABASE_DATABASE_URL ? describe : describe.skip)("qr code persistence", () => {
  it("creates one permanent QR code per table without replacing its token", async () => {
    const db = await getDb();
    if (!db) return;
    const tableNumber = `TEST-${crypto.randomUUID().slice(0, 20)}`;
    try {
      const first = await upsertTableQrCode(tableNumber);
      const second = await upsertTableQrCode(tableNumber);
      expect(first.id).toBe(second.id);
      expect(second.qrToken).toBe(first.qrToken);
      expect((await listTableQrCodes()).some((code) => code.tableNumber === tableNumber)).toBe(true);
      const sessionToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const sessionInfo = await getTableSessionInfo(sessionToken, "01", second.qrToken);
      expect(sessionInfo.session.tableNumber).toBe(tableNumber);
      await expect(getTableSessionInfo(`${crypto.randomUUID()}${crypto.randomUUID()}`, "01", "invalid-qr-token")).rejects.toThrow("TABLE_NOT_FOUND");
      const staffTable = (await getStaffTables()).find((table) => table.tableNumber === tableNumber);
      expect(staffTable).toEqual(expect.objectContaining({ tableNumber, statusLabel: "empty", selectionCount: 0 }));
    } finally {
      const created = await db.select({ id: tableQrCodes.id }).from(tableQrCodes).where(eq(tableQrCodes.tableNumber, tableNumber)).limit(1);
      await db.delete(tableSessions).where(eq(tableSessions.tableNumber, tableNumber));
      if (created[0]) await db.delete(tableQrCodes).where(eq(tableQrCodes.id, created[0].id));
    }
  });
});
