import { GameApi } from "./api/gameApi.js";

let gameId = null;
let teamId = null;
let selectedType = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");
    teamId = params.get("team");

    document.querySelector(".team-name").textContent = teamId ? teamId.toUpperCase() : "";

    await loadRoster();
    loadPeriods();
    setupGoalTypeButtons();
}

init();

// -------------------------
// LOAD ROSTER
// -------------------------
async function loadRoster() {
    if (!gameId || !teamId) return;

    const res = await fetch(`/api/roster/${gameId}/${teamId}`);
    const roster = await res.json();

    const scorerSel = document.querySelector(".scorer-select");
    const a1Sel = document.querySelector(".assist1-select");
    const a2Sel = document.querySelector(".assist2-select");

    roster.forEach(player => {
        const opt = document.createElement("option");
        opt.value = player.playerId;
        opt.textContent = `${player.jersey} — ${player.name}`;

        scorerSel.appendChild(opt.cloneNode(true));
        a1Sel.appendChild(opt.cloneNode(true));
        a2Sel.appendChild(opt.cloneNode(true));
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
// GOAL TYPE
// -------------------------
function setupGoalTypeButtons() {
    document.querySelectorAll(".goal-type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".goal-type-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedType = btn.dataset.type;
        });
    });
}

// -------------------------
// SUBMIT
// -------------------------
document.querySelector(".submit-btn").addEventListener("click", async () => {
    if (!gameId || !teamId) return;

    const scorerId = document.querySelector(".scorer-select").value;
    const assist1Id = document.querySelector(".assist1-select").value || null;
    const assist2Id = document.querySelector(".assist2-select").value || null;
    const period = parseInt(document.querySelector(".period-select").value);
    const time = document.querySelector(".time-input").value;

    await GameApi.addGoal({
        gameId,
        teamId,
        scorerId,
        assist1Id,
        assist2Id,
        period,
        time,
        isPowerPlay: selectedType === "pp",
        isShortHanded: selectedType === "sh",
        isEmptyNet: selectedType === "en",
        isPenaltyShot: selectedType === "ps"
    });

    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});

// -------------------------
// CANCEL
// -------------------------
document.querySelector(".cancel-btn").addEventListener("click", () => {
    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});
