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
