// org-api.js

const OrgApi = {
  async getAll(options = {}) {
    const res = await authFetch("/organizations");
    if (!res.ok) throw new Error("Failed to load organizations");
    const organizations = await res.json();
    return options.activeSeasonOnly
      ? await SeasonContext.filterOrganizations(organizations)
      : organizations;
  },

  async getById(id) {
    const res = await authFetch(`/organizations/${id}`);
    if (!res.ok) throw new Error("Failed to load organization");
    return await res.json();
  },

  async create(dto) {
    const res = await authFetch("/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error("Failed to create organization");
    return await res.json();
  },

  async update(id, dto) {
    const res = await authFetch(`/organizations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error("Failed to update organization");
  },

  async delete(id) {
    const res = await authFetch(`/organizations/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete organization");
  },
};
