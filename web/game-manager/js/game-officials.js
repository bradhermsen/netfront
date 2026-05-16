import { GameApi } from "./api/gameApi.js";

let gameId = null;

// -------------------------
// INITIALIZATION
// -------------------------
async function init() {
    const params = new URLSearchParams(window.location.search);
    gameId = params.get("gameId");

    await loadOfficials();
}

init();

// -------------------------
// LOAD EXISTING OFFICIALS
// -------------------------
async function loadOfficials() {
    const res = await fetch(`/api/game/${gameId}/officials`);
    const data = await res.json();

    document.querySelector(".ref1-input").value = data.ref1 ?? "";
    document.querySelector(".ref2-input").value = data.ref2 ?? "";
    document.querySelector(".line1-input").value = data.line1 ?? "";
    document.querySelector(".line2-input").value = data.line2 ?? "";
    document.querySelector(".notes-input").value = data.notes ?? "";
}

// -------------------------
// SAVE
// -------------------------
document.querySelector(".save-btn").addEventListener("click", async () => {
    const payload = {
        gameId,
        ref1: document.querySelector(".ref1-input").value,
        ref2: document.querySelector(".ref2-input").value,
        line1: document.querySelector(".line1-input").value,
        line2: document.querySelector(".line2-input").value,
        notes: document.querySelector(".notes-input").value
    };

    await fetch(`/api/game/${gameId}/officials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    closeModal();
});

// -------------------------
// CANCEL / CLOSE
// -------------------------
document.querySelector(".cancel-btn").addEventListener("click", closeModal);
document.querySelector(".close-btn").addEventListener("click", closeModal);

function closeModal() {
    window.location.href = `./game-settings.html?gameId=${gameId}`;
}
