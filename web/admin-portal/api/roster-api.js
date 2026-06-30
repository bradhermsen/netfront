// =========================================================
// RosterApi — Unified CRUD API Wrapper for Rosters
// =========================================================

window.RosterApi = {
  // -------------------------------------------------------
  // GET ALL TEAMS (for AdminPage table)
  // -------------------------------------------------------
  async getAll() {
    const res = await authFetch(`/teams`);
    if (!res.ok) return [];
    return await res.json();
  },

  // -------------------------------------------------------
  // GET ONE ROSTER ENTRY
  // -------------------------------------------------------
  async getById(rosterEntryId) {
    const res = await authFetch(`/roster/${rosterEntryId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // -------------------------------------------------------
  // CREATE ROSTER ENTRY
  // -------------------------------------------------------
  async create(payload) {
    const res = await authFetch(`/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Failed to create roster entry`);
    return await res.json();
  },

  // -------------------------------------------------------
  // UPDATE ROSTER ENTRY
  // -------------------------------------------------------
  async update(rosterEntryId, payload) {
    console.log("RosterApi.update called with ID:", rosterEntryId, "payload:", payload);
    
    const res = await authFetch(`/roster/${rosterEntryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("RosterApi.update response status:", res.status);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
      console.error("RosterApi.update error response:", errorData);
      throw new Error(`Failed to update roster entry: ${errorData.error || res.statusText}`);
    }
    
    const result = await res.json();
    console.log("✓ RosterApi.update success response:", result);
    return result;
  },

  // -------------------------------------------------------
  // DELETE ROSTER ENTRY
  // -------------------------------------------------------
  async delete(rosterEntryId) {
    const res = await authFetch(`/roster/${rosterEntryId}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error(`Failed to delete roster entry`);
    return true;
  },

  // -------------------------------------------------------
  // GET AVAILABLE PLAYERS FOR TEAM (for add modal)
  // -------------------------------------------------------
  async getAvailablePlayersForTeam(teamId) {
    const url = `/teams/${teamId}/available-players`;
    console.log("Fetching available players from:", url);
    
    const res = await authFetch(url);
    console.log("getAvailablePlayersForTeam response status:", res.status);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
      console.error("getAvailablePlayersForTeam error:", errorData);
      throw new Error(`Failed to get available players: ${errorData.error || res.statusText}`);
    }
    
    const data = await res.json();
    console.log("getAvailablePlayersForTeam raw response:", data);
    console.log("getAvailablePlayersForTeam response type:", typeof data);
    console.log("getAvailablePlayersForTeam is array?:", Array.isArray(data));
    
    // Handle both direct array and wrapped response
    const players = Array.isArray(data) ? data : data.data || data.players || [];
    console.log("getAvailablePlayersForTeam final players:", players.length);
    
    return players;
  },
};
