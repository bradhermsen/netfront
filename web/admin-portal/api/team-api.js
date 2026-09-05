const TeamApi = {
  baseUrl: `${window.apiBase}/teams`,

  normalizeTeam(team) {
    if (!team || typeof team !== "object") return team;

    return {
      ...team,
      conferenceDistrictId:
        team.conferenceDistrictId || team.conferenceDistrictID || null,
      conferenceDistrictName:
        team.conferenceDistrictName || team.conferenceName || "",
      sectionRegionId:
        team.sectionRegionId || team.sectionRegionID || null,
      sectionRegionName:
        team.sectionRegionName || team.sectionName || "",
    };
  },

  async getAll() {
    const res = await authFetch("/teams");
    if (!res.ok) {
      console.error("Failed to fetch teams:", res.status);
      throw new Error(`HTTP ${res.status}`);
    }
    const payload = await res.json();
    const normalized = Array.isArray(payload)
      ? payload.map((t) => this.normalizeTeam(t))
      : [];
    return await SeasonContext.filterTeams(normalized);
  },

  async getById(id) {
    const res = await authFetch(`/teams/${id}`);
    if (!res.ok) {
      console.error("Failed to fetch team:", res.status);
      throw new Error(`HTTP ${res.status}`);
    }
    const payload = await res.json();
    return this.normalizeTeam(payload);
  },

  async create(payload) {
    const payloadWithConference = {
      ...payload,
      conferenceDistrictId: payload?.conferenceDistrictId || null,
      sectionRegionId: payload?.sectionRegionId || null,
    };

const res = await authFetch("/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithConference),
    });

    if (!res.ok) {
      let detail = "";
      try {
        const data = await res.json();
        detail = data?.error ? ` - ${data.error}` : "";
      } catch {
        detail = "";
      }

      console.error("Failed to create team:", res.status, detail);
      throw new Error(`HTTP ${res.status}: ${res.statusText}${detail}`);
    }

    const data = await res.json();
    return data.teamId; // ✔ correct
  },

  async update(id, payload) {
    const payloadWithConference = {
      ...payload,
      conferenceDistrictId: payload?.conferenceDistrictId || null,
      sectionRegionId: payload?.sectionRegionId || null,
    };

    const res = await authFetch(`/teams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithConference),
    });

    if (!res.ok) {
      let detail = "";
      try {
        const data = await res.json();
        detail = data?.error ? ` - ${data.error}` : "";
      } catch {
        detail = "";
      }

      console.error("Failed to update team:", res.status, detail);
      throw new Error(`HTTP ${res.status}: ${res.statusText}${detail}`);
    }
  },

  async delete(id) {
    const res = await authFetch(`/teams/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Failed to delete team:", res.status);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  },
};
