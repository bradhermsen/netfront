import { GameApi } from "./api/gameApi.js";

let gameId = null;
let playerId = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");
    playerId = params.get("playerId");

    await loadPlayer();
    await loadSeasonStats();
    await loadCareerStats();
    await loadSpecialTeams();
    await loadNotes();
}

init();

// -------------------------
// LOAD PLAYER BIO
// -------------------------
async function loadPlayer() {
    const res = await fetch(`/api/player/${playerId}`);
    const p = await res.json();

    document.querySelector(".player-jersey").textContent = p.jersey;
    document.querySelector(".player-name").textContent = p.name;
    document.querySelector(".player-meta").textContent =
        `${p.position} • Shoots ${p.shoots}`;
}

// -------------------------
// SEASON STATS
// -------------------------
async function loadSeasonStats() {
    const res = await fetch(`/api/player/${playerId}/season`);
    const stats = await res.json();

    const grid = document.querySelector(".season-stats");
    grid.innerHTML = "";

    Object.keys(stats).forEach(key => {
        const item = document.createElement("div");
        item.className = "stat-item";
        item.innerHTML = `
            <div class="stat-label">${key}</div>
            <div class="stat-value">${stats[key]}</div>
        `;
        grid.appendChild(item);
    });
}

// -------------------------
// CAREER STATS
// -------------------------
async function loadCareerStats() {
    const res = await fetch(`/api/player/${playerId}/career`);
    const stats = await res.json();

    const grid = document.querySelector(".career-stats");
    grid.innerHTML = "";

    Object.keys(stats).forEach(key => {
        const item = document.createElement("div");
        item.className = "stat-item";
        item.innerHTML = `
            <div class="stat-label">${key}</div>
            <div class="stat-value">${stats[key]}</div>
        `;
        grid.appendChild(item);
    });
}

// -------------------------
// SPECIAL TEAMS
// -------------------------
async function loadSpecialTeams() {
    const res = await fetch(`/api/player/${playerId}/special`);
    const roles = await res.json();

    const list = document.querySelector(".special-list");
    list.innerHTML = "";

    roles.forEach(r => {
        const item = document.createElement("div");
        item.className = "special-item";
        item.textContent = r;
        list.appendChild(item);
    });
}

// -------------------------
// COACH NOTES
// -------------------------
async function loadNotes() {
    const res = await fetch(`/api/player/${playerId}/notes`);
    const data = await res.json();

    document.querySelector(".notes-input").value = data.notes ?? "";
}

document.querySelector(".save-notes-btn").addEventListener("click", async () => {
    const notes = document.querySelector(".notes-input").value;

    await fetch(`/api/player/${playerId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
    });

    alert("Notes saved");
});

// -------------------------
// NAVIGATION
// -------------------------
document.querySelector(".back-btn").addEventListener("click", () => {
    window.location.href = `./roster.html?gameId=${gameId}&team=home`;
});

document.querySelector(".edit-btn").addEventListener("click", () => {
    window.location.href = `./edit-player.html?playerId=${playerId}`;
});
