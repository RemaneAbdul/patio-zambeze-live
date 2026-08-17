import { describe, expect, it } from "vitest";
import { getFloatingBarVisibility } from "./menuState";

describe("floating menu bars", () => {
  it("hides both bars when there is no history or pending selection", () => {
    expect(getFloatingBarVisibility({ historyCount: 0, pendingUnits: 0, showHistory: false, showSelection: false })).toEqual({ showHistoryBar: false, showSelectionBar: false, historyAboveSelection: false });
  });

  it("shows both bars separately when history exists and new items are pending", () => {
    expect(getFloatingBarVisibility({ historyCount: 1, pendingUnits: 2, showHistory: false, showSelection: false })).toEqual({ showHistoryBar: true, showSelectionBar: true, historyAboveSelection: true });
  });

  it("hides every fixed bar while either panel is open", () => {
    expect(getFloatingBarVisibility({ historyCount: 2, pendingUnits: 1, showHistory: true, showSelection: false })).toEqual({ showHistoryBar: false, showSelectionBar: false, historyAboveSelection: false });
    expect(getFloatingBarVisibility({ historyCount: 2, pendingUnits: 1, showHistory: false, showSelection: true })).toEqual({ showHistoryBar: false, showSelectionBar: false, historyAboveSelection: false });
  });
});
