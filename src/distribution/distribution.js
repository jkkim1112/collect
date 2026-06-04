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

export function getDistributionPeriodRange(state) {
  const dates = state.distribution.loadedLogs
    .map((log) => String(log.dateText || "").trim())
    .filter(Boolean)
    .sort();

  if (!dates.length) {
    return { startDate: "", endDate: "" };
  }

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1]
  };
}

export function getDistributionCombinedResults(state) {
  const resultMap = new Map();
  const memberMap = new Map(state.members.map((member) => [normalizeDistributionName(member.name), member]));

  ["mainland", "world"].forEach((groupKey) => {
    state.distribution[groupKey].results.forEach((row) => {
      const key = normalizeDistributionName(row.memberName);
      const current = resultMap.get(key) || {
        memberId: memberMap.get(key)?.id ?? null,
        memberName: memberMap.get(key)?.name || row.memberName,
        points: 0,
        rawDiamond: 0,
        finalDiamond: 0,
        note: row.note || "",
        isRetired: row.note === "탈퇴한 길드원"
      };

      current.points += Number(row.points ?? 0);
      current.rawDiamond += Number(row.rawDiamond ?? 0);
      current.finalDiamond += Number(row.finalDiamond ?? 0);
      if (row.note === "탈퇴한 길드원") {
        current.note = "탈퇴한 길드원";
        current.isRetired = true;
      }

      resultMap.set(key, current);
    });
  });

  const activeTotalPoints = Array.from(resultMap.values())
    .filter((row) => !row.isRetired)
    .reduce((sum, row) => sum + row.points, 0);

  return Array.from(resultMap.values())
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      return String(left.memberName).localeCompare(String(right.memberName), "ko");
    })
    .map((row) => ({
      ...row,
      ratio: !row.isRetired && activeTotalPoints > 0 ? row.points / activeTotalPoints : 0
    }));
}

export function getDistributionCombinedSummary(state, createDistributionSummary) {
  const mainlandSummary = state.distribution.mainland.summary || createDistributionSummary();
  const worldSummary = state.distribution.world.summary || createDistributionSummary();
  const totalPoints = Number(mainlandSummary.totalPoints ?? 0) + Number(worldSummary.totalPoints ?? 0);
  const actualDiamond = Number(mainlandSummary.actualDiamond ?? 0) + Number(worldSummary.actualDiamond ?? 0);
  const remainingDiamond = Number(mainlandSummary.remainingDiamond ?? 0) + Number(worldSummary.remainingDiamond ?? 0);

  return {
    actualDiamond,
    totalPoints,
    diamondPerPoint: totalPoints > 0 ? actualDiamond / totalPoints : 0,
    remainingDiamond
  };
}

export function normalizeDistributionName(value) {
  return String(value ?? "").trim().replace(/\s+/g, "").toLowerCase();
}
