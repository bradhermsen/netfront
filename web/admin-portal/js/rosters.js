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
function initRostersPage() {
  if (!document.getElementById("teamsRosterBody")) return;

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

    // ⭐ Prevent AdminPage from overwriting your real handler
    editHandlerName: null,
    deleteHandlerName: "openDeleteRoster",
    addHandlerName: "openAddRoster",

    addTitle: "Add Player to Roster",
    editTitle: "Edit Roster Entry",

    api: RosterApi,

    loadDropdowns: async () => {
      await loadPlayersDropdown();
    },

    renderTable: (teams) => {
      const body = document.getElementById("teamsRosterBody");
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
            <button class="nf-btn-icon" title="Manage Roster" onclick="openRosterManager('${team.teamId}')">
              <i class="fa-solid fa-users"></i>
            </button>
          </td>
        `;

        body.appendChild(row);
      });
    },

    clearForm: () => {
      document.getElementById("rosterPlayerId").value = "";
      document.getElementById("rosterJersey").value = "";
      document.getElementById("rosterPosition").value = "";
      document.getElementById("rosterStatus").value = "Active";
      document.getElementById("rosterGrade").value = "";
    },

    populateForm: (entry) => {
      document.getElementById("rosterPlayerId").value = entry.playerId;
      document.getElementById("rosterJersey").value = entry.jerseyNumber ?? "";
      document.getElementById("rosterPosition").value = entry.position ?? "";
      document.getElementById("rosterStatus").value = entry.status ?? "Active";

      const player = allPlayers.find((p) => p.id === entry.playerId);
      document.getElementById("rosterGrade").value = player?.grade ?? "";
    },

    collectFormData: () => ({
      teamId: window.currentRosterTeamId,
      playerId: document.getElementById("rosterPlayerId").value,
      jerseyNumber: document.getElementById("rosterJersey").value,
      position: document.getElementById("rosterPosition").value,
      status: document.getElementById("rosterStatus").value,
    }),
  });

  // Wire Add Player button inside roster manager modal
  document.getElementById("rm-add-player").onclick = () =>
    openAddRoster(window.currentRosterTeamId);

  loadPlayersList();
  attachGlobalFilterEvents();
}

document.addEventListener("layoutLoaded", initRostersPage);
if (window.__layoutAlreadyLoaded) initRostersPage();

// =========================================================
// LOAD PLAYERS
// =========================================================
async function loadPlayersList() {
  console.log("loadPlayersList START, allPlayers:", allPlayers.length);

  const res = await fetch(`${window.apiBase}/players/dto`);
  const data = await res.json();

  allPlayers = data;

  console.log("loadPlayersList END, allPlayers:", allPlayers.length);

  return data; // ⭐ REQUIRED so await actually waits
}

async function loadPlayersDropdown() {
  const select = document.getElementById("rosterPlayerId");

  console.log("Dropdown element:", select);

  if (!select) {
    console.warn("⚠️ rosterPlayerId does NOT exist yet.");
    return;
  }

  select.innerHTML = "";

  allPlayers.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.fullName;
    select.appendChild(opt);
  });

  console.log("Dropdown options created:", select.options.length);
  console.log("First option:", select.options[0]?.textContent);

  select.onchange = () => {
    const p = allPlayers.find((x) => x.id === select.value);
    document.getElementById("rosterGrade").value = p?.grade ?? "";
  };
}

// =========================================================
// GLOBAL FILTER EVENTS
// =========================================================
function attachGlobalFilterEvents() {
  const searchEl = document.getElementById("rosters-search-bar");

  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      globalFilters.search = e.target.value.toLowerCase();
      AdminPage.applySearch();
    });
  }
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

  // ⭐ WIRE BUTTONS AFTER MODAL HTML EXISTS
  document.getElementById("rm-add-player").onclick = () =>
    openAddRoster(teamId);

  document
    .querySelectorAll("#rosterManagerOverlay .rm-close")
    .forEach((btn) => (btn.onclick = closeRosterManager));

  // Update title
  const team = allTeams.find((t) => t.teamId === teamId);
  document.getElementById("rosterManagerTitle").textContent =
    `Manage Roster — ${team?.name || ""}`;

  // Render cached roster immediately
  const cached = rosterCache[teamId] || [];
  renderRosterManagerTable(cached);

  // Fetch fresh roster
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
      return (
        p.fullName.toLowerCase().includes(s) ||
        (r.position ?? "").toLowerCase().includes(s)
      );
    })
    .filter((r) => !rmFilters.position || r.position === rmFilters.position)
    .filter((r) => !rmFilters.shoots || r.shoots === rmFilters.shoots)
    .filter((r) => !rmFilters.status || r.status === rmFilters.status);

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
      const p = allPlayers.find((x) => x.id === r.playerId);
      const grade = p?.grade ?? "-";

      return `
        <tr data-roster-entry-id="${r.rosterEntryId}">
          <td>${p?.fullName ?? "Unknown Player"}</td>
          <td>${r.position ?? "-"}</td>
          <td>${r.shoots ?? "-"}</td>
          <td>${r.jerseyNumber ?? "-"}</td>
          <td>${grade}</td>
          <td>${r.status ?? "Active"}</td>
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
  document.getElementById("rm-search").oninput = (e) => {
    rmSearch = e.target.value;
    renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
  };

  document.getElementById("rm-filter-position").onchange = (e) => {
    rmFilters.position = e.target.value;
    renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
  };

  document.getElementById("rm-filter-shoots").onchange = (e) => {
    rmFilters.shoots = e.target.value;
    renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
  };

  document.getElementById("rm-filter-status").onchange = (e) => {
    rmFilters.status = e.target.value;
    renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
  };

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

  // ⭐ Wire Edit buttons
  document.querySelectorAll("#rm-roster-body .edit").forEach((btn) => {
    btn.onclick = (e) => {
      const row = e.target.closest("tr");
      const entryId = row.dataset.rosterEntryId;
      roster_openEdit(entryId);
    };
  });

  // Wire Delete buttons
  document.querySelectorAll("#rm-roster-body .delete").forEach((btn) => {
    btn.onclick = (e) => {
      const row = e.target.closest("tr");
      const entryId = row.dataset.rosterEntryId;
      openDeleteRoster(entryId);
    };
  });
}

function closeRosterManager() {
  document.getElementById("rosterManagerOverlay").classList.remove("active");
  document.getElementById("rosterManagerModal").classList.remove("active");
}

// =========================================================
// CRUD HANDLERS
// =========================================================
function openAddRoster() {
  window.currentRosterEntryId = null;

  // ⭐ Populate dropdown BEFORE showing modal
  loadPlayersDropdown();

  document.getElementById("rosterPlayerId").value = "";
  document.getElementById("rosterJersey").value = "";
  document.getElementById("rosterPosition").value = "";
  document.getElementById("rosterStatus").value = "Active";
  document.getElementById("rosterGrade").value = "";

  document.getElementById("rosterModalOverlay").classList.add("active");
}

async function roster_openEdit(rosterEntryId) {
  // 1. Get the roster entry
  const entry = await RosterApi.getById(rosterEntryId);
  window.currentRosterTeamId = entry.teamId;

  // 2. Open the modal FIRST so the dropdown exists in the DOM
  AdminPage.openEdit(rosterEntryId);

  // 3. Load players and WAIT for them to finish
  await loadPlayersList();

  // 4. Populate the dropdown AFTER players are loaded
  await loadPlayersDropdown();
}

// =========================================================
// REFRESH ROSTER AFTER SAVE/DELETE
// =========================================================
async function refreshRoster(teamId) {
  await fetchRosterFresh(teamId);
}
