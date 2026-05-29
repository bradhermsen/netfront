// =========================================================
// WAIT FOR CONFIG (apiBase from config-loader.js)
// =========================================================
async function waitForConfig() {
    if (window.configReady) return;

    await new Promise(resolve => {
        const check = setInterval(() => {
            if (window.configReady) {
                clearInterval(check);
                resolve();
            }
        }, 50);
    });
}

// =========================================================
// WAIT FOR SIDEBAR (sidebar-loader.js)
// =========================================================
async function waitForSidebar() {
    const container = document.getElementById("sidebarContainer");

    await new Promise(resolve => {
        const check = setInterval(() => {
            if (
                container &&
                container.innerHTML.trim().length > 0 &&
                container.querySelector("a")
            ) {
                clearInterval(check);
                resolve();
            }
        }, 50);
    });
}

// =========================================================
// LOOKUPS
// =========================================================
async function loadLookups() {
    await Promise.all([
        loadTeams(),
        loadGameTypes(),
        loadGameRounds()
    ]);
}

async function loadTeams() {
    const res = await fetch(`${apiBase}/teams`);
    const teams = await res.json();

    const home = document.getElementById("homeTeamId");
    const away = document.getElementById("awayTeamId");

    home.innerHTML = "";
    away.innerHTML = "";

    teams.forEach(t => {
        const opt = `<option value="${t.teamId}">${t.name}</option>`;
        home.innerHTML += opt;
        away.innerHTML += opt;
    });
}

async function loadGameTypes() {
    const res = await fetch(`${apiBase}/gametypes`);
    const types = await res.json();

    const select = document.getElementById("gameTypeId");
    select.innerHTML = "";

    types.forEach(t => {
        select.innerHTML += `<option value="${t.gameTypeId}">${t.name}</option>`;
    });
}

async function loadGameRounds() {
    const res = await fetch(`${apiBase}/gamerounds`);
    const rounds = await res.json();

    const select = document.getElementById("gameRoundId");
    select.innerHTML = `<option value="">None</option>`;

    rounds.forEach(r => {
        select.innerHTML += `<option value="${r.gameRoundId}">${r.roundName}</option>`;
    });
}

// =========================================================
// LOAD GAMES
// =========================================================
async function loadGames() {
    const res = await fetch(`${apiBase}/games`);
    const games = await res.json();

    const tbody = document.getElementById("gamesTableBody");
    tbody.innerHTML = "";

    games.forEach(game => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${game.homeTeamName}</td>
            <td>${game.awayTeamName}</td>
            <td>${formatDate(game.gameDateTime)}</td>
            <td>${formatTime(game.gameDateTime)}</td>
            <td>${game.arenaName}</td>
            <td>${game.rinkName}</td>
            <td>${game.gameTypeName}</td>
            <td>${game.gameRoundName ?? ""}</td>
            <td>${game.status}</td>
            <td>
                <button class="nf-btn btn-primary" onclick="openEditModal('${game.gameId}')">Edit</button>
                <button class="nf-btn btn-danger" onclick="deleteGame('${game.gameId}')">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// =========================================================
// FORMAT HELPERS
// =========================================================
function formatDate(dt) {
    return new Date(dt).toISOString().split("T")[0];
}

function formatTime(dt) {
    return new Date(dt).toISOString().substring(11, 16);
}

// =========================================================
// MODAL: ADD
// =========================================================
function openAddModal() {
    document.getElementById("gameId").value = "";
    document.getElementById("gameDate").value = "";
    document.getElementById("gameTime").value = "";
    document.getElementById("arenaName").value = "";
    document.getElementById("rinkName").value = "";
    document.getElementById("gameTypeId").value = "";
    document.getElementById("gameRoundId").value = "";
    document.getElementById("notes").value = "";

    gameModal.show();
}

// =========================================================
// MODAL: EDIT
// =========================================================
async function openEditModal(id) {
    const res = await fetch(`${apiBase}/games/${id}`);
    const game = await res.json();

    document.getElementById("gameId").value = game.gameId;

    const dt = new Date(game.gameDateTime);
    document.getElementById("gameDate").value = dt.toISOString().split("T")[0];
    document.getElementById("gameTime").value = dt.toISOString().substring(11, 16);

    document.getElementById("arenaName").value = game.arenaName;
    document.getElementById("rinkName").value = game.rinkName;
    document.getElementById("gameTypeId").value = game.gameTypeId;
    document.getElementById("gameRoundId").value = game.gameRoundId ?? "";
    document.getElementById("notes").value = game.notes ?? "";

    gameModal.show();
}

// =========================================================
// SAVE GAME
// =========================================================
async function saveGameFromForm() {
    const id = document.getElementById("gameId").value;

    const date = document.getElementById("gameDate").value;
    const time = document.getElementById("gameTime").value;
    const gameDateTime = new Date(`${date}T${time}:00`);

    const payload = {
        homeTeamId: document.getElementById("homeTeamId").value,
        awayTeamId: document.getElementById("awayTeamId").value,
        gameDateTime: gameDateTime.toISOString(),
        arenaName: document.getElementById("arenaName").value,
        rinkName: document.getElementById("rinkName").value,
        gameTypeId: parseInt(document.getElementById("gameTypeId").value),
        gameRoundId: document.getElementById("gameRoundId").value || null,
        notes: document.getElementById("notes").value
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `${apiBase}/games/${id}` : `${apiBase}/games`;

    await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    gameModal.hide();
    loadGames();
}

// =========================================================
// DELETE GAME
// =========================================================
async function deleteGame(id) {
    if (!confirm("Delete this game?")) return;

    await fetch(`${apiBase}/games/${id}`, { method: "DELETE" });
    loadGames();
}

// =========================================================
// DOM READY — STRICT + SAFE STARTUP PIPELINE
// =========================================================
let gameModal;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Wait for config-loader.js
    await waitForConfig();

    // 2. Wait for sidebar-loader.js
    await waitForSidebar();

    // 3. Initialize modal
    gameModal = new bootstrap.Modal(document.getElementById("gameModal"));

    // 4. Load lookups
    await loadLookups();

    // 5. Load games
    await loadGames();
});
