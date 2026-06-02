export function getBossParticipationExportFileName(state) {
  const rows = state.bossParticipation?.rows || [];
  const rowDates = rows
    .map((row) => getBossParticipationKstDateTimeParts(row.cutTime).date)
    .filter(Boolean)
    .sort();
  const startDate = state.bossParticipation?.startDate || rowDates[0] || "0000-00-00";
  const endDate = state.bossParticipation?.endDate || rowDates[rowDates.length - 1] || "0000-00-00";
  return `보스로그 ${formatBossParticipationFileDate(startDate)}-${formatBossParticipationFileDate(endDate)}`;
}

export function formatBossParticipationFileDate(value) {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  return digits || "00000000";
}

export function getBossParticipationKstDateTimeParts(value) {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach((part) => {
    map[part.type] = part.value;
  });

  const hour = map.hour === "24" ? "00" : map.hour;
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${hour}:${map.minute}:${map.second}`
  };
}

export function getBossParticipationRecordTypeText(recordType) {
  if (recordType === "cut") return "컷";
  if (recordType === "mung") return "멍";
  return recordType || "-";
}

export function formatBossParticipationDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach((part) => {
    map[part.type] = part.value;
  });

  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.month}-${map.day} ${hour}:${map.minute}`;
}

export function kstDateBoundaryToIso(dateText, isEndBoundary) {
  const [year, month, day] = String(dateText).split("-").map(Number);
  const addDay = isEndBoundary ? 1 : 0;
  return new Date(Date.UTC(year, month - 1, day + addDay, -9, 0, 0)).toISOString();
}

export function escapeSupabaseLike(value) {
  return String(value ?? "").replace(/[%_]/g, "");
}
