export function renderDistributionTab(deps) {
  deps.renderDistributionCommonInputs();
  deps.renderDistributionCommonSummary();
  deps.renderDistributionGroup("mainland");
  deps.renderDistributionGroup("world");
  deps.renderDistributionBossRules();
  deps.renderDistributionNameRules();
  deps.updateDistributionSubtabs();
}

export function updateDistributionSubtabs(state) {
  const activeKey = state.distribution.activeSubtab || "mainland";
  document.querySelectorAll(".newdist-subtab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.newdistTab === activeKey);
  });
  document.getElementById("newdistPanelMainland")?.classList.toggle("active", activeKey === "mainland");
  document.getElementById("newdistPanelWorld")?.classList.toggle("active", activeKey === "world");
}
