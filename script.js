const ADMIN_PASSWORD = "1234";

const TAB_CONFIG = {
  mount: {
    label: "탈것",
    itemLabel: "탈것",
    statusTitle: "탈것 보유 현황"
  },
  accessory: {
    label: "악세",
    itemLabel: "악세",
    statusTitle: "악세 보유 현황"
  },
  special: {
    label: "특수",
    itemLabel: "특수",
    statusTitle: "특수 보유 현황"
  }
};

const state = {
  activeTab: "mount",
  pendingManageType: null,
  selectedMemberId: null,
  data: {
    mount: {
      members: [],
      items: []
    },
    accessory: {
      members: [],
      items: []
    },
    special: {
      members: [],
      items: []
    }
  }
};

const el = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  seedInitialData();
  bindEvents();
  renderAll();
});

function bindElements() {
  el.tabs = Array.from(document.querySelectorAll(".tab"));
  el.guildManageBtn = document.getElementById("guildManageBtn");
  el.itemManageBtn = document.getElementById("itemManageBtn");
  el.searchNameInput = document.getElementById("searchNameInput");
  el.searchBtn = document.getElementById("searchBtn");
  el.memberNameInput = document.getElementById("memberNameInput");
  el.memberPowerInput = document.getElementById("memberPowerInput");
  el.statusTitle = document.getElementById("statusTitle");
  el.statusList = document.getElementById("statusList");
  el.saveBtn = document.getElementById("saveBtn");
  el.summaryTableHead = document.getElementById("summaryTableHead");
  el.summaryTableBody = document.getElementById("summaryTableBody");

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
  el.itemManageTableBody = document.getElementById("itemManageTableBody");
  el.addItemBtn = document.getElementById("addItemBtn");
  el.itemManageCloseBtn = document.getElementById("itemManageCloseBtn");
}

function seedInitialData() {
  state.data.mount.items = [
    { id: createId(), name: "늑대" },
    { id: createId(), name: "말" },
    { id: createId(), name: "비행선" }
  ];

  state.data.accessory.items = [
    { id: createId(), name: "목걸이" },
    { id: createId(), name: "반지" },
    { id: createId(), name: "귀걸이" }
  ];

  state.data.special.items = [
    { id: createId(), name: "특수1" },
    { id: createId(), name: "특수2" },
    { id: createId(), name: "특수3" }
  ];

  state.data.mount.members = [
    createMember("홍길동", 12345, [true, false, true]),
    createMember("김철수", 15600, [false, true, false]),
    createMember("이영희", 14100, [true, true, false])
  ];

  state.data.accessory.members = [
    createMember("홍길동", 12345, [true, false, false]),
    createMember("김철수", 15600, [true, true, false]),
    createMember("이영희", 14100, [false, true, true])
  ];

  state.data.special.members = [
    createMember("홍길동", 12345, [false, true, false]),
    createMember("김철수", 15600, [true, false, true]),
    createMember("이영희", 14100, [false, false, true])
  ];
}

function createMember(name, power, ownedStates) {
  return {
    id: createId(),
    name,
    power,
    ownedMap: ownedStates.reduce((acc, owned, index) => {
      acc[index] = owned;
      return acc;
    }, {})
  };
}

function bindEvents() {
  el.tabs.forEach((tabButton) => {
    tabButton.addEventListener("click", () => {
      const nextTab = tabButton.dataset.tab;
      if (!nextTab || nextTab === state.activeTab) return;
      state.activeTab = nextTab;
      state.selectedMemberId = null;
      el.searchNameInput.value = "";
      renderAll();
    });
  });

  el.searchBtn.addEventListener("click", handleSearch);
  el.searchNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  });

  el.saveBtn.addEventListener("click", handleSave);

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
  el.statusList.addEventListener("click", handleStatusListClick);

  [el.passwordModalBackdrop, el.guildManageModalBackdrop, el.itemManageModalBackdrop].forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });
}

function renderAll() {
  updateActiveTabButtons();
  updateDynamicLabels();
  renderSearchPanel();
  renderSummaryTable();
  renderGuildManageTable();
  renderItemManageTable();
}

function updateActiveTabButtons() {
  el.tabs.forEach((tabButton) => {
    tabButton.classList.toggle("active", tabButton.dataset.tab === state.activeTab);
  });
}

function updateDynamicLabels() {
  const config = TAB_CONFIG[state.activeTab];
  el.itemManageBtn.textContent = `${config.itemLabel} 관리`;
  el.itemManageTitle.textContent = `${config.itemLabel} 관리`;
  el.itemNameHeader.textContent = `${config.itemLabel}명`;
  el.addItemBtn.textContent = `${config.itemLabel} 추가`;
  el.statusTitle.textContent = config.statusTitle;
}

function renderSearchPanel() {
  const data = getActiveData();
  const member = data.members.find((item) => item.id === state.selectedMemberId) || null;

  el.memberNameInput.value = member ? member.name : "";
  el.memberPowerInput.value = member ? member.power : "";
  el.statusList.innerHTML = "";

  if (!member) {
    const empty = document.createElement("div");
    empty.className = "status-item";
    empty.innerHTML = `
      <span class="status-name">검색된 길드원이 없습니다.</span>
      <div class="status-actions"></div>
    `;
    el.statusList.appendChild(empty);
    return;
  }

  data.items.forEach((item, index) => {
    const owned = Boolean(member.ownedMap[index]);
    const row = document.createElement("div");
    row.className = "status-item";
    row.innerHTML = `
      <span class="status-name">${escapeHtml(item.name)}</span>
      <div class="status-actions" data-item-index="${index}">
        <button class="chip ${owned ? "chip-active" : ""}" type="button" data-owned-value="true">보유</button>
        <button class="chip ${owned ? "" : "chip-active"}" type="button" data-owned-value="false">미보유</button>
      </div>
    `;
    el.statusList.appendChild(row);
  });
}

function renderSummaryTable() {
  const data = getActiveData();

  const headCells = ["no", "길드원", "전투력", ...data.items.map((item) => item.name)];
  el.summaryTableHead.innerHTML = `<tr>${headCells.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>`;

  if (data.members.length === 0) {
    el.summaryTableBody.innerHTML = `
      <tr>
        <td colspan="${headCells.length}">등록된 데이터가 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.summaryTableBody.innerHTML = data.members.map((member, rowIndex) => {
    const statusColumns = data.items.map((_, itemIndex) => {
      const owned = Boolean(member.ownedMap[itemIndex]);
      return `<td><span class="badge ${owned ? "badge-own" : "badge-not"}">${owned ? "보유" : "미보유"}</span></td>`;
    }).join("");

    return `
      <tr>
        <td>${rowIndex + 1}</td>
        <td>${escapeHtml(member.name)}</td>
        <td>${member.power}</td>
        ${statusColumns}
      </tr>
    `;
  }).join("");
}

function renderGuildManageTable() {
  const data = getActiveData();

  if (data.members.length === 0) {
    el.guildManageTableBody.innerHTML = `
      <tr>
        <td colspan="4">등록된 길드원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.guildManageTableBody.innerHTML = data.members.map((member, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(member.name)}</td>
      <td>${member.power}</td>
      <td class="action-cell">
        <button class="text-btn" type="button" data-action="edit-member" data-id="${member.id}">수정</button>
        <button class="text-btn danger" type="button" data-action="delete-member" data-id="${member.id}">삭제</button>
      </td>
    </tr>
  `).join("");
}

function renderItemManageTable() {
  const data = getActiveData();

  if (data.items.length === 0) {
    el.itemManageTableBody.innerHTML = `
      <tr>
        <td colspan="3">등록된 ${TAB_CONFIG[state.activeTab].itemLabel}이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.itemManageTableBody.innerHTML = data.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
      <td class="action-cell">
        <button class="text-btn" type="button" data-action="edit-item" data-id="${item.id}">수정</button>
        <button class="text-btn danger" type="button" data-action="delete-item" data-id="${item.id}">삭제</button>
      </td>
    </tr>
  `).join("");
}

function handleSearch() {
  const keyword = el.searchNameInput.value.trim();
  if (!keyword) {
    alert("길드원명을 입력해주세요.");
    return;
  }

  const data = getActiveData();
  const member = data.members.find((item) => item.name === keyword);

  if (!member) {
    state.selectedMemberId = null;
    renderSearchPanel();
    alert("일치하는 길드원을 찾지 못했습니다.");
    return;
  }

  state.selectedMemberId = member.id;
  renderSearchPanel();
}

function handleSave() {
  const data = getActiveData();
  const member = data.members.find((item) => item.id === state.selectedMemberId);

  if (!member) {
    alert("먼저 길드원을 검색해주세요.");
    return;
  }

  const power = Number(el.memberPowerInput.value);
  if (!Number.isFinite(power) || power < 0) {
    alert("전투력을 올바르게 입력해주세요.");
    return;
  }

  member.power = Math.floor(power);
  renderSummaryTable();
  renderGuildManageTable();
  alert("저장되었습니다.");
}

function handleStatusListClick(event) {
  const button = event.target.closest("button[data-owned-value]");
  if (!button) return;

  const data = getActiveData();
  const member = data.members.find((item) => item.id === state.selectedMemberId);
  if (!member) {
    alert("먼저 길드원을 검색해주세요.");
    return;
  }

  const actions = button.closest(".status-actions");
  const itemIndex = Number(actions.dataset.itemIndex);
  member.ownedMap[itemIndex] = button.dataset.ownedValue === "true";
  renderSearchPanel();
}

function openPasswordModal(type) {
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
  const inputValue = el.passwordInput.value;
  if (inputValue !== ADMIN_PASSWORD) {
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

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit-member") {
    editMember(id);
  }

  if (action === "delete-member") {
    deleteMember(id);
  }
}

function handleItemManageTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit-item") {
    editItem(id);
  }

  if (action === "delete-item") {
    deleteItem(id);
  }
}

function addMember() {
  const data = getActiveData();
  const name = prompt("추가할 길드원명을 입력해주세요.");
  if (name === null) return;

  const trimmedName = name.trim();
  if (!trimmedName) {
    alert("길드원명을 입력해주세요.");
    return;
  }

  if (data.members.some((member) => member.name === trimmedName)) {
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

  const ownedMap = {};
  data.items.forEach((_, index) => {
    ownedMap[index] = false;
  });

  data.members.push({
    id: createId(),
    name: trimmedName,
    power: Math.floor(power),
    ownedMap
  });

  renderAll();
}

function editMember(memberId) {
  const data = getActiveData();
  const member = data.members.find((item) => item.id === memberId);
  if (!member) return;

  const nextName = prompt("길드원명을 수정해주세요.", member.name);
  if (nextName === null) return;

  const trimmedName = nextName.trim();
  if (!trimmedName) {
    alert("길드원명을 입력해주세요.");
    return;
  }

  if (data.members.some((item) => item.id !== member.id && item.name === trimmedName)) {
    alert("이미 존재하는 길드원명입니다.");
    return;
  }

  const nextPowerValue = prompt("전투력을 수정해주세요.", String(member.power));
  if (nextPowerValue === null) return;

  const nextPower = Number(nextPowerValue);
  if (!Number.isFinite(nextPower) || nextPower < 0) {
    alert("전투력을 올바르게 입력해주세요.");
    return;
  }

  member.name = trimmedName;
  member.power = Math.floor(nextPower);

  if (state.selectedMemberId === member.id) {
    el.memberNameInput.value = member.name;
    el.memberPowerInput.value = member.power;
  }

  renderAll();
}

function deleteMember(memberId) {
  const data = getActiveData();
  const member = data.members.find((item) => item.id === memberId);
  if (!member) return;

  const ok = confirm(`${member.name} 길드원을 삭제하시겠습니까?`);
  if (!ok) return;

  data.members = data.members.filter((item) => item.id !== memberId);

  if (state.selectedMemberId === memberId) {
    state.selectedMemberId = null;
    el.searchNameInput.value = "";
  }

  renderAll();
}

function addItem() {
  const data = getActiveData();
  const itemLabel = TAB_CONFIG[state.activeTab].itemLabel;
  const name = prompt(`추가할 ${itemLabel}명을 입력해주세요.`);
  if (name === null) return;

  const trimmedName = name.trim();
  if (!trimmedName) {
    alert(`${itemLabel}명을 입력해주세요.`);
    return;
  }

  if (data.items.some((item) => item.name === trimmedName)) {
    alert(`이미 존재하는 ${itemLabel}명입니다.`);
    return;
  }

  data.items.push({ id: createId(), name: trimmedName });
  data.members.forEach((member) => {
    member.ownedMap[data.items.length - 1] = false;
  });

  renderAll();
}

function editItem(itemId) {
  const data = getActiveData();
  const item = data.items.find((entry) => entry.id === itemId);
  if (!item) return;

  const itemLabel = TAB_CONFIG[state.activeTab].itemLabel;
  const name = prompt(`${itemLabel}명을 수정해주세요.`, item.name);
  if (name === null) return;

  const trimmedName = name.trim();
  if (!trimmedName) {
    alert(`${itemLabel}명을 입력해주세요.`);
    return;
  }

  if (data.items.some((entry) => entry.id !== item.id && entry.name === trimmedName)) {
    alert(`이미 존재하는 ${itemLabel}명입니다.`);
    return;
  }

  item.name = trimmedName;
  renderAll();
}

function deleteItem(itemId) {
  const data = getActiveData();
  const itemIndex = data.items.findIndex((entry) => entry.id === itemId);
  if (itemIndex < 0) return;

  const item = data.items[itemIndex];
  const itemLabel = TAB_CONFIG[state.activeTab].itemLabel;
  const ok = confirm(`${item.name} ${itemLabel}을 삭제하시겠습니까?`);
  if (!ok) return;

  data.items.splice(itemIndex, 1);

  data.members.forEach((member) => {
    const nextOwnedMap = {};
    Object.keys(member.ownedMap)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((key) => {
        if (key < itemIndex) nextOwnedMap[key] = member.ownedMap[key];
        if (key > itemIndex) nextOwnedMap[key - 1] = member.ownedMap[key];
      });
    member.ownedMap = nextOwnedMap;
  });

  renderAll();
}

function openModal(backdrop) {
  backdrop.classList.remove("hidden");
}

function closeModal(backdrop) {
  backdrop.classList.add("hidden");
}

function getActiveData() {
  return state.data[state.activeTab];
}

function createId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}