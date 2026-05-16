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
    await loadInfractions();
    loadPeriods();
    setupPenaltyTypeButtons();
}

init();

// -------------------------
// LOAD ROSTER
// -------------------------
async function loadRoster() {
    if (!gameId || !teamId) return;

    const res = await fetch(`/api/roster/${gameId}/${teamId}`);
    const roster = await res.json();

    const playerSel = document.querySelector(".player-select");

    roster.forEach(player => {
        const opt = document.createElement("option");
        opt.value = player.playerId;
        opt.textContent = `${player.jersey} — ${player.name}`;
        playerSel.appendChild(opt);
    });
}

// -------------------------
// LOAD INFRACTIONS
// -------------------------
async function loadInfractions() {
    const res = await fetch(`/api/infractions`);
    const infractions = await res.json();

    const infSel = document.querySelector(".infraction-select");

    infractions.forEach(inf => {
        const opt = document.createElement("option");
        opt.value = inf.code;
        opt.textContent = inf.name;
        infSel.appendChild(opt);
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
// PENALTY TYPE
// -------------------------
function setupPenaltyTypeButtons() {
    const durationInput = document.querySelector(".duration-input");

    document.querySelectorAll(".penalty-type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".penalty-type-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");

            selectedType = btn.dataset.type;

            // Auto-fill duration
            switch (selectedType) {
                case "minor": durationInput.value = "2"; break;
                case "doubleminor": durationInput.value = "4"; break;
                case "major": durationInput.value = "5"; break;
                case "misconduct": durationInput.value = "10"; break;
                case "dq": durationInput.value = "10"; break;
            }
        });
    });
}

// -------------------------
// SUBMIT
// -------------------------
document.querySelector(".submit-btn").addEventListener("click", async () => {
    if (!gameId || !teamId) return;

    const playerId = document.querySelector(".player-select").value;
    const infraction = document.querySelector(".infraction-select").value;
    const period = parseInt(document.querySelector(".period-select").value);
    const time = document.querySelector(".time-input").value;
    const minutes = parseInt(document.querySelector(".duration-input").value);

    await GameApi.addPenalty({
        gameId,
        teamId,
        playerId,
        infraction,
        period,
        time,
        minutes,
        penaltyType: selectedType
    });

    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});

// -------------------------
// CANCEL
// -------------------------
document.querySelector(".cancel-btn").addEventListener("click", () => {
    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});
