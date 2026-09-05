window.SeasonsApi = {
  async getAll() {
    const response = await authFetch("/seasons", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load seasons");
    return await response.json();
  },

  async create(payload) {
    const response = await authFetch("/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response, "Failed to create season"));
  },

  async update(id, payload) {
    const response = await authFetch(`/seasons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response, "Failed to update season"));
  },

  async delete(id) {
    const response = await authFetch(`/seasons/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await this.readError(response, "Failed to delete season"));
  },

  async getOrganizations(id) {
    const response = await authFetch(`/seasons/${id}/organizations`, { cache: "no-store" });
    if (!response.ok) throw new Error(await this.readError(response, "Failed to load season organizations"));
    return await response.json();
  },

  async saveOrganizations(id, organizations) {
    const response = await authFetch(`/seasons/${id}/organizations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizations }),
    });
    if (!response.ok) throw new Error(await this.readError(response, "Failed to save season organizations"));
  },

  async getTeamImportCandidates(targetSeasonId, sourceSeasonId) {
    const response = await authFetch(
      `/seasons/${targetSeasonId}/team-import-candidates?sourceSeasonId=${encodeURIComponent(sourceSeasonId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error(await this.readError(response, "Failed to load team import candidates"));
    return await response.json();
  },

  async importTeams(targetSeasonId, sourceSeasonId, teamIds) {
    const response = await authFetch(`/seasons/${targetSeasonId}/teams/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceSeasonId, teamIds }),
    });
    if (!response.ok) throw new Error(await this.readError(response, "Failed to import teams"));
    return await response.json();
  },

  async readError(response, fallback) {
    try {
      const payload = await response.json();
      return payload?.message || payload?.error || fallback;
    } catch {
      return fallback;
    }
  },
};
