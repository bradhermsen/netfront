let API_BASE = null;

async function loadConfig() {
    if (API_BASE) return API_BASE;

    const res = await fetch("/config.json");
    const config = await res.json();

    API_BASE = config.apiBase;
    return API_BASE;
}

export const GameApi = {

    async addGoal(payload) {
        const base = await loadConfig();
        return fetch(`${base}/goals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(r => r.json());
    },

    async addPenalty(payload) {
        const base = await loadConfig();
        return fetch(`${base}/penalties`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(r => r.json());
    },

    async updateShots(payload) {
        const base = await loadConfig();
        return fetch(`${base}/shots`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(r => r.json());
    },

    async startClock(payload) {
        const base = await loadConfig();
        return fetch(`${base}/clock/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    },

    async stopClock(payload) {
        const base = await loadConfig();
        return fetch(`${base}/clock/stop`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    },

    async horn(payload) {
        const base = await loadConfig();
        return fetch(`${base}/clock/horn`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    },

    async setClock(payload) {
        const base = await loadConfig();
        return fetch(`${base}/clock`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    },

    async updatePeriod(payload) {
        const base = await loadConfig();
        return fetch(`${base}/period`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    },

    async setIntermission(payload) {
        const base = await loadConfig();
        return fetch(`${base}/period/intermission`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    },

    async goalieChange(payload) {
        const base = await loadConfig();
        return fetch(`${base}/goaliechange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    },

    async updateEvent(eventId, payload) {
        const base = await loadConfig();
        return fetch(`${base}/events/${eventId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    },

    async endGame(payload) {
        const base = await loadConfig();
        return fetch(`${base}/game/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }
};
