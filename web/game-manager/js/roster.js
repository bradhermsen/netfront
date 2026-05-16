import { GameApi } from "./api/gameApi.js";

let gameId = null;
let teamId = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");
    teamId = params.get("team");

    document.querySelector(".team-name").textContent = teamId ? teamId.toUpperCase() : "";

    await loadRoster();
}

init();

// -------------------------
// LOAD ROSTER
// -------------------------
async function loadRoster() {
    if (!gameId || !teamId) return;

    const res = await fetch(`/api/roster/${gameId}/${teamId}`);
    const roster = await res.json();

    const list = document.querySelector(".roster-list");
    list.innerHTML = "";

    roster.forEach(player => {
        const row = document.createElement("div");
        row.className = "player-row";

        row.innerHTML = `
            <div class="player-jersey">${player.jersey}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-position">${player.position}</div>
            </div>
            <div class="player-status ${player.isActive ? "status-active" : "status-scratch"}">
                ${player.isActive ? "ACTIVE" : "SCRATCH"}
            </div>
        `;

        row.addEventListener("click", () => {
            window.location.href = `./player-profile.html?gameId=${gameId}&playerId=${player.playerId}`;
        });

        list.appendChild(row);
    });
}

// -------------------------
// ADD PLAYER
// -------------------------
document.querySelector(".add-player-btn").addEventListener("click", () => {
    window.location.href = `./add-player.html?gameId=${gameId}&team=${teamId}`;
});

// -------------------------
// EDIT ROSTER
// -------------------------
document.querySelector(".edit-roster-btn").addEventListener("click", () => {
    window.location.href = `./edit-roster.html?gameId=${gameId}&team=${teamId}`;
});
