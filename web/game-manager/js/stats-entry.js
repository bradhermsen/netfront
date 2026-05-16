import { GameApi } from "./api/gameApi.js";

let gameId = null;
let currentPlayerId = null;
let stats = {};
let timers = {
    toi: null,
    pp: null,
    pk: null
};

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");

    await loadRoster();
}

init();

// -------------------------
// LOAD ROSTER
// -------------------------
async function loadRoster() {
    const res = await fetch(`/api/roster/${gameId}/all`);
    const roster = await res.json();

    const scroll = document.querySelector(".player-scroll");
    scroll.innerHTML = "";

    roster.forEach(player => {
        const chip = document.createElement("div");
        chip.className = "player-chip";
        chip.textContent = player.jersey;

        chip.addEventListener("click", () => {
            document.querySelectorAll(".player-chip").forEach(c => c.classList.remove("selected"));
            chip.classList.add("selected");

            currentPlayerId = player.playerId;
            loadPlayerStats(player);
        });

        scroll.appendChild(chip);
    });
}

// -------------------------
// LOAD PLAYER STATS
// -------------------------
async function loadPlayerStats(player) {
    document.querySelector(".player-name").textContent = player.name;
    document.querySelector(".player-position").textContent = player.position;

    const res = await fetch(`/api/stats/${gameId}/${player.playerId}`);
    stats = await res.json();

    updateUI();
}

// -------------------------
// UPDATE UI
// -------------------------
function updateUI() {
    const fields = [
        "goals", "assists", "sog", "missed", "blocked",
        "fow", "fol", "hits", "bs", "ga", "ta"
    ];

    fields.forEach(f => {
        document.querySelector(`.${f}-value`).textContent = stats[f] ?? 0;
    });

    // Auto fields
    document.querySelector(".points-value").textContent =
        (stats.goals ?? 0) + (stats.assists ?? 0);

    const fow = stats.fow ?? 0;
    const fol = stats.fol ?? 0;
    const pct = fow + fol > 0 ? Math.round((fow / (fow + fol)) * 100) : 0;
    document.querySelector(".fopct-value").textContent = pct + "%";

    // Ice time
    document.querySelector(".toi-value").textContent = stats.toi ?? "00:00";
    document.querySelector(".pp-value").textContent = stats.pp ?? "00:00";
    document.querySelector(".pk-value").textContent = stats.pk ?? "00:00";
}

// -------------------------
// STAT BUTTONS
// -------------------------
document.querySelectorAll(".stat-controls").forEach(ctrl => {
    const stat = ctrl.dataset.stat;

    ctrl.querySelector(".plus").addEventListener("click", () => {
        stats[stat] = (stats[stat] ?? 0) + 1;
        updateUI();
    });

    ctrl.querySelector(".minus").addEventListener("click", () => {
        stats[stat] = Math.max(0, (stats[stat] ?? 0) - 1);
        updateUI();
    });
});

// -------------------------
// ICE TIME TIMERS
// -------------------------
function startTimer(key) {
    if (timers[key]) return;

    timers[key] = setInterval(() => {
        stats[key] = incrementTime(stats[key] ?? "00:00");
        updateUI();
    }, 1000);
}

function stopTimer(key) {
    clearInterval(timers[key]);
    timers[key] = null;
}

function incrementTime(t) {
    let [m, s] = t.split(":").map(Number);
    s++;
    if (s >= 60) {
        s = 0;
        m++;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

document.querySelector(".toi-btn").addEventListener("click", () => {
    timers.toi ? stopTimer("toi") : startTimer("toi");
});

document.querySelector(".pp-btn").addEventListener("click", () => {
    timers.pp ? stopTimer("pp") : startTimer("pp");
});

document.querySelector(".pk-btn").addEventListener("click", () => {
    timers.pk ? stopTimer("pk") : startTimer("pk");
});

// -------------------------
// SAVE
// -------------------------
document.querySelector(".save-btn").addEventListener("click", async () => {
    if (!currentPlayerId) return;

    await fetch(`/api/stats/${gameId}/${currentPlayerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats)
    });

    alert("Stats saved");
});
