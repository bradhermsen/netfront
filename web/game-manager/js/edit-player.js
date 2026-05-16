import { GameApi } from "./api/gameApi.js";

let playerId = null;
let gameId = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    playerId = params.get("playerId");
    gameId = params.get("gameId");

    await loadPlayer();
}

init();

// -------------------------
// LOAD PLAYER
// -------------------------
async function loadPlayer() {
    const res = await fetch(`/api/player/${playerId}`);
    const p = await res.json();

    // Header
    document.querySelector(".player-jersey").textContent = p.jersey;
    document.querySelector(".player-name").textContent = p.name;
    document.querySelector(".player-meta").textContent =
        `${p.position} • Shoots ${p.shoots}`;

    // Form fields
    document.querySelector(".name-input").value = p.name;
    document.querySelector(".jersey-input").value = p.jersey;
    document.querySelector(".position-select").value = p.position;
    document.querySelector(".shoots-select").value = p.shoots;
    document.querySelector(".gradyear-input").value = p.gradYear ?? "";
    document.querySelector(".height-input").value = p.height ?? "";
    document.querySelector(".weight-input").value = p.weight ?? "";

    // Active toggle
    const activeBtn = document.querySelector(".active-toggle");
    if (p.isActive) activeBtn.classList.add("active");
    activeBtn.addEventListener("click", () => activeBtn.classList.toggle("active"));

    // Goalie starter toggle
    const starterRow = document.querySelector(".goalie-only");
    const starterBtn = document.querySelector(".starter-toggle");

    if (p.position === "G") {
        starterRow.style.display = "flex";
        if (p.isStarter) starterBtn.classList.add("active");
        starterBtn.addEventListener("click", () => starterBtn.classList.toggle("active"));
    }
}

// -------------------------
// SAVE
// -------------------------
document.querySelector(".save-btn").addEventListener("click", async () => {
    const payload = {
        name: document.querySelector(".name-input").value,
        jersey: parseInt(document.querySelector(".jersey-input").value),
        position: document.querySelector(".position-select").value,
        shoots: document.querySelector(".shoots-select").value,
        gradYear: parseInt(document.querySelector(".gradyear-input").value) || null,
        height: document.querySelector(".height-input").value,
        weight: parseInt(document.querySelector(".weight-input").value) || null,
        isActive: document.querySelector(".active-toggle").classList.contains("active"),
        isStarter: document.querySelector(".starter-toggle")?.classList.contains("active") || false
    };

    await fetch(`/api/player/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    alert("Player updated");
});

// -------------------------
// BACK
// -------------------------
document.querySelector(".back-btn").addEventListener("click", () => {
    window.location.href = `./player-profile.html?gameId=${gameId}&playerId=${playerId}`;
});
