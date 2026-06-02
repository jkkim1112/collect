import {
  getBossParticipationExportFileName,
  getBossParticipationKstDateTimeParts
} from "./formatters.js";

export async function handleBossParticipationSearch({ state, el, loadBossParticipationData, renderBossParticipationTab }) {
  state.bossParticipation.startDate = String(el.bossParticipationStartDateInput?.value || "").trim();
  state.bossParticipation.endDate = String(el.bossParticipationEndDateInput?.value || "").trim();
  state.bossParticipation.bossKeyword = String(el.bossParticipationBossInput?.value || "").trim();
  state.bossParticipation.participantKeyword = String(el.bossParticipationParticipantInput?.value || "").trim();
  await loadBossParticipationData();
  renderBossParticipationTab();
}

export async function handleBossParticipationReset({ state, el, renderBossParticipationTab }) {
  state.bossParticipation.startDate = "";
  state.bossParticipation.endDate = "";
  state.bossParticipation.bossKeyword = "";
  state.bossParticipation.participantKeyword = "";
  state.bossParticipation.rows = [];
  state.bossParticipation.loaded = false;
  state.bossParticipation.loading = false;
  if (el.bossParticipationStartDateInput) el.bossParticipationStartDateInput.value = "";
  if (el.bossParticipationEndDateInput) el.bossParticipationEndDateInput.value = "";
  if (el.bossParticipationBossInput) el.bossParticipationBossInput.value = "";
  if (el.bossParticipationParticipantInput) el.bossParticipationParticipantInput.value = "";
  renderBossParticipationTab();
}

export function handleBossParticipationExport({ state, XLSX, alertFn = alert }) {
  const rows = state.bossParticipation?.rows || [];
  if (!rows.length) {
    alertFn("엑셀 저장할 보스 참여 이력이 없습니다.");
    return;
  }

  const exportRows = rows.map((row) => {
    const dateTime = getBossParticipationKstDateTimeParts(row.cutTime);
    const participantNames = row.participants
      .map((participant) => String(participant.discord_nickname || "").trim())
      .filter(Boolean);

    return {
      날짜: dateTime.date,
      시간: dateTime.time,
      보스: row.bossName === "-" ? "" : row.bossName,
      컷자: row.cutByNickname === "-" ? "" : row.cutByNickname,
      참여자: participantNames.join(", ")
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: ["날짜", "시간", "보스", "컷자", "참여자"] });
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 16 },
    { wch: 50 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "보스로그");
  XLSX.writeFile(workbook, `${getBossParticipationExportFileName(state)}.xlsx`);
}
