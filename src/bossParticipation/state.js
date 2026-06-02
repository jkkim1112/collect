export function initializeBossParticipationState(state) {
  state.bossParticipation = {
    startDate: "",
    endDate: "",
    bossKeyword: "",
    participantKeyword: "",
    rows: [],
    loading: false,
    loaded: false
  };
}
