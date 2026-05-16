// schedules.js
// NetFront Admin Portal – Schedules Management

const API_BASE = "http://localhost:7071/api";

let teams = [];
let games = [];
let editingGameId = null;

// -------------------------------
// INITIAL LOAD
// -------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await loadTeams();
    await loadGames();

    document.getElementById("add-game-btn").addEventListener("click", openAddModal);
    document.getElementById("game-cancel").addEventListener("click", closeGameModal);
    document.getElementById("game-save").addEventListener("click", saveGame);

    document.getElementById("bulk-schedule-btn").addEventListener("click", openBulkModal);
    document.getElementById("bulk-schedule-cancel").addEventListener("click", closeBulkModal);
    document.getElementById("bulk-schedule-import").addEventListener("click", importBulkSchedules);
});

// -------------------------------
// LOAD TEAMS
// -------------------------------
async function loadTeams() {
    const res = await fetch(`${API_BASE}/teams`);
    teams = await res.json();

    const homeSelect = document.getElementById("game-home");
    const awaySelect = document.getElementById("game-away");

    homeSelect.innerHTML = "";
    awaySelect.innerHTML = "";

    teams.forEach(team => {
        const opt1 = document.createElement("option");
        opt1.value = team.teamId;
        opt1.textContent = team.name;

        const opt2 = document.createElement("option");
        opt2.value = team.teamId;
        opt2.textContent = team.name;

        homeSelect.appendChild(opt1);
        awaySelect.appendChild(opt2);
    });
}

// -------------------------------
// LOAD GAMES
// -------------------------------
async function loadGames() {
    const res = await fetch(`${API_BASE}/games`);
    games = await res.json();
    renderGames();
}

// -------------------------------
// RENDER TABLE
// -------------------------------
function renderGames() {
    const tbody = document.querySelector(".schedule-table tbody");
    tbody.innerHTML = "";

    games.forEach(game => {
        const row = document.createElement("tr");

        const date = new Date(game.gameDate);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const homeTeam = teams.find(t => t.teamId === game.homeTeamId)?.name || "—";
        const awayTeam = teams.find(t => t.teamId === game.awayTeamId)?.name || "—";

        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${timeStr}</td>
            <td>${homeTeam}</td>
            <td>${awayTeam}</td>
            <td>${game.location}</td>
            <td>${game.gameType}</td>
            <td style="text-align:center;">
                <button class="btn-table edit" onclick="editGame('${game.gameId}')">Edit</button>
                <button class="btn-table delete" onclick="deleteGame('${game.gameId}')">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// -------------------------------
// OPEN ADD MODAL
// -------------------------------
function openAddModal() {
    editingGameId = null;

    document.getElementById("game-modal-title").textContent = "Add Game";
    document.getElementById("game-date").value = "";
    document.getElementById("game-time").value = "";
    document.getElementById("game-home").value = "";
    document.getElementById("game-away").value = "";
    document.getElementById("game-location").value = "";
    document.getElementById("game-type").value = "Conference";

    document.getElementById("game-modal").classList.remove("hidden");
}

function closeGameModal() {
    document.getElementById("game-modal").classList.add("hidden");
}

// -------------------------------
// EDIT GAME
// -------------------------------
function editGame(id) {
    const game = games.find(g => g.gameId === id);
    if (!game) return;

    editingGameId = id;

    const dateObj = new Date(game.gameDate);
    const dateStr = dateObj.toISOString().split("T")[0];
    const timeStr = dateObj.toISOString().split("T")[1].substring(0, 5);

    document.getElementById("game-modal-title").textContent = "Edit Game";
    document.getElementById("game-date").value = dateStr;
    document.getElementById("game-time").value = timeStr;
    document.getElementById("game-home").value = game.homeTeamId;
    document.getElementById("game-away").value = game.awayTeamId;
    document.getElementById("game-location").value = game.location;
    document.getElementById("game-type").value = game.gameType || "Conference";

    document.getElementById("game-modal").classList.remove("hidden");
}

// -------------------------------
// SAVE GAME (CREATE OR UPDATE)
// -------------------------------
async function saveGame() {
    const date = document.getElementById("game-date").value;
    const time = document.getElementById("game-time").value;

    const payload = {
        gameId: editingGameId || crypto.randomUUID(),
        homeTeamId: document.getElementById("game-home").value,
        awayTeamId: document.getElementById("game-away").value,
        location: document.getElementById("game-location").value,
        gameType: document.getElementById("game-type").value,
        gameDate: new Date(`${date}T${time}`).toISOString()
    };

    const method = editingGameId ? "PUT" : "POST";

    await fetch(`${API_BASE}/games`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    closeGameModal();
    await loadGames();
}

// -------------------------------
// DELETE GAME
// -------------------------------
async function deleteGame(id) {
    await fetch(`${API_BASE}/games/${id}`, { method: "DELETE" });
    await loadGames();
}

// -------------------------------
// BULK IMPORT
// -------------------------------
function openBulkModal() {
    document.getElementById("bulk-schedule-modal").classList.remove("hidden");
}

function closeBulkModal() {
    document.getElementById("bulk-schedule-modal").classList.add("hidden");
}

async function importBulkSchedules() {
    const fileInput = document.getElementById("bulk-schedule-file");
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    await fetch(`${API_BASE}/games/bulk`, {
        method: "POST",
        body: formData
    });

    closeBulkModal();
    await loadGames();
}
