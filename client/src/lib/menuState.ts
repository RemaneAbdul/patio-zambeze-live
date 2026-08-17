export type FloatingBarStateInput = {
  historyCount: number;
  pendingUnits: number;
  showHistory: boolean;
  showSelection: boolean;
};

export function getFloatingBarVisibility(input: FloatingBarStateInput) {
  const panelOpen = input.showHistory || input.showSelection;
  return {
    showHistoryBar: !panelOpen && input.historyCount > 0,
    showSelectionBar: !panelOpen && input.pendingUnits > 0,
    historyAboveSelection: !panelOpen && input.historyCount > 0 && input.pendingUnits > 0,
  };
}
