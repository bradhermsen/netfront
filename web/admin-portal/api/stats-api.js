window.StatsApi = {
  async getTeamStats(filters = {}) {
    return await fetchStats("/stats/team", filters);
  },

  async getPlayerStats(filters = {}) {
    return await fetchStats("/stats/player", filters);
  },

  async getGameStats(filters = {}) {
    return await fetchStats("/stats/game", filters);
  },

  async getSeasonStats(filters = {}) {
    return await fetchStats("/stats/season", filters);
  },

  async getLeaders(filters = {}) {
    return await fetchStats("/stats/leaders", filters);
  },
};

async function fetchStats(path, filters) {
  const params = new URLSearchParams();

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const url = query ? `${path}?${query}` : path;

  const res = await authFetch(url);
  if (!res || !res.ok) {
    throw new Error(`Stats request failed: ${res?.status ?? "no response"}`);
  }

  return await res.json();
}
