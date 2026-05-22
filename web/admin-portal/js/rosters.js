const apiBase = "http://localhost:7071/api";

let editingRosterEntryId = null;
let playersById = {};

document.addEventListener("DOMContentLoaded", () => {
    loadPlayers().then(() => loadRosters());
    setupModalHandlers();
});

function setupModalHandlers() {
    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
        });
    });

    document.getElementById("editPlayerSave").addEventListener("click", updateRosterEntry);
}

async function loadPlayers() {
    const res = await fetch(`${apiBase}/players`);
    const players = await res.json();

    playersById = {};
    players.forEach(p => {
        playersById[p.playerId] = p;
    });
}

async function loadRosters() {
    const tbody = document.getElementById("rosterBody");
    tbody.innerHTML = "";

    const teamsRes = await fetch(`${apiBase}/teams`);
    const teams = await teamsRes.json();

    // GROUP TEAMS
    const orgGroups = {};
    const externalTeams = [];

    teams.forEach(team => {
        if (team.organizationName) {
            if (!orgGroups[team.organizationName]) {
                orgGroups[team.organizationName] = [];
            }
            orgGroups[team.organizationName].push(team);
        } else {
            externalTeams.push(team);
        }
    });

    //
    // LEVEL 1 — ORGANIZATIONAL TEAMS
    //
    renderTopHeader(tbody, "Organizational Teams");

    for (const [orgName, orgTeams] of Object.entries(orgGroups)) {
        renderOrgHeader(tbody, orgName, "Organizational Teams");

        for (const team of orgTeams) {
            await renderTeamGroup(tbody, team, orgName);
        }
    }

    //
    // LEVEL 1 — EXTERNAL TEAMS
    //
    renderTopHeader(tbody, "External Teams");

    for (const team of externalTeams) {
        const label = team.teamName ?? team.name ?? "External Team";
        renderOrgHeader(tbody, label, "External Teams");
        await renderTeamGroup(tbody, team, label);
    }

    setupTopToggles();
    setupOrgToggles();
    setupTeamToggles();
}

//
// RENDERING HELPERS
//

function renderTopHeader(tbody, label) {
    const row = document.createElement("tr");
    row.classList.add("top-header");
    row.dataset.top = label;

    row.innerHTML = `
        <td colspan="6" class="top-title">
            <span class="top-toggle">▶</span>
            ${label}
        </td>
    `;

    tbody.appendChild(row);
}

function renderOrgHeader(tbody, orgName, parentGroup) {
    const row = document.createElement("tr");
    row.classList.add("org-header", "hidden");
    row.dataset.org = orgName;
    row.dataset.parent = parentGroup;

    row.innerHTML = `
        <td colspan="6" class="org-title">
            <span class="org-toggle">▶</span>
            ${orgName}
        </td>
    `;

    tbody.appendChild(row);
}

async function renderTeamGroup(tbody, team, orgName) {
    const teamRow = document.createElement("tr");
    teamRow.classList.add("group-header", "hidden");
    teamRow.dataset.teamId = team.id;
    teamRow.dataset.org = orgName;

    teamRow.innerHTML = `
        <td colspan="6" class="group-title">
            <span class="group-toggle">▶</span>
            ${team.teamName ?? team.name ?? "Unknown Team"}
        </td>
    `;

    tbody.appendChild(teamRow);

    // FETCH ROSTER
    const rosterRes = await fetch(`${apiBase}/teams/${team.id}/roster`);
    const roster = await rosterRes.json();

    if (!roster || roster.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.classList.add("group-row", `team-${team.id}`, "hidden");
        emptyRow.innerHTML = `
            <td colspan="6" class="empty-row">No roster entries yet</td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }

    roster.forEach(entry => {
        const playerId = entry.playerId || entry.PlayerId;
        const player = playersById[playerId];

        const row = document.createElement("tr");
        row.classList.add("group-row", `team-${team.id}`, "hidden");

        row.innerHTML = `
            <td>${entry.jerseyNumber ?? ""}</td>
            <td>${player ? player.fullName : "Unknown Player"}</td>
            <td>${entry.position ?? ""}</td>
            <td>${entry.grade ?? ""}</td>
            <td>
                <span class="${entry.status === "Active" ? "status-active" : "status-scratched"}">
                    ${entry.status}
                </span>
            </td>
            <td>
                <button class="btn-small" onclick="openEditModal('${entry.id}')">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteRosterEntry('${entry.id}')">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

//
// TOGGLES
//

function setupTopToggles() {
    document.querySelectorAll(".top-header").forEach(header => {
        header.addEventListener("click", () => {
            const label = header.dataset.top;
            const toggle = header.querySelector(".top-toggle");

            const isCollapsed = toggle.textContent === "▶";
            toggle.textContent = isCollapsed ? "▼" : "▶";

            // Show/hide organizations under this top group
            document.querySelectorAll(`.org-header[data-parent="${label}"]`)
                .forEach(r => r.classList.toggle("hidden", !isCollapsed));

            // Collapse everything inside when collapsing top group
            if (!isCollapsed) {
                document.querySelectorAll(`.group-header, .group-row`)
                    .forEach(r => r.classList.add("hidden"));
                document.querySelectorAll(".org-toggle, .group-toggle")
                    .forEach(t => t.textContent = "▶");
            }
        });
    });
}

function setupOrgToggles() {
    document.querySelectorAll(".org-header").forEach(header => {
        header.addEventListener("click", () => {
            const orgName = header.dataset.org;
            const toggle = header.querySelector(".org-toggle");

            const isCollapsed = toggle.textContent === "▶";
            toggle.textContent = isCollapsed ? "▼" : "▶";

            document.querySelectorAll(`.group-header[data-org="${orgName}"]`)
                .forEach(r => r.classList.toggle("hidden", !isCollapsed));
        });
    });
}

function setupTeamToggles() {
    document.querySelectorAll(".group-header").forEach(header => {
        header.addEventListener("click", () => {
            const teamId = header.dataset.teamId;
            const toggle = header.querySelector(".group-toggle");

            const isCollapsed = toggle.textContent === "▶";
            toggle.textContent = isCollapsed ? "▼" : "▶";

            document.querySelectorAll(`.team-${teamId}`)
                .forEach(r => r.classList.toggle("hidden", !isCollapsed));
        });
    });
}

//
// EDIT / DELETE
//

async function openEditModal(id) {
    editingRosterEntryId = id;

    const res = await fetch(`${apiBase}/roster/${id}`);
    const entry = await res.json();

    document.getElementById("editJersey").value = entry.jerseyNumber ?? "";
    document.getElementById("editPosition").value = entry.position ?? "";
    document.getElementById("editGrade").value = entry.grade ?? "";
    document.getElementById("editStatus").value = entry.status ?? "Active";
    document.getElementById("editNotes").value = entry.notes ?? "";

    document.getElementById("editPlayerModal").classList.remove("hidden");
}

async function updateRosterEntry() {
    const dto = {
        jerseyNumber: parseInt(document.getElementById("editJersey").value),
        position: document.getElementById("editPosition").value,
        grade: parseInt(document.getElementById("editGrade").value),
        status: document.getElementById("editStatus").value,
        notes: document.getElementById("editNotes").value,
        isCaptain: false,
        isAssistantCaptain: false,
        isGoalie: false,
        isActive: true
    };

    await fetch(`${apiBase}/roster/${editingRosterEntryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
    });

    document.getElementById("editPlayerModal").classList.add("hidden");
    loadRosters();
}

async function deleteRosterEntry(id) {
    await fetch(`${apiBase}/roster/${id}`, { method: "DELETE" });
    loadRosters();
}
