// rosters.js — Admin Portal
// Team-level roster view with GLOBAL + LOCAL sorting, search, and filters

let allTeams = [];
let rosterCache = {};
let currentSort = { field: null, direction: "asc" };

// Local (per-roster) filters
let searchQuery = "";
let activeFilters = { position: "", status: "", shoots: "" };

// Global filters (team, organization, status, search)
let globalFilters = {
    search: "",
    teamId: "",
    organization: "",
    status: ""
};

document.addEventListener("DOMContentLoaded", async () => {
    await window.configReady;
    await loadTeams(); // load teams first so dropdowns populate correctly
    renderGlobalControls();
    attachGlobalFilterEvents();
    loadTeamsWithRosters();
});

/* -----------------------------
   LOAD TEAMS FIRST (for dropdowns)
------------------------------ */

async function loadTeams() {
    const teamsRes = await fetch(`${apiBase}/teams`);
    if (!teamsRes.ok) throw new Error(`HTTP ${teamsRes.status}`);
    allTeams = await teamsRes.json();
}

/* -----------------------------
   GLOBAL CONTROLS (TOP OF PAGE)
------------------------------ */

function renderGlobalControls() {
    const container = document.getElementById("globalRosterControls");
    if (!container) return;

    const orgs = [...new Set(allTeams.map(t => t.organizationName || "External Team"))];

    container.innerHTML = `
        <input id="globalSearch" placeholder="Search teams or organizations..." />

        <select id="globalTeam">
            <option value="">All Teams</option>
            ${allTeams.map(t => `<option value="${t.teamId}">${t.name}</option>`).join("")}
        </select>

        <select id="globalOrg">
            <option value="">All Organizations</option>
            ${orgs.map(o => `<option value="${o}">${o}</option>`).join("")}
        </select>

        <select id="globalStatus">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
        </select>
    `;
}

function attachGlobalFilterEvents() {
    document.getElementById("globalSearch").addEventListener("input", e => {
        globalFilters.search = e.target.value.toLowerCase();
        loadTeamsWithRosters();
    });

    document.getElementById("globalTeam").addEventListener("change", e => {
        globalFilters.teamId = e.target.value;
        loadTeamsWithRosters();
    });

    document.getElementById("globalOrg").addEventListener("change", e => {
        globalFilters.organization = e.target.value;
        loadTeamsWithRosters();
    });

    document.getElementById("globalStatus").addEventListener("change", e => {
        globalFilters.status = e.target.value;
        loadTeamsWithRosters();
    });
}

/* -----------------------------
   POSITION NORMALIZATION
------------------------------ */

function normalizePosition(pos) {
    if (!pos) return "";
    pos = pos.toUpperCase();

    if (["F", "FW", "FORWARD", "LW", "RW", "C"].includes(pos)) return "F";
    if (["D", "DEF", "DEFENSE"].includes(pos)) return "D";
    if (["G", "GOALIE", "GOL"].includes(pos)) return "G";

    return pos;
}

/* -----------------------------
   GLOBAL FILTER LOGIC
------------------------------ */

function applyGlobalFilters(team) {
    const teamName = team.name.toLowerCase();
    const orgName = (team.organizationName || "External Team").toLowerCase();

    const matchesSearch =
        !globalFilters.search ||
        teamName.includes(globalFilters.search) ||
        orgName.includes(globalFilters.search);

    const matchesTeam =
        !globalFilters.teamId ||
        team.teamId === globalFilters.teamId;

    const matchesOrg =
        !globalFilters.organization ||
        (team.organizationName || "External Team") === globalFilters.organization;

    const matchesStatus =
        !globalFilters.status ||
        (team.isActive ? "Active" : "Inactive") === globalFilters.status;

    return matchesSearch && matchesTeam && matchesOrg && matchesStatus;
}

/* -----------------------------
   LOAD TEAMS + ROSTER COUNTS
------------------------------ */

async function loadTeamsWithRosters() {
    const tbody = document.getElementById("teamsRosterBody");
    tbody.innerHTML = "";

    for (const team of allTeams) {

        // Apply GLOBAL filters to TEAM
        if (!applyGlobalFilters(team)) continue;

        const res = await fetch(`${apiBase}/teams/${team.teamId}/roster`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let roster = await res.json();

        rosterCache[team.teamId] = roster;

        const rosterCount = roster.length;

        const teamRow = document.createElement("tr");
        teamRow.classList.add("team-row");
        teamRow.dataset.teamId = team.teamId;

        teamRow.innerHTML = `
            <td class="team-toggle">${team.name}</td>
            <td>${team.organizationName && team.organizationName.trim() !== "" 
                ? team.organizationName 
                : "External Team"}</td>
            <td>${rosterCount}</td>
            <td>${team.isActive ? "Active" : "Inactive"}</td>
            <td>
                <button class="btn-small" onclick="editTeam('${team.teamId}')">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteTeam('${team.teamId}')">Delete</button>
            </td>
        `;

        tbody.appendChild(teamRow);

        const detailRow = document.createElement("tr");
        detailRow.classList.add("team-details", "hidden");
        detailRow.dataset.teamId = team.teamId;

        detailRow.innerHTML = `
            <td colspan="5">
                <div class="roster-container" id="roster-${team.teamId}"></div>
            </td>
        `;

        tbody.appendChild(detailRow);

        teamRow.querySelector(".team-toggle").addEventListener("click", () => {
            toggleRoster(team.teamId);
        });
    }
}

/* -----------------------------
   EXPAND / COLLAPSE / REFRESH
------------------------------ */

async function toggleRoster(teamId, refresh = false) {
    const detailRow = document.querySelector(`tr.team-details[data-team-id="${teamId}"]`);
    const container = document.getElementById(`roster-${teamId}`);

    if (!detailRow || !container) return;

    if (!refresh && !detailRow.classList.contains("hidden")) {
        detailRow.classList.add("hidden");
        return;
    }

    let roster = rosterCache[teamId] || [];

    // Apply LOCAL filters
    roster = applySearchAndFilters(roster);
    roster = applySort(roster);

    container.innerHTML = buildRosterTable(roster);
    detailRow.classList.remove("hidden");

    attachSortHandlers(teamId);
}

/* -----------------------------
   BUILD ROSTER TABLE (LOCAL)
------------------------------ */

function buildRosterTable(roster) {
    return `
        <div class="roster-controls">
            <input id="searchInput" class="search-bar" placeholder="Search players in this team...">
            <select id="filterPosition">
                <option value="">All Positions</option>
                <option value="F">Forward</option>
                <option value="D">Defense</option>
                <option value="G">Goalie</option>
            </select>
            <select id="filterShoots">
                <option value="">Shoots</option>
                <option value="L">Left</option>
                <option value="R">Right</option>
            </select>
            <select id="filterStatus">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Scratched">Scratched</option>
            </select>
        </div>

        <table class="inner-table">
            <thead>
                <tr>
                    <th class="sortable" data-field="fullName">Player Name</th>
                    <th class="sortable" data-field="position">Position</th>
                    <th class="sortable" data-field="shoots">Shoots</th>
                    <th class="sortable" data-field="jerseyNumber">Jersey</th>
                    <th class="sortable" data-field="status">Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${roster.map(r => `
                    <tr>
                        <td>${r.fullName}</td>
                        <td>${r.position ?? "-"}</td>
                        <td>${r.shoots ?? "-"}</td>
                        <td>${r.jerseyNumber ?? "-"}</td>
                        <td>${r.status ?? (r.isActive ? "Active" : "Inactive")}</td>
                        <td><button class="btn-small" onclick="viewPlayer('${r.playerId}')">View</button></td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

/* -----------------------------
   LOCAL SORTING + FILTER EVENTS
------------------------------ */

function attachSortHandlers(teamId) {

    document.querySelectorAll(`#roster-${teamId} .sortable`).forEach(header => {
        header.addEventListener("click", () => {
            const field = header.dataset.field;
            currentSort.direction =
                currentSort.field === field && currentSort.direction === "asc"
                    ? "desc"
                    : "asc";
            currentSort.field = field;

            toggleRoster(teamId, true);
        });
    });

    document.getElementById("searchInput").addEventListener("input", e => {
        searchQuery = e.target.value.toLowerCase();
        toggleRoster(teamId, true);
    });

    document.getElementById("filterPosition").addEventListener("change", e => {
        activeFilters.position = e.target.value;
        toggleRoster(teamId, true);
    });

    document.getElementById("filterShoots").addEventListener("change", e => {
        activeFilters.shoots = e.target.value;
        toggleRoster(teamId, true);
    });

    document.getElementById("filterStatus").addEventListener("change", e => {
        activeFilters.status = e.target.value;
        toggleRoster(teamId, true);
    });
}

/* -----------------------------
   LOCAL SORT + FILTER LOGIC
------------------------------ */

function applySort(roster) {
    if (!currentSort.field) return roster;

    return roster.slice().sort((a, b) => {
        const A = (a[currentSort.field] ?? "").toString().toLowerCase();
        const B = (b[currentSort.field] ?? "").toString().toLowerCase();
        return currentSort.direction === "asc" ? A.localeCompare(B) : B.localeCompare(A);
    });
}

function applySearchAndFilters(roster) {
    return roster.filter(r => {
        const matchesSearch =
            !searchQuery ||
            (r.fullName ?? "").toLowerCase().includes(searchQuery) ||
            (r.position ?? "").toLowerCase().includes(searchQuery) ||
            (r.shoots ?? "").toLowerCase().includes(searchQuery);

        const matchesPosition =
            !activeFilters.position ||
            normalizePosition(r.position) === activeFilters.position;

        const matchesShoots =
            !activeFilters.shoots ||
            r.shoots === activeFilters.shoots;

        const matchesStatus =
            !activeFilters.status ||
            r.status === activeFilters.status;

        return matchesSearch && matchesPosition && matchesShoots && matchesStatus;
    });
}

/* -----------------------------
   TEAM ACTIONS
------------------------------ */

function editTeam(teamId) {
    window.location.href = `/admin-portal/screens/edit-team.html?id=${teamId}`;
}

async function deleteTeam(teamId) {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
        const res = await fetch(`${apiBase}/teams/${teamId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        loadTeamsWithRosters();
    } catch (err) {
        console.error("Error deleting team:", err);
        alert("Failed to delete team.");
    }
}

function viewPlayer(playerId) {
    window.location.href = `/admin-portal/screens/edit-player.html?id=${playerId}`;
}
