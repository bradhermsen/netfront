// =========================================================
// PLAYER API — CLEAN CRUD + DTO SUPPORT
// =========================================================

const PlayerApi = {
  // -------------------------------------------------------
  // GET ALL (DTO LIST)
  // -------------------------------------------------------
  async getAll() {
    const res = await fetch(`${window.apiBase}/players/dto`);
    if (!res.ok) throw new Error("Failed to load players");
    return await res.json();
  },

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------
  async getById(id) {
    const res = await fetch(`${window.apiBase}/players/${id}`);
    if (!res.ok) throw new Error("Failed to load player");
    return await res.json();
  },

  // -------------------------------------------------------
  // CREATE
  // -------------------------------------------------------
  async create(data) {
    const res = await fetch(`${window.apiBase}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create player");
    return await res.json();
  },

  // -------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------
  async update(id, data) {
    const res = await fetch(`${window.apiBase}/players/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Server error response:", errorText);
      throw new Error(`Failed to update player: ${errorText}`);
    }

    // Some APIs return 204 No Content on update
    if (res.status === 204) return true;

    return await res.json();
  },

  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------
  async delete(id) {
    const res = await fetch(`${window.apiBase}/players/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete player");
    return true;
  },
};
