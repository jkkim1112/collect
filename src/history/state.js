export function initializeHistoryState(state) {
  state.history = {
    filterDate: "",
    sortKey: "saved_desc",
    selectedId: null,
    items: [],
    detailCache: {},
    loadingDetailId: null
  };
}

export function getFilteredHistoryItems(state) {
  const filterDate = String(state.history.filterDate || "").trim();
  const sortKey = state.history.sortKey || "saved_desc";
  let items = [...(state.history.items || [])];

  if (filterDate) {
    items = items.filter((item) => item.startDate <= filterDate && item.endDate >= filterDate);
  }

  items.sort((left, right) => {
    if (sortKey === "saved_asc") return String(left.savedAt).localeCompare(String(right.savedAt));
    if (sortKey === "period_desc") return String(right.endDate).localeCompare(String(left.endDate));
    if (sortKey === "period_asc") return String(left.startDate).localeCompare(String(right.startDate));
    return String(right.savedAt).localeCompare(String(left.savedAt));
  });

  return items;
}

export function getSelectedHistoryDetail(state) {
  const selectedId = String(state.history?.selectedId || "").trim();
  if (!selectedId) return null;
  return state.history?.detailCache?.[selectedId] ?? null;
}

export function getSelectedHistoryItem(state) {
  const items = getFilteredHistoryItems(state);
  if (!state.history.selectedId) return null;
  return items.find((item) => item.id === state.history.selectedId) || null;
}
