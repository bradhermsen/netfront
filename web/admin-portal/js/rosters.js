console.log("ROSTERS.JS LOADED");

// =========================================================
// DATA CACHES
// =========================================================
let allTeams = [];
let allPlayers = [];
let rosterCache = {}; // teamId → roster array

let rmSort = { field: null, direction: "asc" };
let rmSearch = "";
let rmFilters = { position: "", shoots: "", status: "" };

let globalFilters = {
  search: "",
  teamId: "",
  organization: "",
  status: "",
};

// =========================================================
// PAGE INITIALIZATION
// =========================================================
async function initRostersPage() {
  if (!document.getElementById("teamsRosterBody")) return;

  console.log("ROSTERS: Initializing page…");

  // Load teams BEFORE anything else
  await loadTeamsList();
  await loadPlayersList();

  // Populate filter dropdowns
  populateRosterFilterDropdowns();

  attachGlobalFilterEvents();

  AdminPage.init({
    tableBodyId: "teamsRosterBody",
    searchInputId: "rosters-search-bar",

    modalId: "rosterModalOverlay",
    modalTitleId: "rosterModalTitle",
    addButtonId: null,
    saveButtonId: "rosterSave",
    cancelButtonId: "rosterCancel",

    deleteModalId: "rosterDeleteModalOverlay",
    deleteConfirmId: "rosterDeleteConfirm",
    deleteCancelId: "rosterDeleteCancel",

    editHandlerName: null,
    deleteHandlerName: "openDeleteRoster",

    addTitle: "Add Player to Roster",
    editTitle: "Edit Roster Entry",

    api: RosterApi,

    loadDropdowns: async () => {
      await loadPlayersList();
    },

    renderTable: (teams) => {
      // Delegate to our own renderer so we can reuse it with filters
      renderTeamsTable(teams);
    },

    clearForm: () => {
      document.getElementById("roster-org").value = "";
      document.getElementById("roster-team").value = "";
      document.getElementById("rosterPlayerId").value = "";
      document.getElementById("rosterStatus").value = "Active";
    },

    populateForm: async (entry) => {
      await loadRosterOrganizations();
      document.getElementById("roster-org").value = entry.organizationId;

      await loadRosterTeams(entry.organizationId);
      document.getElementById("roster-team").value = entry.teamId;

      // Load players for this TEAM (not org)
      await loadRosterPlayersByTeam(entry.teamId);
      document.getElementById("rosterPlayerId").value = entry.playerId;

      document.getElementById("rosterStatus").value = entry.status ?? "Active";
    },

    collectFormData: () => ({
      organizationId: document.getElementById("roster-org").value,
      teamId: document.getElementById("roster-team").value,
      playerId: document.getElementById("rosterPlayerId").value,
      status: document.getElementById("rosterStatus").value,
    }),
  });

  // Wire close buttons for Add/Edit modal
  document
    .querySelectorAll("#rosterModalOverlay .rm-close")
    .forEach((btn) => (btn.onclick = closeRosterModal));
  document.getElementById("rosterCancel").onclick = closeRosterModal;

  // Wire close buttons for Delete modal
  document
    .querySelectorAll("#rosterDeleteModalOverlay .rm-close")
    .forEach((btn) => (btn.onclick = closeDeleteRoster));
  document.getElementById("rosterDeleteCancel").onclick = closeDeleteRoster;

  // Wire Add Player button inside manager modal
  document.getElementById("rm-add-player").onclick = () =>
    openAddRoster(window.currentRosterTeamId);

  // Initial render of main table
  renderTeamsTable(allTeams);

  console.log("ROSTERS: Page initialized.");
}

document.addEventListener("layoutLoaded", initRostersPage);
if (window.__layoutAlreadyLoaded) initRostersPage();

// =========================================================
// POPULATE TEAM + ORGANIZATION FILTER DROPDOWNS
// =========================================================
function populateRosterFilterDropdowns() {
  const teamSelect = document.getElementById("filter-team");
  const orgSelect = document.getElementById("filter-organization");

  if (!teamSelect || !orgSelect) return;

  // Clear existing
  teamSelect.innerHTML = `<option value="">Team: All</option>`;
  orgSelect.innerHTML = `<option value="">Organization: All</option>`;

  // --- ORGANIZATIONS ---
  const orgMap = new Map();
  allTeams.forEach((t) => {
    if (t.organizationId && t.organizationName) {
      orgMap.set(t.organizationId, t.organizationName);
    }
  });

  // Sort alphabetically
  const sortedOrgs = [...orgMap.entries()].sort((a, b) =>
    a[1].localeCompare(b[1]),
  );

  sortedOrgs.forEach(([orgId, orgName]) => {
    const opt = document.createElement("option");
    opt.value = orgId;
    opt.textContent = orgName;
    orgSelect.appendChild(opt);
  });

  // --- TEAMS ---
  const sortedTeams = [...allTeams].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  sortedTeams.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.teamId;
    opt.textContent = t.name;
    teamSelect.appendChild(opt);
  });
}

// =========================================================
// LOAD PLAYERS (GLOBAL LIST)
// =========================================================
async function loadPlayersList() {
  const res = await fetch(`${window.apiBase}/players/dto`);
  allPlayers = await res.json();
  return allPlayers;
}

// =========================================================
// LOAD TEAMS (GLOBAL LIST)
// =========================================================
async function loadTeamsList() {
  try {
    const res = await fetch(`${window.apiBase}/teams`);
    if (!res.ok) throw new Error(`Teams API returned ${res.status}`);
    allTeams = await res.json();

    console.log("Loaded teams:", allTeams);
    return allTeams;
  } catch (err) {
    console.error("Failed to load teams:", err);
    allTeams = [];
    return [];
  }
}

// =========================================================
// LOAD TEAMS FOR ORGANIZATION (ROSTER MODAL)
// =========================================================
async function loadRosterTeams(orgId) {
  const teamSelect = document.getElementById("roster-team");
  if (!teamSelect) return;

  teamSelect.innerHTML = `<option value="">Select Team</option>`;

  if (!orgId) return;

  try {
    const res = await fetch(`${window.apiBase}/teams/by-organization/${orgId}`);
    if (!res.ok) throw new Error("Team endpoint missing or returned error");

    const teams = await res.json();
    console.log("DEBUG TEAMS FROM API:", teams);

    teams.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id; // matches API shape
      opt.textContent = t.name;
      teamSelect.appendChild(opt);
    });
  } catch (err) {
    console.warn("loadRosterTeams failed:", err);
  }
}

// =========================================================
// MAIN TEAM ROSTER TABLE RENDERER
// =========================================================
function renderTeamsTable(teams) {
  const body = document.getElementById("teamsRosterBody");
  if (!body) return;

  body.innerHTML = "";

  teams.forEach((team) => {
    const rosterCount = team.rosterCount ?? 0;

    const row = document.createElement("tr");
    row.dataset.teamId = team.teamId;

    row.innerHTML = `
      <td>${team.name}</td>
      <td>${team.organizationName || "External Team"}</td>
      <td>${rosterCount}</td>
      <td>${team.isActive ? "Active" : "Inactive"}</td>
      <td class="actions-col">
        <button class="nf-btn-icon" title="Manage Roster"
          onclick="openRosterManager('${team.teamId}')">
          <i class="fa-solid fa-users"></i>
        </button>
      </td>
    `;

    body.appendChild(row);
  });
}

// =========================================================
// ROSTER ENTRY DROPDOWNS
// =========================================================
async function loadRosterOrganizations() {
  const res = await fetch(`${window.apiBase}/organizations`);
  const orgs = await res.json();

  const select = document.getElementById("roster-org");
  if (!select) return;

  select.innerHTML = `<option value="">Select Organization</option>`;

  orgs.forEach((o) => {
    const opt = document.createElement("option");
    opt.value = o.organizationId;
    opt.textContent = o.name;
    select.appendChild(opt);
  });
}

// =========================================================
// LOAD PLAYERS BY TEAM (ROSTER MODAL)
// =========================================================
async function loadRosterPlayersByTeam(teamId) {
  const playerSelect = document.getElementById("rosterPlayerId");
  if (!playerSelect) return;

  playerSelect.innerHTML = `<option value="">Select Player</option>`;

  if (!teamId) return;

  try {
    const res = await fetch(`${window.apiBase}/teams/${teamId}/roster`);
    if (!res.ok)
      throw new Error("Team roster endpoint missing or returned error");

    const roster = await res.json();

    roster.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.playerId;
      opt.textContent = `${r.firstName} ${r.lastName}`;
      playerSelect.appendChild(opt);
    });
  } catch (err) {
    console.warn("loadRosterPlayersByTeam failed:", err);
  }
}

// =========================================================
// GLOBAL FILTER EVENTS (MAIN TABLE)
// =========================================================
function attachGlobalFilterEvents() {
  // SEARCH BAR
  const searchEl = document.getElementById("rosters-search-bar");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      globalFilters.search = e.target.value.toLowerCase();
      applyMainRosterFilters();
    });
  }

  // TEAM FILTER
  const teamFilter = document.getElementById("filter-team");
  if (teamFilter) {
    teamFilter.onchange = (e) => {
      globalFilters.teamId = e.target.value;
      applyMainRosterFilters();
    };
  }

  // ORGANIZATION FILTER
  const orgFilter = document.getElementById("filter-organization");
  if (orgFilter) {
    orgFilter.onchange = (e) => {
      globalFilters.organization = e.target.value;
      applyMainRosterFilters();
    };
  }

  // STATUS FILTER
  const statusFilter = document.getElementById("filter-status");
  if (statusFilter) {
    statusFilter.onchange = (e) => {
      globalFilters.status = e.target.value;
      applyMainRosterFilters();
    };
  }
}

// =========================================================
// APPLY FILTERS TO MAIN TEAM ROSTER TABLE
// =========================================================
function applyMainRosterFilters() {
  let filtered = [...allTeams];

  // SEARCH
  if (globalFilters.search) {
    const s = globalFilters.search;
    filtered = filtered.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const org = (t.organizationName || "").toLowerCase();
      return name.includes(s) || org.includes(s);
    });
  }

  // TEAM
  if (globalFilters.teamId) {
    filtered = filtered.filter((t) => t.teamId === globalFilters.teamId);
  }

  // ORGANIZATION
  if (globalFilters.organization) {
    filtered = filtered.filter(
      (t) => t.organizationId === globalFilters.organization,
    );
  }

  // STATUS
  if (globalFilters.status) {
    const wantActive = globalFilters.status === "Active";
    filtered = filtered.filter((t) => t.isActive === wantActive);
  }

  renderTeamsTable(filtered);
}

// =========================================================
// ROSTER MANAGER — OPEN MODAL
// =========================================================
async function openRosterManager(teamId) {
  window.currentRosterTeamId = teamId;

  const overlay = document.getElementById("rosterManagerOverlay");
  const modal = document.getElementById("rosterManagerModal");

  overlay.classList.add("active");
  modal.classList.add("active");

  document.getElementById("rm-add-player").onclick = () =>
    openAddRoster(teamId);

  document
    .querySelectorAll("#rosterManagerOverlay .rm-close")
    .forEach((btn) => (btn.onclick = closeRosterManager));

  const team = allTeams.find((t) => t.teamId === teamId);
  console.log("DEBUG TEAM OBJECT:", team);

  // Update modal title
  document.getElementById("rosterManagerTitle").textContent =
    `Manage Roster — ${team?.name || ""}`;

  // Wait for the DOM to contain the span
  requestAnimationFrame(() => {
    const span = document.getElementById("rm-current-team");
    if (span) {
      span.textContent = `${team?.organizationName || ""} ${team?.name || ""}`;
    }
  });

  const cached = rosterCache[teamId] || [];
  renderRosterManagerTable(cached);

  fetchRosterFresh(teamId);
}

// =========================================================
// FETCH ROSTER (SILENT REFRESH)
// =========================================================
async function fetchRosterFresh(teamId) {
  try {
    const res = await fetch(`${window.apiBase}/teams/${teamId}/roster`);
    if (!res.ok) return;

    const fresh = await res.json();
    rosterCache[teamId] = fresh;

    renderRosterManagerTable(fresh);
  } catch (err) {
    console.error("Roster refresh failed:", err);
  }
}

// =========================================================
// ROSTER MANAGER — RENDER TABLE
// =========================================================
function renderRosterManagerTable(list) {
  const body = document.getElementById("rm-roster-body");
  if (!Array.isArray(list)) list = [];

  let filtered = list
    .filter((r) => {
      const p = allPlayers.find((x) => x.id === r.playerId);
      if (!p) return false;

      const s = rmSearch.toLowerCase();
      const fullName = p.fullName || `${p.firstName} ${p.lastName}`;

      return (
        fullName.toLowerCase().includes(s) ||
        (r.position ?? "").toLowerCase().includes(s)
      );
    })
    .filter((r) => !rmFilters.position || r.position === rmFilters.position)
    .filter((r) => !rmFilters.shoots || r.shoots === rmFilters.shoots)
    .filter((r) => {
      if (!rmFilters.status) return true;
      const status = r.isActive ? "Active" : "Inactive";
      return status === rmFilters.status;
    });

  if (rmSort.field) {
    filtered = filtered.slice().sort((a, b) => {
      const A = (a[rmSort.field] ?? "").toString().toLowerCase();
      const B = (b[rmSort.field] ?? "").toString().toLowerCase();
      return rmSort.direction === "asc"
        ? A.localeCompare(B)
        : B.localeCompare(A);
    });
  }

  body.innerHTML = filtered
    .map((r) => {
      const fullName = r.fullName || `${r.firstName} ${r.lastName}`;
      const position = r.position || "-";
      const shoots = r.shoots || "-";
      const jersey = r.jerseyNumber ?? "-";
      const grade = r.grade ?? "-";
      const status = r.isActive ? "Active" : "Inactive";

      return `
      <tr data-roster-entry-id="${r.rosterEntryId}">
        <td>${fullName}</td>
        <td>${position}</td>
        <td>${shoots}</td>
        <td>${jersey}</td>
        <td>${grade}</td>
        <td>${status}</td>
        <td class="actions-col">
          <button class="nf-btn-icon edit" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="nf-btn-icon delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
    })
    .join("");

  attachRosterManagerEvents();
}

// =========================================================
// ROSTER MANAGER — EVENT HANDLERS
// =========================================================
function attachRosterManagerEvents() {
  const searchEl = document.getElementById("rm-search");
  if (searchEl) {
    searchEl.oninput = (e) => {
      rmSearch = e.target.value;
      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  }

  const posFilter = document.getElementById("rm-filter-position");
  if (posFilter) {
    posFilter.onchange = (e) => {
      rmFilters.position = e.target.value;
      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  }

  const shootsFilter = document.getElementById("rm-filter-shoots");
  if (shootsFilter) {
    shootsFilter.onchange = (e) => {
      rmFilters.shoots = e.target.value;
      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  }

  const statusFilter = document.getElementById("rm-filter-status");
  if (statusFilter) {
    statusFilter.onchange = (e) => {
      rmFilters.status = e.target.value;
      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  }

  document.querySelectorAll("#rm-roster-table .sortable").forEach((th) => {
    th.onclick = () => {
      const field = th.dataset.field;
      rmSort.direction =
        rmSort.field === field && rmSort.direction === "asc" ? "desc" : "asc";
      rmSort.field = field;

      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  });

  document
    .querySelectorAll("#rosterManagerOverlay .rm-close")
    .forEach((btn) => {
      btn.onclick = closeRosterManager;
    });

  document.querySelectorAll("#rm-roster-body .edit").forEach((btn) => {
    btn.onclick = (e) => {
      const row = e.target.closest("tr");
      const entryId = row.dataset.rosterEntryId;
      roster_openEdit(entryId);
    };
  });

  document.querySelectorAll("#rm-roster-body .delete").forEach((btn) => {
    btn.onclick = (e) => {
      const row = e.target.closest("tr");
      const entryId = row.dataset.rosterEntryId;
      openDeleteRoster(entryId);
    };
  });

  // Org/Team → Team/Player cascade in the Add/Edit modal
  if (!attachRosterManagerEvents._cascadeWired) {
    document.addEventListener("change", (e) => {
      if (e.target.id === "roster-org") {
        loadRosterTeams(e.target.value);
        // Players will load when a team is selected
      }

      if (e.target.id === "roster-team") {
        loadRosterPlayersByTeam(e.target.value);
      }
    });
    attachRosterManagerEvents._cascadeWired = true;
  }
}

function closeRosterManager() {
  document.getElementById("rosterManagerOverlay").classList.remove("active");
  document.getElementById("rosterManagerModal").classList.remove("active");
}

function openDeleteRoster(entryId) {
  window.currentRosterEntryId = entryId;

  document.getElementById("rosterDeleteModalOverlay").classList.add("active");
  document.getElementById("rosterDeleteModal").classList.add("active");
}

function closeRosterModal() {
  document.getElementById("rosterModalOverlay").classList.remove("active");
  document.getElementById("rosterModal").classList.remove("active");
}

function closeDeleteRoster() {
  document
    .getElementById("rosterDeleteModalOverlay")
    .classList.remove("active");
  document.getElementById("rosterDeleteModal").classList.remove("active");
}

// =========================================================
// OPEN ADD ROSTER ENTRY
// =========================================================
async function openAddRoster() {
  window.currentRosterEntryId = null;

  await loadRosterOrganizations();

  const team = allTeams.find((t) => t.teamId === window.currentRosterTeamId);

  if (team) {
    // Preselect organization
    document.getElementById("roster-org").value = team.organizationId;

    // Load teams for this org
    await loadRosterTeams(team.organizationId);

    // Select correct team
    const teamSelect = document.getElementById("roster-team");

    const match = [...teamSelect.options].find(
      (o) => o.value && o.value.toLowerCase() === team.teamId.toLowerCase(),
    );

    if (match) {
      teamSelect.value = match.value;
    } else {
      console.warn(
        "No matching team found in dropdown for:",
        team.teamId,
        "Available options:",
        [...teamSelect.options].map((o) => o.value),
      );

      if (teamSelect.options.length > 1) {
        teamSelect.selectedIndex = 1;
      }
    }

    // Load players for this TEAM
    await loadRosterPlayersByTeam(team.teamId);
  }

  // Default status
  document.getElementById("rosterStatus").value = "Active";

  // Open modal
  document.getElementById("rosterModalOverlay").classList.add("active");
  document.getElementById("rosterModal").classList.add("active");
}

// =========================================================
// OPEN EDIT ROSTER ENTRY
// =========================================================
async function roster_openEdit(rosterEntryId) {
  const entry = await RosterApi.getById(rosterEntryId);
  console.log("DEBUG EDIT ENTRY:", entry);

  window.currentRosterEntryId = rosterEntryId;
  window.currentRosterTeamId = entry.teamId;

  // Find the full team object so we can get organizationId
  const team = allTeams.find((t) => t.teamId === entry.teamId);
  if (!team) {
    console.error(
      "EDIT ERROR: Could not find team in allTeams for",
      entry.teamId,
    );
    return;
  }

  // Load orgs
  await loadRosterOrganizations();
  document.getElementById("roster-org").value = team.organizationId;

  // Load teams for this org
  await loadRosterTeams(team.organizationId);

  // Select correct team
  const teamSelect = document.getElementById("roster-team");
  teamSelect.value = entry.teamId;

  // Load players for this TEAM
  await loadRosterPlayersByTeam(entry.teamId);

  // Select correct player
  document.getElementById("rosterPlayerId").value = entry.playerId;

  // Status
  document.getElementById("rosterStatus").value = entry.status ?? "Active";

  // Open modal
  document.getElementById("rosterModalOverlay").classList.add("active");
  document.getElementById("rosterModal").classList.add("active");
}

// =========================================================
// REFRESH ROSTER AFTER SAVE/DELETE
// =========================================================
async function refreshRoster(teamId) {
  await fetchRosterFresh(teamId);
}
