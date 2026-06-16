// =========================================================
// USERS API WRAPPER (Admin Portal)
// =========================================================

window.UsersAPI = {
  // -------------------------------------------------------
  // GET ALL USERS
  // -------------------------------------------------------
  async getAll() {
    const res = await authFetch("/api/users");
    return res.json();
  },

  // -------------------------------------------------------
  // GET USER BY ID
  // -------------------------------------------------------
  async getById(id) {
    const res = await authFetch(`/api/users/${id}`);
    return res.json();
  },

  // -------------------------------------------------------
  // CREATE USER
  // -------------------------------------------------------
  async create(payload) {
    return authFetch("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // -------------------------------------------------------
  // UPDATE USER
  // -------------------------------------------------------
  async update(id, payload) {
    return authFetch(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // -------------------------------------------------------
  // DELETE USER
  // -------------------------------------------------------
  async delete(id) {
    return authFetch(`/api/users/${id}`, {
      method: "DELETE",
    });
  },
};
