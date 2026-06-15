// org-api.js

const OrgApi = {
  baseUrl: "http://localhost:7071/api/organizations",

  async getAll() {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error("Failed to load organizations");
    return await res.json();
  },

  async getById(id) {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (!res.ok) throw new Error("Failed to load organization");
    return await res.json();
  },

  async create(dto) {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error("Failed to create organization");
    return await res.json();
  },

  async update(id, dto) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error("Failed to update organization");
  },

  async delete(id) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete organization");
  },
};
