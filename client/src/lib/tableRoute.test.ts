import { describe, expect, it } from "vitest";
import { parseTableRoute } from "./tableRoute";

describe("table route", () => {
  it("uses the stable QR table id", () => {
    expect(parseTableRoute("?table=A8F21")).toEqual({ tableId: "A8F21", tableNumber: "01" });
  });

  it("keeps legacy human table numbers compatible", () => {
    expect(parseTableRoute("?mesa=4")).toEqual({ tableId: undefined, tableNumber: "04" });
  });
});
