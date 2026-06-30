const TeamApi = {
  baseUrl: `${window.apiBase}/teams`,

  async getAll() {
    const res = await authFetch("/teams");
    if (!res.ok) {
      console.error("Failed to fetch teams:", res.status);
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  },

  async getById(id) {
    const res = await authFetch(`/teams/${id}`);
    if (!res.ok) {
      console.error("Failed to fetch team:", res.status);
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  },

  async create(payload) {
    console.log(">>> TeamApi.create() payload:", payload);

    const res = await authFetch("/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Failed to create team:", res.status);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data.teamId; // ✔ correct
  },

  async update(id, payload) {
    const res = await authFetch(`/teams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Failed to update team:", res.status);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  },

  async delete(id) {
    const res = await authFetch(`/teams/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Failed to delete team:", res.status);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  },
};
