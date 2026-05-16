import { GameApi } from "./api/gameApi.js";

let gameId = null;
let dqPenalty = null;
let signaturePad = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");

    await loadDQPenalty();
    await loadOfficials();
    setupSignaturePad();
}

init();

// -------------------------
// LOAD DQ PENALTY DETAILS
// -------------------------
async function loadDQPenalty() {
    const res = await fetch(`/api/dq/${gameId}`);
    dqPenalty = await res.json();

    document.querySelector(".dq-player").textContent = dqPenalty.playerName;
    document.querySelector(".dq-team").textContent = dqPenalty.teamName;
    document.querySelector(".dq-period").textContent = dqPenalty.period;
    document.querySelector(".dq-time").textContent = dqPenalty.timeInPeriod;
    document.querySelector(".dq-infraction").textContent = dqPenalty.infraction;
    document.querySelector(".dq-duration").textContent = dqPenalty.duration;
}

// -------------------------
// LOAD OFFICIALS
// -------------------------
async function loadOfficials() {
    const res = await fetch(`/api/game/${gameId}/officials`);
    const officials = await res.json();

    const sel = document.querySelector(".official-select");
    sel.innerHTML = "";

    officials.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.officialId;
        opt.textContent = o.name;
        sel.appendChild(opt);
    });
}

// -------------------------
// SIGNATURE PAD
// -------------------------
function setupSignaturePad() {
    const canvas = document.querySelector(".signature-pad");
    const ctx = canvas.getContext("2d");

    let drawing = false;

    canvas.addEventListener("mousedown", () => drawing = true);
    canvas.addEventListener("mouseup", () => drawing = false);
    canvas.addEventListener("mouseleave", () => drawing = false);

    canvas.addEventListener("mousemove", e => {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    document.querySelector(".clear-signature-btn").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    signaturePad = canvas;
}

// -------------------------
// SUBMIT
// -------------------------
document.querySelector(".submit-btn").addEventListener("click", async () => {
    const signatureData = signaturePad.toDataURL("image/png");

    const payload = {
        gameId,
        playerId: dqPenalty.playerId,
        reportingOfficialId: document.querySelector(".official-select").value,
        period: dqPenalty.period,
        timeInPeriod: dqPenalty.timeInPeriod,
        infraction: dqPenalty.infraction,
        ruleReference: dqPenalty.ruleReference,
        duration: dqPenalty.duration,
        incidentNotes: document.querySelector(".notes-input").value,
        signatureImageBase64: signatureData
    };

    await fetch(`/api/dq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    window.location.href = `./summary.html?gameId=${gameId}`;
});

// -------------------------
// CANCEL
// -------------------------
document.querySelector(".cancel-btn").addEventListener("click", () => {
    window.location.href = `./game-score-sheet.html?gameId=${gameId}`;
});
