export function bindNewDistributionUi(state, deps) {
  const root = document.querySelector(".newdist-root");
  if (!root) return;

  root.addEventListener("click", deps.handleDistributionClick);
  root.addEventListener("input", deps.handleDistributionInput);
  root.addEventListener("change", deps.handleDistributionChange);

  document.getElementById("newdistResetBtn")?.addEventListener("click", deps.handleDistributionReset);
  document.getElementById("newdistLoadBtn")?.addEventListener("click", deps.handleDistributionLoadExcel);
  document.getElementById("newdistOpenBossManageBtn")?.addEventListener("click", () => deps.openDistributionModal("newdistBossManageModal"));
  document.getElementById("newdistOpenNameRuleBtn")?.addEventListener("click", () => deps.openDistributionModal("newdistNameRuleModal"));
  document.getElementById("newdistBossAddBtn")?.addEventListener("click", deps.handleDistributionAddBossRule);
  document.getElementById("newdistBossSaveBtn")?.addEventListener("click", deps.handleDistributionSaveBossRules);
  document.getElementById("newdistNameRuleAddBtn")?.addEventListener("click", deps.handleDistributionAddNameRule);
  document.getElementById("newdistNameRuleSaveBtn")?.addEventListener("click", deps.handleDistributionSaveNameRules);
  document.getElementById("newdistLogEditApplyBtn")?.addEventListener("click", deps.handleDistributionApplyLogEdit);
  bindDistributionButtonIds(["distributionSaveBtn", "distributionExportBtn", "newdistExportBtn"], deps.handleDistributionExport);
  bindDistributionButtonIds(["distributionFinalSaveBtn", "newdistFinalSaveBtn"], deps.handleDistributionFinalSave);

  ["mainland", "world"].forEach((groupKey) => {
    const upper = groupKey === "mainland" ? "Mainland" : "World";
    document.getElementById(`newdist${upper}AddDeductionBtn`)?.addEventListener("click", () => deps.handleDistributionAddDeduction(groupKey));
    document.getElementById(`newdist${upper}ApplyDeductionBtn`)?.addEventListener("click", () => deps.handleDistributionApplyDeductions(groupKey));
    document.getElementById(`newdist${upper}RefreshBtn`)?.addEventListener("click", () => deps.handleDistributionRefreshGroup(groupKey));
    document.getElementById(`newdist${upper}CalcBtn`)?.addEventListener("click", () => deps.handleDistributionCalculate(groupKey));
    document.getElementById(`newdist${upper}ClearBtn`)?.addEventListener("click", () => deps.handleDistributionClearResults(groupKey));
  });

  root.querySelectorAll(".newdist-subtab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.distribution.activeSubtab = tab.dataset.newdistTab || "mainland";
      deps.updateDistributionSubtabs();
    });
  });

  root.querySelectorAll("[data-newdist-close]").forEach((button) => {
    button.addEventListener("click", () => deps.closeDistributionModal(button.dataset.newdistClose));
  });

  deps.updateDistributionSubtabs();
}

function bindDistributionButtonIds(ids, handler) {
  ids.forEach((id) => {
    const button = document.getElementById(id);
    if (!button || button.dataset.distributionBound === "true") return;
    button.dataset.distributionBound = "true";
    button.addEventListener("click", handler);
  });
}

export function renderDistributionTab(deps) {
  renderDistributionCommonInputs(deps);
  renderDistributionCommonSummary(deps);
  renderDistributionGroup(deps, "mainland");
  renderDistributionGroup(deps, "world");
  renderDistributionBossRules(deps);
  renderDistributionNameRules(deps);
  deps.updateDistributionSubtabs();
}

export function renderDistributionCommonInputs({ state, setValueIfNeeded }) {
  const distribution = state.distribution;
  setValueIfNeeded("newdistTotalDiamondInput", distribution.totalDiamond || distribution.totalDiamond === 0 ? String(distribution.totalDiamond) : "");
  setValueIfNeeded("newdistMainlandRatioInput", String(distribution.mainlandRatio));
  setValueIfNeeded("newdistWorldRatioInput", String(distribution.worldRatio));
}

export function renderDistributionCommonSummary({
  state,
  getDistributionAssignedAmounts,
  setText,
  formatNumber
}) {
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

export function renderDistributionGroup(deps, groupKey) {
  const group = deps.state.distribution[groupKey];
  const summary = deps.calculateDistributionGroupSummary(groupKey);

  group.summary = summary;

  const prefix = groupKey === "mainland" ? "newdistMainland" : "newdistWorld";
  deps.setText(`${prefix}Assigned`, deps.formatNumber(summary.assignedDiamond));
  deps.setText(`${prefix}DeductionTotal`, deps.formatNumber(summary.deductionTotal));
  deps.setText(`${prefix}ActualDiamond`, deps.formatNumber(summary.actualDiamond));
  deps.setText(`${prefix}TotalPoints`, deps.formatNumber(summary.totalPoints));
  deps.setText(`${prefix}PerPoint`, deps.formatDecimal(summary.perPoint, 1));
  deps.setText(`${prefix}Remaining`, deps.formatNumber(summary.remainingDiamond));
  deps.setText(`${prefix}DeductionChip`, deps.formatNumber(summary.deductionTotal));
  deps.setText(`${prefix}ActualChip`, deps.formatNumber(summary.actualDiamond));

  renderDistributionDeductionTable(deps, groupKey);
  renderDistributionLogs(deps, groupKey);
  renderDistributionResults(deps, groupKey);
}

export function renderDistributionDeductionTable(deps, groupKey) {
  const body = document.getElementById(groupKey === "mainland" ? "newdistMainlandDeductionBody" : "newdistWorldDeductionBody");
  if (!body) return;

  const rows = deps.state.distribution[groupKey].deductions;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="distribution-empty-row">등록된 공제 항목이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((row) => {
    const appliedRow = deps.findAppliedDistributionDeductionRow(groupKey, row.id);
    const deductionAmount = appliedRow ? deps.getDistributionDeductionAmount(groupKey, appliedRow) : 0;

    return `
    <tr>
      <td><input class="newdist-input-sm" type="text" data-role="newdist-deduction-name" data-group="${groupKey}" data-id="${row.id}" value="${deps.escapeAttr(row.name)}"></td>
      <td>
        <select class="newdist-select-sm" data-role="newdist-deduction-mode" data-group="${groupKey}" data-id="${row.id}">
          <option value="percent" ${row.mode === "percent" ? "selected" : ""}>%</option>
          <option value="amount" ${row.mode === "amount" ? "selected" : ""}>직접금액</option>
        </select>
      </td>
      <td><input class="newdist-input-sm" type="number" min="0" step="0.01" data-role="newdist-deduction-value" data-group="${groupKey}" data-id="${row.id}" value="${deps.escapeAttr(row.value ?? "")}"></td>
      <td class="right">${deps.formatNumber(deductionAmount)}</td>
      <td class="center"><button class="btn btn-outline" type="button" data-role="newdist-delete-deduction" data-group="${groupKey}" data-id="${row.id}">삭제</button></td>
    </tr>
  `;
  }).join("");
}

export function renderDistributionLogs(deps, groupKey) {
  const body = document.getElementById(groupKey === "mainland" ? "newdistMainlandLogBody" : "newdistWorldLogBody");
  if (!body) return;

  const logs = deps.state.distribution[groupKey].logs;
  if (!logs.length) {
    body.innerHTML = `<tr><td colspan="9" class="distribution-empty-row">표시할 작업 로그가 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = logs.map((log, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td>${deps.escapeHtml(log.dateText || "-")}</td>
      <td>${deps.escapeHtml(log.timeText || "-")}</td>
      <td>${deps.escapeHtml(log.boss || "-")}</td>
      <td class="center"><span class="newdist-badge ${groupKey === "mainland" ? "newdist-badge-mainland" : "newdist-badge-world"}">${groupKey === "mainland" ? "본토" : "월드"}</span></td>
      <td>${deps.escapeHtml(log.cutter || "-")}</td>
      <td>${deps.escapeHtml(log.rawParticipants.join(", ")) || "-"}</td>
      <td>${deps.escapeHtml(log.workingParticipants.join(", ")) || "-"}</td>
      <td class="center"><button class="btn btn-outline newdist-log-edit-btn" type="button" data-role="newdist-edit-log" data-group="${groupKey}" data-log-key="${log.key}">수정</button></td>
    </tr>
  `).join("");
}

export function renderDistributionResults(deps, groupKey) {
  const body = document.getElementById(groupKey === "mainland" ? "newdistMainlandResultBody" : "newdistWorldResultBody");
  if (!body) return;

  const rows = deps.state.distribution[groupKey].results;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="7" class="distribution-empty-row">계산 결과가 없습니다.</td></tr>`;
    return;
  }

  const sortedRows = [...rows].sort((left, right) => {
    const leftRetired = left.note === "탈퇴한 길드원";
    const rightRetired = right.note === "탈퇴한 길드원";
    if (leftRetired !== rightRetired) return leftRetired ? 1 : -1;

    const pointDiff = Number(right.points ?? 0) - Number(left.points ?? 0);
    if (pointDiff !== 0) return pointDiff;
    return String(left.memberName ?? "").localeCompare(String(right.memberName ?? ""), "ko");
  });

  body.innerHTML = sortedRows.map((row, index) => `
    <tr class="${row.note === "탈퇴한 길드원" ? "newdist-danger-soft" : ""}">
      <td class="center">${index + 1}</td>
      <td>${deps.escapeHtml(row.memberName)}</td>
      <td class="right">${deps.formatNumber(row.points)}</td>
      <td class="right">${deps.formatPercent(row.ratio)}</td>
      <td class="right">${deps.formatDecimal(row.rawDiamond, 1)}</td>
      <td class="right">${deps.formatNumber(row.finalDiamond)}</td>
      <td>${deps.escapeHtml(row.note || "-")}</td>
    </tr>
  `).join("");
}

export function renderDistributionBossRules({ state, escapeAttr }) {
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
      <td class="right"><input class="newdist-input-sm" type="number" min="0" step="1" data-role="newdist-boss-score" data-id="${row.id}" value="${escapeAttr(row.score)}"></td>
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

export function renderDistributionNameRules({ state, escapeAttr }) {
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

export function initializeDistributionState(state, deps) {
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
    bossRulesLoaded: false,
    bossRuleDbIds: [],
    mainland: deps.createDistributionGroupState("mainland"),
    world: deps.createDistributionGroupState("world")
  };
}

export function createDistributionGroupState(type, createDistributionSummary) {
  return {
    type,
    deductions: [],
    appliedDeductions: [],
    logs: [],
    results: [],
    summary: createDistributionSummary(),
    dirtyLogs: false
  };
}

export function createDistributionSummary() {
  return {
    assignedDiamond: 0,
    deductionTotal: 0,
    actualDiamond: 0,
    totalPoints: 0,
    perPoint: 0,
    remainingDiamond: 0
  };
}

export function createDistributionDeduction(createDistributionId, name = "", mode = "percent", value = "") {
  return {
    id: createDistributionId("ded"),
    name,
    mode,
    value: value === "" ? "" : Number(value)
  };
}

export function createBossRule(createDistributionId, name = "", score = 1, group = "mainland") {
  const parsedScore = Math.floor(Number(score));
  return {
    id: createDistributionId("boss"),
    name,
    score: Number.isFinite(parsedScore) && parsedScore >= 0 ? parsedScore : 1,
    group
  };
}

export function createNameRule(createDistributionId, source = "", target = "") {
  return {
    id: createDistributionId("name"),
    source,
    target
  };
}

export function createDistributionId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function getDistributionAssignedAmounts(state) {
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

export function getDistributionDeductionAmount(state, groupKey, row) {
  const assigned = getDistributionAssignedAmounts(state)[groupKey];
  const value = Number(row.value);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (row.mode === "amount") return Math.floor(value);
  return Math.floor(assigned * (value / 100));
}

export function getDistributionPeriodRange(state) {
  const dates = state.distribution.loadedLogs
    .map((log) => String(log.dateText || "").trim())
    .filter(Boolean)
    .sort();

  if (!dates.length) {
    return { startDate: "", endDate: "" };
  }

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1]
  };
}

export function getDistributionCombinedResults(state) {
  const resultMap = new Map();
  const memberMap = new Map(state.members.map((member) => [normalizeDistributionName(member.name), member]));

  ["mainland", "world"].forEach((groupKey) => {
    state.distribution[groupKey].results.forEach((row) => {
      const key = normalizeDistributionName(row.memberName);
      const current = resultMap.get(key) || {
        memberId: memberMap.get(key)?.id ?? null,
        memberName: memberMap.get(key)?.name || row.memberName,
        points: 0,
        rawDiamond: 0,
        finalDiamond: 0,
        note: row.note || "",
        isRetired: row.note === "탈퇴한 길드원"
      };

      current.points += Number(row.points ?? 0);
      current.rawDiamond += Number(row.rawDiamond ?? 0);
      current.finalDiamond += Number(row.finalDiamond ?? 0);
      if (row.note === "탈퇴한 길드원") {
        current.note = "탈퇴한 길드원";
        current.isRetired = true;
      }

      resultMap.set(key, current);
    });
  });

  const activeTotalPoints = Array.from(resultMap.values())
    .filter((row) => !row.isRetired)
    .reduce((sum, row) => sum + row.points, 0);

  return Array.from(resultMap.values())
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      return String(left.memberName).localeCompare(String(right.memberName), "ko");
    })
    .map((row) => ({
      ...row,
      ratio: !row.isRetired && activeTotalPoints > 0 ? row.points / activeTotalPoints : 0
    }));
}

export function getDistributionCombinedSummary(state, createDistributionSummary) {
  const mainlandSummary = state.distribution.mainland.summary || createDistributionSummary();
  const worldSummary = state.distribution.world.summary || createDistributionSummary();
  const totalPoints = Number(mainlandSummary.totalPoints ?? 0) + Number(worldSummary.totalPoints ?? 0);
  const actualDiamond = Number(mainlandSummary.actualDiamond ?? 0) + Number(worldSummary.actualDiamond ?? 0);
  const remainingDiamond = Number(mainlandSummary.remainingDiamond ?? 0) + Number(worldSummary.remainingDiamond ?? 0);

  return {
    actualDiamond,
    totalPoints,
    diamondPerPoint: totalPoints > 0 ? actualDiamond / totalPoints : 0,
    remainingDiamond
  };
}

export async function readWorkbookFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  return arrayBuffer;
}

export function readDistributionSheetRows(workbookData, XLSX) {
  const workbook = XLSX.read(workbookData, { type: "array", cellDates: true });
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

export function buildDistributionLogsFromRows(rows, createDistributionId) {
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

export function findDistributionHeaderKey(keys, words) {
  const lowered = keys.map((key) => ({ key, lowered: String(key).toLowerCase() }));
  const exact = lowered.find((entry) => words.some((word) => entry.lowered.includes(String(word).toLowerCase())));
  return exact?.key || "";
}

export function normalizeDistributionDateText(value) {
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
  return text.replace(/\./g, "-").replace(/\//g, "-");
}

export function normalizeDistributionTimeText(value) {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).trim();
  if (!text) return "";
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
  }
  return text;
}

export function splitParticipantText(text) {
  return String(text ?? "")
    .replace(/\n/g, ",")
    .split(/[,\|\/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function dedupeStrings(values) {
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

export function normalizeDistributionName(value) {
  return String(value ?? "").trim().replace(/\s+/g, "").toLowerCase();
}
