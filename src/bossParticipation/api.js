import { escapeSupabaseLike, kstDateBoundaryToIso } from "./formatters.js";

export async function loadBossParticipationRows({ bossSupabase, tabState, normalizeSearchText }) {
  if (!bossSupabase) {
    throw new Error("보스봇 Supabase URL과 ANON KEY를 script 파일에 설정해주세요.");
  }

  const records = [];
  const recordPageSize = 1000;
  let recordFrom = 0;

  while (true) {
    let query = bossSupabase
      .from("boss_kill_records")
      .select("id, boss_id, boss_name, record_type, cut_time, cut_by_nickname, cut_by_discord_id, cut_source, next_spawn_time, created_at")
      .order("cut_time", { ascending: false })
      .range(recordFrom, recordFrom + recordPageSize - 1);

    if (tabState.startDate) {
      query = query.gte("cut_time", kstDateBoundaryToIso(tabState.startDate, false));
    }

    if (tabState.endDate) {
      query = query.lt("cut_time", kstDateBoundaryToIso(tabState.endDate, true));
    }

    if (tabState.bossKeyword) {
      query = query.ilike("boss_name", `%${escapeSupabaseLike(tabState.bossKeyword)}%`);
    }

    const recordRes = await query;
    if (recordRes.error) {
      throw new Error(`보스 컷 기록 조회 중 오류가 발생했습니다.\n${recordRes.error.message}`);
    }

    const pageRecords = recordRes.data ?? [];
    records.push(...pageRecords);

    if (pageRecords.length < recordPageSize) {
      break;
    }

    recordFrom += recordPageSize;
  }

  const recordIds = records.map((row) => row.id).filter(Boolean);
  const participants = await loadBossParticipantsByRecordIds(bossSupabase, recordIds);
  const participantMap = groupBossParticipantsByRecordId(participants);
  const participantKeyword = normalizeSearchText(tabState.participantKeyword);

  let rows = records.map((record) => {
    const rowParticipants = participantMap.get(record.id) || [];
    return {
      id: record.id,
      bossName: record.boss_name || "-",
      recordType: record.record_type || "-",
      cutTime: record.cut_time || "",
      cutByNickname: record.cut_by_nickname || "-",
      cutSource: record.cut_source || "-",
      nextSpawnTime: record.next_spawn_time || "",
      participants: rowParticipants
    };
  });

  if (participantKeyword) {
    rows = rows.filter((row) => row.participants.some((participant) => {
      return normalizeSearchText(participant.discord_nickname).includes(participantKeyword);
    }));
  }

  return rows;
}

export async function loadBossParticipantsByRecordIds(bossSupabase, recordIds) {
  if (!recordIds.length) return [];

  const rows = [];
  const chunkSize = 500;
  const pageSize = 1000;

  for (let index = 0; index < recordIds.length; index += chunkSize) {
    const chunk = recordIds.slice(index, index + chunkSize);
    let from = 0;

    while (true) {
      const res = await bossSupabase
        .from("boss_participants")
        .select("kill_record_id, boss_id, boss_name, cut_time, discord_user_id, discord_nickname, created_at")
        .in("kill_record_id", chunk)
        .order("created_at", { ascending: true })
        .range(from, from + pageSize - 1);

      if (res.error) {
        throw new Error(`보스 참여자 조회 중 오류가 발생했습니다.\n${res.error.message}`);
      }

      const pageRows = res.data ?? [];
      rows.push(...pageRows);

      if (pageRows.length < pageSize) {
        break;
      }

      from += pageSize;
    }
  }

  return rows;
}

export function groupBossParticipantsByRecordId(participants) {
  const map = new Map();
  participants.forEach((participant) => {
    const key = participant.kill_record_id;
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(participant);
  });
  return map;
}
