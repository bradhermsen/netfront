import { GameApi } from "./api/gameApi.js";

let gameId = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");

    await loadGameHeader();
    await loadCoaches();
    await loadReferees();
    await loadMedia();
}

init();

// -------------------------
// GAME HEADER
// -------------------------
async function loadGameHeader() {
    const res = await fetch(`/api/summary/${gameId}/header`);
    const data = await res.json();

    document.querySelector(".game-title").textContent = data.title;
    document.querySelector(".game-score").textContent = data.score;
}

// -------------------------
// LOAD COACHES
// -------------------------
async function loadCoaches() {
    const res = await fetch(`/api/email/coaches/${gameId}`);
    const coaches = await res.json();

    const list = document.querySelector(".coaches-list");
    list.innerHTML = "";

    coaches.forEach(c => {
        list.appendChild(buildToggleRow(c.name, c.email));
    });
}

// -------------------------
// LOAD REFEREES
// -------------------------
async function loadReferees() {
    const res = await fetch(`/api/email/referees/${gameId}`);
    const refs = await res.json();

    const list = document.querySelector(".referees-list");
    list.innerHTML = "";

    refs.forEach(r => {
        list.appendChild(buildToggleRow(r.name, r.email));
    });
}

// -------------------------
// LOAD MEDIA
// -------------------------
async function loadMedia() {
    const res = await fetch(`/api/email/media/${gameId}`);
    const media = await res.json();

    const list = document.querySelector(".media-list");
    list.innerHTML = "";

    media.forEach(m => {
        list.appendChild(buildToggleRow(m.name, m.email));
    });
}

// -------------------------
// BUILD TOGGLE ROW
// -------------------------
function buildToggleRow(label, email) {
    const row = document.createElement("div");
    row.className = "toggle-row";

    row.innerHTML = `
        <span class="toggle-label">${label}</span>
        <button class="toggle-btn" data-email="${email}"></button>
    `;

    const btn = row.querySelector(".toggle-btn");
    btn.addEventListener("click", () => {
        btn.classList.toggle("active");
    });

    return row;
}

// -------------------------
// SEND SUMMARY
// -------------------------
document.querySelector(".send-btn").addEventListener("click", async () => {
    const selected = [];

    document.querySelectorAll(".toggle-btn.active").forEach(btn => {
        selected.push(btn.dataset.email);
    });

    const other = document.querySelector(".other-email-input").value.trim();
    if (other) selected.push(other);

    await fetch(`/api/email/send-summary/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: selected })
    });

    alert("Summary sent!");
});

// -------------------------
// BACK
// -------------------------
document.querySelector(".back-btn").addEventListener("click", () => {
    window.location.href = `./summary.html?gameId=${gameId}`;
});
