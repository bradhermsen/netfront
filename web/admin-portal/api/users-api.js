// =========================================================
// USERS API — CLEAN CRUD + DTO SUPPORT
// =========================================================

const UsersAPI = {
  // -------------------------------------------------------
  // GET ALL USERS (DTO LIST)
  // -------------------------------------------------------
  async getAll() {
    const res = await authFetch("/users");
    if (!res.ok) throw new Error("Failed to load users");
    return await res.json();
  },

  // -------------------------------------------------------
  // GET USER BY ID
  // -------------------------------------------------------
  async getById(id) {
    const res = await authFetch(`/users/${id}`);
    if (!res.ok) throw new Error("Failed to load user");
    return await res.json();
  },

  // -------------------------------------------------------
  // CREATE USER
  // -------------------------------------------------------
  async create(data) {
    const res = await authFetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create user");
    return await res.json();
  },

  // -------------------------------------------------------
  // UPDATE USER
  // -------------------------------------------------------
  async update(id, data) {
    const res = await authFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update user");

    // AdminPage expects a boolean
    return true;
  },

  // -------------------------------------------------------
  // DELETE USER
  // -------------------------------------------------------
  async delete(id) {
    const res = await authFetch(`/users/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete user");

    // AdminPage expects a boolean
    return true;
  },
};
