import {
  getFilteredHistoryItems,
  getSelectedHistoryDetail,
  getSelectedHistoryItem
} from "./state.js";

export function renderHistoryTab({ state, el, formatNumber, formatDecimal, escapeHtml }) {
  renderHistoryInputs({ state, el });
  renderHistoryListTable({ state, el, formatNumber, escapeHtml });
  renderHistoryDetail({ state, el, formatNumber, formatDecimal, escapeHtml });
}

export function renderHistoryInputs({ state, el }) {
  el.historyDateInput.value = state.history.filterDate || "";
  el.historySortSelect.value = state.history.sortKey || "saved_desc";
}

export function renderHistoryListTable({ state, el, formatNumber, escapeHtml }) {
  el.historyListTableHead.innerHTML = `
    <tr>
      <th class="is-center">No</th>
      <th>저장일시</th>
      <th>대상 기간</th>
      <th class="is-right">실제 분배 다이아</th>
      <th class="is-right">전체 참여점수</th>
      <th class="is-right">남은 다이아</th>
    </tr>
  `;

  const items = getFilteredHistoryItems(state);
  if (!items.length) {
    el.historyListTableBody.innerHTML = `<tr><td class="distribution-empty-row" colspan="6">조회된 분배 이력이 없습니다.</td></tr>`;
    return;
  }

  if (state.history.selectedId && !items.some((item) => item.id === state.history.selectedId)) {
    state.history.selectedId = null;
  }

  el.historyListTableBody.innerHTML = items.map((item, index) => `
    <tr class="${item.id === state.history.selectedId ? "history-selected-row" : ""}" data-role="history-select-row" data-history-id="${item.id}">
      <td class="is-center">${index + 1}</td>
      <td>${escapeHtml(item.savedAt)}</td>
      <td>${escapeHtml(`${item.startDate} ~ ${item.endDate}`)}</td>
      <td class="is-right">${formatNumber(item.actualDiamond)}</td>
      <td class="is-right">${formatNumber(item.totalPoints)}</td>
      <td class="is-right">${formatNumber(item.remainingDiamond)}</td>
    </tr>
  `).join("");
}

export function renderHistoryDetail({ state, el, formatNumber, formatDecimal, escapeHtml }) {
  const item = getSelectedHistoryItem(state);

  if (!item) {
    el.historySummaryPeriod.textContent = "-";
    el.historySummaryActualDiamond.textContent = "0";
    el.historySummaryTotalPoints.textContent = "0";
    el.historySummaryPerPoint.textContent = "0";
    el.historySummaryRemaining.textContent = "0";
    el.historySavedAt.textContent = "-";
    el.historyTotalDiamond.textContent = "0";
    el.historyGuildFeePercent.textContent = "0";
    el.historyGuildMasterPercent.textContent = "0";
    el.historyManagerPercent.textContent = "-";
    renderHistoryGroupSummaryTable({ el, formatNumber, formatDecimal, rows: [] });
    renderHistoryDeductionTable({ el, formatNumber, formatDecimal, escapeHtml, rows: [] });
    renderHistoryMemberTable({ el, formatNumber, escapeHtml, rows: [], activeGroupTypes: [] });
    return;
  }

  el.historySummaryPeriod.textContent = `${item.startDate} ~ ${item.endDate}`;
  el.historySummaryActualDiamond.textContent = formatNumber(item.actualDiamond);
  el.historySummaryTotalPoints.textContent = formatNumber(item.totalPoints);
  el.historySummaryPerPoint.textContent = formatDecimal(item.diamondPerPoint, 1);
  el.historySummaryRemaining.textContent = formatNumber(item.remainingDiamond);
  el.historySavedAt.textContent = item.savedAt;
  el.historyTotalDiamond.textContent = formatNumber(item.totalDiamond);
  el.historyGuildFeePercent.textContent = String(item.guildFeePercent);
  el.historyGuildMasterPercent.textContent = String(item.guildMasterPercent);
  el.historyManagerPercent.textContent = "-";

  const detail = getSelectedHistoryDetail(state);
  const isLoading = state.history?.loadingDetailId === item.id && !detail;

  if (isLoading) {
    renderHistoryGroupSummaryTable({ el, formatNumber, formatDecimal, rows: null });
    renderHistoryDeductionTable({ el, formatNumber, formatDecimal, escapeHtml, rows: null });
    renderHistoryMemberTable({ el, formatNumber, escapeHtml, rows: null, activeGroupTypes: [] });
    return;
  }

  const groupRows = (detail?.groupRows || []).filter((row) => Number(row.assignedDiamond ?? 0) > 0);
  renderHistoryGroupSummaryTable({ el, formatNumber, formatDecimal, rows: groupRows });

  const activeGroupTypes = groupRows.map((row) => row.groupType);
  const deductionRows = (detail?.deductionRows || []).filter((row) => activeGroupTypes.includes(row.groupType));
  renderHistoryDeductionTable({ el, formatNumber, formatDecimal, escapeHtml, rows: deductionRows });
  renderHistoryMemberTable({ el, formatNumber, escapeHtml, rows: detail?.memberRows || [], activeGroupTypes });
}

export function renderHistoryGroupSummaryTable({ el, formatNumber, formatDecimal, rows }) {
  if (!el.historyGroupSummarySection || !el.historyGroupSummaryBody) return;

  if (rows === null) {
    el.historyGroupSummarySection.classList.remove("hidden");
    el.historyGroupSummaryBody.innerHTML = `<tr><td class="distribution-empty-row" colspan="7">상세 데이터를 불러오는 중입니다.</td></tr>`;
    return;
  }

  if (!rows.length) {
    el.historyGroupSummarySection.classList.add("hidden");
    el.historyGroupSummaryBody.innerHTML = "";
    return;
  }

  el.historyGroupSummarySection.classList.remove("hidden");
  el.historyGroupSummaryBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.groupType === "world" ? "월드" : "본토"}</td>
      <td class="is-right">${formatNumber(row.assignedDiamond)}</td>
      <td class="is-right">${formatNumber(row.deductionTotal)}</td>
      <td class="is-right">${formatNumber(row.actualDiamond)}</td>
      <td class="is-right">${formatNumber(row.totalPoints)}</td>
      <td class="is-right">${formatDecimal(row.diamondPerPoint, 1)}</td>
      <td class="is-right">${formatNumber(row.remainingDiamond)}</td>
    </tr>
  `).join("");
}

export function renderHistoryDeductionTable({ el, formatNumber, formatDecimal, escapeHtml, rows }) {
  if (!el.historyDeductionSection || !el.historyDeductionBody) return;

  if (rows === null) {
    el.historyDeductionSection.classList.remove("hidden");
    el.historyDeductionBody.innerHTML = `<tr><td class="distribution-empty-row" colspan="6">상세 데이터를 불러오는 중입니다.</td></tr>`;
    return;
  }

  if (!rows.length) {
    el.historyDeductionSection.classList.add("hidden");
    el.historyDeductionBody.innerHTML = "";
    return;
  }

  el.historyDeductionSection.classList.remove("hidden");
  el.historyDeductionBody.innerHTML = rows.map((row, index) => `
    <tr>
      <td class="is-center">${index + 1}</td>
      <td>${row.groupType === "world" ? "월드" : "본토"}</td>
      <td>${escapeHtml(row.name || "-")}</td>
      <td>${row.mode === "amount" ? "금액" : "비율"}</td>
      <td class="is-right">${row.mode === "amount" ? formatNumber(row.value) : `${formatDecimal(row.value, 2)}%`}</td>
      <td class="is-right">${formatNumber(row.amount)}</td>
    </tr>
  `).join("");
}

export function renderHistoryMemberTable({ el, formatNumber, escapeHtml, rows, activeGroupTypes = [] }) {
  const showMainland = activeGroupTypes.includes("mainland");
  const showWorld = activeGroupTypes.includes("world");

  const headCells = [
    '<th class="is-center">No</th>',
    "<th>길드원</th>"
  ];
  if (showMainland) headCells.push('<th class="is-right">본토 점수</th>');
  if (showWorld) headCells.push('<th class="is-right">월드 점수</th>');
  headCells.push('<th class="is-right">총점</th>');
  if (showMainland) headCells.push('<th class="is-right">본토 다이아</th>');
  if (showWorld) headCells.push('<th class="is-right">월드 다이아</th>');
  headCells.push('<th class="is-right">최종 분배 다이아</th>');
  headCells.push("<th>비고</th>");

  el.historyMemberTableHead.innerHTML = `
    <tr>
      ${headCells.join("")}
    </tr>
  `;

  if (rows === null) {
    el.historyMemberTableBody.innerHTML = `<tr><td class="distribution-empty-row" colspan="${headCells.length}">상세 데이터를 불러오는 중입니다.</td></tr>`;
    return;
  }

  if (!rows.length) {
    el.historyMemberTableBody.innerHTML = `<tr><td class="distribution-empty-row" colspan="${headCells.length}">표시할 길드원별 분배 결과가 없습니다.</td></tr>`;
    return;
  }

  el.historyMemberTableBody.innerHTML = rows.map((row, index) => `
    <tr class="${row.note === "탈퇴한 길드원" ? "distribution-retired-row" : ""}">
      <td class="is-center">${index + 1}</td>
      <td>${escapeHtml(row.memberName)}</td>
      ${showMainland ? `<td class="is-right">${formatNumber(row.mainlandPoints)}</td>` : ""}
      ${showWorld ? `<td class="is-right">${formatNumber(row.worldPoints)}</td>` : ""}
      <td class="is-right">${formatNumber(row.points)}</td>
      ${showMainland ? `<td class="is-right">${formatNumber(row.mainlandDiamond)}</td>` : ""}
      ${showWorld ? `<td class="is-right">${formatNumber(row.worldDiamond)}</td>` : ""}
      <td class="is-right">${formatNumber(row.finalDiamond)}</td>
      <td>${escapeHtml(row.note || "-")}</td>
    </tr>
  `).join("");
}
