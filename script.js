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
  activeTab: "mount",
  pendingManageType: null,
  members: [],
  mountItems: [],
  memberMounts: [],
  accessoryGroups: [],
  memberAccessories: [],
  searchTerm: "",
  selectedMemberId: null,
  draftMemberId: null,
  draftPower: "",
  draftOwnedMap: {},
  draftAccessoryMap: {},
  powerSortDirection: null
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
  el.itemManageBtn = document.getElementById("itemManageBtn");
  el.tableGuideText = document.getElementById("tableGuideText");
  el.searchInput = document.getElementById("searchInput");
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
}

function bindEvents() {
  el.tabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      const nextTab = tab.dataset.tab;
      if (nextTab === state.activeTab) return;

      state.activeTab = nextTab;
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

  el.searchSelectCloseBtn.addEventListener("click", closeSearchSelectModal);
  el.searchSelectCancelBtn.addEventListener("click", closeSearchSelectModal);
  el.searchSelectList.addEventListener("click", handleSearchSelectClick);

  el.summaryTableHead.addEventListener("click", handleSummaryTableHeadClick);
  el.summaryTableBody.addEventListener("click", handleSummaryTableClick);
  el.summaryTableBody.addEventListener("input", handleSummaryTableInput);

  el.guildManageBtn.addEventListener("click", () => openPasswordModal("guild"));
  el.itemManageBtn.addEventListener("click", () => openPasswordModal("item"));

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

  el.addMemberBtn.addEventListener("click", addMember);
  el.addItemBtn.addEventListener("click", addItem);

  el.guildManageTableBody.addEventListener("click", handleGuildManageTableClick);
  el.itemManageTableBody.addEventListener("click", handleItemManageTableClick);

  [el.passwordModalBackdrop, el.guildManageModalBackdrop, el.itemManageModalBackdrop, el.searchSelectModalBackdrop].forEach((backdrop) => {
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

  el.guildManageBtn.disabled = isSpecial;
  el.itemManageBtn.disabled = isSpecial;
  el.itemManageBtn.textContent = isAccessory ? "악세사리 관리" : "탈것 관리";
  el.itemManageTitle.textContent = isAccessory ? "악세사리 관리" : "탈것 관리";
  el.itemNameHeader.textContent = isAccessory ? "악세사리명" : "탈것명";
  el.itemMaxHeader.classList.toggle("hidden", !isAccessory);
  el.addItemBtn.textContent = isAccessory ? "악세사리 추가" : "탈것 추가";
}

async function loadActiveTabData() {
  if (state.activeTab === "accessory") {
    await loadAccessoryData();
    return;
  }

  await loadMountData();
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
  syncDraftState();
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

function handleResetSearch() {
  state.searchTerm = "";
  state.selectedMemberId = null;
  el.searchInput.value = "";
  closeSearchSelectModal();
  syncDraftState();
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
  if (!state.searchTerm.trim() || !state.selectedMemberId) return null;
  return state.members.find((member) => member.id === state.selectedMemberId) ?? null;
}

function syncDraftState() {
  const editableMember = getEditableMember();

  if (!editableMember) {
    state.draftMemberId = null;
    state.draftPower = "";
    state.draftOwnedMap = {};
    state.draftAccessoryMap = {};
    return;
  }

  if (state.draftMemberId === editableMember.id) return;

  state.draftMemberId = editableMember.id;
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

  state.mountItems.forEach((item) => {
    const record = state.memberMounts.find(
      (entry) => entry.member_id === editableMember.id && entry.mount_id === item.id
    );
    state.draftOwnedMap[item.id] = Boolean(record?.owned);
  });
}

function renderAll() {
  if (state.activeTab === "special") {
    renderPlaceholderTable();
    return;
  }

  syncDraftState();
  renderGuideText();
  renderSummaryTable();
  renderGuildManageTable();
  renderItemManageTable();
}

function renderGuideText() {
  const keyword = state.searchTerm.trim();

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

  el.tableGuideText.textContent = state.activeTab === "accessory"
    ? "선택된 길드원 1명만 표시됩니다. 이 행에서 전투력과 악세사리 수량을 수정할 수 있습니다."
    : "선택된 길드원 1명만 표시됩니다. 이 행에서 전투력과 보유 상태를 수정할 수 있습니다.";
}

function renderSummaryTable() {
  if (state.activeTab === "accessory") {
    renderAccessorySummaryTable();
    return;
  }

  renderMountSummaryTable();
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
  const editableMember = getEditableMember();

  if (filteredMembers.length === 0) {
    el.summaryTableBody.innerHTML = `
      <tr>
        <td class="empty-row" colspan="${state.mountItems.length + 5}">표시할 길드원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.summaryTableBody.innerHTML = filteredMembers.map((member, index) => {
    const isEditable = editableMember && editableMember.id === member.id;

    const powerCell = isEditable
      ? `<input class="inline-power-input" type="number" min="0" step="1" data-role="power-input" data-member-id="${member.id}" value="${escapeAttr(state.draftPower)}">`
      : `<span class="value-box">${member.power ?? 0}</span>`;

    const itemCells = state.mountItems.map((item) => {
      const currentOwned = isEditable
        ? Boolean(state.draftOwnedMap[item.id])
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

    const saveCell = isEditable
      ? `<button class="btn btn-primary btn-sm" type="button" data-role="save-row-mount" data-member-id="${member.id}">저장</button>`
      : `<span class="notice-text action-box">불가</span>`;

    const lastUpdatedCell = `<span class="last-updated-box">${formatUpdatedAt(member.updated_at)}</span>`;

    return `
      <tr>
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

  const topHeaders = [
    `<th rowspan="2">no</th>`,
    `<th rowspan="2">길드원</th>`,
    `<th rowspan="2" class="sortable-header ${state.powerSortDirection ? "active" : ""}" data-role="power-sort-header"><span class="sort-header-inner"><span>전투력</span><span class="sort-indicator">${powerSortText}</span></span></th>`,
    ...state.accessoryGroups.map((group) => `<th colspan="${ACCESSORY_PARTS.length}" class="group-header group-boundary-start group-boundary-end">${escapeHtml(group.name)}</th>`),
    `<th rowspan="2" class="save-col">저장</th>`,
    `<th rowspan="2" class="last-updated-col">수정일</th>`
  ];

  const subHeaders = state.accessoryGroups.flatMap(() => (
    ACCESSORY_PARTS.map((part, partIndex) => {
      const classes = ['accessory-sub-header'];
      if (partIndex === 0) classes.push('group-boundary-start');
      if (partIndex === ACCESSORY_PARTS.length - 1) classes.push('group-boundary-end');
      return `<th class="${classes.join(' ')}">${part.label}</th>`;
    })
  ));

  el.summaryTableHead.innerHTML = `
    <tr>${topHeaders.join("")}</tr>
    <tr>${subHeaders.join("")}</tr>
  `;

  const filteredMembers = getFilteredMembers();
  const editableMember = getEditableMember();

  if (filteredMembers.length === 0) {
    el.summaryTableBody.innerHTML = `
      <tr>
        <td class="empty-row" colspan="${state.accessoryGroups.length * ACCESSORY_PARTS.length + 5}">표시할 길드원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.summaryTableBody.innerHTML = filteredMembers.map((member, index) => {
    const isEditable = editableMember && editableMember.id === member.id;

    const powerCell = isEditable
      ? `<input class="inline-power-input" type="number" min="0" step="1" data-role="power-input" data-member-id="${member.id}" value="${escapeAttr(state.draftPower)}">`
      : `<span class="value-box">${member.power ?? 0}</span>`;

    const groupCells = state.accessoryGroups.map((group) => {
      const record = getAccessoryRecord(member.id, group.id);
      return ACCESSORY_PARTS.map((part, partIndex) => {
        const maxCount = Number(group.max_count ?? 0);
        const currentValue = isEditable
          ? Number(state.draftAccessoryMap[group.id]?.[part.key] ?? 0)
          : Number(record?.[part.key] ?? 0);
        const tdClasses = [];
        if (partIndex === 0) tdClasses.push('group-boundary-start');
        if (partIndex === ACCESSORY_PARTS.length - 1) tdClasses.push('group-boundary-end');
        const tdClassAttr = tdClasses.length > 0 ? ` class="${tdClasses.join(' ')}"` : '';

        if (isEditable) {
          return `
            <td${tdClassAttr}>
              <input class="inline-qty-input" type="number" min="0" max="${escapeAttr(maxCount)}" step="1" data-role="accessory-qty-input" data-member-id="${member.id}" data-group-id="${group.id}" data-part-key="${part.key}" value="${escapeAttr(currentValue)}">
            </td>
          `;
        }

        return `<td${tdClassAttr}><span class="value-box qty-box">${currentValue}</span></td>`;
      }).join("");
    }).join("");

    const saveCell = isEditable
      ? `<button class="btn btn-primary btn-sm" type="button" data-role="save-row-accessory" data-member-id="${member.id}">저장</button>`
      : `<span class="notice-text action-box">불가</span>`;

    const lastUpdatedCell = `<span class="last-updated-box">${formatUpdatedAt(getAccessoryLatestUpdatedAt(member.id))}</span>`;

    return `
      <tr>
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
  const items = state.activeTab === "accessory" ? state.accessoryGroups : state.mountItems;
  const emptyText = state.activeTab === "accessory" ? "등록된 악세사리가 없습니다." : "등록된 탈것이 없습니다.";

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
    state.draftPower = target.value;
    return;
  }

  if (target.matches('[data-role="accessory-qty-input"]')) {
    const memberId = target.dataset.memberId;
    const groupId = target.dataset.groupId;
    const partKey = target.dataset.partKey;
    if (memberId !== state.draftMemberId) return;

    const group = state.accessoryGroups.find((entry) => String(entry.id) === String(groupId));
    const maxCount = Number(group?.max_count ?? 0);
    const value = Math.min(maxCount, Math.max(0, Math.floor(Number(target.value) || 0)));
    if (!state.draftAccessoryMap[groupId]) {
      state.draftAccessoryMap[groupId] = {};
    }
    state.draftAccessoryMap[groupId][partKey] = value;
    target.value = String(value);
  }
}

function handleSummaryTableHeadClick(event) {
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
    if (memberId !== state.draftMemberId) return;

    state.draftOwnedMap[itemId] = !Boolean(state.draftOwnedMap[itemId]);
    renderSummaryTable();
    return;
  }

  if (role === "save-row-mount") {
    saveMountEditableRow(button.dataset.memberId);
    return;
  }

  if (role === "save-row-accessory") {
    saveAccessoryEditableRow(button.dataset.memberId);
  }
}

async function saveMountEditableRow(memberId) {
  if (memberId !== state.draftMemberId) return;

  const power = Number(state.draftPower);
  if (!Number.isFinite(power) || power < 0) {
    alert("전투력을 올바르게 입력해주세요.");
    return;
  }

  const updateMemberRes = await supabase
    .from("guild_members")
    .update({ power: Math.floor(power), updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (updateMemberRes.error) {
    alert(`전투력 저장 중 오류가 발생했습니다.\n${updateMemberRes.error.message}`);
    return;
  }

  const upsertPayload = state.mountItems.map((item) => ({
    member_id: memberId,
    mount_id: item.id,
    owned: Boolean(state.draftOwnedMap[item.id])
  }));

  const upsertRes = await supabase
    .from("member_mounts")
    .upsert(upsertPayload, { onConflict: "member_id,mount_id" });

  if (upsertRes.error) {
    alert(`보유 상태 저장 중 오류가 발생했습니다.\n${upsertRes.error.message}`);
    return;
  }

  resetSearchState();
  await loadMountData();
  renderAll();
  alert("저장되었습니다.");
}

async function saveAccessoryEditableRow(memberId) {
  if (memberId !== state.draftMemberId) return;

  const power = Number(state.draftPower);
  if (!Number.isFinite(power) || power < 0) {
    alert("전투력을 올바르게 입력해주세요.");
    return;
  }

  const updateMemberRes = await supabase
    .from("guild_members")
    .update({ power: Math.floor(power), updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (updateMemberRes.error) {
    alert(`전투력 저장 중 오류가 발생했습니다.\n${updateMemberRes.error.message}`);
    return;
  }

  const now = new Date().toISOString();
  const upsertPayload = state.accessoryGroups.map((group) => {
    const maxCount = Number(group.max_count ?? 0);
    const normalizeCount = (value) => Math.min(maxCount, Math.max(0, Math.floor(Number(value) || 0)));

    return {
      member_id: memberId,
      accessory_group_id: group.id,
      ring_count: normalizeCount(state.draftAccessoryMap[group.id]?.ring_count),
      necklace_count: normalizeCount(state.draftAccessoryMap[group.id]?.necklace_count),
      earring_count: normalizeCount(state.draftAccessoryMap[group.id]?.earring_count),
      belt_count: normalizeCount(state.draftAccessoryMap[group.id]?.belt_count),
      bracelet_count: normalizeCount(state.draftAccessoryMap[group.id]?.bracelet_count),
      updated_at: now
    };
  });

  const upsertRes = await supabase
    .from("member_accessories")
    .upsert(upsertPayload, { onConflict: "member_id,accessory_group_id" });

  if (upsertRes.error) {
    alert(`악세사리 저장 중 오류가 발생했습니다.\n${upsertRes.error.message}`);
    return;
  }

  resetSearchState();
  await loadAccessoryData();
  renderAll();
  alert("저장되었습니다.");
}

function resetSearchState() {
  state.searchTerm = "";
  state.selectedMemberId = null;
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
