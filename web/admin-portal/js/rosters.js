// =========================================================
// Rosters.js — Final Corrected Version (Delegated + Modal Safe)
// =========================================================

console.log("ROSTERS.JS LOADED");

// Data caches
let allTeams = [];
let rosterCache = {};
let allPlayers = [];
let currentSort = { field: null, direction: "asc" };

// Local filters
let searchQuery = "";
let activeFilters = { position: "", status: "", shoots: "" };

// Global filters
let globalFilters = {
  search: "",
  teamId: "",
  organization: "",
  status: "",
};

// =========================================================
// PAGE INITIALIZATION
// =========================================================
document.addEventListener("nf-page-ready", async () => {
  console.log("nf-page-ready fired");

  await window.configReady;

  await loadTeams();
  await loadPlayersList();
  attachGlobalFilterEvents();
  loadTeamsWithRosters();

  // CLOSE BUTTONS
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("rosterModal").classList.remove("show");
      document.getElementById("deleteRosterModal").classList.remove("show");
    });
  });

  // SAVE BUTTON
  document
    .getElementById("saveRosterBtn")
    .addEventListener("click", saveRosterEntry);

  // DELETE CONFIRM
  document
    .getElementById("confirmDeleteRosterBtn")
    .addEventListener("click", confirmDeleteRoster);
});

// =========================================================
// DELEGATED EVENT LISTENERS (Dynamic‑Safe)
// =========================================================

// View Players
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("roster-btn")) {
    const teamId = e.target.dataset.teamId;
    viewRoster(teamId);
  }
});

// Add Player
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;

  const teamId = btn.dataset.teamId;
  openAddRoster(teamId);
});

// Edit Player
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const rosterEntryId = e.target.dataset.entryId;
    const teamId = e.target.dataset.teamId;
    openEditRoster(rosterEntryId, teamId);
  }
});

// Delete Player
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const rosterEntryId = e.target.dataset.entryId;
    const teamId = e.target.dataset.teamId;
    openDeleteRoster(rosterEntryId, teamId);
  }
});

// =========================================================
// LOAD TEAMS
// =========================================================
async function loadTeams() {
  const res = await fetch(`${window.apiBase}/teams`);
  allTeams = await res.json();
}

// =========================================================
// LOAD ALL PLAYERS
// =========================================================
async function loadPlayersList() {
  const res = await fetch(`${window.apiBase}/players`);
  allPlayers = await res.json();
}

// =========================================================
// GLOBAL FILTER EVENTS
// =========================================================
function attachGlobalFilterEvents() {
  const searchEl = document.getElementById("globalSearch");
  const teamEl = document.getElementById("globalTeam");
  const orgEl = document.getElementById("globalOrg");
  const statusEl = document.getElementById("globalStatus");

  if (searchEl)
    searchEl.addEventListener("input", (e) => {
      globalFilters.search = e.target.value.toLowerCase();
      loadTeamsWithRosters();
    });

  if (teamEl)
    teamEl.addEventListener("change", (e) => {
      globalFilters.teamId = e.target.value;
      loadTeamsWithRosters();
    });

  if (orgEl)
    orgEl.addEventListener("change", (e) => {
      globalFilters.organization = e.target.value;
      loadTeamsWithRosters();
    });

  if (statusEl)
    statusEl.addEventListener("change", (e) => {
      globalFilters.status = e.target.value;
      loadTeamsWithRosters();
    });
}

// =========================================================
// GLOBAL FILTER LOGIC
// =========================================================
function applyGlobalFilters(team) {
  const teamName = team.name.toLowerCase();
  const orgName = (team.organizationName || "External Team").toLowerCase();

  const matchesSearch =
    !globalFilters.search ||
    teamName.includes(globalFilters.search) ||
    orgName.includes(globalFilters.search);

  const matchesTeam =
    !globalFilters.teamId || team.teamId === globalFilters.teamId;

  const matchesOrg =
    !globalFilters.organization ||
    (team.organizationName || "External Team") === globalFilters.organization;

  const matchesStatus =
    !globalFilters.status ||
    (team.isActive ? "Active" : "Inactive") === globalFilters.status;

  return matchesSearch && matchesTeam && matchesOrg && matchesStatus;
}

// =========================================================
// LOAD TEAMS + ROSTERS
// =========================================================
async function loadTeamsWithRosters() {
  const tbody = document.getElementById("teamsRosterBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  for (const team of allTeams) {
    if (!applyGlobalFilters(team)) continue;

    let roster = [];
    try {
      const res = await fetch(`${window.apiBase}/teams/${team.teamId}/roster`);
      if (res.ok) roster = await res.json();
    } catch (err) {
      console.error("Roster load failed:", err);
    }

    rosterCache[team.teamId] = roster;

    // TEAM ROW
    const teamRow = document.createElement("tr");
    teamRow.classList.add("team-row");
    teamRow.dataset.teamId = team.teamId;

    teamRow.innerHTML = `
      <td class="team-toggle">${team.name}</td>
      <td>${team.organizationName || "External Team"}</td>
      <td>${roster.length}</td>
      <td>${team.isActive ? "Active" : "Inactive"}</td>
      <td class="actions-col">
        <button class="action-btn roster-btn" data-team-id="${team.teamId}">View Players</button>
        <button class="action-btn add-btn" data-team-id="${team.teamId}">Add Player</button>
      </td>
    `;

    tbody.appendChild(teamRow);

    // DETAIL ROW
    const detailRow = document.createElement("tr");
    detailRow.classList.add("team-details", "hidden");
    detailRow.dataset.teamId = team.teamId;

    detailRow.innerHTML = `
      <td colspan="5">
        <div class="roster-container" id="roster-${team.teamId}"></div>
      </td>
    `;

    tbody.appendChild(detailRow);

    teamRow
      .querySelector(".team-toggle")
      .addEventListener("click", () => toggleRoster(team.teamId));
  }
}

// =========================================================
// EXPAND / COLLAPSE ROSTER
// =========================================================
function viewRoster(teamId) {
  toggleRoster(teamId);
}

async function toggleRoster(teamId, refresh = false) {
  const detailRow = document.querySelector(
    `tr.team-details[data-team-id="${teamId}"]`,
  );
  const container = document.getElementById(`roster-${teamId}`);

  if (!detailRow || !container) return;

  if (!refresh) {
    const isHidden = detailRow.classList.contains("hidden");
    if (!isHidden) {
      detailRow.classList.add("hidden");
      return;
    }
  }

  detailRow.classList.remove("hidden");

  let roster = rosterCache[teamId] || [];
  roster = applySearchAndFilters(roster);
  roster = applySort(roster);

  container.innerHTML = buildRosterTable(roster, teamId);

  attachSortHandlers(teamId);
}

// =========================================================
// BUILD ROSTER TABLE
// =========================================================
function buildRosterTable(roster, teamId) {
  return `
    <div class="roster-controls">
      <input id="searchInput-${teamId}" class="search-bar" placeholder="Search players...">
      <select id="filterPosition-${teamId}">
        <option value="">All Positions</option>
        <option value="F">Forward</option>
        <option value="D">Defense</option>
        <option value="G">Goalie</option>
      </select>
      <select id="filterShoots-${teamId}">
        <option value="">Shoots</option>
        <option value="L">Left</option>
        <option value="R">Right</option>
      </select>
      <select id="filterStatus-${teamId}">
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
          <th class="actions-col">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${roster
          .map(
            (r) => `
          <tr>
            <td>${r.fullName}</td>
            <td>${r.position ?? "-"}</td>
            <td>${r.shoots ?? "-"}</td>
            <td>${r.jerseyNumber ?? "-"}</td>
            <td>${r.status ?? (r.isActive ? "Active" : "Inactive")}</td>
            <td class="actions-col">
              <button class="action-btn edit-btn" data-entry-id="${r.rosterEntryId}" data-team-id="${teamId}">Edit</button>
              <button class="action-btn delete-btn" data-entry-id="${r.rosterEntryId}" data-team-id="${teamId}">Delete</button>
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

// =========================================================
// SORT + FILTER HANDLERS
// =========================================================
function attachSortHandlers(teamId) {
  document.querySelectorAll(`#roster-${teamId} .sortable`).forEach((header) => {
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

  const searchEl = document.getElementById(`searchInput-${teamId}`);
  const posEl = document.getElementById(`filterPosition-${teamId}`);
  const shootsEl = document.getElementById(`filterShoots-${teamId}`);
  const statusEl = document.getElementById(`filterStatus-${teamId}`);

  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase();
      toggleRoster(teamId, true);
    });
  }

  if (posEl) {
    posEl.addEventListener("change", (e) => {
      activeFilters.position = e.target.value;
      toggleRoster(teamId, true);
    });
  }

  if (shootsEl) {
    shootsEl.addEventListener("change", (e) => {
      activeFilters.shoots = e.target.value;
      toggleRoster(teamId, true);
    });
  }

  if (statusEl) {
    statusEl.addEventListener("change", (e) => {
      activeFilters.status = e.target.value;
      toggleRoster(teamId, true);
    });
  }
}

// =========================================================
// SORT + FILTER LOGIC
// =========================================================
function applySort(roster) {
  if (!currentSort.field) return roster;

  return roster.slice().sort((a, b) => {
    const A = (a[currentSort.field] ?? "").toString().toLowerCase();
    const B = (b[currentSort.field] ?? "").toString().toLowerCase();
    return currentSort.direction === "asc"
      ? A.localeCompare(B)
      : B.localeCompare(A);
  });
}

function applySearchAndFilters(roster) {
  return roster.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      (r.fullName ?? "").toLowerCase().includes(searchQuery) ||
      (r.position ?? "").toLowerCase().includes(searchQuery) ||
      (r.shoots ?? "").toLowerCase().includes(searchQuery);

    const matchesPosition =
      !activeFilters.position ||
      (r.position ?? "").toUpperCase() === activeFilters.position;

    const matchesShoots =
      !activeFilters.shoots || r.shoots === activeFilters.shoots;

    const matchesStatus =
      !activeFilters.status || r.status === activeFilters.status;

    return matchesSearch && matchesPosition && matchesShoots && matchesStatus;
  });
}

// =========================================================
// EDIT ROSTER ENTRY
// =========================================================
async function openEditRoster(rosterEntryId, teamId) {
  try {
    const res = await fetch(`${window.apiBase}/roster/${rosterEntryId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const entry = await res.json();

    const select = document.getElementById("rosterPlayerId");
    select.innerHTML = "";
    allPlayers.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.playerId;
      opt.textContent = p.fullName;
      select.appendChild(opt);
    });

    document.getElementById("rosterPlayerId").value = entry.playerId;
    document.getElementById("rosterJersey").value = entry.jerseyNumber ?? "";
    document.getElementById("rosterPosition").value = entry.position ?? "";
    document.getElementById("rosterStatus").value = entry.status ?? "Active";

    window.currentRosterEdit = { rosterEntryId, teamId };

    document.getElementById("rosterModalTitle").textContent =
      "Edit Roster Entry";
    document.getElementById("rosterModal").classList.add("show");
  } catch (err) {
    console.error("Failed to load roster entry:", err);
    alert("Unable to load roster entry.");
  }
}

// =========================================================
// SAVE ROSTER ENTRY
// =========================================================
async function saveRosterEntry() {
  const playerId = document.getElementById("rosterPlayerId").value;
  const jerseyNumber = document.getElementById("rosterJersey").value;
  const position = document.getElementById("rosterPosition").value;
  const status = document.getElementById("rosterStatus").value;

  let url, method, teamId;

  if (window.currentRosterEdit) {
    url = `${window.apiBase}/roster/${window.currentRosterEdit.rosterEntryId}`;
    method = "PUT";
    teamId = window.currentRosterEdit.teamId;
  } else {
    teamId = window.currentTeamForAdd;
    url = `${window.apiBase}/roster`;
    method = "POST";
  }

  const body = {
    teamId,
    playerId,
    jerseyNumber,
    position,
    status,
  };

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    alert("Failed to save roster entry.");
    return;
  }

  document.getElementById("rosterModal").classList.remove("show");
  await refreshRoster(teamId);
}

// =========================================================
// DELETE ROSTER ENTRY
// =========================================================
function openDeleteRoster(rosterEntryId, teamId) {
  window.currentRosterDelete = { rosterEntryId, teamId };
  document.getElementById("deleteRosterModal").classList.add("show");
}

async function confirmDeleteRoster() {
  const { rosterEntryId, teamId } = window.currentRosterDelete;

  const res = await fetch(`${window.apiBase}/roster/${rosterEntryId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    alert("Failed to delete roster entry.");
    return;
  }

  document.getElementById("deleteRosterModal").classList.remove("show");
  await refreshRoster(teamId);
}

// =========================================================
// REFRESH ROSTER
// =========================================================
async function refreshRoster(teamId) {
  let roster = [];
  try {
    const res = await fetch(`${window.apiBase}/teams/${teamId}/roster`);
    if (res.ok) roster = await res.json();
  } catch (err) {
    console.error("Error refreshing roster:", err);
  }

  rosterCache[teamId] = roster;
  toggleRoster(teamId, true);
}

// =========================================================
// TEAM ACTIONS
// =========================================================
function editTeam(teamId) {
  window.location.href = `/admin-portal/screens/edit-team.html?id=${teamId}`;
}

async function deleteTeam(teamId) {
  if (!confirm("Are you sure you want to delete this team?")) return;

  try {
    const res = await fetch(`${window.apiBase}/teams/${teamId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    loadTeamsWithRosters();
  } catch (err) {
    console.error("Error deleting team:", err);
    alert("Failed to delete team.");
  }
}

// =========================================================
// Add Player Action
// =========================================================
function openAddRoster(teamId) {
  window.currentRosterEdit = null;
  window.currentTeamForAdd = teamId;

  const select = document.getElementById("rosterPlayerId");
  select.innerHTML = "";
  allPlayers.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.playerId;
    opt.textContent = p.fullName;
    select.appendChild(opt);
  });

  document.getElementById("rosterJersey").value = "";
  document.getElementById("rosterPosition").value = "";
  document.getElementById("rosterStatus").value = "Active";

  document.getElementById("rosterModalTitle").textContent =
    "Add Player to Roster";
  document.getElementById("rosterModal").classList.add("show");
}

// expose for any callers that need them
window.openAddRoster = openAddRoster;
window.viewRoster = viewRoster;
