import { GameApi } from "./api/gameApi.js";

let gameId = null;
let teamId = null;
let roster = [];

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");
    teamId = params.get("team");

    document.querySelector(".team-name").textContent = teamId?.toUpperCase() ?? "";

    await loadRoster();
    buildEditList();
}

init();

// -------------------------
// LOAD ROSTER
// -------------------------
async function loadRoster() {
    const res = await fetch(`/api/roster/${gameId}/${teamId}`);
    roster = await res.json();
}

// -------------------------
// BUILD EDIT LIST
// -------------------------
function buildEditList() {
    const list = document.querySelector(".edit-list");
    list.innerHTML = "";

    roster.forEach(player => {
        const row = document.createElement("div");
        row.className = "edit-row";

        row.innerHTML = `
            <div class="row-top">
                <div class="row-name">${player.name}</div>
                <button class="toggle-btn active-toggle ${player.isActive ? "active" : ""}"></button>
            </div>

            <div class="row-controls">
                <input class="input-small jersey-input" type="number" value="${player.jersey}">
                
                <select class="select-small position-select">
                    <option value="F" ${player.position === "F" ? "selected" : ""}>F</option>
                    <option value="D" ${player.position === "D" ? "selected" : ""}>D</option>
                    <option value="G" ${player.position === "G" ? "selected" : ""}>G</option>
                </select>

                <select class="select-small shoots-select">
                    <option value="L" ${player.shoots === "L" ? "selected" : ""}>L</option>
                    <option value="R" ${player.shoots === "R" ? "selected" : ""}>R</option>
                </select>
            </div>
        `;

        // Toggle active
        const toggle = row.querySelector(".active-toggle");
        toggle.addEventListener("click", () => toggle.classList.toggle("active"));

        // Attach row to DOM
        row.dataset.playerId = player.playerId;
        list.appendChild(row);
    });
}

// -------------------------
// SAVE CHANGES
// -------------------------
document.querySelector(".save-btn").addEventListener("click", async () => {
    const rows = document.querySelectorAll(".edit-row");

    const updates = [];

    rows.forEach(row => {
        const playerId = row.dataset.playerId;

        updates.push({
            playerId,
            jersey: parseInt(row.querySelector(".jersey-input").value),
            position: row.querySelector(".position-select").value,
            shoots: row.querySelector(".shoots-select").value,
            isActive: row.querySelector(".active-toggle").classList.contains("active")
        });
    });

    await fetch(`/api/roster/${gameId}/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
    });

    alert("Roster updated");
    window.location.href = `./roster.html?gameId=${gameId}&team=${teamId}`;
});

// -------------------------
// CANCEL
// -------------------------
document.querySelector(".back-btn").addEventListener("click", () => {
    window.location.href = `./roster.html?gameId=${gameId}&team=${teamId}`;
});
