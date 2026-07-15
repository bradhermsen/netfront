const OfficialsApi = {
  async getAll() {
    const res = await authFetch("/officials/all");
    if (!res.ok) throw new Error("Failed to load officials");
    return await res.json();
  },

  async getById(id) {
    const res = await authFetch(`/officials/${id}`);
    if (!res.ok) throw new Error("Failed to load official");
    return await res.json();
  },

  async create(dto) {
    const res = await authFetch("/officials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error("Failed to create official");
    return await res.json();
  },

  async update(id, dto) {
    const res = await authFetch(`/officials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error("Failed to update official");
  },

  async delete(id) {
    const res = await authFetch(`/officials/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      let message = "Failed to delete official";
      try {
        const payload = await res.json();
        if (payload?.message) {
          message = payload.message;
        }
      } catch {
        // Ignore JSON parse issues and use fallback message.
      }

      throw new Error(message);
    }
  },
};
