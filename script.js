import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mgmvyapblwiwjaytkgwl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fzA0-8AjS9D1xtXLkgdo1Q_iCY-dYJV";
const ADMIN_PASSWORD = "1234";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  activeTab: "mount",
  pendingManageType: null,
  members: [],
  items: [],
  memberMounts: [],
  searchTerm: "",
  draftMemberId: null,
  draftPower: "",
  draftOwnedMap: {}
};

const el = {};

document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  bindEvents();
  updateTabUi();
  await loadMountData();
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

function bindEvents() {
  el.tabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      const nextTab = tab.dataset.tab;
      if (nextTab === state.activeTab) return;

      if (nextTab !== "mount") {
        state.activeTab = nextTab;
        updateTabUi();
        renderPlaceholderTable();
        return;
      }

      state.activeTab = "mount";
      updateTabUi();
      await loadMountData();
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

  [el.passwordModalBackdrop, el.guildManageModalBackdrop, el.itemManageModalBackdrop].forEach((backdrop) => {
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
    tab.classList.toggle("disabled", tab.dataset.tab !== "mount");
  });

  const isMount = state.activeTab === "mount";
  el.guildManageBtn.disabled = !isMount;
  el.itemManageBtn.disabled = !isMount;
  el.itemManageBtn.textContent = isMount ? "탈것 관리" : "준비중";
  el.itemManageTitle.textContent = "탈것 관리";
  el.itemNameHeader.textContent = "탈것명";
}

async function loadMountData() {
  const [membersRes, itemsRes, memberMountsRes] = await Promise.all([
    supabase.from("guild_members").select("id, name, power").order("name", { ascending: true }),
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
  state.items = itemsRes.data ?? [];
  state.memberMounts = memberMountsRes.data ?? [];
  syncDraftState();
}

function handleSearch() {
  state.searchTerm = el.searchInput.value.trim();
  syncDraftState();
  renderAll();
}

function handleResetSearch() {
  state.searchTerm = "";
  el.searchInput.value = "";
  syncDraftState();
  renderAll();
}

function getFilteredMembers() {
  const keyword = state.searchTerm.trim();
  if (!keyword) return state.members;
  return state.members.filter((member) => member.name.includes(keyword));
}

function getEditableMember() {
  if (!state.searchTerm.trim()) return null;
  const filtered = getFilteredMembers();
  if (filtered.length !== 1) return null;
  return filtered[0];
}

function syncDraftState() {
  const editableMember = getEditableMember();

  if (!editableMember) {
    state.draftMemberId = null;
    state.draftPower = "";
    state.draftOwnedMap = {};
    return;
  }

  if (state.draftMemberId === editableMember.id) return;

  state.draftMemberId = editableMember.id;
  state.draftPower = String(editableMember.power ?? 0);
  state.draftOwnedMap = {};

  state.items.forEach((item) => {
    const record = state.memberMounts.find(
      (entry) => entry.member_id === editableMember.id && entry.mount_id === item.id
    );
    state.draftOwnedMap[item.id] = Boolean(record?.owned);
  });
}

function renderAll() {
  if (state.activeTab !== "mount") {
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
  const filtered = getFilteredMembers();
  const keyword = state.searchTerm.trim();

  if (!keyword) {
    el.tableGuideText.textContent = "전체 목록 상태에서는 수정할 수 없습니다. 길드원을 검색해주세요.";
    return;
  }

  if (filtered.length === 0) {
    el.tableGuideText.textContent = "검색 결과가 없습니다.";
    return;
  }

  if (filtered.length > 1) {
    el.tableGuideText.textContent = "검색 결과가 여러 명입니다. 정확한 길드원명을 입력해주세요.";
    return;
  }

  el.tableGuideText.textContent = "검색 결과가 정확히 1명입니다. 이 행에서 전투력과 보유 상태를 수정할 수 있습니다.";
}

function renderSummaryTable() {
  const headers = ["no", "길드원", "전투력", ...state.items.map((item) => item.name), "저장"];
  el.summaryTableHead.innerHTML = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>`;

  const filteredMembers = getFilteredMembers();
  const editableMember = getEditableMember();

  if (filteredMembers.length === 0) {
    el.summaryTableBody.innerHTML = `
      <tr>
        <td class="empty-row" colspan="${headers.length}">표시할 길드원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.summaryTableBody.innerHTML = filteredMembers.map((member, index) => {
    const isEditable = editableMember && editableMember.id === member.id;

    const powerCell = isEditable
      ? `
        <input
          class="inline-power-input"
          type="number"
          min="0"
          step="1"
          data-role="power-input"
          data-member-id="${member.id}"
          value="${escapeAttr(state.draftPower)}"
        >
      `
      : `${member.power ?? 0}`;

    const itemCells = state.items.map((item) => {
      const currentOwned = isEditable
        ? Boolean(state.draftOwnedMap[item.id])
        : getOwnedValue(member.id, item.id);

      if (isEditable) {
        return `
          <td>
            <button
              class="toggle-single-btn ${currentOwned ? "owned" : "not-owned"}"
              type="button"
              data-role="owned-toggle"
              data-member-id="${member.id}"
              data-item-id="${item.id}"
            >
              ${currentOwned ? "보유" : "미보유"}
            </button>
          </td>
        `;
      }

      return `
        <td>
          <span class="badge ${currentOwned ? "badge-own" : "badge-not"}">${currentOwned ? "보유" : "미보유"}</span>
        </td>
      `;
    }).join("");

    const saveCell = isEditable
      ? `<button class="btn btn-primary btn-sm" type="button" data-role="save-row" data-member-id="${member.id}">저장</button>`
      : `<span class="notice-text">수정 불가</span>`;

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(member.name)}</td>
        <td>${powerCell}</td>
        ${itemCells}
        <td>${saveCell}</td>
      </tr>
    `;
  }).join("");
}

function renderPlaceholderTable() {
  el.tableGuideText.textContent = "현재는 탈것 탭만 연결되어 있습니다.";
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
      <td>${state.activeTab === "accessory" ? "악세" : "특수"}</td>
      <td>준비중</td>
    </tr>
  `;
}

function renderGuildManageTable() {
  if (state.members.length === 0) {
    el.guildManageTableBody.innerHTML = `
      <tr>
        <td colspan="4">등록된 길드원이 없습니다.</td>
      </tr>
    `;
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
  if (state.items.length === 0) {
    el.itemManageTableBody.innerHTML = `
      <tr>
        <td colspan="3">등록된 탈것이 없습니다.</td>
      </tr>
    `;
    return;
  }

  el.itemManageTableBody.innerHTML = state.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
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
  if (!target.matches('[data-role="power-input"]')) return;
  state.draftPower = target.value;
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

  if (role === "save-row") {
    saveEditableRow(button.dataset.memberId);
  }
}

async function saveEditableRow(memberId) {
  if (memberId !== state.draftMemberId) return;

  const power = Number(state.draftPower);
  if (!Number.isFinite(power) || power < 0) {
    alert("전투력을 올바르게 입력해주세요.");
    return;
  }

  const updateMemberRes = await supabase
    .from("guild_members")
    .update({ power: Math.floor(power) })
    .eq("id", memberId);

  if (updateMemberRes.error) {
    alert(`전투력 저장 중 오류가 발생했습니다.\n${updateMemberRes.error.message}`);
    return;
  }

  const upsertPayload = state.items.map((item) => ({
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

  state.searchTerm = "";
  el.searchInput.value = "";

  await loadMountData();
  renderAll();
  alert("저장되었습니다.");
}

function openPasswordModal(type) {
  if (state.activeTab !== "mount") {
    alert("현재는 탈것 탭만 사용할 수 있습니다.");
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
    .select("id, name, power")
    .single();

  if (insertRes.error) {
    alert(`길드원 추가 중 오류가 발생했습니다.\n${insertRes.error.message}`);
    return;
  }

  const newMember = insertRes.data;

  if (state.items.length > 0) {
    const memberMountPayload = state.items.map((item) => ({
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

  await loadMountData();
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
    .update({ name: nextName, power: Math.floor(nextPower) })
    .eq("id", memberId);

  if (updateRes.error) {
    alert(`길드원 수정 중 오류가 발생했습니다.\n${updateRes.error.message}`);
    return;
  }

  await loadMountData();
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
    state.searchTerm = "";
    el.searchInput.value = "";
  }

  await loadMountData();
  renderAll();
}

async function addItem() {
  const nameValue = prompt("추가할 탈것명을 입력해주세요.");
  if (nameValue === null) return;

  const name = nameValue.trim();
  if (!name) {
    alert("탈것명을 입력해주세요.");
    return;
  }

  if (state.items.some((item) => item.name === name)) {
    alert("이미 존재하는 탈것명입니다.");
    return;
  }

  const nextDisplayOrder = state.items.length === 0
    ? 1
    : Math.max(...state.items.map((item) => Number(item.display_order ?? 0))) + 1;

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

async function editItem(itemId) {
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item) return;

  const nextNameValue = prompt("탈것명을 수정해주세요.", item.name);
  if (nextNameValue === null) return;

  const nextName = nextNameValue.trim();
  if (!nextName) {
    alert("탈것명을 입력해주세요.");
    return;
  }

  if (state.items.some((entry) => entry.id !== itemId && entry.name === nextName)) {
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

async function deleteItem(itemId) {
  const item = state.items.find((entry) => entry.id === itemId);
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

function getOwnedValue(memberId, itemId) {
  const record = state.memberMounts.find(
    (entry) => entry.member_id === memberId && entry.mount_id === itemId
  );
  return Boolean(record?.owned);
}

function openModal(backdrop) {
  backdrop.classList.remove("hidden");
}

function closeModal(backdrop) {
  backdrop.classList.add("hidden");
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