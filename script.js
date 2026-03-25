import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mgmvyapblwiwjaytkgwl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fzA0-8AjS9D1xtXLkgdo1Q_iCY-dYJV";
const ADMIN_PASSWORD = "1234";
const ACCESSORY_PARTS = [
  { key: "ring_count", label: "반지" },
  { key: "necklace_count", label: "목걸이" },
  { key: "earring_count", label: "귀걸이" },
  { key: "belt_count", label: "허리띠" },
  { key: "bracelet_count", label: "팔찌" }
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  activeTab: "power",
  pendingManageType: null,
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
  draftMemberId: null,
  draftTab: null,
  draftPower: "",
  draftOwnedMap: {},
  draftAccessoryMap: {},
  draftAllRows: {},
  overallEditMode: false,
  powerSortDirection: "desc",
  hiddenAccessoryGroupIds: {},
  isBulkSaving: false,
  bulkSaveProgress: 0,
  importPreview: null
};

const el = {};

document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  bindEvents();
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

      if (nextTab === "special") {
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

  const isSpecial = state.activeTab === "special";
  const isAccessory = state.activeTab === "accessory";
  const isBoss = state.activeTab === "boss";
  const isPower = state.activeTab === "power";

  el.guildManageBtn.disabled = isSpecial;
  el.bulkEditBtn.disabled = isSpecial;
  el.bulkEditBtn.classList.toggle("hidden", state.overallEditMode);
  el.bulkSaveBtn.classList.toggle("hidden", !state.overallEditMode);
  el.bulkCancelBtn.classList.toggle("hidden", !state.overallEditMode);
  el.bulkSaveBtn.disabled = isSpecial || state.isBulkSaving;
  el.bulkCancelBtn.disabled = isSpecial || state.isBulkSaving;
  el.itemManageBtn.disabled = isSpecial || isPower || state.isBulkSaving;
  el.guildManageBtn.disabled = isSpecial || state.isBulkSaving;
  el.bulkEditBtn.disabled = isSpecial || state.isBulkSaving;
  el.searchBtn.disabled = isSpecial || state.isBulkSaving;
  el.resetBtn.disabled = isSpecial || state.isBulkSaving;
  el.searchInput.disabled = isSpecial || state.isBulkSaving;
  el.bossSearchInput.disabled = !isBoss || isSpecial || state.isBulkSaving;
  el.bossSearchInput.classList.toggle("hidden", !isBoss);
  el.itemManageBtn.classList.toggle("hidden", isPower);
  el.importOpenBtn.classList.toggle("hidden", !(state.activeTab === "mount" || state.activeTab === "boss"));
  el.importOpenBtn.disabled = isSpecial || isPower || isAccessory || state.isBulkSaving;
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
    supabase.from("member_mounts").select("id, member_id, mount_id, owned")
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
      .select("id, member_id, boss_collection_id, owned")
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
  if (!state.powerSortDirection) return members;

  const direction = state.powerSortDirection === "asc" ? 1 : -1;

  return [...members].sort((left, right) => {
    const leftPower = Number(left.power ?? 0);
    const rightPower = Number(right.power ?? 0);

    if (leftPower !== rightPower) {
      return (leftPower - rightPower) * direction;
    }

    return String(left.name ?? "").localeCompare(String(right.name ?? ""), "ko");
  });
}

function getEditableMember() {
  if (state.overallEditMode) return null;
  if (!state.searchTerm.trim() || !state.selectedMemberId) return null;
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

  if (state.activeTab === "special") {
    renderPlaceholderTable();
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

  el.tableGuideText.textContent = state.activeTab === "power"
    ? "선택된 길드원 1명만 표시됩니다. 이 행에서 최고 투력을 수정할 수 있습니다."
    : state.activeTab === "accessory"
      ? "선택된 길드원 1명만 표시됩니다. 이 행에서 악세사리 수량을 수정할 수 있습니다."
      : "선택된 길드원 1명만 표시됩니다. 이 행에서 보유 상태를 수정할 수 있습니다.";
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
    `<th class="last-updated-col">수정일</th>`
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

    const saveCell = state.overallEditMode
      ? `<span class="notice-text action-box">일괄</span>`
      : isEditable
        ? `<button class="btn btn-primary btn-sm" type="button" data-role="save-row-power" data-member-id="${member.id}">저장</button>`
        : `<span class="notice-text action-box">불가</span>`;

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
    `<th class="last-updated-col">수정일</th>`
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

    const saveCell = state.overallEditMode
      ? `<span class="notice-text action-box">일괄</span>`
      : isEditable
        ? `<button class="btn btn-primary btn-sm" type="button" data-role="save-row-mount" data-member-id="${member.id}">저장</button>`
        : `<span class="notice-text action-box">불가</span>`;

    const lastUpdatedCell = `<span class="last-updated-box">${formatUpdatedAt(member.updated_at)}</span>`;

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
    `<th class="last-updated-col">수정일</th>`
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

    const saveCell = state.overallEditMode
      ? `<span class="notice-text action-box">일괄</span>`
      : isEditable
        ? `<button class="btn btn-primary btn-sm" type="button" data-role="save-row-boss" data-member-id="${member.id}">저장</button>`
        : `<span class="notice-text action-box">불가</span>`;

    const lastUpdatedCell = `<span class="last-updated-box">${formatUpdatedAt(member.updated_at)}</span>`;

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
    `<th rowspan="2" class="last-updated-col">수정일</th>`
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

    const saveCell = state.overallEditMode
      ? `<span class="notice-text action-box">일괄</span>`
      : isEditable
        ? `<button class="btn btn-primary btn-sm" type="button" data-role="save-row-accessory" data-member-id="${member.id}">저장</button>`
        : `<span class="notice-text action-box">불가</span>`;

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
  el.searchInput.value = member.name;
  closeSearchSelectModal();
  syncDraftState();
  renderAll();
}

function closeSearchSelectModal() {
  closeModal(el.searchSelectModalBackdrop);
}

function renderPlaceholderTable() {
  el.tableGuideText.textContent = "현재는 특수 탭만 준비중입니다.";
  el.summaryTableHead.innerHTML = `
    <tr>
      <th>no</th>
      <th>항목</th>
      <th>상태</th>
    </tr>
  `;
  el.summaryTableBody.innerHTML = `
    <tr>
      <td>1</td>
      <td>특수</td>
      <td>준비중</td>
    </tr>
  `;
}

function renderGuildManageTable() {
  if (state.members.length === 0) {
    el.guildManageTableBody.innerHTML = `<tr><td colspan="4">등록된 길드원이 없습니다.</td></tr>`;
    return;
  }

  el.guildManageTableBody.innerHTML = state.members.map((member, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(member.name)}</td>
      <td>${member.power ?? 0}</td>
      <td>
        <div class="row-actions">
          <button class="text-btn" type="button" data-action="edit-member" data-id="${member.id}">수정</button>
          <button class="text-btn danger" type="button" data-action="delete-member" data-id="${member.id}">삭제</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderItemManageTable() {
  const items = state.activeTab === "accessory" ? state.accessoryGroups : state.activeTab === "boss" ? state.bossItems : state.mountItems;
  const emptyText = state.activeTab === "accessory" ? "등록된 악세사리가 없습니다." : state.activeTab === "boss" ? "등록된 보스컬렉이 없습니다." : "등록된 탈것이 없습니다.";

  if (items.length === 0) {
    el.itemManageTableBody.innerHTML = `<tr><td colspan="${state.activeTab === "accessory" ? 4 : 3}">${emptyText}</td></tr>`;
    return;
  }

  el.itemManageTableBody.innerHTML = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
      ${state.activeTab === "accessory" ? `<td>${Number(item.max_count ?? 0)}</td>` : ""}
      <td>
        <div class="row-actions">
          <button class="text-btn" type="button" data-action="edit-item" data-id="${item.id}">수정</button>
          <button class="text-btn danger" type="button" data-action="delete-item" data-id="${item.id}">삭제</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function handleSummaryTableInput(event) {
  const target = event.target;

  if (target.matches('[data-role="power-input"]')) {
    const memberId = target.dataset.memberId;
    if (state.overallEditMode) {
      ensureDraftRow(memberId).power = target.value;
    } else {
      state.draftPower = target.value;
    }
    return;
  }

  if (target.matches('[data-role="accessory-qty-input"]')) {
    const memberId = target.dataset.memberId;
    const groupId = target.dataset.groupId;
    const partKey = target.dataset.partKey;
    if (!state.overallEditMode && memberId !== state.draftMemberId) return;

    const group = state.accessoryGroups.find((entry) => String(entry.id) === String(groupId));
    const maxCount = Number(group?.max_count ?? 0);
    const value = Math.min(maxCount, Math.max(0, Math.floor(Number(target.value) || 0)));
    if (state.overallEditMode) {
      const draftRow = ensureDraftRow(memberId);
      if (!draftRow.accessoryMap[groupId]) {
        draftRow.accessoryMap[groupId] = {};
      }
      draftRow.accessoryMap[groupId][partKey] = value;
    } else {
      if (!state.draftAccessoryMap[groupId]) {
        state.draftAccessoryMap[groupId] = {};
      }
      state.draftAccessoryMap[groupId][partKey] = value;
    }
    target.value = String(value);
  }
}

function handleSummaryTableHeadClick(event) {
  const hideButton = event.target.closest('[data-role="toggle-accessory-group-hidden"]');
  if (hideButton) {
    toggleAccessoryGroupHidden(hideButton.dataset.groupId);
    return;
  }

  const header = event.target.closest('[data-role="power-sort-header"]');
  if (!header) return;

  if (state.powerSortDirection === "asc") {
    state.powerSortDirection = "desc";
  } else if (state.powerSortDirection === "desc") {
    state.powerSortDirection = null;
  } else {
    state.powerSortDirection = "asc";
  }

  renderSummaryTable();
}

function handleSummaryTableClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const role = button.dataset.role;

  if (role === "owned-toggle") {
    const memberId = button.dataset.memberId;
    const itemId = button.dataset.itemId;
    if (!state.overallEditMode && memberId !== state.draftMemberId) return;

    if (state.overallEditMode) {
      const draftRow = ensureDraftRow(memberId);
      draftRow.ownedMap[itemId] = !Boolean(draftRow.ownedMap[itemId]);
    } else {
      state.draftOwnedMap[itemId] = !Boolean(state.draftOwnedMap[itemId]);
    }
    renderSummaryTable();
    return;
  }

  if (role === "toggle-accessory-group-hidden") {
    toggleAccessoryGroupHidden(button.dataset.groupId);
    return;
  }

  if (role === "save-row-power") {
    savePowerEditableRow(button.dataset.memberId);
    return;
  }

  if (role === "save-row-mount") {
    saveMountEditableRow(button.dataset.memberId);
    return;
  }

  if (role === "save-row-accessory") {
    saveAccessoryEditableRow(button.dataset.memberId);
    return;
  }

  if (role === "save-row-boss") {
    saveBossEditableRow(button.dataset.memberId);
  }
}

async function updateMemberPower(memberId, power, updatedAt) {
  const updateMemberRes = await supabase
    .from("guild_members")
    .update({ power: Math.floor(power), updated_at: updatedAt })
    .eq("id", memberId);

  if (updateMemberRes.error) {
    throw new Error(`전투력 저장 중 오류가 발생했습니다.\n${updateMemberRes.error.message}`);
  }
}

async function persistPowerRow(memberId, draftRow, power) {
  await updateMemberPower(memberId, power, new Date().toISOString());
}

async function persistMountRow(memberId, draftRow) {
  const upsertPayload = state.mountItems.map((item) => ({
    member_id: memberId,
    mount_id: item.id,
    owned: Boolean(draftRow?.ownedMap?.[item.id])
  }));

  const upsertRes = await supabase
    .from("member_mounts")
    .upsert(upsertPayload, { onConflict: "member_id,mount_id" });

  if (upsertRes.error) {
    throw new Error(`보유 상태 저장 중 오류가 발생했습니다.\n${upsertRes.error.message}`);
  }
}

async function persistAccessoryRow(memberId, draftRow) {
  const now = new Date().toISOString();

  const upsertPayload = state.accessoryGroups.map((group) => {
    const maxCount = Number(group.max_count ?? 0);
    const normalizeCount = (value) => Math.min(maxCount, Math.max(0, Math.floor(Number(value) || 0)));

    return {
      member_id: memberId,
      accessory_group_id: group.id,
      ring_count: normalizeCount(draftRow?.accessoryMap?.[group.id]?.ring_count),
      necklace_count: normalizeCount(draftRow?.accessoryMap?.[group.id]?.necklace_count),
      earring_count: normalizeCount(draftRow?.accessoryMap?.[group.id]?.earring_count),
      belt_count: normalizeCount(draftRow?.accessoryMap?.[group.id]?.belt_count),
      bracelet_count: normalizeCount(draftRow?.accessoryMap?.[group.id]?.bracelet_count),
      updated_at: now
    };
  });

  const upsertRes = await supabase
    .from("member_accessories")
    .upsert(upsertPayload, { onConflict: "member_id,accessory_group_id" });

  if (upsertRes.error) {
    throw new Error(`악세사리 저장 중 오류가 발생했습니다.\n${upsertRes.error.message}`);
  }
}

async function persistBossRow(memberId, draftRow) {
  const now = new Date().toISOString();

  const upsertPayload = state.bossItems.map((item) => ({
    member_id: memberId,
    boss_collection_id: item.id,
    owned: Boolean(draftRow?.ownedMap?.[item.id]),
    updated_at: now
  }));

  const upsertRes = await supabase
    .from("member_boss_collections")
    .upsert(upsertPayload, { onConflict: "member_id,boss_collection_id" });

  if (upsertRes.error) {
    throw new Error(`보스컬렉 저장 중 오류가 발생했습니다.\n${upsertRes.error.message}`);
  }
}

async function saveAllOverallEdits() {
  if (!state.overallEditMode || state.isBulkSaving) return;

  const memberIds = Object.keys(state.draftAllRows);
  if (memberIds.length === 0) {
    alert("저장할 변경사항이 없습니다.");
    return;
  }

  state.isBulkSaving = true;
  setBulkSaveProgress(0);
  updateTabUi();

  try {
    for (let index = 0; index < memberIds.length; index += 1) {
      const memberId = memberIds[index];
      const draftRow = ensureDraftRow(memberId);
      const power = Number(draftRow?.power);

      if (state.activeTab === "power") {
        if (!Number.isFinite(power) || power < 0) {
          throw new Error("전투력을 올바르게 입력해주세요.");
        }
        await persistPowerRow(memberId, draftRow, power);
      } else if (state.activeTab === "accessory") {
        await persistAccessoryRow(memberId, draftRow);
      } else if (state.activeTab === "boss") {
        await persistBossRow(memberId, draftRow);
      } else {
        await persistMountRow(memberId, draftRow);
      }

      setBulkSaveProgress(((index + 1) / memberIds.length) * 100);
    }

    resetOverallEditMode();

    if (state.activeTab === "power") {
      await loadPowerData();
    } else if (state.activeTab === "accessory") {
      await loadAccessoryData();
    } else if (state.activeTab === "boss") {
      await loadBossData();
    } else {
      await loadMountData();
    }

    renderAll();
    alert("저장되었습니다.");
  } catch (error) {
    alert(error.message);
  } finally {
    setBulkSaveProgress(100);
    state.isBulkSaving = false;
    renderAll();
  }
}

async function savePowerEditableRow(memberId) {
  if (!state.overallEditMode && memberId !== state.draftMemberId) return;

  const draftRow = state.overallEditMode
    ? ensureDraftRow(memberId)
    : { power: state.draftPower };
  const power = Number(draftRow?.power);
  if (!Number.isFinite(power) || power < 0) {
    alert("전투력을 올바르게 입력해주세요.");
    return;
  }

  try {
    await persistPowerRow(memberId, draftRow, power);
  } catch (error) {
    alert(error.message);
    return;
  }

  if (!state.overallEditMode) {
    resetSearchState();
  }
  await loadPowerData();
  if (state.overallEditMode) {
    state.draftAllRows = {};
  }
  renderAll();
  alert("저장되었습니다.");
}

async function saveMountEditableRow(memberId) {
  if (!state.overallEditMode && memberId !== state.draftMemberId) return;

  const draftRow = state.overallEditMode
    ? ensureDraftRow(memberId)
    : { power: state.draftPower, ownedMap: { ...state.draftOwnedMap } };
  try {
    await persistMountRow(memberId, draftRow);
  } catch (error) {
    alert(error.message);
    return;
  }

  if (!state.overallEditMode) {
    resetSearchState();
  }
  await loadMountData();
  if (state.overallEditMode) {
    state.draftAllRows = {};
  }
  renderAll();
  alert("저장되었습니다.");
}

async function saveAccessoryEditableRow(memberId) {
  if (!state.overallEditMode && memberId !== state.draftMemberId) return;

  const draftRow = state.overallEditMode
    ? ensureDraftRow(memberId)
    : { power: state.draftPower, accessoryMap: structuredClone(state.draftAccessoryMap) };
  try {
    await persistAccessoryRow(memberId, draftRow);
  } catch (error) {
    alert(error.message);
    return;
  }

  if (!state.overallEditMode) {
    resetSearchState();
  }
  await loadAccessoryData();
  if (state.overallEditMode) {
    state.draftAllRows = {};
  }
  renderAll();
  alert("저장되었습니다.");
}

async function saveBossEditableRow(memberId) {
  if (!state.overallEditMode && memberId !== state.draftMemberId) return;

  const draftRow = state.overallEditMode
    ? ensureDraftRow(memberId)
    : { power: state.draftPower, ownedMap: { ...state.draftOwnedMap } };
  try {
    await persistBossRow(memberId, draftRow);
  } catch (error) {
    alert(error.message);
    return;
  }

  if (!state.overallEditMode) {
    resetSearchState();
  }
  await loadBossData();
  if (state.overallEditMode) {
    state.draftAllRows = {};
  }
  renderAll();
  alert("저장되었습니다.");
}

function resetSearchState() {
  state.searchTerm = "";
  state.selectedMemberId = null;
  state.draftTab = null;
  el.searchInput.value = "";
}

function openPasswordModal(type) {
  if (state.activeTab === "special") {
    alert("현재는 특수 탭을 사용할 수 없습니다.");
    return;
  }

  state.pendingManageType = type;
  el.passwordInput.value = "";
  el.passwordErrorText.classList.add("hidden");
  openModal(el.passwordModalBackdrop);
  setTimeout(() => el.passwordInput.focus(), 0);
}

function closePasswordModal() {
  state.pendingManageType = null;
  closeModal(el.passwordModalBackdrop);
}

function confirmPassword() {
  if (el.passwordInput.value !== ADMIN_PASSWORD) {
    el.passwordErrorText.classList.remove("hidden");
    return;
  }

  closeModal(el.passwordModalBackdrop);
  el.passwordErrorText.classList.add("hidden");

  if (state.pendingManageType === "guild") {
    openModal(el.guildManageModalBackdrop);
  }

  if (state.pendingManageType === "item") {
    openModal(el.itemManageModalBackdrop);
  }

  if (state.pendingManageType === "bulk-edit") {
    state.overallEditMode = true;
    state.draftAllRows = {};
    renderAll();
  }

  if (state.pendingManageType === "import") {
    openImportModal();
  }

  state.pendingManageType = null;
}

function handleGuildManageTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "edit-member") {
    editMember(button.dataset.id);
    return;
  }

  if (button.dataset.action === "delete-member") {
    deleteMember(button.dataset.id);
  }
}

function handleItemManageTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "edit-item") {
    editItem(button.dataset.id);
    return;
  }

  if (button.dataset.action === "delete-item") {
    deleteItem(button.dataset.id);
  }
}

async function addMember() {
  const nameValue = prompt("추가할 길드원명을 입력해주세요.");
  if (nameValue === null) return;

  const name = nameValue.trim();
  if (!name) {
    alert("길드원명을 입력해주세요.");
    return;
  }

  if (state.members.some((member) => member.name === name)) {
    alert("이미 존재하는 길드원명입니다.");
    return;
  }

  const powerValue = prompt("전투력을 입력해주세요.", "0");
  if (powerValue === null) return;

  const power = Number(powerValue);
  if (!Number.isFinite(power) || power < 0) {
    alert("전투력을 올바르게 입력해주세요.");
    return;
  }

  const insertRes = await supabase
    .from("guild_members")
    .insert({ name, power: Math.floor(power) })
    .select("id, name, power, updated_at")
    .single();

  if (insertRes.error) {
    alert(`길드원 추가 중 오류가 발생했습니다.\n${insertRes.error.message}`);
    return;
  }

  const newMember = insertRes.data;

  if (state.mountItems.length > 0) {
    const memberMountPayload = state.mountItems.map((item) => ({
      member_id: newMember.id,
      mount_id: item.id,
      owned: false
    }));

    const memberMountRes = await supabase
      .from("member_mounts")
      .upsert(memberMountPayload, { onConflict: "member_id,mount_id" });

    if (memberMountRes.error) {
      alert(`길드원 기본 탈것 정보 생성 중 오류가 발생했습니다.\n${memberMountRes.error.message}`);
      return;
    }
  }

  if (state.accessoryGroups.length > 0) {
    const now = new Date().toISOString();
    const memberAccessoryPayload = state.accessoryGroups.map((group) => ({
      member_id: newMember.id,
      accessory_group_id: group.id,
      ring_count: Number(group.max_count ?? 0),
      necklace_count: Number(group.max_count ?? 0),
      earring_count: Number(group.max_count ?? 0),
      belt_count: Number(group.max_count ?? 0),
      bracelet_count: Number(group.max_count ?? 0),
      updated_at: now
    }));

    const memberAccessoryRes = await supabase
      .from("member_accessories")
      .upsert(memberAccessoryPayload, { onConflict: "member_id,accessory_group_id" });

    if (memberAccessoryRes.error) {
      alert(`길드원 기본 악세사리 정보 생성 중 오류가 발생했습니다.\n${memberAccessoryRes.error.message}`);
      return;
    }
  }

  if (state.bossItems.length > 0) {
    const now = new Date().toISOString();
    const memberBossPayload = state.bossItems.map((item) => ({
      member_id: newMember.id,
      boss_collection_id: item.id,
      owned: false,
      updated_at: now
    }));

    const memberBossRes = await supabase
      .from("member_boss_collections")
      .upsert(memberBossPayload, { onConflict: "member_id,boss_collection_id" });

    if (memberBossRes.error) {
      alert(`길드원 기본 보스컬렉 정보 생성 중 오류가 발생했습니다.\n${memberBossRes.error.message}`);
      return;
    }
  }

  await loadActiveTabData();
  renderAll();
}

async function editMember(memberId) {
  const member = state.members.find((entry) => entry.id === memberId);
  if (!member) return;

  const nextNameValue = prompt("길드원명을 수정해주세요.", member.name);
  if (nextNameValue === null) return;

  const nextName = nextNameValue.trim();
  if (!nextName) {
    alert("길드원명을 입력해주세요.");
    return;
  }

  if (state.members.some((entry) => entry.id !== memberId && entry.name === nextName)) {
    alert("이미 존재하는 길드원명입니다.");
    return;
  }

  const nextPowerValue = prompt("전투력을 수정해주세요.", String(member.power ?? 0));
  if (nextPowerValue === null) return;

  const nextPower = Number(nextPowerValue);
  if (!Number.isFinite(nextPower) || nextPower < 0) {
    alert("전투력을 올바르게 입력해주세요.");
    return;
  }

  const updateRes = await supabase
    .from("guild_members")
    .update({ name: nextName, power: Math.floor(nextPower), updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (updateRes.error) {
    alert(`길드원 수정 중 오류가 발생했습니다.\n${updateRes.error.message}`);
    return;
  }

  await loadActiveTabData();
  renderAll();
}

async function deleteMember(memberId) {
  const member = state.members.find((entry) => entry.id === memberId);
  if (!member) return;

  if (!confirm(`${member.name} 길드원을 삭제하시겠습니까?`)) return;

  const deleteRes = await supabase
    .from("guild_members")
    .delete()
    .eq("id", memberId);

  if (deleteRes.error) {
    alert(`길드원 삭제 중 오류가 발생했습니다.\n${deleteRes.error.message}`);
    return;
  }

  if (state.draftMemberId === memberId) {
    resetSearchState();
  }

  await loadActiveTabData();
  renderAll();
}

async function addItem() {
  if (state.activeTab === "accessory") {
    await addAccessoryGroup();
    return;
  }

  if (state.activeTab === "boss") {
    await addBossItem();
    return;
  }

  const nameValue = prompt("추가할 탈것명을 입력해주세요.");
  if (nameValue === null) return;

  const name = nameValue.trim();
  if (!name) {
    alert("탈것명을 입력해주세요.");
    return;
  }

  if (state.mountItems.some((item) => item.name === name)) {
    alert("이미 존재하는 탈것명입니다.");
    return;
  }

  const nextDisplayOrder = state.mountItems.length === 0
    ? 1
    : Math.max(...state.mountItems.map((item) => Number(item.display_order ?? 0))) + 1;

  const insertRes = await supabase
    .from("mounts")
    .insert({ name, display_order: nextDisplayOrder })
    .select("id, name, display_order")
    .single();

  if (insertRes.error) {
    alert(`탈것 추가 중 오류가 발생했습니다.\n${insertRes.error.message}`);
    return;
  }

  const newItem = insertRes.data;

  if (state.members.length > 0) {
    const memberMountPayload = state.members.map((member) => ({
      member_id: member.id,
      mount_id: newItem.id,
      owned: false
    }));

    const memberMountRes = await supabase
      .from("member_mounts")
      .upsert(memberMountPayload, { onConflict: "member_id,mount_id" });

    if (memberMountRes.error) {
      alert(`탈것 기본 보유 정보 생성 중 오류가 발생했습니다.\n${memberMountRes.error.message}`);
      return;
    }
  }

  await loadMountData();
  renderAll();
}

async function addBossItem() {
  const nameValue = prompt("추가할 보스컬렉명을 입력해주세요.");
  if (nameValue === null) return;

  const name = nameValue.trim();
  if (!name) {
    alert("보스컬렉명을 입력해주세요.");
    return;
  }

  if (state.bossItems.some((item) => item.name === name)) {
    alert("이미 존재하는 보스컬렉명입니다.");
    return;
  }

  const nextDisplayOrder = state.bossItems.length === 0
    ? 1
    : Math.max(...state.bossItems.map((item) => Number(item.display_order ?? 0))) + 1;

  const insertRes = await supabase
    .from("boss_collections")
    .insert({ name, display_order: nextDisplayOrder, updated_at: new Date().toISOString() })
    .select("id, name, display_order")
    .single();

  if (insertRes.error) {
    alert(`보스컬렉 추가 중 오류가 발생했습니다.\n${insertRes.error.message}`);
    return;
  }

  const newItem = insertRes.data;

  if (state.members.length > 0) {
    const now = new Date().toISOString();
    const memberBossPayload = state.members.map((member) => ({
      member_id: member.id,
      boss_collection_id: newItem.id,
      owned: false,
      updated_at: now
    }));

    const memberBossRes = await supabase
      .from("member_boss_collections")
      .upsert(memberBossPayload, { onConflict: "member_id,boss_collection_id" });

    if (memberBossRes.error) {
      alert(`보스컬렉 기본 보유 정보 생성 중 오류가 발생했습니다.\n${memberBossRes.error.message}`);
      return;
    }
  }

  await loadBossData();
  renderAll();
}

async function addAccessoryGroup() {
  const nameValue = prompt("추가할 악세사리명을 입력해주세요.");
  if (nameValue === null) return;

  const name = nameValue.trim();
  if (!name) {
    alert("악세사리명을 입력해주세요.");
    return;
  }

  const maxCountValue = prompt("최대값을 입력해주세요.", "0");
  if (maxCountValue === null) return;

  const maxCount = Math.floor(Number(maxCountValue));
  if (!Number.isFinite(maxCount) || maxCount < 0) {
    alert("최대값을 올바르게 입력해주세요.");
    return;
  }

  if (state.accessoryGroups.some((item) => item.name === name)) {
    alert("이미 존재하는 악세사리명입니다.");
    return;
  }

  const nextDisplayOrder = state.accessoryGroups.length === 0
    ? 1
    : Math.max(...state.accessoryGroups.map((item) => Number(item.display_order ?? 0))) + 1;

  const insertRes = await supabase
    .from("accessory_groups")
    .insert({ name, display_order: nextDisplayOrder, max_count: maxCount, updated_at: new Date().toISOString() })
    .select("id, name, display_order, max_count")
    .single();

  if (insertRes.error) {
    alert(`악세사리 추가 중 오류가 발생했습니다.\n${insertRes.error.message}`);
    return;
  }

  const newGroup = insertRes.data;

  if (state.members.length > 0) {
    const now = new Date().toISOString();
    const memberAccessoryPayload = state.members.map((member) => ({
      member_id: member.id,
      accessory_group_id: newGroup.id,
      ring_count: Number(newGroup.max_count ?? 0),
      necklace_count: Number(newGroup.max_count ?? 0),
      earring_count: Number(newGroup.max_count ?? 0),
      belt_count: Number(newGroup.max_count ?? 0),
      bracelet_count: Number(newGroup.max_count ?? 0),
      updated_at: now
    }));

    const memberAccessoryRes = await supabase
      .from("member_accessories")
      .upsert(memberAccessoryPayload, { onConflict: "member_id,accessory_group_id" });

    if (memberAccessoryRes.error) {
      alert(`악세사리 기본 수량 생성 중 오류가 발생했습니다.\n${memberAccessoryRes.error.message}`);
      return;
    }
  }

  await loadAccessoryData();
  renderAll();
}

async function editItem(itemId) {
  if (state.activeTab === "accessory") {
    await editAccessoryGroup(itemId);
    return;
  }

  if (state.activeTab === "boss") {
    await editBossItem(itemId);
    return;
  }

  const item = state.mountItems.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;

  const nextNameValue = prompt("탈것명을 수정해주세요.", item.name);
  if (nextNameValue === null) return;

  const nextName = nextNameValue.trim();
  if (!nextName) {
    alert("탈것명을 입력해주세요.");
    return;
  }

  if (state.mountItems.some((entry) => String(entry.id) !== String(itemId) && entry.name === nextName)) {
    alert("이미 존재하는 탈것명입니다.");
    return;
  }

  const updateRes = await supabase
    .from("mounts")
    .update({ name: nextName })
    .eq("id", itemId);

  if (updateRes.error) {
    alert(`탈것 수정 중 오류가 발생했습니다.\n${updateRes.error.message}`);
    return;
  }

  await loadMountData();
  renderAll();
}

async function editBossItem(itemId) {
  const item = state.bossItems.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;

  const nextNameValue = prompt("보스컬렉명을 수정해주세요.", item.name);
  if (nextNameValue === null) return;

  const nextName = nextNameValue.trim();
  if (!nextName) {
    alert("보스컬렉명을 입력해주세요.");
    return;
  }

  if (state.bossItems.some((entry) => String(entry.id) !== String(itemId) && entry.name === nextName)) {
    alert("이미 존재하는 보스컬렉명입니다.");
    return;
  }

  const updateRes = await supabase
    .from("boss_collections")
    .update({ name: nextName, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (updateRes.error) {
    alert(`보스컬렉 수정 중 오류가 발생했습니다.\n${updateRes.error.message}`);
    return;
  }

  await loadBossData();
  renderAll();
}

async function editAccessoryGroup(itemId) {
  const item = state.accessoryGroups.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;

  const nextNameValue = prompt("악세사리명을 수정해주세요.", item.name);
  if (nextNameValue === null) return;

  const nextName = nextNameValue.trim();
  if (!nextName) {
    alert("악세사리명을 입력해주세요.");
    return;
  }

  const nextMaxCountValue = prompt("최대값을 수정해주세요.", String(Number(item.max_count ?? 0)));
  if (nextMaxCountValue === null) return;

  const nextMaxCount = Math.floor(Number(nextMaxCountValue));
  if (!Number.isFinite(nextMaxCount) || nextMaxCount < 0) {
    alert("최대값을 올바르게 입력해주세요.");
    return;
  }

  if (state.accessoryGroups.some((entry) => String(entry.id) !== String(itemId) && entry.name === nextName)) {
    alert("이미 존재하는 악세사리명입니다.");
    return;
  }

  const updateRes = await supabase
    .from("accessory_groups")
    .update({ name: nextName, max_count: nextMaxCount, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (updateRes.error) {
    alert(`악세사리 수정 중 오류가 발생했습니다.\n${updateRes.error.message}`);
    return;
  }

  await loadAccessoryData();
  renderAll();
}

async function deleteItem(itemId) {
  if (state.activeTab === "accessory") {
    await deleteAccessoryGroup(itemId);
    return;
  }

  if (state.activeTab === "boss") {
    await deleteBossItem(itemId);
    return;
  }

  const item = state.mountItems.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;

  if (!confirm(`${item.name} 탈것을 삭제하시겠습니까?`)) return;

  const deleteRes = await supabase
    .from("mounts")
    .delete()
    .eq("id", itemId);

  if (deleteRes.error) {
    alert(`탈것 삭제 중 오류가 발생했습니다.\n${deleteRes.error.message}`);
    return;
  }

  await loadMountData();
  renderAll();
}

async function deleteBossItem(itemId) {
  const item = state.bossItems.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;

  if (!confirm(`${item.name} 보스컬렉을 삭제하시겠습니까?`)) return;

  const deleteRes = await supabase
    .from("boss_collections")
    .delete()
    .eq("id", itemId);

  if (deleteRes.error) {
    alert(`보스컬렉 삭제 중 오류가 발생했습니다.\n${deleteRes.error.message}`);
    return;
  }

  await loadBossData();
  renderAll();
}

async function deleteAccessoryGroup(itemId) {
  const item = state.accessoryGroups.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;

  if (!confirm(`${item.name} 악세사리를 삭제하시겠습니까?`)) return;

  const deleteRes = await supabase
    .from("accessory_groups")
    .delete()
    .eq("id", itemId);

  if (deleteRes.error) {
    alert(`악세사리 삭제 중 오류가 발생했습니다.\n${deleteRes.error.message}`);
    return;
  }

  await loadAccessoryData();
  renderAll();
}

function getOwnedValue(memberId, itemId) {
  const record = state.memberMounts.find(
    (entry) => entry.member_id === memberId && entry.mount_id === itemId
  );
  return Boolean(record?.owned);
}

function getBossOwnedValue(memberId, itemId) {
  const record = state.memberBossCollections.find(
    (entry) => entry.member_id === memberId && String(entry.boss_collection_id) === String(itemId)
  );
  return Boolean(record?.owned);
}

function getSimpleItems() {
  return state.activeTab === "boss" ? state.bossItems : state.mountItems;
}

function getSimpleMemberRecords() {
  return state.activeTab === "boss" ? state.memberBossCollections : state.memberMounts;
}

function getSimpleItemForeignKey() {
  return state.activeTab === "boss" ? "boss_collection_id" : "mount_id";
}

function getAccessoryZeroPowerCellStyle() {
  return "background-color: #fdecec;";
}

function getAccessoryZeroPowerHoverCellStyle() {
  return "background-color: #f9dede;";
}

function getAccessoryHeatCellStyle(value, maxCount) {
  const safeMax = Math.max(Number(maxCount ?? 0), 0);
  const safeValue = Math.max(0, Math.min(Number(value ?? 0), safeMax));

  if (safeMax <= 0 || safeValue <= 0) {
    return "background-color: #ffffff;";
  }

  const ratio = safeValue / safeMax;
  const saturation = 75;
  const lightness = 97 - (ratio * 14);

  return `background-color: hsl(215 ${saturation}% ${lightness}%);`;
}

function getAccessoryRecord(memberId, groupId) {
  return state.memberAccessories.find(
    (entry) => entry.member_id === memberId && String(entry.accessory_group_id) === String(groupId)
  ) ?? null;
}

function getAccessoryLatestUpdatedAt(memberId) {
  const records = state.memberAccessories.filter((entry) => entry.member_id === memberId);
  if (records.length === 0) return null;

  return records.reduce((latest, current) => {
    if (!latest) return current.updated_at;
    return new Date(current.updated_at) > new Date(latest) ? current.updated_at : latest;
  }, null);
}

function openModal(backdrop) {
  backdrop.classList.remove("hidden");
}

function closeModal(backdrop) {
  backdrop.classList.add("hidden");
}

function formatUpdatedAt(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}


function openImportModal() {
  state.importPreview = null;
  const isBoss = state.activeTab === "boss";
  el.importModalTitle.textContent = isBoss ? "보스컬렉 초기값 붙여넣기" : "탈것 초기값 붙여넣기";
  el.importModalGuideText.textContent = isBoss
    ? "첫 줄에 헤더를 포함해서 붙여넣어주세요. 첫 칸은 이름, 나머지 칸은 보스컬렉명입니다."
    : "첫 줄에 헤더를 포함해서 붙여넣어주세요. 첫 칸은 이름, 나머지 칸은 탈것명입니다.";
  el.importTextarea.value = "";
  el.importPreviewBox.textContent = "미리보기를 누르면 반영 예정 내용을 보여드립니다.";
  el.importApplyBtn.disabled = true;
  openModal(el.importModalBackdrop);
  setTimeout(() => el.importTextarea.focus(), 0);
}

function closeImportModal() {
  state.importPreview = null;
  el.importApplyBtn.disabled = true;
  closeModal(el.importModalBackdrop);
}

function getImportTargetConfig() {
  if (state.activeTab === "boss") {
    return {
      tabLabel: "보스컬렉",
      items: state.bossItems,
      conflictKey: "member_id,boss_collection_id",
      makeRow: (memberId, itemId) => ({
        member_id: memberId,
        boss_collection_id: itemId,
        owned: true
      }),
      applyOwned: (row, owned) => {
        row.owned = owned;
        row.updated_at = new Date().toISOString();
      },
      tableName: "member_boss_collections"
    };
  }

  return {
    tabLabel: "탈것",
    items: state.mountItems,
    conflictKey: "member_id,mount_id",
    makeRow: (memberId, itemId) => ({
      member_id: memberId,
      mount_id: itemId,
      owned: true
    }),
    applyOwned: (row, owned) => {
      row.owned = owned;
    },
    tableName: "member_mounts"
  };
}

function parseImportOwnedValue(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return { kind: "blank" };

  const normalized = value.toLowerCase();
  if (["1", "true", "보유", "o", "y"].includes(normalized)) return { kind: "value", owned: true };
  if (["0", "false", "미보유", "x", "n"].includes(normalized)) return { kind: "value", owned: false };
  return { kind: "invalid", value };
}

function buildImportPreview() {
  if (!(state.activeTab === "mount" || state.activeTab === "boss")) {
    throw new Error("탈것 또는 보스컬렉 탭에서만 사용할 수 있습니다.");
  }

  const raw = String(el.importTextarea.value ?? "").split("\r").join("").trim();
  if (!raw) {
    throw new Error("붙여넣을 데이터를 입력해주세요.");
  }

  const rows = raw.split("\n").map((line) => line.split("\t"));
  if (rows.length < 2) {
    throw new Error("헤더 포함 2줄 이상 데이터를 붙여넣어주세요.");
  }

  const config = getImportTargetConfig();
  const headerRow = rows[0].map((value) => String(value ?? "").trim());
  const itemMap = new Map(config.items.map((item) => [item.name.trim(), item]));
  const memberMap = new Map(state.members.map((member) => [member.name.trim(), member]));

  const unknownHeaders = [];
  const headerItems = [];
  for (let colIndex = 1; colIndex < headerRow.length; colIndex += 1) {
    const headerName = headerRow[colIndex];
    if (!headerName) {
      headerItems.push(null);
      continue;
    }

    const item = itemMap.get(headerName) ?? null;
    if (!item) unknownHeaders.push(headerName);
    headerItems.push(item);
  }

  const unknownMembers = new Set();
  const invalidValues = [];
  const appliedMap = new Map();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const memberName = String(row[0] ?? "").trim();
    if (!memberName) continue;

    const member = memberMap.get(memberName);
    if (!member) {
      unknownMembers.add(memberName);
      continue;
    }

    for (let colIndex = 1; colIndex < headerRow.length; colIndex += 1) {
      const item = headerItems[colIndex - 1];
      if (!item) continue;

      const parsed = parseImportOwnedValue(row[colIndex] ?? "");
      if (parsed.kind === "blank") continue;
      if (parsed.kind === "invalid") {
        invalidValues.push(`${memberName} / ${headerRow[colIndex]} / ${parsed.value}`);
        continue;
      }

      const key = `${member.id}__${item.id}`;
      const targetRow = config.makeRow(member.id, item.id);
      config.applyOwned(targetRow, parsed.owned);
      appliedMap.set(key, targetRow);
    }
  }

  return {
    tableName: config.tableName,
    conflictKey: config.conflictKey,
    updates: Array.from(appliedMap.values()),
    summaryText: [
      `${config.tabLabel} 초기값 미리보기`,
      `반영 예정 셀 수: ${appliedMap.size}건`,
      `없는 항목 수: ${unknownHeaders.length}건`,
      `없는 길드원 수: ${unknownMembers.size}건`,
      `잘못된 값 수: ${invalidValues.length}건`,
      unknownHeaders.length ? `없는 항목: ${unknownHeaders.join(", ")}` : "",
      unknownMembers.size ? `없는 길드원: ${Array.from(unknownMembers).join(", ")}` : "",
      invalidValues.length ? `잘못된 값 예시: ${invalidValues.slice(0, 10).join(" | ")}` : ""
    ].filter(Boolean).join("\n")
  };
}

function handleImportPreview() {
  try {
    const preview = buildImportPreview();
    state.importPreview = preview;
    el.importPreviewBox.textContent = preview.summaryText;
    el.importApplyBtn.disabled = preview.updates.length === 0;
    if (preview.updates.length === 0) {
      el.importPreviewBox.textContent += "\n\n반영할 데이터가 없습니다.";
    }
  } catch (error) {
    state.importPreview = null;
    el.importApplyBtn.disabled = true;
    el.importPreviewBox.textContent = error.message;
  }
}

async function handleImportApply() {
  if (!state.importPreview || state.importPreview.updates.length === 0) {
    alert("먼저 미리보기를 확인해주세요.");
    return;
  }

  try {
    const res = await supabase
      .from(state.importPreview.tableName)
      .upsert(state.importPreview.updates, { onConflict: state.importPreview.conflictKey });

    if (res.error) {
      throw new Error(`초기값 저장 중 오류가 발생했습니다.\n${res.error.message}`);
    }

    closeImportModal();
    await loadActiveTabData();
    renderAll();
    alert("초기값이 저장되었습니다.");
  } catch (error) {
    alert(error.message);
  }
}
