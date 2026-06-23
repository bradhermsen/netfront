// =========================================================
// COACH–TEAM ASSIGNMENT API
// =========================================================

const CoachTeamsApi = {
  // -------------------------------------------------------
  // ASSIGN COACH TO TEAM
  // -------------------------------------------------------
  async assign(userId, teamId) {
    const res = await authFetch("/coachteams/assign", {
      method: "POST",
      body: JSON.stringify({ userId, teamId }),
    });

    if (!res.ok) {
      console.error("CoachTeamsApi.assign() FAILED", { userId, teamId });
      throw new Error("Failed to assign coach to team");
    }

    return true;
  },

  // -------------------------------------------------------
  // GET ALL TEAMS FOR A COACH
  // -------------------------------------------------------
  async getTeamsForCoach(userId) {
    const res = await authFetch(`/coachteams/coach/${userId}`);

    if (!res.ok) {
      console.error("CoachTeamsApi.getTeamsForCoach() FAILED", { userId });
      throw new Error("Failed to load coach teams");
    }

    return await res.json();
  },

  // -------------------------------------------------------
  // GET ALL COACHES FOR A TEAM
  // -------------------------------------------------------
  async getCoachesForTeam(teamId) {
    const res = await authFetch(`/coachteams/team/${teamId}`);

    if (!res.ok) {
      console.error("CoachTeamsApi.getCoachesForTeam() FAILED", { teamId });
      throw new Error("Failed to load team coaches");
    }

    return await res.json();
  },
};
