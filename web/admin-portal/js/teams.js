// ===============================
// DOM ELEMENTS
// ===============================
const teamsBody = document.getElementById("teamsBody");

const teamModal = document.getElementById("teamModal");
const teamModalTitle = document.getElementById("teamModalTitle");
const btnAddTeam = document.getElementById("btnAddTeam");
const btnSaveTeam = document.getElementById("btnSaveTeam");
const btnCancelTeam = document.getElementById("btnCancelTeam");
const btnGenerateCodes = document.getElementById("btnGenerateCodes");

const teamNameInput = document.getElementById("team-name");
const teamOrgInput = document.getElementById("team-org");
const teamLevelInput = document.getElementById("team-level");
const teamSeasonInput = document.getElementById("team-season");

const teamHeadCoachInput = document.getElementById("team-head-coach");
const teamAsst1Input = document.getElementById("team-asst1");
const teamAsst2Input = document.getElementById("team-asst2");
const teamAsst3Input = document.getElementById("team-asst3");
const teamAsst4Input = document.getElementById("team-asst4");

const teamNotesInput = document.getElementById("team-notes");

const teamActiveInput = document.getElementById("team-active");
const teamExternalInput = document.getElementById("team-external");

const scoreCodeInput = document.getElementById("team-score-code");
const statCodeInput = document.getElementById("team-stat-code");

const teamsSearchBar = document.getElementById("teams-search-bar");

let editingTeamId = null;
let allTeams = [];
let currentSort = { column: null, direction: null };

// ===============================
// GENERATE ACCESS CODES BUTTON
// ===============================
btnGenerateCodes.addEventListener("click", () => {
    const scoreCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const statCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    scoreCodeInput.value = scoreCode;
    statCodeInput.value = statCode;

    alert(`Generated Codes:\n\nScorekeeper: ${scoreCode}\nStat Manager: ${statCode}`);
});

// ===============================
// MODAL CONTROL
// ===============================
function showTeamModal() {
    teamModal.classList.remove("hidden");
}

function closeTeamModal() {
    teamModal.classList.add("hidden");
    clearTeamForm();
    editingTeamId = null;
}

btnCancelTeam.addEventListener("click", closeTeamModal);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !teamModal.classList.contains("hidden")) {
        closeTeamModal();
    }
});

// ===============================
// CLEAR FORM
// ===============================
function clearTeamForm() {
    teamNameInput.value = "";
    teamOrgInput.value = "";
    teamLevelInput.value = "";
    teamSeasonInput.value = "";

    teamHeadCoachInput.value = "";
    teamAsst1Input.value = "";
    teamAsst2Input.value = "";
    teamAsst3Input.value = "";
    teamAsst4Input.value = "";

    teamNotesInput.value = "";

    scoreCodeInput.value = "";
    statCodeInput.value = "";

    teamActiveInput.checked = true;
    teamExternalInput.checked = false;
}

// ===============================
// LOAD DROPDOWNS
// ===============================
async function loadOrganizationsForTeams() {
    const res = await fetch("http://localhost:7071/api/organizations");
    const orgs = await res.json();

    teamOrgInput.innerHTML = `<option value="">Select Organization</option>`;
    orgs.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.organizationId;
        opt.textContent = o.name;
        teamOrgInput.appendChild(opt);
    });
}

async function loadLevelsForTeams() {
    const res = await fetch("http://localhost:7071/api/levels");
    const levels = await res.json();

    teamLevelInput.innerHTML = `<option value="">Select Level</option>`;
    levels.forEach(l => {
        const opt = document.createElement("option");
        opt.value = l.levelId;
        opt.textContent = l.levelName;
        teamLevelInput.appendChild(opt);
    });
}

async function loadSeasonsForTeams() {
    const res = await fetch("http://localhost:7071/api/seasons");
    const seasons = await res.json();

    teamSeasonInput.innerHTML = `<option value="">Select Season</option>`;
    seasons.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.seasonId;
        opt.textContent = s.seasonName;
        teamSeasonInput.appendChild(opt);
    });
}

async function loadTeamDropdowns() {
    await Promise.all([
        loadOrganizationsForTeams(),
        loadLevelsForTeams(),
        loadSeasonsForTeams()
    ]);
}

// ===============================
// RENDER TEAMS (GROUPED + COLLAPSIBLE)
// ===============================
function renderTeams(teams) {
    teamsBody.innerHTML = "";

    const groups = new Map();
    const externalKey = "__external__";

    groups.set(externalKey, []);

    teams.forEach(t => {
        const isExternal =
            t.isExternal === true ||
            t.organizationId === null ||
            t.organizationId === "00000000-0000-0000-0000-000000000000";

        const key = isExternal ? externalKey : (t.organizationName ?? "");

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(t);
    });

    groups.forEach((groupTeams, key) => {
        const groupId = key === externalKey ? "external" : key.replace(/\s+/g, "-").toLowerCase();

        const headerRow = document.createElement("tr");
        headerRow.classList.add("team-group-header");
        headerRow.dataset.group = groupId;

        headerRow.innerHTML = `
            <td colspan="9">
                <span class="group-toggle">▼</span>
                ${key === externalKey ? "External Teams" : key}
            </td>
        `;

        headerRow.addEventListener("click", () => {
            const rows = document.querySelectorAll(`tr[data-parent='${groupId}']`);
            const icon = headerRow.querySelector(".group-toggle");
            const collapsed = headerRow.classList.toggle("collapsed");
            icon.textContent = collapsed ? "►" : "▼";
            rows.forEach(r => r.style.display = collapsed ? "none" : "");
        });

        teamsBody.appendChild(headerRow);

        groupTeams.forEach(team => {
            const row = document.createElement("tr");
            row.dataset.parent = groupId;

            row.innerHTML = `
                <td>${team.name}</td>
                <td>${team.isExternal ? "" : (team.organizationName ?? "")}</td>
                <td>${team.levelName ?? ""}</td>
                <td>${team.seasonName ?? ""}</td>
                <td>${team.rosterCount ?? 0}</td>
                <td>${team.headCoachName ?? ""}</td>

                <td class="table-stack">
                    <div class="stack-item">
                        <label class="stack-label">Score Keeper</label>
                        <span class="stack-orange">${team.scorekeeperCode ?? ""}</span>
                    </div>
                    <div class="stack-item">
                        <label class="stack-label">Stat Manager</label>
                        <span class="stack-blue">${team.statManagerCode ?? ""}</span>
                    </div>
                </td>

                <td>
                    <span class="status-pill ${team.isActive ? "active" : "inactive"}">
                        ${team.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                </td>

                <td class="actions-col">
                    <button class="btn-small" onclick="openRoster('${team.id}')">Roster</button>
                    <button class="btn-small" onclick="openEditTeamModal('${team.id}')">Edit</button>
                    <button class="btn-small btn-danger" onclick="openDeleteTeamModal('${team.id}')">Delete</button>
                </td>
            `;
            teamsBody.appendChild(row);
        });
    });
}

// ===============================
// LOAD TEAMS
// ===============================
async function loadTeams() {
    allTeams = await TeamApi.getAll();
    applySearchAndSort();
}

// ===============================
// SORTING
// ===============================
function sortTeams(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
    } else {
        currentSort.column = column;
        currentSort.direction = "asc";
    }

    const dir = currentSort.direction === "asc" ? 1 : -1;

    allTeams.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA > valB) return dir;
        if (valA < valB) return -dir;
        return 0;
    });

    updateSortHeaderClasses();
    applySearchAndSort();
}

function updateSortHeaderClasses() {
    const ths = document.querySelectorAll("th.sortable");
    ths.forEach(th => th.classList.remove("asc", "desc"));

    if (!currentSort.column) return;

    const map = {
        name: 0,
        organizationName: 1,
        levelName: 2,
        seasonName: 3,
        rosterCount: 4,
        headCoachName: 5,
        isActive: 6
    };

    const index = map[currentSort.column];
    if (index === undefined) return;

    const th = ths[index];
    th.classList.add(currentSort.direction);
}

// ===============================
// SEARCH / FILTER
// ===============================
function applySearchAndSort() {
    const q = (teamsSearchBar.value || "").toLowerCase();

    const filtered = allTeams.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.organizationName?.toLowerCase().includes(q) ||
        t.levelName?.toLowerCase().includes(q) ||
        t.seasonName?.toLowerCase().includes(q) ||
        t.headCoachName?.toLowerCase().includes(q)
    );

    renderTeams(filtered);
}

teamsSearchBar.addEventListener("input", applySearchAndSort);

// ===============================
// OPEN ADD MODAL
// ===============================
btnAddTeam.addEventListener("click", async () => {
    editingTeamId = null;
    teamModalTitle.textContent = "Add Team";
    await loadTeamDropdowns();
    clearTeamForm();
    showTeamModal();
});

// ===============================
// OPEN EDIT MODAL
// ===============================
async function openEditTeamModal(id) {
    editingTeamId = id;
    teamModalTitle.textContent = "Edit Team";

    await loadTeamDropdowns();

    const team = await TeamApi.getById(id);

    teamNameInput.value = team.name;
    teamOrgInput.value = team.organizationId ?? "";
    teamLevelInput.value = team.levelId ?? "";
    teamSeasonInput.value = team.seasonId ?? "";

    teamHeadCoachInput.value = team.headCoachName ?? "";
    teamAsst1Input.value = team.assistantCoach1Name ?? "";
    teamAsst2Input.value = team.assistantCoach2Name ?? "";
    teamAsst3Input.value = team.assistantCoach3Name ?? "";
    teamAsst4Input.value = team.assistantCoach4Name ?? "";

    teamNotesInput.value = team.notes ?? "";

    teamActiveInput.checked = team.isActive;
    teamExternalInput.checked = team.isExternal;

    scoreCodeInput.value = team.scorekeeperCode ?? "";
    statCodeInput.value = team.statManagerCode ?? "";

    showTeamModal();
}

// ===============================
// SAVE TEAM
// ===============================
btnSaveTeam.addEventListener("click", saveTeam);

async function saveTeam() {
    const payload = {
        organizationId: teamOrgInput.value || null,
        levelId: teamLevelInput.value || null,
        seasonId: teamSeasonInput.value || null,
        name: teamNameInput.value,
        headCoachName: teamHeadCoachInput.value,
        assistantCoach1Name: teamAsst1Input.value,
        assistantCoach2Name: teamAsst2Input.value,
        assistantCoach3Name: teamAsst3Input.value,
        assistantCoach4Name: teamAsst4Input.value,
        isActive: teamActiveInput.checked,
        isExternal: teamExternalInput.checked,
        notes: teamNotesInput.value,
        scorekeeperCode: scoreCodeInput.value,
        statManagerCode: statCodeInput.value
    };

    if (editingTeamId) {
        await TeamApi.update(editingTeamId, payload);
    } else {
        await TeamApi.create(payload);
    }

    closeTeamModal();
    loadTeams();
}

// ===============================
// DELETE TEAM
// ===============================
let deleteTeamId = null;

function openDeleteTeamModal(id) {
    deleteTeamId = id;
    document.getElementById("teamDeleteModal").classList.remove("hidden");
}

document.getElementById("btnCancelTeamDelete").addEventListener("click", () => {
    deleteTeamId = null;
    document.getElementById("teamDeleteModal").classList.add("hidden");
});

document.getElementById("btnConfirmTeamDelete").addEventListener("click", async () => {
    if (deleteTeamId) {
        await TeamApi.delete(deleteTeamId);
        deleteTeamId = null;
        document.getElementById("teamDeleteModal").classList.add("hidden");
        loadTeams();
    }
});

// ===============================
// ROSTER NAV
// ===============================
function openRoster(teamId) {
    window.location.href = `rosters.html?teamId=${teamId}`;
}

// ===============================
// INITIAL LOAD
// ===============================
loadTeams();
