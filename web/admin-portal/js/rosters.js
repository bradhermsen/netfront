console.log("Roster JS loaded");

const tbody = document.querySelector(".roster-table tbody");

// Modal elements
const playerModal = document.getElementById("player-modal");
const playerModalTitle = document.getElementById("player-modal-title");

const firstInput = document.getElementById("player-first");
const lastInput = document.getElementById("player-last");
const jerseyInput = document.getElementById("player-jersey");
const positionInput = document.getElementById("player-position");
const shootsInput = document.getElementById("player-shoots");
const statusInput = document.getElementById("player-status");
const teamInput = document.getElementById("player-team");

const addPlayerBtn = document.getElementById("add-player-btn");
const playerCancelBtn = document.getElementById("player-cancel");
const playerSaveBtn = document.getElementById("player-save");

// Bulk modal elements
const bulkRosterModal = document.getElementById("bulk-roster-modal");
const bulkRosterBtn = document.getElementById("bulk-roster-btn");
const bulkRosterCancel = document.getElementById("bulk-roster-cancel");
const bulkRosterFile = document.getElementById("bulk-roster-file");
const bulkRosterPreview = document.getElementById("bulk-roster-preview");

// Search
const rosterSearchInput = document.getElementById("roster-search");

let editingPlayerId = null;
let allPlayers = [];
let allTeams = [];

// Load teams for dropdown
async function loadTeams() {
    const res = await fetch("http://localhost:7071/api/teams");
    allTeams = await res.json();

    teamInput.innerHTML = "";
    allTeams.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.name;
        teamInput.appendChild(opt);
    });
}

// Load roster
async function loadRoster() {
    const res = await fetch("http://localhost:7071/api/roster");
    allPlayers = await res.json();
    renderRoster(allPlayers);
}

function renderRoster(players) {
    tbody.innerHTML = "";

    players.forEach(p => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${p.firstName} ${p.lastName}</td>
            <td>${p.jerseyNumber}</td>
            <td>${p.position}</td>
            <td>${p.shoots}</td>
            <td>${p.status}</td>
            <td>${p.teamName}</td>
            <td style="text-align:center;">
                <button class="btn-sm edit-btn" data-id="${p.id}">✏️ Edit</button>
                <button class="btn-sm delete-btn" data-id="${p.id}">🗑️ Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", () => openEditModal(btn.dataset.id))
    );

    document.querySelectorAll(".delete-btn").forEach(btn =>
        btn.addEventListener("click", () => deletePlayer(btn.dataset.id))
    );
}

function openAddModal() {
    editingPlayerId = null;
    playerModalTitle.textContent = "Add Player";

    firstInput.value = "";
    lastInput.value = "";
    jerseyInput.value = "";
    positionInput.value = "F";
    shootsInput.value = "Left";
    statusInput.value = "Active";
    teamInput.value = allTeams[0]?.id ?? "";

    playerModal.classList.remove("hidden");
}

async function openEditModal(id) {
    editingPlayerId = id;

    const res = await fetch(`http://localhost:7071/api/roster/${id}`);
    const p = await res.json();

    playerModalTitle.textContent = "Edit Player";

    firstInput.value = p.firstName;
    lastInput.value = p.lastName;
    jerseyInput.value = p.jerseyNumber;
    positionInput.value = p.position;
    shootsInput.value = p.shoots;
    statusInput.value = p.status;
    teamInput.value = p.teamId;

    playerModal.classList.remove("hidden");
}

async function savePlayer() {
    const payload = {
        firstName: firstInput.value,
        lastName: lastInput.value,
        jerseyNumber: jerseyInput.value,
        position: positionInput.value,
        shoots: shootsInput.value,
        status: statusInput.value,
        teamId: parseInt(teamInput.value)
    };

    if (editingPlayerId) {
        await fetch(`http://localhost:7071/api/roster/${editingPlayerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } else {
        await fetch("http://localhost:7071/api/roster", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }

    playerModal.classList.add("hidden");
    loadRoster();
}

async function deletePlayer(id) {
    const confirmDelete = confirm("Delete this player?");
    if (!confirmDelete) return;

    await fetch(`http://localhost:7071/api/roster/${id}`, {
        method: "DELETE"
    });

    loadRoster();
}

// CSV parser
function parseCSV(text) {
    return text.trim().split("\n").map(r => r.split(","));
}

// Bulk Add
bulkRosterBtn.addEventListener("click", () => {
    console.log("Bulk Add clicked");
    bulkRosterPreview.innerHTML = "";
    bulkRosterFile.value = "";
    bulkRosterModal.classList.remove("hidden");
});

bulkRosterCancel.addEventListener("click", () => {
    bulkRosterModal.classList.add("hidden");
});

bulkRosterFile.addEventListener("change", async () => {
    const file = bulkRosterFile.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCSV(text);

    let html = `<table class="admin-table"><thead><tr>`;
    rows[0].forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;

    rows.slice(1).forEach(r => {
        html += "<tr>";
        r.forEach(c => html += `<td>${c}</td>`);
        html += "</tr>";
    });

    html += "</tbody></table>";
    bulkRosterPreview.innerHTML = html;
});

document.getElementById("bulk-roster-import").addEventListener("click", async () => {
    const file = bulkRosterFile.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCSV(text);

    const headers = rows[0];
    const data = rows.slice(1).map(r => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = r[i]);
        return obj;
    });

    await fetch("http://localhost:7071/api/roster/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    bulkRosterModal.classList.add("hidden");
    loadRoster();
});

// Search
rosterSearchInput.addEventListener("input", () => {
    const term = rosterSearchInput.value.toLowerCase();
    const filtered = allPlayers.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
        p.teamName.toLowerCase().includes(term)
    );
    renderRoster(filtered);
});

// Modal buttons
addPlayerBtn.addEventListener("click", openAddModal);
playerCancelBtn.addEventListener("click", () => playerModal.classList.add("hidden"));
playerSaveBtn.addEventListener("click", savePlayer);

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("nf_admin_token");
    localStorage.removeItem("nf_admin_role");
    window.location.href = "./login.html";
});

// Init
await loadTeams();
await loadRoster();
