const TeamApi = {
    baseUrl: "http://localhost:7071/api/teams",

    async getAll() {
        const res = await fetch(this.baseUrl);
        return await res.json();
    },

    async getById(id) {
        const res = await fetch(`${this.baseUrl}/${id}`);
        return await res.json();
    },

    async create(payload) {
        await fetch(this.baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        // No JSON to return
    },

    async update(id, payload) {
        await fetch(`${this.baseUrl}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        // No JSON to return
    },

    async delete(id) {
        await fetch(`${this.baseUrl}/${id}`, {
            method: "DELETE"
        });
    }
};
