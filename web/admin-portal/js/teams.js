const tbody = document.querySelector(".team-table tbody");

// Modal elements
const teamModal = document.getElementById("team-modal");
const teamModalTitle = document.getElementById("team-modal-title");

const teamNameInput = document.getElementById("team-name");
const teamLevelInput = document.getElementById("team-level");
const teamGenderInput = document.getElementById("team-gender");
const teamOrgInput = document.getElementById("team-org");
const teamScoreInput = document.getElementById("team-score-code");
const teamStatInput = document.getElementById("team-stat-code");

const addTeamBtn = document.getElementById("add-team-btn");
const teamCancelBtn = document.getElementById("team-cancel");
const teamSaveBtn = document.getElementById("team-save");

// Bulk modal elements
const bulkTeamModal = document.getElementById("bulk-team-modal");
const bulkTeamBtn = document.getElementById("bulk-team-btn");
const bulkTeamCancel = document.getElementById("bulk-team-cancel");
const bulkTeamFile = document.getElementById("bulk-team-file");
const bulkTeamPreview = document.getElementById("bulk-team-preview");

// Search
const teamSearchInput = document.getElementById("team-search");

let editingTeamId = null;
let allTeams = [];
let allOrgs = [];

// Load organizations
async function loadOrganizations() {
    const res = await fetch("http://localhost:7071/api/organizations");
    allOrgs = await res.json();

    teamOrgInput.innerHTML = "";
    allOrgs.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.id;
        opt.textContent = o.name;
        teamOrgInput.appendChild(opt);
    });
}

// Load teams
async function loadTeams() {
    const res = await fetch("http://localhost:7071/api/teams");
    allTeams = await res.json();
    renderTeams(allTeams);
}

function renderTeams(teams) {
    tbody.innerHTML = "";

    teams.forEach(t => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${t.name}</td>
            <td>${t.level}</td>
            <td>${t.gender}</td>
            <td>${t.organizationName}</td>
            <td>${t.scorekeeperCode}</td>
            <td>${t.statManagerCode}</td>
            <td style="text-align:center;">
                <button class="btn-sm edit-btn" data-id="${t.id}">✏️ Edit</button>
                <button class="btn-sm delete-btn" data-id="${t.id}">🗑️ Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", () => openEditModal(btn.dataset.id))
    );

    document.querySelectorAll(".delete-btn").forEach(btn =>
        btn.addEventListener("click", () => deleteTeam(btn.dataset.id))
    );
}

function openAddModal() {
    editingTeamId = null;
    teamModalTitle.textContent = "Add Team";

    teamNameInput.value = "";
    teamLevelInput.value = "Varsity";
    teamGenderInput.value = "Boys";
    teamOrgInput.value = allOrgs[0]?.id ?? "";
    teamScoreInput.value = "";
    teamStatInput.value = "";

    teamModal.classList.remove("hidden");
}

async function openEditModal(id) {
    editingTeamId = id;

    const res = await fetch(`http://localhost:7071/api/teams/${id}`);
    const t = await res.json();

    teamModalTitle.textContent = "Edit Team";

    teamNameInput.value = t.name;
    teamLevelInput.value = t.level;
    teamGenderInput.value = t.gender;
    teamOrgInput.value = t.organizationId;
    teamScoreInput.value = t.scorekeeperCode;
    teamStatInput.value = t.statManagerCode;

    teamModal.classList.remove("hidden");
}

async function saveTeam() {
    const payload = {
        name: teamNameInput.value,
        level: teamLevelInput.value,
        gender: teamGenderInput.value,
        organizationId: parseInt(teamOrgInput.value),
        scorekeeperCode: teamScoreInput.value,
        statManagerCode: teamStatInput.value
    };

    if (editingTeamId) {
        await fetch(`http://localhost:7071/api/teams/${editingTeamId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } else {
        await fetch("http://localhost:7071/api/teams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }

    teamModal.classList.add("hidden");
    loadTeams();
}

async function deleteTeam(id) {
    const confirmDelete = confirm("Delete this team?");
    if (!confirmDelete) return;

    await fetch(`http://localhost:7071/api/teams/${id}`, {
        method: "DELETE"
    });

    loadTeams();
}

// CSV parser
function parseCSV(text) {
    return text.trim().split("\n").map(r => r.split(","));
}

// Bulk Add
bulkTeamBtn.addEventListener("click", () => {
    bulkTeamPreview.innerHTML = "";
    bulkTeamFile.value = "";
    bulkTeamModal.classList.remove("hidden");
});

bulkTeamCancel.addEventListener("click", () => {
    bulkTeamModal.classList.add("hidden");
});

bulkTeamFile.addEventListener("change", async () => {
    const file = bulkTeamFile.files[0];
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
    bulkTeamPreview.innerHTML = html;
});

document.getElementById("bulk-team-import").addEventListener("click", async () => {
    const file = bulkTeamFile.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCSV(text);

    const headers = rows[0];
    const data = rows.slice(1).map(r => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = r[i]);
        return obj;
    });

    await fetch("http://localhost:7071/api/teams/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    bulkTeamModal.classList.add("hidden");
    loadTeams();
});

// Search
teamSearchInput.addEventListener("input", () => {
    const term = teamSearchInput.value.toLowerCase();
    const filtered = allTeams.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.organizationName.toLowerCase().includes(term)
    );
    renderTeams(filtered);
});

// Modal buttons
addTeamBtn.addEventListener("click", openAddModal);
teamCancelBtn.addEventListener("click", () => teamModal.classList.add("hidden"));
teamSaveBtn.addEventListener("click", saveTeam);

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("nf_admin_token");
    localStorage.removeItem("nf_admin_role");
    window.location.href = "./login.html";
});

// Init
await loadOrganizations();
await loadTeams();
