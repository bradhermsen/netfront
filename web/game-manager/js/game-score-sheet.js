import { GameApi } from "./api/gameApi.js";

// Game ID will be provided by router or querystring
let gameId = null;

// -------------------------
// SHOTS
// -------------------------
document.querySelectorAll(".shots-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
        if (!gameId) return;

        const team = btn.dataset.team;
        const isPlus = btn.classList.contains("shots-btn-plus");

        const totalEl = document.querySelector(`.shots-total-${team}`);
        let current = parseInt(totalEl.textContent || "0");

        current = isPlus ? current + 1 : Math.max(0, current - 1);
        totalEl.textContent = current;

        await GameApi.updateShots({
            gameId,
            teamId: team,
            period: currentPeriod,
            shots: current
        });
    });
});

// -------------------------
// GOAL / PENALTY BUTTONS
// -------------------------
document.querySelectorAll(".pill-goal").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!gameId) return;
        const team = btn.dataset.team;
        window.location.href = `./add-goal.html?gameId=${gameId}&team=${team}`;
    });
});

document.querySelectorAll(".pill-penalty").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!gameId) return;
        const team = btn.dataset.team;
        window.location.href = `./add-penalty.html?gameId=${gameId}&team=${team}`;
    });
});

// -------------------------
// CLOCK CONTROLS
// -------------------------
document.querySelector(".control-start").addEventListener("click", async () => {
    if (!gameId) return;
    await GameApi.startClock({
        gameId,
        period: currentPeriod,
        clockTime: getCurrentClock()
    });
});

document.querySelector(".control-stop").addEventListener("click", async () => {
    if (!gameId) return;
    await GameApi.stopClock({
        gameId,
        period: currentPeriod,
        clockTime: getCurrentClock()
    });
});

document.querySelector(".control-horn").addEventListener("click", async () => {
    if (!gameId) return;
    await GameApi.horn({ gameId });
});

// -------------------------
// SET / EDIT CLOCK
// -------------------------
document.querySelector(".set-clock").addEventListener("click", async () => {
    if (!gameId) return;

    const newTime = prompt("Enter new clock time (MM:SS):");
    if (!newTime) return;

    await GameApi.setClock({
        gameId,
        period: currentPeriod,
        newTime
    });

    document.querySelector(".clock-display").textContent = newTime;
});

// -------------------------
// PERIOD SELECTOR
// -------------------------
let currentPeriod = 1;
const periodNumberEl = document.querySelector(".period-number");

function updatePeriodDisplay() {
    periodNumberEl.textContent = currentPeriod;
}

document.querySelector(".period-arrow-up").addEventListener("click", async () => {
    if (!gameId) return;
    currentPeriod = Math.min(4, currentPeriod + 1);
    updatePeriodDisplay();

    await GameApi.updatePeriod({
        gameId,
        period: currentPeriod
    });
});

document.querySelector(".period-arrow-down").addEventListener("click", async () => {
    if (!gameId) return;
    currentPeriod = Math.max(1, currentPeriod - 1);
    updatePeriodDisplay();

    await GameApi.updatePeriod({
        gameId,
        period: currentPeriod
    });
});

// -------------------------
// INTERMISSION
// -------------------------
document.querySelector(".period-intermission").addEventListener("click", async () => {
    if (!gameId) return;
    await GameApi.setIntermission({
        gameId,
        isIntermission: true
    });
});

// -------------------------
// GOALIE CHANGE
// -------------------------
document.querySelector(".goalie-change").addEventListener("click", () => {
    if (!gameId) return;
    window.location.href = `./goalie-change.html?gameId=${gameId}`;
});

// -------------------------
// END GAME
// -------------------------
document.querySelector(".end-game-button").addEventListener("click", async () => {
    if (!gameId) return;

    const confirmEnd = confirm("Are you sure you want to end the game?");
    if (!confirmEnd) return;

    await GameApi.endGame({ gameId });
    window.location.href = "./summary.html?gameId=" + gameId;
});

// -------------------------
// HELPERS
// -------------------------
function getCurrentClock() {
    return document.querySelector(".clock-display").textContent.trim() || "00:00";
}

// -------------------------
// INITIALIZATION
// -------------------------
function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");

    updatePeriodDisplay();
}

init();
