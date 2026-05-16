import { GameApi } from "./api/gameApi.js";

let gameId = null;
let teamId = "home";
let selectedReason = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");

    loadPeriods();
    setupTeamToggle();
    setupReasonButtons();

    await loadGoalies();
}

init();

// -------------------------
// TEAM TOGGLE
// -------------------------
function setupTeamToggle() {
    document.querySelectorAll(".team-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            document.querySelectorAll(".team-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");

            teamId = btn.dataset.team;
            await loadGoalies();
        });
    });
}

// -------------------------
// LOAD GOALIES
// -------------------------
async function loadGoalies() {
    if (!gameId) return;

    const res = await fetch(`/api/goalies/${gameId}/${teamId}`);
    const data = await res.json();

    const current = data.currentGoalie;
    const available = data.availableGoalies;

    // OUT goalie
    const outEl = document.querySelector(".goalie-out");
    outEl.textContent = current
        ? `${current.jersey} — ${current.name}`
        : "No active goalie";

    // IN goalie dropdown
    const sel = document.querySelector(".goalie-select");
    sel.innerHTML = "";

    available.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g.playerId;
        opt.textContent = `${g.jersey} — ${g.name}`;
        sel.appendChild(opt);
    });
}

// -------------------------
// PERIODS
// -------------------------
function loadPeriods() {
    const sel = document.querySelector(".period-select");
    [1, 2, 3, 4].forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        sel.appendChild(opt);
    });
}

// -------------------------
// REASON BUTTONS
// -------------------------
function setupReasonButtons() {
    document.querySelectorAll(".reason-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".reason-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedReason = btn.dataset.reason;
        });
    });
}

// -------------------------
// SUBMIT
// -------------------------
document.querySelector(".submit-btn").addEventListener("click", async () => {
    if (!gameId) return;

    const newGoalieId = document.querySelector(".goalie-select").value;
    const period = parseInt(document.querySelector(".period-select").value);
    const time = document.querySelector(".time-input").value;

    await GameApi.goalieChange({
        gameId,
        teamId,
        newGoalieId,
        period,
        time,
        reason: selectedReason
    });

    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});

// -------------------------
// CANCEL
// -------------------------
document.querySelector(".cancel-btn").addEventListener("click", () => {
    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});
