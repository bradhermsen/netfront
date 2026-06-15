// =========================================================
// RosterApi — Unified CRUD API Wrapper for Rosters
// =========================================================

window.RosterApi = {
  // -------------------------------------------------------
  // GET ALL TEAMS (for AdminPage table)
  // -------------------------------------------------------
  async getAll() {
    const res = await fetch(`${window.apiBase}/teams`);
    if (!res.ok) return [];
    return await res.json();
  },

  // -------------------------------------------------------
  // GET ONE ROSTER ENTRY
  // -------------------------------------------------------
  async getById(rosterEntryId) {
    const res = await fetch(`${window.apiBase}/roster/${rosterEntryId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // -------------------------------------------------------
  // CREATE ROSTER ENTRY
  // -------------------------------------------------------
  async create(payload) {
    const res = await fetch(`${window.apiBase}/roster`, {
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
    const res = await fetch(`${window.apiBase}/roster/${rosterEntryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Failed to update roster entry`);
    return await res.json();
  },

  // -------------------------------------------------------
  // DELETE ROSTER ENTRY
  // -------------------------------------------------------
  async delete(rosterEntryId) {
    const res = await fetch(`${window.apiBase}/roster/${rosterEntryId}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error(`Failed to delete roster entry`);
    return true;
  },
};
