// =========================================================
// USERS API — CLEAN CRUD + DTO SUPPORT
// =========================================================

const UsersAPI = {
  // -------------------------------------------------------
  // GET ALL USERS (DTO LIST)
  // -------------------------------------------------------
  async getAll() {
    const res = await fetch(`${window.apiBase}/users`);
    if (!res.ok) throw new Error("Failed to load users");
    return await res.json();
  },

  // -------------------------------------------------------
  // GET USER BY ID
  // -------------------------------------------------------
  async getById(id) {
    const res = await fetch(`${window.apiBase}/users/${id}`);
    if (!res.ok) throw new Error("Failed to load user");
    return await res.json();
  },

  // -------------------------------------------------------
  // CREATE USER
  // -------------------------------------------------------
  async create(data) {
    const res = await fetch(`${window.apiBase}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create user");
    return await res.json();
  },

  // -------------------------------------------------------
  // UPDATE USER
  // -------------------------------------------------------
  async update(id, data) {
    const res = await fetch(`${window.apiBase}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update user");

    // Some APIs return 204 No Content on update
    if (res.status === 204) return true;

    return await res.json();
  },

  // -------------------------------------------------------
  // DELETE USER
  // -------------------------------------------------------
  async delete(id) {
    const res = await fetch(`${window.apiBase}/users/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete user");
    return true;
  },
};
