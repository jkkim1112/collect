import {
  formatBossParticipationDateTime,
  getBossParticipationRecordTypeText
} from "./formatters.js";

export function renderBossParticipationTab({
  state,
  el,
  setValueIfNeeded,
  normalizeSearchText,
  formatNumber,
  escapeHtml
}) {
  const tabState = state.bossParticipation;
  if (!tabState) return;

  renderBossParticipationInputs({ tabState, setValueIfNeeded });
  renderBossParticipationSummary({ state, el, normalizeSearchText, formatNumber });
  renderBossParticipationTable({ state, el, formatNumber, escapeHtml });
}

export function renderBossParticipationInputs({ tabState, setValueIfNeeded }) {
  setValueIfNeeded("bossParticipationStartDateInput", tabState.startDate || "");
  setValueIfNeeded("bossParticipationEndDateInput", tabState.endDate || "");
  setValueIfNeeded("bossParticipationBossInput", tabState.bossKeyword || "");
  setValueIfNeeded("bossParticipationParticipantInput", tabState.participantKeyword || "");
}

export function renderBossParticipationSummary({ state, el, normalizeSearchText, formatNumber }) {
  const rows = state.bossParticipation?.rows || [];
  const cutRows = rows.filter((row) => row.recordType === "cut");
  const mungRows = rows.filter((row) => row.recordType === "mung");
  const participantNames = rows.flatMap((row) => row.participants.map((participant) => String(participant.discord_nickname || "").trim()).filter(Boolean));
  const uniqueParticipants = new Set(participantNames.map((name) => normalizeSearchText(name)));

  el.bossParticipationSummaryTotalRecords.textContent = formatNumber(rows.length);
  el.bossParticipationSummaryCutRecords.textContent = formatNumber(cutRows.length);
  el.bossParticipationSummaryMungRecords.textContent = formatNumber(mungRows.length);
  el.bossParticipationSummaryParticipants.textContent = formatNumber(participantNames.length);
  el.bossParticipationSummaryUniqueParticipants.textContent = formatNumber(uniqueParticipants.size);
}

export function renderBossParticipationTable({ state, el, formatNumber, escapeHtml }) {
  el.bossParticipationTableHead.innerHTML = `
    <tr>
      <th class="is-center">No</th>
      <th>컷 시간</th>
      <th>보스명</th>
      <th class="is-center">기록</th>
      <th>컷자</th>
      <th class="is-right">참여자 수</th>
      <th>참여자</th>
    </tr>
  `;

  const tabState = state.bossParticipation;
  const rows = tabState?.rows || [];

  if (tabState?.loading) {
    el.bossParticipationTableBody.innerHTML = `<tr><td class="distribution-empty-row" colspan="7">보스 참여 이력을 불러오는 중입니다.</td></tr>`;
    return;
  }

  if (!rows.length) {
    const message = tabState?.loaded ? "조회된 보스 참여 이력이 없습니다." : "조회 버튼을 눌러 보스 참여 이력을 불러와주세요.";
    el.bossParticipationTableBody.innerHTML = `<tr><td class="distribution-empty-row" colspan="7">${message}</td></tr>`;
    return;
  }

  el.bossParticipationTableBody.innerHTML = rows.map((row, index) => {
    const participantNames = row.participants.map((participant) => participant.discord_nickname || "-").filter(Boolean);
    const recordClass = row.recordType === "mung" ? "boss-participation-mung-row" : "";
    return `
      <tr class="${recordClass}">
        <td class="is-center">${index + 1}</td>
        <td>${escapeHtml(formatBossParticipationDateTime(row.cutTime))}</td>
        <td>${escapeHtml(row.bossName)}</td>
        <td class="is-center"><span class="boss-participation-badge ${row.recordType === "mung" ? "is-mung" : "is-cut"}">${escapeHtml(getBossParticipationRecordTypeText(row.recordType))}</span></td>
        <td>${escapeHtml(row.cutByNickname)}</td>
        <td class="is-right">${formatNumber(participantNames.length)}</td>
        <td class="boss-participation-participants-cell">${escapeHtml(participantNames.length ? participantNames.join(", ") : "-")}</td>
      </tr>
    `;
  }).join("");
}
