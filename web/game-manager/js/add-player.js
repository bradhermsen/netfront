import { GameApi } from "./api/gameApi.js";

let gameId = null;
let teamId = null;

// -------------------------
// INITIALIZATION
// -------------------------
function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");
    teamId = params.get("team");

    setupToggles();
    setupPositionWatcher();
}

init();

// -------------------------
// TOGGLES
// -------------------------
function setupToggles() {
    const activeBtn = document.querySelector(".active-toggle");
    activeBtn.addEventListener("click", () => activeBtn.classList.toggle("active"));

    const starterBtn = document.querySelector(".starter-toggle");
    starterBtn.addEventListener("click", () => starterBtn.classList.toggle("active"));
}

// -------------------------
// SHOW/HIDE GOALIE FIELDS
// -------------------------
function setupPositionWatcher() {
    const posSelect = document.querySelector(".position-select");
    const goalieRow = document.querySelector(".goalie-only");

    posSelect.addEventListener("change", () => {
        goalieRow.style.display = posSelect.value === "G" ? "flex" : "none";
    });
}

// -------------------------
// SAVE PLAYER
// -------------------------
document.querySelector(".save-btn").addEventListener("click", async () => {
    const payload = {
        gameId,
        teamId,
        name: document.querySelector(".name-input").value,
        jersey: parseInt(document.querySelector(".jersey-input").value),
        position: document.querySelector(".position-select").value,
        shoots: document.querySelector(".shoots-select").value,
        gradYear: parseInt(document.querySelector(".gradyear-input").value) || null,
        height: document.querySelector(".height-input").value,
        weight: parseInt(document.querySelector(".weight-input").value) || null,
        isActive: document.querySelector(".active-toggle").classList.contains("active"),
        isStarter: document.querySelector(".starter-toggle").classList.contains("active")
    };

    await fetch(`/api/player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    alert("Player added");
    window.location.href = `./roster.html?gameId=${gameId}&team=${teamId}`;
});

// -------------------------
// CANCEL
// -------------------------
document.querySelector(".back-btn").addEventListener("click", () => {
    window.location.href = `./roster.html?gameId=${gameId}&team=${teamId}`;
});
