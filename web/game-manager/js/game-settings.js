import { GameApi } from "./api/gameApi.js";

let gameId = null;
let clockMode = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");

    await loadGameHeader();
    await loadExistingSettings();
    setupClockButtons();
}

init();

// -------------------------
// LOAD GAME HEADER
// -------------------------
async function loadGameHeader() {
    const res = await fetch(`/api/game/${gameId}`);
    const data = await res.json();

    document.querySelector(".team-vs").textContent = `${data.homeTeam} vs ${data.awayTeam}`;
    document.querySelector(".game-date").textContent = data.date;
}

// -------------------------
// LOAD EXISTING SETTINGS
// -------------------------
async function loadExistingSettings() {
    const res = await fetch(`/api/game/${gameId}/settings`);
    const s = await res.json();

    document.querySelector(".game-type-select").value = s.gameType ?? "";
    document.querySelector(".period-length-input").value = s.periodLength ?? "";
    document.querySelector(".venue-input").value = s.venue ?? "";
    document.querySelector(".notes-input").value = s.notes ?? "";

    if (s.clockMode) {
        clockMode = s.clockMode;
        document.querySelector(`.clock-btn[data-mode="${clockMode}"]`).classList.add("selected");
        enableStartButton();
    }
}

// -------------------------
// CLOCK MODE
// -------------------------
function setupClockButtons() {
    document.querySelectorAll(".clock-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".clock-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");

            clockMode = btn.dataset.mode;
            enableStartButton();
        });
    });
}

function enableStartButton() {
    const startBtn = document.querySelector(".start-btn");

    if (clockMode) {
        startBtn.classList.remove("disabled");
    } else {
        startBtn.classList.add("disabled");
    }
}

// -------------------------
// SAVE + START GAME
// -------------------------
document.querySelector(".start-btn").addEventListener("click", async () => {
    if (!clockMode) return;

    const payload = {
        gameId,
        gameType: document.querySelector(".game-type-select").value,
        periodLength: parseInt(document.querySelector(".period-length-input").value),
        venue: document.querySelector(".venue-input").value,
        notes: document.querySelector(".notes-input").value,
        clockMode
    };

    await fetch(`/api/game/${gameId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});

// -------------------------
// OFFICIALS
// -------------------------
document.querySelector(".officials-btn").addEventListener("click", () => {
    window.location.href = `./game-officials.html?gameId=${gameId}`;
});

// -------------------------
// LINEUP
// -------------------------
document.querySelector(".lineup-btn").addEventListener("click", () => {
    window.location.href = `./lineup-card.html?gameId=${gameId}&team=home`;
});

// -------------------------
// BACK
// -------------------------
document.querySelector(".back-btn").addEventListener("click", () => {
    window.location.href = `./game-setup.html?gameId=${gameId}`;
});
