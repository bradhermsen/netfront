// =========================================================
// USERS API — CLEAN CRUD + DTO SUPPORT
// =========================================================

const UsersAPI = {
  // -------------------------------------------------------
  // GET ALL USERS
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
  // GET USER BY EMAIL (404 = user not found)
  // -------------------------------------------------------
  async getByEmail(email) {
    const encoded = encodeURIComponent(email);
    const res = await authFetch(`/users/by-email?email=${encoded}`);

    if (res.status === 404) {
      return null; // user does not exist — this is OK
    }

    if (!res.ok) {
      const backendError = await res.text();
      console.error("❌ UsersAPI.getByEmail() backend error:", backendError);
      throw new Error(backendError);
    }

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

    if (!res.ok) {
      const backendError = await res.text();
      console.error("❌ UsersAPI.create() backend error:", backendError);
      throw new Error(backendError);
    }

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
    return true;
  },
};
