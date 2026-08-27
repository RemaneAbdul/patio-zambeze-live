import { describe, expect, it } from "vitest";
import { clientNavigationHash, clientNavigationState, isClientNavigationState, parseClientNavigation } from "./clientNavigation";

describe("client menu navigation", () => {
  it("keeps the menu as the neutral base state", () => {
    expect(clientNavigationHash({ view: "menu" })).toBe("");
    expect(parseClientNavigation("")).toEqual({ view: "menu" });
  });

  it("round-trips a product name without changing the table query", () => {
    const hash = clientNavigationHash({ view: "product", productKey: "Frango grelhado & arroz" });
    expect(hash).toBe("#patio-view=product&product=Frango+grelhado+%26+arroz");
    expect(parseClientNavigation(hash)).toEqual({ view: "product", productKey: "Frango grelhado & arroz" });
  });

  it("represents selection, confirmation and history as distinct visual states", () => {
    expect(parseClientNavigation("#patio-view=selection")).toEqual({ view: "selection" });
    expect(parseClientNavigation("#patio-view=confirmation")).toEqual({ view: "confirmation" });
    expect(parseClientNavigation("#patio-view=history")).toEqual({ view: "history" });
  });

  it("stores a browser state marker and navigation depth", () => {
    const state = clientNavigationState({ view: "history" }, 3);
    expect(state).toMatchObject({ clientNavigation: true, clientNavigationDepth: 3, view: "history" });
    expect(isClientNavigationState(state)).toBe(true);
    expect(isClientNavigationState({ view: "history" })).toBe(false);
  });
});
