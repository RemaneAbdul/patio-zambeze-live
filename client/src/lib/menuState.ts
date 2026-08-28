export type FloatingBarStateInput = {
  historyCount: number;
  pendingUnits: number;
  showHistory: boolean;
  showSelection: boolean;
  showConfirmation?: boolean;
};

export function getFloatingBarVisibility(input: FloatingBarStateInput) {
  const panelOpen = input.showHistory || input.showSelection || Boolean(input.showConfirmation);
  const hasHistory = input.historyCount > 0;
  const hasSelection = input.pendingUnits > 0;

  return {
    showHistoryBar: !panelOpen && hasHistory,
    showSelectionBar: !panelOpen && hasSelection,
    historyAboveSelection: !panelOpen && hasHistory && hasSelection,
  };
}
