export function bindNewDistributionUi(state, deps) {
  const root = document.querySelector(".newdist-root");
  if (!root) return;

  root.addEventListener("click", deps.handleDistributionClick);
  root.addEventListener("input", deps.handleDistributionInput);
  root.addEventListener("change", deps.handleDistributionChange);

  document.getElementById("newdistResetBtn")?.addEventListener("click", deps.handleDistributionReset);
  document.getElementById("newdistLoadBtn")?.addEventListener("click", deps.handleDistributionLoadExcel);
  document.getElementById("newdistOpenBossManageBtn")?.addEventListener("click", () => deps.openDistributionModal("newdistBossManageModal"));
  document.getElementById("newdistOpenNameRuleBtn")?.addEventListener("click", () => deps.openDistributionModal("newdistNameRuleModal"));
  document.getElementById("newdistBossAddBtn")?.addEventListener("click", deps.handleDistributionAddBossRule);
  document.getElementById("newdistBossSaveBtn")?.addEventListener("click", deps.handleDistributionSaveBossRules);
  document.getElementById("newdistNameRuleAddBtn")?.addEventListener("click", deps.handleDistributionAddNameRule);
  document.getElementById("newdistNameRuleSaveBtn")?.addEventListener("click", deps.handleDistributionSaveNameRules);
  document.getElementById("newdistLogEditApplyBtn")?.addEventListener("click", deps.handleDistributionApplyLogEdit);
  bindDistributionButtonIds(["distributionSaveBtn", "distributionExportBtn", "newdistExportBtn"], deps.handleDistributionExport);
  bindDistributionButtonIds(["distributionFinalSaveBtn", "newdistFinalSaveBtn"], deps.handleDistributionFinalSave);

  ["mainland", "world"].forEach((groupKey) => {
    const upper = groupKey === "mainland" ? "Mainland" : "World";
    document.getElementById(`newdist${upper}AddDeductionBtn`)?.addEventListener("click", () => deps.handleDistributionAddDeduction(groupKey));
    document.getElementById(`newdist${upper}ApplyDeductionBtn`)?.addEventListener("click", () => deps.handleDistributionApplyDeductions(groupKey));
    document.getElementById(`newdist${upper}RefreshBtn`)?.addEventListener("click", () => deps.handleDistributionRefreshGroup(groupKey));
    document.getElementById(`newdist${upper}CalcBtn`)?.addEventListener("click", () => deps.handleDistributionCalculate(groupKey));
    document.getElementById(`newdist${upper}ClearBtn`)?.addEventListener("click", () => deps.handleDistributionClearResults(groupKey));
  });

  root.querySelectorAll(".newdist-subtab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.distribution.activeSubtab = tab.dataset.newdistTab || "mainland";
      deps.updateDistributionSubtabs();
    });
  });

  root.querySelectorAll("[data-newdist-close]").forEach((button) => {
    button.addEventListener("click", () => deps.closeDistributionModal(button.dataset.newdistClose));
  });

  deps.updateDistributionSubtabs();
}

function bindDistributionButtonIds(ids, handler) {
  ids.forEach((id) => {
    const button = document.getElementById(id);
    if (!button || button.dataset.distributionBound === "true") return;
    button.dataset.distributionBound = "true";
    button.addEventListener("click", handler);
  });
}

export function initializeDistributionState(state, deps) {
  state.distribution = {
    activeSubtab: "mainland",
    totalDiamond: 0,
    mainlandRatio: 70,
    worldRatio: 30,
    workbookName: "",
    rawLogs: [],
    loadedLogs: [],
    unknownBosses: [],
    bossRules: [],
    nameRules: [],
    editingLogKey: null,
    bossRulesLoaded: false,
    bossRuleDbIds: [],
    mainland: deps.createDistributionGroupState("mainland"),
    world: deps.createDistributionGroupState("world")
  };
}

export function createDistributionGroupState(type, createDistributionSummary) {
  return {
    type,
    deductions: [],
    appliedDeductions: [],
    logs: [],
    results: [],
    summary: createDistributionSummary(),
    dirtyLogs: false
  };
}

export function createDistributionSummary() {
  return {
    assignedDiamond: 0,
    deductionTotal: 0,
    actualDiamond: 0,
    totalPoints: 0,
    perPoint: 0,
    remainingDiamond: 0
  };
}

export function createDistributionDeduction(createDistributionId, name = "", mode = "percent", value = "") {
  return {
    id: createDistributionId("ded"),
    name,
    mode,
    value: value === "" ? "" : Number(value)
  };
}

export function createBossRule(createDistributionId, name = "", score = 1, group = "mainland") {
  const parsedScore = Math.floor(Number(score));
  return {
    id: createDistributionId("boss"),
    name,
    score: Number.isFinite(parsedScore) && parsedScore >= 0 ? parsedScore : 1,
    group
  };
}

export function createNameRule(createDistributionId, source = "", target = "") {
  return {
    id: createDistributionId("name"),
    source,
    target
  };
}

export function createDistributionId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function getDistributionAssignedAmounts(state) {
  const totalDiamond = Math.max(0, Math.floor(Number(state.distribution.totalDiamond) || 0));
  let mainlandRatio = Number(state.distribution.mainlandRatio);
  let worldRatio = Number(state.distribution.worldRatio);

  if (!Number.isFinite(mainlandRatio)) mainlandRatio = 0;
  if (!Number.isFinite(worldRatio)) worldRatio = 0;

  mainlandRatio = Math.min(100, Math.max(0, mainlandRatio));
  worldRatio = Math.min(100, Math.max(0, worldRatio));

  const totalRatio = mainlandRatio + worldRatio;
  if (totalRatio <= 0) {
    return { mainland: 0, world: 0 };
  }

  const mainland = Math.floor(totalDiamond * (mainlandRatio / totalRatio));
  const world = Math.max(0, totalDiamond - mainland);
  return { mainland, world };
}

export function getDistributionDeductionAmount(state, groupKey, row) {
  const assigned = getDistributionAssignedAmounts(state)[groupKey];
  const value = Number(row.value);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (row.mode === "amount") return Math.floor(value);
  return Math.floor(assigned * (value / 100));
}

export function normalizeDistributionName(value) {
  return String(value ?? "").trim().replace(/\s+/g, "").toLowerCase();
}
