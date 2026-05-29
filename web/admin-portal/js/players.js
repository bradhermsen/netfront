// players.js — Admin Portal
// Loads player data from /players/dto and renders the table

let playersData = [];
let currentSort = { key: null, direction: 1 };

document.addEventListener("DOMContentLoaded", async () => {
    await window.configReady;   // Wait for config.json to finish loading
    loadPlayers();
});

/* -----------------------------
   LOAD + RENDER PLAYERS
------------------------------ */

async function loadPlayers() {
    const tableBody = document.querySelector("#playersBody");
    tableBody.innerHTML = "";

    try {
        const response = await fetch(`${apiBase}/players/dto`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        playersData = await response.json();   // store globally for sorting

        renderPlayers(playersData);
        attachSorting();

    } catch (err) {
        console.error("Error loading players:", err);
        tableBody.innerHTML = `<tr><td colspan="8" class="error">Failed to load players.</td></tr>`;
    }
}

function renderPlayers(list) {
    const tableBody = document.querySelector("#playersBody");
    tableBody.innerHTML = "";

    list.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${p.fullName ?? ""}</td>
            <td>${p.teamName ?? "-"}</td>
            <td>${p.organizationName ?? "-"}</td>
            <td>${p.position ?? "-"}</td>
            <td>${p.shoots ?? "-"}</td>
            <td>${p.jerseyNumber ?? "-"}</td>
            <td>${p.isActive ? "✅" : "❌"}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="editPlayer('${p.playerId}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deletePlayer('${p.playerId}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/* -----------------------------
   SORTING LOGIC
------------------------------ */

function sortPlayers(key) {
    if (currentSort.key === key) {
        currentSort.direction *= -1; // toggle asc/desc
    } else {
        currentSort.key = key;
        currentSort.direction = 1;
    }

    playersData.sort((a, b) => {
        const valA = (a[key] ?? "").toString().toLowerCase();
        const valB = (b[key] ?? "").toString().toLowerCase();

        if (valA < valB) return -1 * currentSort.direction;
        if (valA > valB) return 1 * currentSort.direction;
        return 0;
    });

    renderPlayers(playersData);
}

function attachSorting() {
    document.querySelectorAll("th.sortable").forEach(th => {
        th.addEventListener("click", () => {
            const key = th.dataset.key;
            sortPlayers(key);
        });
    });
}

/* -----------------------------
   EDIT + DELETE
------------------------------ */

function editPlayer(id) {
    window.location.href = `/admin-portal/screens/edit-player.html?id=${id}`;
}

async function deletePlayer(id) {
    if (!confirm("Are you sure you want to delete this player?")) return;

    try {
        const response = await fetch(`${apiBase}/players/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        loadPlayers();
    } catch (err) {
        console.error("Error deleting player:", err);
        alert("Failed to delete player.");
    }
}
