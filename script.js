import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mgmvyapblwiwjaytkgwl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fzA0-8AjS9D1xtXLkgdo1Q_iCY-dYJV";
const ADMIN_PASSWORD = "1590";
const ACCESSORY_PARTS = [
  { key: "necklace_count", label: "목걸이" },
  { key: "earring_count", label: "귀걸이" },
  { key: "ring_count", label: "반지" },
  { key: "bracelet_count", label: "팔찌" },
  { key: "belt_count", label: "허리띠" }
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  activeTab: "power",
  distribution: null,
  history: null,
  pendingManageType: null,
  pendingEditMemberId: null,
  members: [],
  mountItems: [],
  memberMounts: [],
  bossItems: [],
  memberBossCollections: [],
  accessoryGroups: [],
  memberAccessories: [],
  searchTerm: "",
  bossSearchTerm: "",
  selectedMemberId: null,
  rowEditMemberId: null,
  draftMemberId: null,
  draftTab: null,
  draftPower: "",
  draftOwnedMap: {},
  draftAccessoryMap: {},
  draftAllRows: {},
  overallEditMode: false,
  powerSortDirection: "desc",
  updatedAtSortDirection: null,
  hiddenAccessoryGroupIds: {},
  isBulkSaving: false,
  bulkSaveProgress: 0,
  importPreview: null
};

const el = {};

document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  bindEvents();
  initializeDistributionState();
  initializeHistoryState();
  bindNewDistributionUi();
  updateTabUi();
  await loadActiveTabData();
  renderAll();
});

function bindElements() {
  el.tabs = Array.from(document.querySelectorAll(".tab"));
  el.guildManageBtn = document.getElementById("guildManageBtn");
  el.bulkEditBtn = document.getElementById("bulkEditBtn");
  el.bulkSaveBtn = document.getElementById("bulkSaveBtn");
  el.bulkCancelBtn = document.getElementById("bulkCancelBtn");
  el.itemManageBtn = document.getElementById("itemManageBtn");
  el.importOpenBtn = document.getElementById("importOpenBtn");
  el.tableGuideText = document.getElementById("tableGuideText");
  el.searchInput = document.getElementById("searchInput");
  el.bossSearchInput = document.getElementById("bossSearchInput");
  el.searchBtn = document.getElementById("searchBtn");
  el.resetBtn = document.getElementById("resetBtn");
  el.summaryTableHead = document.getElementById("summaryTableHead");
  el.summaryTableBody = document.getElementById("summaryTableBody");

  el.searchSelectModalBackdrop = document.getElementById("searchSelectModalBackdrop");
  el.searchSelectGuideText = document.getElementById("searchSelectGuideText");
  el.searchSelectList = document.getElementById("searchSelectList");
  el.searchSelectCloseBtn = document.getElementById("searchSelectCloseBtn");
  el.searchSelectCancelBtn = document.getElementById("searchSelectCancelBtn");

  el.passwordModalBackdrop = document.getElementById("passwordModalBackdrop");
  el.passwordInput = document.getElementById("passwordInput");
  el.passwordErrorText = document.getElementById("passwordErrorText");
  el.passwordCancelBtn = document.getElementById("passwordCancelBtn");
  el.passwordConfirmBtn = document.getElementById("passwordConfirmBtn");

  el.guildManageModalBackdrop = document.getElementById("guildManageModalBackdrop");
  el.guildManageTableBody = document.getElementById("guildManageTableBody");
  el.addMemberBtn = document.getElementById("addMemberBtn");
  el.guildManageCloseBtn = document.getElementById("guildManageCloseBtn");

  el.itemManageModalBackdrop = document.getElementById("itemManageModalBackdrop");
  el.itemManageTitle = document.getElementById("itemManageTitle");
  el.itemNameHeader = document.getElementById("itemNameHeader");
  el.itemMaxHeader = document.getElementById("itemMaxHeader");
  el.itemManageTableBody = document.getElementById("itemManageTableBody");
  el.addItemBtn = document.getElementById("addItemBtn");
  el.itemManageCloseBtn = document.getElementById("itemManageCloseBtn");
  el.importModalBackdrop = document.getElementById("importModalBackdrop");
  el.importModalTitle = document.getElementById("importModalTitle");
  el.importModalGuideText = document.getElementById("importModalGuideText");
  el.importTextarea = document.getElementById("importTextarea");
  el.importPreviewBox = document.getElementById("importPreviewBox");
  el.importCancelBtn = document.getElementById("importCancelBtn");
  el.importPreviewBtn = document.getElementById("importPreviewBtn");
  el.importApplyBtn = document.getElementById("importApplyBtn");
  el.importCloseBtn = document.getElementById("importCloseBtn");
  el.mainCard = document.getElementById("mainCard");
  el.mainCardTitle = document.getElementById("mainCardTitle");
  el.mainActions = document.getElementById("mainActions");
  el.mainTableSearch = document.getElementById("mainTableSearch");
  el.summaryTableWrap = document.getElementById("summaryTableWrap");
  el.distributionContent = document.getElementById("distributionContent");
  el.historyContent = document.getElementById("historyContent");
  el.historyHeaderActions = document.getElementById("historyHeaderActions");
  el.historyDeleteBtn = document.getElementById("historyDeleteBtn");
  el.historyExportBtn = document.getElementById("historyExportBtn");
  el.historyDateInput = document.getElementById("historyDateInput");
  el.historySortSelect = document.getElementById("historySortSelect");
  el.historySearchBtn = document.getElementById("historySearchBtn");
  el.historyListTableHead = document.getElementById("historyListTableHead");
  el.historyListTableBody = document.getElementById("historyListTableBody");
  el.historyMemberTableHead = document.getElementById("historyMemberTableHead");
  el.historyMemberTableBody = document.getElementById("historyMemberTableBody");
  el.historyLogTableHead = document.getElementById("historyLogTableHead");
  el.historyLogTableBody = document.getElementById("historyLogTableBody");
  el.historySummaryPeriod = document.getElementById("historySummaryPeriod");
  el.historySummaryActualDiamond = document.getElementById("historySummaryActualDiamond");
  el.historySummaryTotalPoints = document.getElementById("historySummaryTotalPoints");
  el.historySummaryPerPoint = document.getElementById("historySummaryPerPoint");
  el.historySummaryRemaining = document.getElementById("historySummaryRemaining");
  el.historySavedAt = document.getElementById("historySavedAt");
  el.historyTotalDiamond = document.getElementById("historyTotalDiamond");
  el.historyGuildFeePercent = document.getElementById("historyGuildFeePercent");
  el.historyGuildMasterPercent = document.getElementById("historyGuildMasterPercent");
  el.historyManagerPercent = document.getElementById("historyManagerPercent");
  el.bulkSaveOverlay = document.getElementById("bulkSaveOverlay");
  el.bulkSavePercent = document.getElementById("bulkSavePercent");
  el.bulkSaveBarFill = document.getElementById("bulkSaveBarFill");
}

function bindEvents() {
  el.tabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      const nextTab = tab.dataset.tab;
      if (nextTab === state.activeTab) return;

      state.activeTab = nextTab;
      resetOverallEditMode();
      updateTabUi();

      if (nextTab === "distribution") {
        renderAll();
        return;
      }

      if (nextTab === "history") {
        await loadHistoryData();
        renderAll();
        return;
      }

      await loadActiveTabData();
      renderAll();
    });
  });

  el.searchBtn.addEventListener("click", handleSearch);
  el.resetBtn.addEventListener("click", handleResetSearch);

  el.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  });

  el.bossSearchInput.addEventListener("input", handleBossSearchInput);
  el.bossSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleBossSearchInput();
    }
  });

  el.searchSelectCloseBtn.addEventListener("click", closeSearchSelectModal);
  el.searchSelectCancelBtn.addEventListener("click", closeSearchSelectModal);
  el.searchSelectList.addEventListener("click", handleSearchSelectClick);

  el.summaryTableHead.addEventListener("click", handleSummaryTableHeadClick);
  el.summaryTableBody.addEventListener("click", handleSummaryTableClick);
  el.summaryTableBody.addEventListener("input", handleSummaryTableInput);
  el.historyListTableBody?.addEventListener("click", handleHistoryListClick);

  el.guildManageBtn.addEventListener("click", () => openPasswordModal("guild"));
  el.bulkEditBtn.addEventListener("click", handleBulkEditButtonClick);
  el.bulkSaveBtn.addEventListener("click", handleBulkSaveButtonClick);
  el.bulkCancelBtn.addEventListener("click", handleBulkCancelButtonClick);
  el.itemManageBtn.addEventListener("click", () => openPasswordModal("item"));
  el.importOpenBtn.addEventListener("click", () => openPasswordModal("import"));

  el.passwordCancelBtn.addEventListener("click", closePasswordModal);
  el.passwordConfirmBtn.addEventListener("click", confirmPassword);
  el.passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmPassword();
    }
  });

  el.guildManageCloseBtn.addEventListener("click", () => closeModal(el.guildManageModalBackdrop));
  el.itemManageCloseBtn.addEventListener("click", () => closeModal(el.itemManageModalBackdrop));
  el.importCloseBtn.addEventListener("click", closeImportModal);
  el.importCancelBtn.addEventListener("click", closeImportModal);
  el.importPreviewBtn.addEventListener("click", handleImportPreview);
  el.importApplyBtn.addEventListener("click", handleImportApply);
  el.historySearchBtn.addEventListener("click", handleHistorySearch);
  el.historyDeleteBtn.addEventListener("click", handleHistoryDelete);
  el.historyExportBtn.addEventListener("click", handleHistoryExport);

  el.addMemberBtn.addEventListener("click", addMember);
  el.addItemBtn.addEventListener("click", addItem);

  el.guildManageTableBody.addEventListener("click", handleGuildManageTableClick);
  el.itemManageTableBody.addEventListener("click", handleItemManageTableClick);

  [el.passwordModalBackdrop, el.guildManageModalBackdrop, el.itemManageModalBackdrop, el.searchSelectModalBackdrop, el.importModalBackdrop].forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });
}

function updateTabUi() {
  el.tabs.forEach((tab) => {
    const active = tab.dataset.tab === state.activeTab;
    tab.classList.toggle("active", active);
    tab.classList.toggle("disabled", tab.dataset.tab === "special");
  });

  const isSpecial = false;
  const isDistribution = state.activeTab === "distribution";
  const isHistory = state.activeTab === "history";
  const isAccessory = state.activeTab === "accessory";
  const isBoss = state.activeTab === "boss";
  const isPower = state.activeTab === "power";

  el.mainCard.classList.remove("hidden");
  el.mainActions.classList.toggle("hidden", isDistribution || isHistory);
  el.summaryTableWrap.classList.toggle("hidden", isDistribution || isHistory);
  el.distributionContent.classList.toggle("hidden", !isDistribution);
  el.historyContent.classList.toggle("hidden", !isHistory);
  el.mainTableSearch.classList.toggle("hidden", isDistribution || isHistory);
  el.historyHeaderActions.classList.toggle("hidden", !isHistory);

  if (isDistribution) {
    el.mainCardTitle.textContent = "분배";
    el.tableGuideText.textContent = "보스로그 엑셀을 기준으로 기간 내 참여 점수를 집계하여 분배 다이아를 계산합니다.";
  } else if (isHistory) {
    el.mainCardTitle.textContent = "분배 이력";
    el.tableGuideText.textContent = "저장된 분배 이력을 날짜 기준으로 조회하는 화면입니다.";
  } else {
    el.mainCardTitle.textContent = "전체 현황";
  }

  el.guildManageBtn.disabled = isSpecial || isDistribution || isHistory;
  el.bulkEditBtn.disabled = isSpecial;
  el.bulkEditBtn.classList.toggle("hidden", state.overallEditMode);
  el.bulkSaveBtn.classList.toggle("hidden", !state.overallEditMode);
  el.bulkCancelBtn.classList.toggle("hidden", !state.overallEditMode);
  el.bulkSaveBtn.disabled = isSpecial || state.isBulkSaving;
  el.bulkCancelBtn.disabled = isSpecial || state.isBulkSaving;
  el.itemManageBtn.disabled = isSpecial || isDistribution || isPower || state.isBulkSaving;
  el.guildManageBtn.disabled = isSpecial || isDistribution || isHistory || state.isBulkSaving;
  el.bulkEditBtn.disabled = isSpecial || isDistribution || isHistory || state.isBulkSaving;
  el.searchBtn.disabled = isSpecial || isDistribution || isHistory || state.isBulkSaving;
  el.resetBtn.disabled = isSpecial || isDistribution || isHistory || state.isBulkSaving;
  el.searchInput.disabled = isSpecial || isDistribution || isHistory || state.isBulkSaving;
  el.bossSearchInput.disabled = !isBoss || isSpecial || isDistribution || isHistory || state.isBulkSaving;
  el.bossSearchInput.classList.toggle("hidden", !isBoss);
  el.itemManageBtn.classList.toggle("hidden", isPower || isDistribution || isHistory);
  el.importOpenBtn.classList.toggle("hidden", !(state.activeTab === "mount" || state.activeTab === "boss" || state.activeTab === "accessory"));
  el.importOpenBtn.disabled = isSpecial || isDistribution || isHistory || isPower || state.isBulkSaving;
  el.itemManageBtn.textContent = isAccessory ? "악세사리 관리" : isBoss ? "보스컬렉 관리" : "탈것 관리";
  el.itemManageTitle.textContent = isAccessory ? "악세사리 관리" : isBoss ? "보스컬렉 관리" : "탈것 관리";
  el.itemNameHeader.textContent = isAccessory ? "악세사리명" : isBoss ? "보스컬렉명" : "탈것명";
  el.itemMaxHeader.classList.toggle("hidden", !isAccessory);
  el.addItemBtn.textContent = isAccessory ? "악세사리 추가" : isBoss ? "보스컬렉 추가" : "탈것 추가";
}

async function loadActiveTabData() {
  if (state.activeTab === "power") {
    await loadPowerData();
    return;
  }

  if (state.activeTab === "accessory") {
    await loadAccessoryData();
    return;
  }

  if (state.activeTab === "boss") {
    await loadBossData();
    return;
  }

  await loadMountData();
}

async function loadPowerData() {
  const membersRes = await supabase.from("guild_members").select("id, name, power, updated_at").order("name", { ascending: true });

  if (membersRes.error) {
    alert(`길드원 조회 중 오류가 발생했습니다.\n${membersRes.error.message}`);
    return;
  }

  state.members = membersRes.data ?? [];
  syncDraftState();
}

async function loadMountData() {
  const [membersRes, itemsRes, memberMountsRes] = await Promise.all([
    supabase.from("guild_members").select("id, name, power, updated_at").order("name", { ascending: true }),
    supabase.from("mounts").select("id, name, display_order").order("display_order", { ascending: true }),
    supabase.from("member_mounts").select("id, member_id, mount_id, owned, updated_at")
  ]);

  if (membersRes.error) {
    alert(`길드원 조회 중 오류가 발생했습니다.\n${membersRes.error.message}`);
    return;
  }

  if (itemsRes.error) {
    alert(`탈것 조회 중 오류가 발생했습니다.\n${itemsRes.error.message}`);
    return;
  }

  if (memberMountsRes.error) {
    alert(`보유 정보 조회 중 오류가 발생했습니다.\n${memberMountsRes.error.message}`);
    return;
  }

  state.members = membersRes.data ?? [];
  state.mountItems = itemsRes.data ?? [];
  state.memberMounts = memberMountsRes.data ?? [];
  syncDraftState();
}
async function loadBossData() {
  const [membersRes, itemsRes] = await Promise.all([
    supabase.from("guild_members").select("id, name, power, updated_at").order("name", { ascending: true }),
    supabase
      .from("boss_collections")
      .select("id, name, display_order")
      .order("display_order", { ascending: true })
      .order("id", { ascending: true })
  ]);

  if (membersRes.error) {
    alert(`길드원 조회 중 오류가 발생했습니다.\n${membersRes.error.message}`);
    return;
  }

  if (itemsRes.error) {
    alert(`보스컬렉 조회 중 오류가 발생했습니다.\n${itemsRes.error.message}`);
    return;
  }

  const allBossRows = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const memberBossRes = await supabase
      .from("member_boss_collections")
      .select("id, member_id, boss_collection_id, owned, updated_at")
      .range(from, from + pageSize - 1);

    if (memberBossRes.error) {
      alert(`보유 정보 조회 중 오류가 발생했습니다.\n${memberBossRes.error.message}`);
      return;
    }

    const rows = memberBossRes.data ?? [];
    allBossRows.push(...rows);

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  state.members = membersRes.data ?? [];
  state.bossItems = itemsRes.data ?? [];
  state.memberBossCollections = allBossRows;
  syncDraftState();
}

async function loadAccessoryData() {
  const [membersRes, groupsRes, memberAccessoriesRes] = await Promise.all([
    supabase.from("guild_members").select("id, name, power, updated_at").order("name", { ascending: true }),
    supabase.from("accessory_groups").select("id, name, display_order, max_count").order("display_order", { ascending: true }),
    supabase.from("member_accessories").select("id, member_id, accessory_group_id, ring_count, necklace_count, earring_count, belt_count, bracelet_count, updated_at")
  ]);

  if (membersRes.error) {
    alert(`길드원 조회 중 오류가 발생했습니다.\n${membersRes.error.message}`);
    return;
  }

  if (groupsRes.error) {
    alert(`악세사리 조회 중 오류가 발생했습니다.\n${groupsRes.error.message}`);
    return;
  }

  if (memberAccessoriesRes.error) {
    alert(`악세사리 정보 조회 중 오류가 발생했습니다.\n${memberAccessoriesRes.error.message}`);
    return;
  }

  state.members = membersRes.data ?? [];
  state.accessoryGroups = groupsRes.data ?? [];
  state.memberAccessories = memberAccessoriesRes.data ?? [];
  ensureAccessoryHiddenState();
  syncDraftState();
}

function ensureAccessoryHiddenState() {
  const nextHiddenMap = {};
  state.accessoryGroups.forEach((group) => {
    nextHiddenMap[group.id] = Boolean(state.hiddenAccessoryGroupIds[group.id]);
  });
  state.hiddenAccessoryGroupIds = nextHiddenMap;
}

function toggleAccessoryGroupHidden(groupId) {
  if (state.activeTab !== "accessory") return;
  state.hiddenAccessoryGroupIds[groupId] = !Boolean(state.hiddenAccessoryGroupIds[groupId]);
  renderSummaryTable();
}

function handleBossSearchInput() {
  state.bossSearchTerm = el.bossSearchInput.value.trim();
  renderSummaryTable();
}

function handleSearch() {
  const keyword = el.searchInput.value.trim();
  state.searchTerm = keyword;

  if (!keyword) {
    state.selectedMemberId = null;
    syncDraftState();
    renderAll();
    return;
  }

  const matchedMembers = getMatchedMembers(keyword);

  if (matchedMembers.length === 0) {
    state.selectedMemberId = null;
    state.rowEditMemberId = null;
    closeSearchSelectModal();
    syncDraftState();
    renderAll();
    return;
  }

  if (matchedMembers.length === 1) {
    selectMemberFromSearch(matchedMembers[0].id);
    return;
  }

  renderSearchSelectModal(matchedMembers);
  openModal(el.searchSelectModalBackdrop);
}

async function handleResetSearch() {
  state.searchTerm = "";
  state.bossSearchTerm = "";
  state.selectedMemberId = null;
  el.searchInput.value = "";
  el.bossSearchInput.value = "";
  closeSearchSelectModal();

  if (state.activeTab !== "special") {
    await loadActiveTabData();
  } else {
    syncDraftState();
  }

  renderAll();
}

function getMatchedMembers(keyword) {
  const exactMatched = state.members.filter((member) => member.name === keyword);
  if (exactMatched.length > 0) return exactMatched;
  return state.members.filter((member) => member.name.includes(keyword));
}

function getFilteredMembers() {
  const keyword = state.searchTerm.trim();
  let filteredMembers;

  if (!keyword) {
    filteredMembers = [...state.members];
  } else if (!state.selectedMemberId) {
    const matchedMembers = getMatchedMembers(keyword);
    filteredMembers = matchedMembers.length === 0 ? [] : [...state.members];
  } else {
    filteredMembers = state.members.filter((member) => member.id === state.selectedMemberId);
  }

  return sortFilteredMembers(filteredMembers);
}

function sortFilteredMembers(members) {
  const updatedDirection = state.updatedAtSortDirection;
  const powerDirection = state.powerSortDirection;

  if (!updatedDirection && !powerDirection) return members;

  return [...members].sort((left, right) => {
    if (updatedDirection) {
      const leftTime = getComparableUpdatedAt(left);
      const rightTime = getComparableUpdatedAt(right);

      if (leftTime !== rightTime) {
        return updatedDirection === "asc" ? leftTime - rightTime : rightTime - leftTime;
      }
    }

    if (powerDirection) {
      const leftPower = Number(left.power ?? 0);
      const rightPower = Number(right.power ?? 0);

      if (leftPower !== rightPower) {
        return powerDirection === "asc" ? leftPower - rightPower : rightPower - leftPower;
      }
    }

    return String(left.name ?? "").localeCompare(String(right.name ?? ""), "ko");
  });
}

function getEditableMember() {
  if (state.overallEditMode) return null;
  if (!state.searchTerm.trim() || !state.selectedMemberId) return null;
  if (!state.rowEditMemberId || state.rowEditMemberId !== state.selectedMemberId) return null;
  return state.members.find((member) => member.id === state.selectedMemberId) ?? null;
}

function syncDraftState() {
  const editableMember = getEditableMember();

  if (!editableMember) {
    state.draftMemberId = null;
    state.draftTab = null;
    state.draftPower = "";
    state.draftOwnedMap = {};
    state.draftAccessoryMap = {};
    return;
  }

  if (state.draftMemberId === editableMember.id && state.draftTab === state.activeTab) return;

  state.draftMemberId = editableMember.id;
  state.draftTab = state.activeTab;
  state.draftPower = String(editableMember.power ?? 0);
  state.draftOwnedMap = {};
  state.draftAccessoryMap = {};

  if (state.activeTab === "accessory") {
    state.accessoryGroups.forEach((group) => {
      const record = state.memberAccessories.find(
        (entry) => entry.member_id === editableMember.id && String(entry.accessory_group_id) === String(group.id)
      );

      state.draftAccessoryMap[group.id] = {};
      ACCESSORY_PARTS.forEach((part) => {
        state.draftAccessoryMap[group.id][part.key] = Number(record?.[part.key] ?? 0);
      });
    });
    return;
  }

  const simpleItems = getSimpleItems();
  const simpleRecords = getSimpleMemberRecords();
  const simpleItemKey = getSimpleItemForeignKey();

  simpleItems.forEach((item) => {
    const record = simpleRecords.find(
      (entry) => entry.member_id === editableMember.id && String(entry[simpleItemKey]) === String(item.id)
    );
    state.draftOwnedMap[item.id] = Boolean(record?.owned);
  });
}

function ensureDraftRow(memberId) {
  if (!memberId) return null;
  if (!state.draftAllRows[memberId]) {
    const member = state.members.find((entry) => entry.id === memberId);
    const row = { power: String(member?.power ?? 0), ownedMap: {}, accessoryMap: {} };

    if (state.activeTab === "accessory") {
      state.accessoryGroups.forEach((group) => {
        const record = state.memberAccessories.find((entry) => entry.member_id === memberId && String(entry.accessory_group_id) === String(group.id));
        row.accessoryMap[group.id] = {};
        ACCESSORY_PARTS.forEach((part) => {
          row.accessoryMap[group.id][part.key] = Number(record?.[part.key] ?? 0);
        });
      });
    } else {
      const simpleItems = getSimpleItems();
      const simpleRecords = getSimpleMemberRecords();
      const simpleItemKey = getSimpleItemForeignKey();
      simpleItems.forEach((item) => {
        const record = simpleRecords.find((entry) => entry.member_id === memberId && String(entry[simpleItemKey]) === String(item.id));
        row.ownedMap[item.id] = Boolean(record?.owned);
      });
    }

    state.draftAllRows[memberId] = row;
  }
  return state.draftAllRows[memberId];
}

function isMemberEditable(memberId) {
  if (state.overallEditMode) return true;
  const editableMember = getEditableMember();
  return Boolean(editableMember && editableMember.id === memberId);
}

function getMemberDraftPower(member) {
  if (state.overallEditMode) {
    return ensureDraftRow(member.id)?.power ?? String(member.power ?? 0);
  }
  return state.draftPower;
}

function getMemberDraftOwned(memberId, itemId) {
  if (state.overallEditMode) {
    return Boolean(ensureDraftRow(memberId)?.ownedMap?.[itemId]);
  }
  return Boolean(state.draftOwnedMap[itemId]);
}

function getMemberDraftAccessory(memberId, groupId, partKey) {
  if (state.overallEditMode) {
    return Number(ensureDraftRow(memberId)?.accessoryMap?.[groupId]?.[partKey] ?? 0);
  }
  return Number(state.draftAccessoryMap[groupId]?.[partKey] ?? 0);
}

function resetOverallEditMode() {
  state.overallEditMode = false;
  state.draftAllRows = {};
}

function handleBulkEditButtonClick() {
  openPasswordModal("bulk-edit");
}

async function handleBulkSaveButtonClick() {
  await saveAllOverallEdits();
}

function handleBulkCancelButtonClick() {
  resetOverallEditMode();
  renderAll();
}

function setBulkSaveProgress(percent) {
  const safePercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  state.bulkSaveProgress = safePercent;
  renderBulkSaveOverlay();
}

function renderBulkSaveOverlay() {
  if (!el.bulkSaveOverlay || !el.bulkSavePercent || !el.bulkSaveBarFill) return;

  el.bulkSaveOverlay.classList.toggle("hidden", !state.isBulkSaving);
  el.bulkSavePercent.textContent = `${state.bulkSaveProgress}%`;
  el.bulkSaveBarFill.style.width = `${state.bulkSaveProgress}%`;
}

function renderAll() {
  updateTabUi();

  if (state.activeTab === "distribution") {
    renderDistributionTab();
    return;
  }

  if (state.activeTab === "history") {
    renderHistoryTab();
    return;
  }

  syncDraftState();
  renderGuideText();
  renderSummaryTable();
  renderGuildManageTable();
  renderItemManageTable();
  renderBulkSaveOverlay();
}

function renderGuideText() {
  const keyword = state.searchTerm.trim();

  if (state.overallEditMode) {
    el.tableGuideText.textContent = state.activeTab === "power"
      ? "전체수정 모드입니다. 전체 목록에서 최고 투력을 수정한 뒤 하단 저장 버튼으로 저장할 수 있습니다."
      : state.activeTab === "accessory"
        ? "전체수정 모드입니다. 전체 목록에서 악세사리 수량을 수정한 뒤 하단 저장 버튼으로 저장할 수 있습니다."
        : "전체수정 모드입니다. 전체 목록에서 보유 상태를 수정한 뒤 하단 저장 버튼으로 저장할 수 있습니다.";
    return;
  }

  if (!keyword) {
    el.tableGuideText.textContent = "전체 목록 상태에서는 수정할 수 없습니다. 길드원을 검색해주세요.";
    return;
  }

  if (!state.selectedMemberId) {
    const matchedMembers = getMatchedMembers(keyword);
    el.tableGuideText.textContent = matchedMembers.length === 0
      ? "검색 결과가 없습니다."
      : "검색 결과 팝업에서 길드원을 선택해주세요.";
    return;
  }

  el.tableGuideText.textContent = state.rowEditMemberId === state.selectedMemberId
    ? state.activeTab === "power"
      ? "선택된 길드원 1명 수정 모드입니다. 이 행에서 최고 투력을 수정한 뒤 저장할 수 있습니다."
      : state.activeTab === "accessory"
        ? "선택된 길드원 1명 수정 모드입니다. 이 행에서 악세사리 수량을 수정한 뒤 저장할 수 있습니다."
        : "선택된 길드원 1명 수정 모드입니다. 이 행에서 보유 상태를 수정한 뒤 저장할 수 있습니다."
    : "선택된 길드원 1명만 표시됩니다. 수정 버튼에서 관리자 인증 후 수정할 수 있습니다.";
}

function renderSummaryTable() {
  if (state.activeTab === "power") {
    renderPowerSummaryTable();
    return;
  }

  if (state.activeTab === "accessory") {
    renderAccessorySummaryTable();
    return;
  }

  if (state.activeTab === "boss") {
    renderBossSummaryTable();
    return;
  }

  renderMountSummaryTable();
}

function getRowActionButtonHtml(memberId, saveRole) {
  if (state.overallEditMode) return `<span class="notice-text action-box">일괄</span>`;
  if (state.selectedMemberId !== memberId) return `<span class="notice-text action-box">불가</span>`;
  if (state.rowEditMemberId === memberId) return `<button class="btn btn-primary btn-sm" type="button" data-role="${saveRole}" data-member-id="${memberId}">저장</button>`;
  return `<button class="btn btn-outline btn-sm" type="button" data-role="edit-row" data-member-id="${memberId}">수정</button>`;
}

function renderPowerSummaryTable() {
  const powerSortText = state.powerSortDirection === "asc"
    ? "▲"
    : state.powerSortDirection === "desc"
      ? "▼"
      : "↕";

  const headers = [
    `<th>no</th>`,
    `<th>길드원</th>`,
    `<th class="sortable-header ${state.powerSortDirection ? "active" : ""}" data-role="power-sort-header"><span class="sort-header-inner"><span>최고 투력</span><span class="sort-indicator">${powerSortText}</span></span></th>`,
    `<th class="save-col">저장</th>`,
    `<th class="last-updated-col sortable-header ${state.updatedAtSortDirection ? "active" : ""}" data-role="updated-sort-header"><span class="sort-header-inner"><span class="last-updated-header-text">수정일</span><span class="sort-indicator">${getUpdatedSortText()}</span></span></th>`
  ];

  el.summaryTableHead.innerHTML = `<tr>${headers.join("")}</tr>`;

  const filteredMembers = getFilteredMembers();

  if (filteredMembers.length === 0) {
    el.summaryTableBody.innerHTML = `
      <tr>
        <td class="empty-row" colspan="5">표시할 길드원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.summaryTableBody.innerHTML = filteredMembers.map((member, index) => {
    const isEditable = isMemberEditable(member.id);
    const rowClass = Number(member.power ?? 0) === 0 ? "power-zero-row" : "";

    const powerCell = isEditable
      ? `<input class="inline-power-input" type="number" min="0" step="1" data-role="power-input" data-member-id="${member.id}" value="${escapeAttr(getMemberDraftPower(member))}">`
      : `<span class="value-box">${member.power ?? 0}</span>`;

    const saveCell = getRowActionButtonHtml(member.id, "save-row-power");

    const lastUpdatedCell = `<span class="last-updated-box">${formatUpdatedAt(member.updated_at)}</span>`;

    return `
      <tr class="${rowClass}">
        <td>${index + 1}</td>
        <td>${escapeHtml(member.name)}</td>
        <td>${powerCell}</td>
        <td>${saveCell}</td>
        <td>${lastUpdatedCell}</td>
      </tr>
    `;
  }).join("");
}

function renderMountSummaryTable() {
  const powerSortText = state.powerSortDirection === "asc"
    ? "▲"
    : state.powerSortDirection === "desc"
      ? "▼"
      : "↕";

  const headers = [
    `<th>no</th>`,
    `<th>길드원</th>`,
    `<th class="sortable-header ${state.powerSortDirection ? "active" : ""}" data-role="power-sort-header"><span class="sort-header-inner"><span>전투력</span><span class="sort-indicator">${powerSortText}</span></span></th>`,
    ...state.mountItems.map((item) => `<th class="item-col-header">${escapeHtml(item.name)}</th>`),
    `<th class="save-col">저장</th>`,
    `<th class="last-updated-col sortable-header ${state.updatedAtSortDirection ? "active" : ""}" data-role="updated-sort-header"><span class="sort-header-inner"><span class="last-updated-header-text">수정일</span><span class="sort-indicator">${getUpdatedSortText()}</span></span></th>`
  ];

  el.summaryTableHead.innerHTML = `<tr>${headers.join("")}</tr>`;

  const filteredMembers = getFilteredMembers();

  if (filteredMembers.length === 0) {
    el.summaryTableBody.innerHTML = `
      <tr>
        <td class="empty-row" colspan="${state.mountItems.length + 5}">표시할 길드원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.summaryTableBody.innerHTML = filteredMembers.map((member, index) => {
    const isEditable = isMemberEditable(member.id);
    const rowClass = Number(member.power ?? 0) === 0 ? "power-zero-row" : "";

    const powerCell = `<span class="value-box">${member.power ?? 0}</span>`;

    const itemCells = state.mountItems.map((item) => {
      const currentOwned = isEditable
        ? getMemberDraftOwned(member.id, item.id)
        : getOwnedValue(member.id, item.id);

      if (isEditable) {
        return `
          <td>
            <button class="toggle-single-btn ${currentOwned ? "owned" : "not-owned"}" type="button" data-role="owned-toggle" data-member-id="${member.id}" data-item-id="${item.id}">
              ${currentOwned ? "보유" : "미보유"}
            </button>
          </td>
        `;
      }

      return `<td><span class="badge ${currentOwned ? "badge-own" : "badge-not"}">${currentOwned ? "보유" : "미보유"}</span></td>`;
    }).join("");

    const saveCell = getRowActionButtonHtml(member.id, "save-row-mount");

    const lastUpdatedCell = `<span class="last-updated-box">${formatUpdatedAt(getMountLatestUpdatedAt(member.id))}</span>`;

    return `
      <tr class="${rowClass}">
        <td>${index + 1}</td>
        <td>${escapeHtml(member.name)}</td>
        <td>${powerCell}</td>
        ${itemCells}
        <td>${saveCell}</td>
        <td>${lastUpdatedCell}</td>
      </tr>
    `;
  }).join("");
}

function getFilteredBossItems() {
  const keyword = state.bossSearchTerm.trim();
  if (!keyword) return state.bossItems;
  return state.bossItems.filter((item) => item.name.includes(keyword));
}

function renderBossSummaryTable() {
  const powerSortText = state.powerSortDirection === "asc"
    ? "▲"
    : state.powerSortDirection === "desc"
      ? "▼"
      : "↕";

  const filteredBossItems = getFilteredBossItems();

  const headers = [
    `<th>no</th>`,
    `<th>길드원</th>`,
    `<th class="sortable-header ${state.powerSortDirection ? "active" : ""}" data-role="power-sort-header"><span class="sort-header-inner"><span>전투력</span><span class="sort-indicator">${powerSortText}</span></span></th>`,
    ...filteredBossItems.map((item) => `<th class="item-col-header">${escapeHtml(item.name)}</th>`),
    `<th class="save-col">저장</th>`,
    `<th class="last-updated-col sortable-header ${state.updatedAtSortDirection ? "active" : ""}" data-role="updated-sort-header"><span class="sort-header-inner"><span class="last-updated-header-text">수정일</span><span class="sort-indicator">${getUpdatedSortText()}</span></span></th>`
  ];

  el.summaryTableHead.innerHTML = `<tr>${headers.join("")}</tr>`;

  const filteredMembers = getFilteredMembers();

  if (filteredMembers.length === 0) {
    el.summaryTableBody.innerHTML = `
      <tr>
        <td class="empty-row" colspan="${filteredBossItems.length + 5}">표시할 길드원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.summaryTableBody.innerHTML = filteredMembers.map((member, index) => {
    const isEditable = isMemberEditable(member.id);
    const rowClass = Number(member.power ?? 0) === 0 ? "power-zero-row" : "";

    const powerCell = `<span class="value-box">${member.power ?? 0}</span>`;

    const itemCells = filteredBossItems.map((item) => {
      const currentOwned = isEditable
        ? getMemberDraftOwned(member.id, item.id)
        : getBossOwnedValue(member.id, item.id);

      if (isEditable) {
        return `
          <td>
            <button class="toggle-single-btn ${currentOwned ? "owned" : "not-owned"}" type="button" data-role="owned-toggle" data-member-id="${member.id}" data-item-id="${item.id}">
              ${currentOwned ? "보유" : "미보유"}
            </button>
          </td>
        `;
      }

      return `<td><span class="badge ${currentOwned ? "badge-own" : "badge-not"}">${currentOwned ? "보유" : "미보유"}</span></td>`;
    }).join("");

    const saveCell = getRowActionButtonHtml(member.id, "save-row-boss");

    const lastUpdatedCell = `<span class="last-updated-box">${formatUpdatedAt(getBossLatestUpdatedAt(member.id))}</span>`;

    return `
      <tr class="${rowClass}">
        <td>${index + 1}</td>
        <td>${escapeHtml(member.name)}</td>
        <td>${powerCell}</td>
        ${itemCells}
        <td>${saveCell}</td>
        <td>${lastUpdatedCell}</td>
      </tr>
    `;
  }).join("");
}

function renderAccessorySummaryTable() {
  const powerSortText = state.powerSortDirection === "asc"
    ? "▲"
    : state.powerSortDirection === "desc"
      ? "▼"
      : "↕";

  const totalAccessoryColumnCount = state.accessoryGroups.reduce((sum, group) => {
    return sum + (state.hiddenAccessoryGroupIds[group.id] ? 1 : ACCESSORY_PARTS.length);
  }, 0);

  const topHeaders = [
    `<th rowspan="2">no</th>`,
    `<th rowspan="2">길드원</th>`,
    `<th rowspan="2" class="sortable-header ${state.powerSortDirection ? "active" : ""}" data-role="power-sort-header"><span class="sort-header-inner"><span>전투력</span><span class="sort-indicator">${powerSortText}</span></span></th>`,
    ...state.accessoryGroups.map((group) => {
      const isHidden = Boolean(state.hiddenAccessoryGroupIds[group.id]);
      const colSpan = isHidden ? 1 : ACCESSORY_PARTS.length;
      const hiddenClass = isHidden ? ' is-collapsed' : '';
      return `<th colspan="${colSpan}" class="group-header group-boundary-start group-boundary-end${hiddenClass}"><div class="group-header-inner"><span class="group-header-text">${escapeHtml(group.name)}</span><button class="group-hide-btn ${isHidden ? "is-hidden" : ""}" type="button" data-role="toggle-accessory-group-hidden" data-group-id="${group.id}">${isHidden ? "숨김해제" : "숨김"}</button></div></th>`;
    }),
    `<th rowspan="2" class="save-col">저장</th>`,
    `<th rowspan="2" class="last-updated-col sortable-header ${state.updatedAtSortDirection ? "active" : ""}" data-role="updated-sort-header"><span class="sort-header-inner"><span class="last-updated-header-text">수정일</span><span class="sort-indicator">${getUpdatedSortText()}</span></span></th>`
  ];

  const subHeaders = state.accessoryGroups.flatMap((group) => {
    const isHidden = Boolean(state.hiddenAccessoryGroupIds[group.id]);

    if (isHidden) {
      return [`<th class="accessory-sub-header accessory-collapsed-header group-boundary-start group-boundary-end">숨김</th>`];
    }

    return ACCESSORY_PARTS.map((part, partIndex) => {
      const classes = ['accessory-sub-header'];
      if (partIndex === 0) classes.push('group-boundary-start');
      if (partIndex === ACCESSORY_PARTS.length - 1) classes.push('group-boundary-end');
      return `<th class="${classes.join(' ')}">${part.label}</th>`;
    });
  });

  el.summaryTableHead.innerHTML = `
    <tr>${topHeaders.join("")}</tr>
    <tr>${subHeaders.join("")}</tr>
  `;

  const filteredMembers = getFilteredMembers();

  if (filteredMembers.length === 0) {
    el.summaryTableBody.innerHTML = `
      <tr>
        <td class="empty-row" colspan="${totalAccessoryColumnCount + 5}">표시할 길드원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.summaryTableBody.innerHTML = filteredMembers.map((member, index) => {
    const isEditable = isMemberEditable(member.id);
    const rowClass = Number(member.power ?? 0) === 0 ? "power-zero-row" : "";

    const powerCell = `<span class="value-box">${member.power ?? 0}</span>`;

    const groupCells = state.accessoryGroups.map((group) => {
      const record = getAccessoryRecord(member.id, group.id);
      const isHidden = Boolean(state.hiddenAccessoryGroupIds[group.id]);

      if (isHidden) {
        return `<td class="accessory-collapsed-cell group-boundary-start group-boundary-end"${rowClass ? ` style="${getAccessoryZeroPowerCellStyle()}"` : ""}><span class="accessory-collapsed-text">숨김</span></td>`;
      }

      return ACCESSORY_PARTS.map((part, partIndex) => {
        const maxCount = Number(group.max_count ?? 0);
        const currentValue = isEditable
          ? getMemberDraftAccessory(member.id, group.id, part.key)
          : Number(record?.[part.key] ?? 0);
        const tdClasses = ['accessory-heat-cell'];
        if (partIndex === 0) tdClasses.push('group-boundary-start');
        if (partIndex === ACCESSORY_PARTS.length - 1) tdClasses.push('group-boundary-end');
        const tdClassAttr = ` class="${tdClasses.join(' ')}"`;
        const tdStyleAttr = ` style="${rowClass ? getAccessoryZeroPowerCellStyle() : getAccessoryHeatCellStyle(currentValue, maxCount)}"`;

        if (isEditable) {
          return `
            <td${tdClassAttr}${tdStyleAttr}>
              <input class="inline-qty-input accessory-heat-input" type="number" min="0" max="${escapeAttr(maxCount)}" step="1" data-role="accessory-qty-input" data-member-id="${member.id}" data-group-id="${group.id}" data-part-key="${part.key}" value="${escapeAttr(currentValue)}">
            </td>
          `;
        }

        return `<td${tdClassAttr}${tdStyleAttr}><span class="value-box qty-box accessory-heat-value">${currentValue}</span></td>`;
      }).join("");
    }).join("");

    const saveCell = getRowActionButtonHtml(member.id, "save-row-accessory");

    const lastUpdatedCell = `<span class="last-updated-box">${formatUpdatedAt(getAccessoryLatestUpdatedAt(member.id))}</span>`;

    return `
      <tr class="${rowClass}">
        <td>${index + 1}</td>
        <td>${escapeHtml(member.name)}</td>
        <td>${powerCell}</td>
        ${groupCells}
        <td>${saveCell}</td>
        <td>${lastUpdatedCell}</td>
      </tr>
    `;
  }).join("");
}

function renderSearchSelectModal(members) {
  el.searchSelectGuideText.textContent = "검색 결과에서 길드원을 선택해주세요.";

  if (members.length === 0) {
    el.searchSelectList.innerHTML = '<div class="search-select-empty">검색 결과가 없습니다.</div>';
    return;
  }

  el.searchSelectList.innerHTML = members.map((member) => `
    <button class="search-select-item" type="button" data-role="search-select-item" data-member-id="${member.id}">
      ${escapeHtml(member.name)}
    </button>
  `).join("");
}

function handleSearchSelectClick(event) {
  const button = event.target.closest('[data-role="search-select-item"]');
  if (!button) return;
  selectMemberFromSearch(button.dataset.memberId);
}

function selectMemberFromSearch(memberId) {
  const member = state.members.find((entry) => entry.id === memberId);
  if (!member) return;

  state.searchTerm = member.name;
  state.selectedMemberId = member.id;
  state.rowEditMemberId = null;
  el.searchInput.value = member.name;
  closeSearchSelectModal();
  syncDraftState();
  renderAll();
}

function closeSearchSelectModal() {
  closeModal(el.searchSelectModalBackdrop);
}


function initializeDistributionState() {
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
    mainland: createDistributionGroupState("mainland"),
    world: createDistributionGroupState("world")
  };
}

function createDistributionGroupState(type) {
  return {
    type,
    deductions: [],
    logs: [],
    results: [],
    summary: createDistributionSummary(),
    dirtyLogs: false
  };
}

function createDistributionSummary() {
  return {
    assignedDiamond: 0,
    deductionTotal: 0,
    actualDiamond: 0,
    totalPoints: 0,
    perPoint: 0,
    remainingDiamond: 0
  };
}

function createDistributionDeduction(name = "", mode = "percent", value = "") {
  return {
    id: createDistributionId("ded"),
    name,
    mode,
    value: value === "" ? "" : Number(value)
  };
}

function createBossRule(name = "", score = 1, group = "mainland") {
  return {
    id: createDistributionId("boss"),
    name,
    score: Number(score) > 0 ? Number(score) : 1,
    group
  };
}

function createNameRule(source = "", target = "") {
  return {
    id: createDistributionId("name"),
    source,
    target
  };
}

function createDistributionId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function renderDistributionTab() {
  renderDistributionCommonInputs();
  renderDistributionCommonSummary();
  renderDistributionGroup("mainland");
  renderDistributionGroup("world");
  renderDistributionBossRules();
  renderDistributionNameRules();
}

function renderDistributionCommonInputs() {
  const distribution = state.distribution;
  setValueIfNeeded("newdistTotalDiamondInput", distribution.totalDiamond || distribution.totalDiamond === 0 ? String(distribution.totalDiamond) : "");
  setValueIfNeeded("newdistMainlandRatioInput", String(distribution.mainlandRatio));
  setValueIfNeeded("newdistWorldRatioInput", String(distribution.worldRatio));
}

function setValueIfNeeded(id, nextValue) {
  const input = document.getElementById(id);
  if (!input) return;
  if (document.activeElement === input) return;
  if (input.value !== String(nextValue ?? "")) {
    input.value = String(nextValue ?? "");
  }
}

function renderDistributionCommonSummary() {
  const distribution = state.distribution;
  const assigned = getDistributionAssignedAmounts();
  setText("newdistSummaryTotalDiamond", formatNumber(distribution.totalDiamond));
  setText("newdistSummaryMainlandAssigned", formatNumber(assigned.mainland));
  setText("newdistSummaryWorldAssigned", formatNumber(assigned.world));

  const loadedCount = distribution.loadedLogs.length;
  const unknownCount = distribution.unknownBosses.length;
  let statusText = "대기";
  if (distribution.workbookName && loadedCount === 0) {
    statusText = "엑셀 로드 완료";
  }
  if (loadedCount > 0) {
    statusText = `작업 로그 ${loadedCount}건`;
  }
  if (unknownCount > 0) {
    statusText += ` / 미분류 ${unknownCount}건`;
  }
  setText("newdistSummaryStatus", statusText);
}

function renderDistributionGroup(groupKey) {
  const group = state.distribution[groupKey];
  const summary = calculateDistributionGroupSummary(groupKey);

  group.summary = summary;

  const prefix = groupKey === "mainland" ? "newdistMainland" : "newdistWorld";
  setText(`${prefix}Assigned`, formatNumber(summary.assignedDiamond));
  setText(`${prefix}DeductionTotal`, formatNumber(summary.deductionTotal));
  setText(`${prefix}ActualDiamond`, formatNumber(summary.actualDiamond));
  setText(`${prefix}TotalPoints`, formatNumber(summary.totalPoints));
  setText(`${prefix}PerPoint`, formatDecimal(summary.perPoint, 1));
  setText(`${prefix}Remaining`, formatNumber(summary.remainingDiamond));
  setText(`${prefix}DeductionChip`, formatNumber(summary.deductionTotal));
  setText(`${prefix}ActualChip`, formatNumber(summary.actualDiamond));

  renderDistributionDeductionTable(groupKey);
  renderDistributionLogs(groupKey);
  renderDistributionResults(groupKey);
}

function renderDistributionDeductionTable(groupKey) {
  const body = document.getElementById(groupKey === "mainland" ? "newdistMainlandDeductionBody" : "newdistWorldDeductionBody");
  if (!body) return;

  const rows = state.distribution[groupKey].deductions;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="distribution-empty-row">등록된 공제 항목이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((row, index) => `
    <tr>
      <td><input class="newdist-input-sm" type="text" data-role="newdist-deduction-name" data-group="${groupKey}" data-id="${row.id}" value="${escapeAttr(row.name)}"></td>
      <td>
        <select class="newdist-select-sm" data-role="newdist-deduction-mode" data-group="${groupKey}" data-id="${row.id}">
          <option value="percent" ${row.mode === "percent" ? "selected" : ""}>%</option>
          <option value="amount" ${row.mode === "amount" ? "selected" : ""}>직접금액</option>
        </select>
      </td>
      <td><input class="newdist-input-sm" type="number" min="0" step="0.01" data-role="newdist-deduction-value" data-group="${groupKey}" data-id="${row.id}" value="${escapeAttr(row.value ?? "")}"></td>
      <td class="right">${formatNumber(getDistributionDeductionAmount(groupKey, row))}</td>
      <td class="center"><button class="btn btn-outline" type="button" data-role="newdist-delete-deduction" data-group="${groupKey}" data-id="${row.id}">삭제</button></td>
    </tr>
  `).join("");
}

function renderDistributionLogs(groupKey) {
  const body = document.getElementById(groupKey === "mainland" ? "newdistMainlandLogBody" : "newdistWorldLogBody");
  if (!body) return;

  const logs = state.distribution[groupKey].logs;
  if (!logs.length) {
    body.innerHTML = `<tr><td colspan="9" class="distribution-empty-row">표시할 작업 로그가 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = logs.map((log, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td>${escapeHtml(log.dateText || "-")}</td>
      <td>${escapeHtml(log.timeText || "-")}</td>
      <td>${escapeHtml(log.boss || "-")}</td>
      <td class="center"><span class="newdist-badge ${groupKey === "mainland" ? "newdist-badge-mainland" : "newdist-badge-world"}">${groupKey === "mainland" ? "본토" : "월드"}</span></td>
      <td>${escapeHtml(log.cutter || "-")}</td>
      <td>${escapeHtml(log.rawParticipants.join(", ")) || "-"}</td>
      <td>${escapeHtml(log.workingParticipants.join(", ")) || "-"}</td>
      <td class="center"><button class="btn btn-outline newdist-log-edit-btn" type="button" data-role="newdist-edit-log" data-group="${groupKey}" data-log-key="${log.key}">수정</button></td>
    </tr>
  `).join("");
}

function renderDistributionResults(groupKey) {
  const body = document.getElementById(groupKey === "mainland" ? "newdistMainlandResultBody" : "newdistWorldResultBody");
  if (!body) return;

  const rows = state.distribution[groupKey].results;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="7" class="distribution-empty-row">계산 결과가 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((row, index) => `
    <tr class="${row.note === "탈퇴한 길드원" ? "newdist-danger-soft" : ""}">
      <td class="center">${index + 1}</td>
      <td>${escapeHtml(row.memberName)}</td>
      <td class="right">${formatNumber(row.points)}</td>
      <td class="right">${formatPercent(row.ratio)}</td>
      <td class="right">${formatDecimal(row.rawDiamond, 1)}</td>
      <td class="right">${formatNumber(row.finalDiamond)}</td>
      <td>${escapeHtml(row.note || "-")}</td>
    </tr>
  `).join("");
}

function renderDistributionBossRules() {
  const body = document.getElementById("newdistBossRuleBody");
  if (!body) return;
  const rows = state.distribution.bossRules;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="distribution-empty-row">등록된 분배 보스가 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((row, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td><input class="newdist-input-sm" type="text" data-role="newdist-boss-name" data-id="${row.id}" value="${escapeAttr(row.name)}"></td>
      <td class="right"><input class="newdist-input-sm" type="number" min="1" step="1" data-role="newdist-boss-score" data-id="${row.id}" value="${escapeAttr(row.score)}"></td>
      <td class="center">
        <select class="newdist-select-sm" data-role="newdist-boss-group" data-id="${row.id}">
          <option value="mainland" ${row.group === "mainland" ? "selected" : ""}>본토</option>
          <option value="world" ${row.group === "world" ? "selected" : ""}>월드</option>
        </select>
      </td>
      <td class="center"><button class="btn btn-outline" type="button" data-role="newdist-delete-boss" data-id="${row.id}">삭제</button></td>
    </tr>
  `).join("");
}

function renderDistributionNameRules() {
  const body = document.getElementById("newdistNameRuleBody");
  if (!body) return;
  const rows = state.distribution.nameRules;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="4" class="distribution-empty-row">등록된 이름 정리 규칙이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((row, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td><input class="newdist-input-sm" type="text" data-role="newdist-name-source" data-id="${row.id}" value="${escapeAttr(row.source)}"></td>
      <td><input class="newdist-input-sm" type="text" data-role="newdist-name-target" data-id="${row.id}" value="${escapeAttr(row.target)}"></td>
      <td class="center"><button class="btn btn-outline" type="button" data-role="newdist-delete-name" data-id="${row.id}">삭제</button></td>
    </tr>
  `).join("");
}

function calculateDistributionGroupSummary(groupKey) {
  const distribution = state.distribution;
  const assigned = getDistributionAssignedAmounts()[groupKey];
  const deductions = distribution[groupKey].deductions;
  const deductionTotal = deductions.reduce((sum, row) => sum + getDistributionDeductionAmount(groupKey, row), 0);
  const actualDiamond = Math.max(0, assigned - deductionTotal);

  const activePointTotal = distribution[groupKey].results
    .filter((row) => row.note !== "탈퇴한 길드원")
    .reduce((sum, row) => sum + row.points, 0);

  const perPoint = activePointTotal > 0 ? actualDiamond / activePointTotal : 0;
  const distributedDiamond = distribution[groupKey].results
    .filter((row) => row.note !== "탈퇴한 길드원")
    .reduce((sum, row) => sum + row.finalDiamond, 0);

  return {
    assignedDiamond: assigned,
    deductionTotal,
    actualDiamond,
    totalPoints: activePointTotal,
    perPoint,
    remainingDiamond: Math.max(0, actualDiamond - distributedDiamond)
  };
}

function getDistributionAssignedAmounts() {
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

function getDistributionDeductionAmount(groupKey, row) {
  const assigned = getDistributionAssignedAmounts()[groupKey];
  const value = Number(row.value);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (row.mode === "amount") return Math.floor(value);
  return Math.floor(assigned * (value / 100));
}

function bindNewDistributionUi() {
  const root = document.querySelector(".newdist-root");
  if (!root) return;

  root.addEventListener("click", handleDistributionClick);
  root.addEventListener("input", handleDistributionInput);
  root.addEventListener("change", handleDistributionChange);

  document.getElementById("newdistResetBtn")?.addEventListener("click", handleDistributionReset);
  document.getElementById("newdistLoadBtn")?.addEventListener("click", handleDistributionLoadExcel);
  document.getElementById("newdistOpenBossManageBtn")?.addEventListener("click", () => openDistributionModal("newdistBossManageModal"));
  document.getElementById("newdistOpenNameRuleBtn")?.addEventListener("click", () => openDistributionModal("newdistNameRuleModal"));
  document.getElementById("newdistBossAddBtn")?.addEventListener("click", handleDistributionAddBossRule);
  document.getElementById("newdistBossSaveBtn")?.addEventListener("click", handleDistributionSaveBossRules);
  document.getElementById("newdistNameRuleAddBtn")?.addEventListener("click", handleDistributionAddNameRule);
  document.getElementById("newdistNameRuleSaveBtn")?.addEventListener("click", handleDistributionSaveNameRules);
  document.getElementById("newdistLogEditApplyBtn")?.addEventListener("click", handleDistributionApplyLogEdit);

  ["mainland", "world"].forEach((groupKey) => {
    const upper = groupKey === "mainland" ? "Mainland" : "World";
    document.getElementById(`newdist${upper}AddDeductionBtn`)?.addEventListener("click", () => handleDistributionAddDeduction(groupKey));
    document.getElementById(`newdist${upper}RefreshBtn`)?.addEventListener("click", () => handleDistributionRefreshGroup(groupKey));
    document.getElementById(`newdist${upper}CalcBtn`)?.addEventListener("click", () => handleDistributionCalculate(groupKey));
    document.getElementById(`newdist${upper}ClearBtn`)?.addEventListener("click", () => handleDistributionClearResults(groupKey));
  });

  root.querySelectorAll(".newdist-subtab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.distribution.activeSubtab = tab.dataset.newdistTab || "mainland";
      updateDistributionSubtabs();
    });
  });

  root.querySelectorAll("[data-newdist-close]").forEach((button) => {
    button.addEventListener("click", () => closeDistributionModal(button.dataset.newdistClose));
  });

  ["newdistBossManageModal", "newdistNameRuleModal", "newdistLogEditModal"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", (event) => {
      if (event.target.id === id) {
        closeDistributionModal(id);
      }
    });
  });

  updateDistributionSubtabs();
}

function updateDistributionSubtabs() {
  const activeKey = state.distribution.activeSubtab || "mainland";
  document.querySelectorAll(".newdist-subtab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.newdistTab === activeKey);
  });
  document.getElementById("newdistPanelMainland")?.classList.toggle("active", activeKey === "mainland");
  document.getElementById("newdistPanelWorld")?.classList.toggle("active", activeKey === "world");
}

function handleDistributionReset() {
  if (!window.confirm("분배 탭 데이터를 초기화하시겠습니까?")) return;
  initializeDistributionState();
  renderDistributionTab();
}

async function handleDistributionLoadExcel() {
  const fileInput = document.getElementById("newdistFileInput");
  const file = fileInput?.files?.[0];
  if (!file) {
    alert("보스로그 엑셀 파일을 선택해주세요.");
    return;
  }

  try {
    const workbook = await readWorkbookFile(file);
    const rows = readDistributionSheetRows(workbook);
    const parsedLogs = buildDistributionLogsFromRows(rows);

    state.distribution.workbookName = file.name;
    state.distribution.rawLogs = parsedLogs;
    rebuildDistributionWorkingLogs();
    renderDistributionTab();

    const loadedCount = state.distribution.loadedLogs.length;
    const unknownCount = state.distribution.unknownBosses.length;
    alert(`엑셀 로드가 완료되었습니다.\n작업 로그 ${loadedCount}건${unknownCount ? `\n미분류 보스 ${unknownCount}건` : ""}`);
  } catch (error) {
    alert(error.message || "엑셀 로드 중 오류가 발생했습니다.");
  }
}

function handleDistributionAddBossRule() {
  state.distribution.bossRules.push(createBossRule("", 1, "mainland"));
  renderDistributionBossRules();
}

function handleDistributionSaveBossRules() {
  sanitizeDistributionBossRules();
  rebuildDistributionWorkingLogs();
  renderDistributionTab();
  closeDistributionModal("newdistBossManageModal");
  alert("분배 보스 관리가 저장되었습니다.");
}

function handleDistributionAddNameRule() {
  state.distribution.nameRules.push(createNameRule("", ""));
  renderDistributionNameRules();
}

function handleDistributionSaveNameRules() {
  sanitizeDistributionNameRules();
  rebuildDistributionWorkingLogs();
  renderDistributionTab();
  closeDistributionModal("newdistNameRuleModal");
  alert("참여자 이름 정리가 저장되었습니다.");
}

function handleDistributionAddDeduction(groupKey) {
  state.distribution[groupKey].deductions.push(createDistributionDeduction("", "percent", ""));
  renderDistributionGroup(groupKey);
}

function handleDistributionRefreshGroup(groupKey) {
  rebuildDistributionWorkingLogs();
  state.distribution[groupKey].results = [];
  renderDistributionTab();
}

function handleDistributionCalculate(groupKey) {
  rebuildDistributionWorkingLogs();
  calculateDistributionResults(groupKey);
  renderDistributionTab();
}

function handleDistributionClearResults(groupKey) {
  state.distribution[groupKey].results = [];
  renderDistributionGroup(groupKey);
}

function handleDistributionClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  const role = target.dataset.role;

  if (role === "newdist-delete-boss") {
    state.distribution.bossRules = state.distribution.bossRules.filter((row) => row.id !== target.dataset.id);
    renderDistributionBossRules();
    return;
  }

  if (role === "newdist-delete-name") {
    state.distribution.nameRules = state.distribution.nameRules.filter((row) => row.id !== target.dataset.id);
    renderDistributionNameRules();
    return;
  }

  if (role === "newdist-delete-deduction") {
    const groupKey = target.dataset.group;
    state.distribution[groupKey].deductions = state.distribution[groupKey].deductions.filter((row) => row.id !== target.dataset.id);
    renderDistributionGroup(groupKey);
    return;
  }

  if (role === "newdist-edit-log") {
    openDistributionLogEdit(target.dataset.group, target.dataset.logKey);
  }
}

function handleDistributionInput(event) {
  const target = event.target;
  const distribution = state.distribution;
  const role = target.dataset.role;

  if (target.id === "newdistTotalDiamondInput") {
    distribution.totalDiamond = Math.max(0, Math.floor(Number(target.value) || 0));
    renderDistributionTab();
    return;
  }

  if (target.id === "newdistMainlandRatioInput") {
    const value = clampPercent(target.value);
    distribution.mainlandRatio = value;
    distribution.worldRatio = 100 - value;
    renderDistributionTab();
    return;
  }

  if (target.id === "newdistWorldRatioInput") {
    const value = clampPercent(target.value);
    distribution.worldRatio = value;
    distribution.mainlandRatio = 100 - value;
    renderDistributionTab();
    return;
  }

  if (role === "newdist-boss-name") {
    const row = distribution.bossRules.find((entry) => entry.id === target.dataset.id);
    if (row) row.name = target.value;
    return;
  }

  if (role === "newdist-boss-score") {
    const row = distribution.bossRules.find((entry) => entry.id === target.dataset.id);
    if (row) row.score = Math.max(1, Math.floor(Number(target.value) || 1));
    return;
  }

  if (role === "newdist-name-source") {
    const row = distribution.nameRules.find((entry) => entry.id === target.dataset.id);
    if (row) row.source = target.value;
    return;
  }

  if (role === "newdist-name-target") {
    const row = distribution.nameRules.find((entry) => entry.id === target.dataset.id);
    if (row) row.target = target.value;
    return;
  }

  if (role === "newdist-deduction-name") {
    const row = findDistributionDeductionRow(target.dataset.group, target.dataset.id);
    if (row) row.name = target.value;
    return;
  }

  if (role === "newdist-deduction-value") {
    const row = findDistributionDeductionRow(target.dataset.group, target.dataset.id);
    if (row) {
      row.value = target.value === "" ? "" : Math.max(0, Number(target.value) || 0);
      renderDistributionGroup(target.dataset.group);
    }
  }
}

function handleDistributionChange(event) {
  const target = event.target;
  const role = target.dataset.role;

  if (role === "newdist-boss-group") {
    const row = state.distribution.bossRules.find((entry) => entry.id === target.dataset.id);
    if (row) row.group = target.value === "world" ? "world" : "mainland";
    return;
  }

  if (role === "newdist-deduction-mode") {
    const row = findDistributionDeductionRow(target.dataset.group, target.dataset.id);
    if (row) {
      row.mode = target.value === "amount" ? "amount" : "percent";
      renderDistributionGroup(target.dataset.group);
    }
  }
}

function openDistributionModal(id) {
  document.getElementById(id)?.classList.add("open");
  if (id === "newdistBossManageModal") renderDistributionBossRules();
  if (id === "newdistNameRuleModal") renderDistributionNameRules();
}

function closeDistributionModal(id) {
  document.getElementById(id)?.classList.remove("open");
}

function openDistributionLogEdit(groupKey, logKey) {
  const log = state.distribution[groupKey].logs.find((entry) => entry.key === logKey);
  if (!log) return;
  state.distribution.editingLogKey = logKey;
  const current = document.getElementById("newdistLogEditCurrent");
  const edited = document.getElementById("newdistLogEditEdited");
  if (current) current.value = log.workingParticipants.join(", ");
  if (edited) edited.value = log.overrideParticipants ? log.overrideParticipants.join(", ") : log.workingParticipants.join(", ");
  openDistributionModal("newdistLogEditModal");
}

function handleDistributionApplyLogEdit() {
  const logKey = state.distribution.editingLogKey;
  if (!logKey) return;
  const edited = document.getElementById("newdistLogEditEdited");
  const nextParticipants = splitParticipantText(edited?.value || "");
  const targetLog = state.distribution.loadedLogs.find((entry) => entry.key === logKey);
  if (!targetLog) return;

  targetLog.overrideParticipants = dedupeStrings(nextParticipants);
  rebuildDistributionWorkingLogs();
  renderDistributionTab();
  closeDistributionModal("newdistLogEditModal");
}

function findDistributionDeductionRow(groupKey, rowId) {
  return state.distribution[groupKey]?.deductions?.find((entry) => entry.id === rowId) || null;
}

function clampPercent(value) {
  const num = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(100, num));
}

async function readWorkbookFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: "array", cellDates: true });
}

function readDistributionSheetRows(workbook) {
  const preferredSheet = workbook.SheetNames.find((name) => /보스|boss/i.test(name)) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[preferredSheet];
  if (!sheet) {
    throw new Error("읽을 수 있는 시트가 없습니다.");
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("엑셀에 읽을 데이터가 없습니다.");
  }
  return rows;
}

function buildDistributionLogsFromRows(rows) {
  const logs = [];

  rows.forEach((row, index) => {
    const keys = Object.keys(row);
    const dateKey = findDistributionHeaderKey(keys, ["날짜", "date"]);
    const timeKey = findDistributionHeaderKey(keys, ["시간", "time"]);
    const bossKey = findDistributionHeaderKey(keys, ["보스", "boss"]);
    const cutterKey = findDistributionHeaderKey(keys, ["컷", "막타", "cutter", "커터"]);
    const participantsKey = findDistributionHeaderKey(keys, ["참여", "인원", "멤버", "member", "participants"]);

    const dateText = normalizeDistributionDateText(row[dateKey]);
    const timeText = normalizeDistributionTimeText(row[timeKey]);
    const boss = String(row[bossKey] ?? "").trim();
    const cutter = String(row[cutterKey] ?? "").trim();

    let participantText = participantsKey ? row[participantsKey] : "";
    if (!String(participantText ?? "").trim()) {
      const excludedKeys = new Set([dateKey, timeKey, bossKey, cutterKey].filter(Boolean));
      const remainingValues = keys
        .filter((key) => !excludedKeys.has(key))
        .map((key) => String(row[key] ?? "").trim())
        .filter(Boolean);
      participantText = remainingValues.join(", ");
    }

    const participants = dedupeStrings(splitParticipantText(participantText));
    if (!boss && participants.length === 0 && !dateText && !timeText) return;

    logs.push({
      key: createDistributionId(`log_${index}`),
      dateText,
      timeText,
      boss,
      cutter,
      rawParticipants: participants,
      overrideParticipants: null
    });
  });

  return logs;
}

function findDistributionHeaderKey(keys, words) {
  const lowered = keys.map((key) => ({ key, lowered: String(key).toLowerCase() }));
  const exact = lowered.find((entry) => words.some((word) => entry.lowered.includes(String(word).toLowerCase())));
  return exact?.key || "";
}

function normalizeDistributionDateText(value) {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).trim();
  if (!text) return "";
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const cleaned = text.replace(/\./g, "-").replace(/\//g, "-");
  return cleaned;
}

function normalizeDistributionTimeText(value) {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).trim();
  if (!text) return "";
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
  }
  return text;
}

function splitParticipantText(text) {
  return String(text ?? "")
    .replace(/\n/g, ",")
    .split(/[,\|\/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupeStrings(values) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const key = String(value).trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(key);
  });
  return result;
}

function sanitizeDistributionBossRules() {
  state.distribution.bossRules = state.distribution.bossRules
    .map((row) => ({
      ...row,
      name: String(row.name || "").trim(),
      score: Math.max(1, Math.floor(Number(row.score) || 1)),
      group: row.group === "world" ? "world" : "mainland"
    }))
    .filter((row) => row.name);
}

function sanitizeDistributionNameRules() {
  state.distribution.nameRules = state.distribution.nameRules
    .map((row) => ({
      ...row,
      source: String(row.source || "").trim(),
      target: String(row.target || "").trim()
    }))
    .filter((row) => row.source && row.target);
}

function rebuildDistributionWorkingLogs() {
  sanitizeDistributionBossRules();
  sanitizeDistributionNameRules();

  state.distribution.loadedLogs = [];
  state.distribution.unknownBosses = [];
  state.distribution.mainland.logs = [];
  state.distribution.world.logs = [];

  const bossRuleMap = new Map(state.distribution.bossRules.map((row) => [normalizeDistributionName(row.name), row]));
  const nameRuleMap = new Map(state.distribution.nameRules.map((row) => [normalizeDistributionName(row.source), row.target.trim()]));
  const memberNameMap = new Map(state.members.map((member) => [normalizeDistributionName(member.name), member.name]));

  state.distribution.rawLogs.forEach((rawLog) => {
    const bossRule = bossRuleMap.get(normalizeDistributionName(rawLog.boss));
    if (!bossRule) {
      state.distribution.unknownBosses.push(rawLog);
      return;
    }

    const baseParticipants = Array.isArray(rawLog.overrideParticipants) && rawLog.overrideParticipants !== null
      ? rawLog.overrideParticipants
      : rawLog.rawParticipants;

    const workingParticipants = dedupeStrings(baseParticipants.map((name) => {
      const normalized = normalizeDistributionName(name);
      const mappedName = nameRuleMap.get(normalized) || memberNameMap.get(normalized) || String(name).trim();
      return mappedName;
    }).filter(Boolean));

    const nextLog = {
      ...rawLog,
      group: bossRule.group,
      score: bossRule.score,
      workingParticipants
    };

    state.distribution.loadedLogs.push(nextLog);
    state.distribution[bossRule.group].logs.push(nextLog);
  });

  state.distribution.mainland.dirtyLogs = false;
  state.distribution.world.dirtyLogs = false;
}

function calculateDistributionResults(groupKey) {
  const group = state.distribution[groupKey];
  const memberMap = new Map(state.members.map((member) => [normalizeDistributionName(member.name), member]));
  const pointMap = new Map();

  group.logs.forEach((log) => {
    const score = Math.max(1, Number(log.score) || 1);
    log.workingParticipants.forEach((participant) => {
      const key = normalizeDistributionName(participant);
      const current = pointMap.get(key) || {
        memberName: participant,
        points: 0,
        isRetired: !memberMap.has(key)
      };
      current.memberName = memberMap.get(key)?.name || participant;
      current.points += score;
      current.isRetired = !memberMap.has(key);
      pointMap.set(key, current);
    });
  });

  const assigned = getDistributionAssignedAmounts()[groupKey];
  const deductionTotal = group.deductions.reduce((sum, row) => sum + getDistributionDeductionAmount(groupKey, row), 0);
  const actualDiamond = Math.max(0, assigned - deductionTotal);
  const activeTotalPoints = Array.from(pointMap.values()).filter((row) => !row.isRetired).reduce((sum, row) => sum + row.points, 0);
  const perPoint = activeTotalPoints > 0 ? actualDiamond / activeTotalPoints : 0;

  const rows = Array.from(pointMap.values())
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      return String(left.memberName).localeCompare(String(right.memberName), "ko");
    })
    .map((row) => {
      if (row.isRetired) {
        return {
          memberName: row.memberName,
          points: row.points,
          ratio: 0,
          rawDiamond: 0,
          finalDiamond: 0,
          note: "탈퇴한 길드원"
        };
      }

      const rawDiamond = row.points * perPoint;
      return {
        memberName: row.memberName,
        points: row.points,
        ratio: activeTotalPoints > 0 ? row.points / activeTotalPoints : 0,
        rawDiamond,
        finalDiamond: Math.floor(rawDiamond),
        note: ""
      };
    });

  group.results = rows;
  group.summary = calculateDistributionGroupSummary(groupKey);
}

function normalizeDistributionName(value) {
  return String(value ?? "").trim().replace(/\s+/g, "").toLowerCase();
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return Math.round(num).toLocaleString("ko-KR");
}

function formatDecimal(value, digits = 1) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return "0";
  return num.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return "0.00%";
  return `${(num * 100).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = String(value ?? "");
  }
}
