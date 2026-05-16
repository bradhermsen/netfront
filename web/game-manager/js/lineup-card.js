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
    buildLineupUI();
    await loadExistingLineup();
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
// BUILD UI
// -------------------------
function buildLineupUI() {
    buildLines(".forwards-list", 3, 3);
    buildLines(".defense-list", 3, 2);
    buildLines(".pp-list", 1, 5);
    buildLines(".pk-list", 1, 4);
    buildLines(".six-list", 1, 6);

    buildGoalieSelectors();
}

function buildLines(selector, rows, cols) {
    const container = document.querySelector(selector);
    container.innerHTML = "";

    for (let r = 0; r < rows; r++) {
        const row = document.createElement("div");
        row.className = "line-row";

        for (let c = 0; c < cols; c++) {
            const slot = document.createElement("select");
            slot.className = "input line-slot";
            slot.dataset.row = r;
            slot.dataset.col = c;

            roster.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.playerId;
                opt.textContent = `${p.jersey} — ${p.name}`;
                slot.appendChild(opt);
            });

            row.appendChild(slot);
        }

        container.appendChild(row);
    }
}

function buildGoalieSelectors() {
    const starter = document.querySelector(".goalie-starter");
    const backup = document.querySelector(".goalie-backup");

    roster
        .filter(p => p.position === "G")
        .forEach(g => {
            const opt = document.createElement("option");
            opt.value = g.playerId;
            opt.textContent = `${g.jersey} — ${g.name}`;
            starter.appendChild(opt.cloneNode(true));
            backup.appendChild(opt.cloneNode(true));
        });
}

// -------------------------
// LOAD EXISTING LINEUP
// -------------------------
async function loadExistingLineup() {
    const res = await fetch(`/api/lineup/${gameId}/${teamId}`);
    const data = await res.json();

    // Fill lines
    fillSlots(".forwards-list", data.forwards);
    fillSlots(".defense-list", data.defense);
    fillSlots(".pp-list", data.pp);
    fillSlots(".pk-list", data.pk);
    fillSlots(".six-list", data.six);

    // Goalies
    document.querySelector(".goalie-starter").value = data.starter ?? "";
    document.querySelector(".goalie-backup").value = data.backup ?? "";

    // Notes
    document.querySelector(".opponent-input").value = data.opponentLines ?? "";
    document.querySelector(".period-notes-input").value = data.periodNotes ?? "";
    document.querySelector(".post-notes-input").value = data.postNotes ?? "";
}

function fillSlots(selector, entries) {
    if (!entries) return;

    const rows = document.querySelectorAll(`${selector} .line-row`);

    rows.forEach((row, r) => {
        const slots = row.querySelectorAll("select");
        slots.forEach((slot, c) => {
            const entry = entries.find(e => e.row === r && e.col === c);
            if (entry) slot.value = entry.playerId;
        });
    });
}

// -------------------------
// SAVE LINEUP
// -------------------------
document.querySelector(".save-btn").addEventListener("click", async () => {
    const payload = {
        gameId,
        teamId,
        forwards: collectSlots(".forwards-list"),
        defense: collectSlots(".defense-list"),
        pp: collectSlots(".pp-list"),
        pk: collectSlots(".pk-list"),
        six: collectSlots(".six-list"),
        starter: document.querySelector(".goalie-starter").value,
        backup: document.querySelector(".goalie-backup").value,
        opponentLines: document.querySelector(".opponent-input").value,
        periodNotes: document.querySelector(".period-notes-input").value,
        postNotes: document.querySelector(".post-notes-input").value
    };

    await fetch(`/api/lineup/${gameId}/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    alert("Lineup saved");
});

function collectSlots(selector) {
    const rows = document.querySelectorAll(`${selector} .line-row`);
    const result = [];

    rows.forEach((row, r) => {
        const slots = row.querySelectorAll("select");
        slots.forEach((slot, c) => {
            result.push({
                row: r,
                col: c,
                playerId: slot.value
            });
        });
    });

    return result;
}

// -------------------------
// PRINT
// -------------------------
document.querySelector(".print-btn").addEventListener("click", () => {
    window.print();
});

// -------------------------
// BACK
// -------------------------
document.querySelector(".back-btn").addEventListener("click", () => {
    window.location.href = `./stats-entry.html?gameId=${gameId}`;
});
