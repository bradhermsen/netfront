import { GameApi } from "./api/gameApi.js";

let gameId = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");

    await loadSummary();
}

init();

// -------------------------
// LOAD SUMMARY DATA
// -------------------------
async function loadSummary() {
    if (!gameId) return;

    const res = await fetch(`/api/summary/${gameId}`);
    const data = await res.json();

    populateFinalScore(data);
    populateComparison(data);
    populateScoring(data);
    populatePenalties(data);
    populatePeriods(data);
}

// -------------------------
// FINAL SCORE
// -------------------------
function populateFinalScore(data) {
    document.querySelector(".home-team-name").textContent = data.homeTeamName;
    document.querySelector(".away-team-name").textContent = data.awayTeamName;

    document.querySelector(".home-score").textContent = data.homeScore;
    document.querySelector(".away-score").textContent = data.awayScore;
}

// -------------------------
// TEAM COMPARISON
// -------------------------
function populateComparison(data) {
    const list = document.querySelector(".comparison-list");
    list.innerHTML = "";

    data.teamComparison.forEach(item => {
        const row = document.createElement("div");
        row.className = "summary-row";

        row.innerHTML = `
            <span>${item.label}</span>
            <span>${item.home} - ${item.away}</span>
        `;

        list.appendChild(row);
    });
}

// -------------------------
// SCORING SUMMARY
// -------------------------
function populateScoring(data) {
    const list = document.querySelector(".scoring-list");
    list.innerHTML = "";

    data.scoringSummary.forEach(play => {
        const row = document.createElement("div");
        row.className = "summary-row";

        row.innerHTML = `
            <span>${play.period} • ${play.time}</span>
            <span>${play.team} — ${play.description}</span>
        `;

        list.appendChild(row);
    });
}

// -------------------------
// PENALTY SUMMARY
// -------------------------
function populatePenalties(data) {
    const list = document.querySelector(".penalty-list");
    list.innerHTML = "";

    data.penaltySummary.forEach(p => {
        const row = document.createElement("div");
        row.className = "summary-row";

        row.innerHTML = `
            <span>${p.period} • ${p.time}</span>
            <span>${p.team} — ${p.player} (${p.infraction})</span>
        `;

        list.appendChild(row);
    });
}

// -------------------------
// PERIOD STATS
// -------------------------
function populatePeriods(data) {
    const list = document.querySelector(".period-list");
    list.innerHTML = "";

    data.periodStats.forEach(ps => {
        const row = document.createElement("div");
        row.className = "summary-row";

        row.innerHTML = `
            <span>Period ${ps.period}</span>
            <span>${ps.home} - ${ps.away}</span>
        `;

        list.appendChild(row);
    });
}

// -------------------------
// EXPORT BUTTONS
// -------------------------
document.querySelector(".pdf-btn").addEventListener("click", () => {
    window.location.href = `/api/summary/${gameId}/pdf`;
});

document.querySelector(".csv-btn").addEventListener("click", () => {
    window.location.href = `/api/summary/${gameId}/csv`;
});

document.querySelector(".email-btn").addEventListener("click", () => {
    window.location.href = `./email-summary.html?gameId=${gameId}`;
});

// -------------------------
// BACK TO GAME
// -------------------------
document.querySelector(".back-btn").addEventListener("click", () => {
    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});
