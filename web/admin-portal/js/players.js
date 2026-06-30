// =========================================================
// PLAYERS PAGE — MODERN ADMINPAGE VERSION (DUAL ROSTER READY)
// =========================================================

// =========================================================
// LOAD DROPDOWNS
// =========================================================
async function loadPlayerDropdowns() {
  await Promise.all([loadPlayerOrganizations(), loadPlayerTeamsForFilter()]);
}

async function loadPlayerOrganizations() {
  const res = await fetch(`${window.apiBase}/organizations`);
  const orgs = await res.json();

  // Modal org dropdown
  const select = document.getElementById("player-org");
  if (select) {
    select.innerHTML = `<option value="">Select Organization</option>`;
    orgs.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.organizationId;
      opt.textContent = o.name;
      select.appendChild(opt);
    });
  }

  // Filter org dropdown
  const filter = document.getElementById("filter-player-org");
  if (filter) {
    filter.innerHTML = `<option value="">Organization: All</option>`;
    orgs.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.organizationId;
      opt.textContent = o.name;
      filter.appendChild(opt);
    });
  }
}

// =========================================================
// LOAD TEAMS FOR PLAYER MODAL (TOGGLES)
// =========================================================
async function loadTeamsForPlayer(orgId, selectedTeamIds = []) {
  const container = document.getElementById("player-teams-container");
  if (!container) return;

  container.innerHTML = "";

  if (!orgId) return;

  try {
    const res = await fetch(`${window.apiBase}/teams/by-organization/${orgId}`);
    const teams = await res.json();

    teams.forEach((t) => {
      const row = document.createElement("div");
      row.className = "team-toggle-row";

      row.innerHTML = `
        <label class="switch">
          <input type="checkbox" class="player-team-toggle" value="${t.id}"
            ${selectedTeamIds.includes(t.id) ? "checked" : ""}>
          <span class="slider"></span>
        </label>
        <span class="label-text">${t.name} - ${t.levelName}</span>
      `;

      container.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load teams:", err);
  }
}

// =========================================================
// LOAD TEAMS FOR FILTER DROPDOWN (ALL TEAMS)
// =========================================================
async function loadPlayerTeamsForFilter() {
  const filter = document.getElementById("filter-player-team");
  if (!filter) return;

  filter.innerHTML = `<option value="">Team: All</option>`;

  try {
    const res = await fetch(`${window.apiBase}/teams`);
    const teams = await res.json();

    teams.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.teamId;
      opt.textContent = t.name;
      filter.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load teams for filter:", err);
  }
}

// =========================================================
// RELOAD TEAM FILTER WHEN ORG FILTER CHANGES
// =========================================================
async function reloadTeamFilterByOrg(orgId) {
  const filter = document.getElementById("filter-player-team");
  if (!filter) return;

  filter.innerHTML = `<option value="">Team: All</option>`;

  if (!orgId) {
    return loadPlayerTeamsForFilter();
  }

  const res = await fetch(`${window.apiBase}/teams/by-organization/${orgId}`);
  const teams = await res.json();

  teams.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    filter.appendChild(opt);
  });
}

// =========================================================
// MAIN PAGE INITIALIZER
// =========================================================
function initPlayersPage() {
  if (!document.getElementById("players-table-body")) return;

  AdminPage.init({
    tableBodyId: "players-table-body",
    searchInputId: "players-search-bar",

    modalId: "playerModalOverlay",
    modalTitleId: "playerModalTitle",
    addButtonId: "btnAddPlayer",
    saveButtonId: "playerSave",
    cancelButtonId: "playerCancel",

    deleteModalId: "playerDeleteModalOverlay",
    deleteConfirmId: "playerDeleteConfirm",
    deleteCancelId: "playerDeleteCancel",

    addTitle: "Add Player",
    editTitle: "Edit Player",

    api: PlayerApi,

    loadDropdowns: async () => {
      await loadPlayerDropdowns();
      wirePlayerFilterEvents();

      const orgSelect = document.getElementById("player-org");
      if (orgSelect) {
        orgSelect.addEventListener("change", (e) => {
          loadTeamsForPlayer(e.target.value);
        });
      }
    },

    // =========================================================
    // RENDER TABLE (supports multiple teams)
    // =========================================================
    renderTable: (players) => {
      const body = document.getElementById("players-table-body");
      body.innerHTML = "";

      players.forEach((p) => {
        const row = document.createElement("tr");

        row.dataset.orgId = p.organizationId || "";
        row.dataset.grade = p.grade || "";
        row.dataset.status = (p.status || "").toLowerCase();

        const teamNames = p.teams?.length
          ? p.teams.map((t) => `${t.teamName} - ${t.levelName}`).join("<br>")
          : "None";

        const teamIds = p.teams?.map((t) => t.teamId).join(",") || "";
        row.dataset.teamIds = teamIds;

        row.innerHTML = `
          <td>${p.firstName} ${p.lastName}</td>
          <td>${p.organizationName || "External Team"}</td>
          <td>${teamNames}</td>
          <td>${p.grade || ""}</td>
          <td>${p.status || ""}</td>
          <td class="actions-col">
            <button class="nf-btn-icon edit"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="nf-btn-icon delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;

        row.querySelector(".edit").onclick = () => openEditPlayer(p.id);
        row.querySelector(".delete").onclick = () => openDeletePlayer(p.id);

        body.appendChild(row);
      });

      applyPlayerFilters();
    },

    // =========================================================
    // CLEAR FORM
    // =========================================================
    clearForm: () => {
      [
        "player-first-name",
        "player-last-name",
        "player-birthdate",
        "player-grade",
        "player-height",
        "player-weight",
        "player-shoots",
        "player-position",
        "player-jersey",
        "player-org",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      document.getElementById("player-active").checked = true;

      const container = document.getElementById("player-teams-container");
      if (container) container.innerHTML = "";
    },

    // =========================================================
    // POPULATE FORM (multi-team)
    // =========================================================
    populateForm: async (p) => {
      document.getElementById("player-org").value = p.organizationId || "";

      const selectedTeamIds = p.teams?.map((t) => t.teamId) || [];
      await loadTeamsForPlayer(p.organizationId, selectedTeamIds);

      document.getElementById("player-first-name").value = p.firstName || "";
      document.getElementById("player-last-name").value = p.lastName || "";
      document.getElementById("player-birthdate").value = p.birthDate || "";
      document.getElementById("player-grade").value = p.grade || "";
      document.getElementById("player-height").value = p.heightInches || "";
      document.getElementById("player-weight").value = p.weightLbs || "";
      document.getElementById("player-shoots").value = p.shoots || "";
      document.getElementById("player-position").value = p.position || "";
      document.getElementById("player-jersey").value = p.jerseyNumber || "";
      document.getElementById("player-active").checked = p.isActive;
    },

    // =========================================================
    // COLLECT FORM DATA (multi-team)
    // =========================================================
    collectFormData: () => {
      const selectedTeams = [
        ...document.querySelectorAll(".player-team-toggle:checked"),
      ].map((t) => t.value);

      return {
        firstName: document.getElementById("player-first-name").value,
        lastName: document.getElementById("player-last-name").value,

        birthDate: document.getElementById("player-birthdate").value
          ? new Date(
              document.getElementById("player-birthdate").value,
            ).toISOString()
          : null,

        grade: document.getElementById("player-grade").value
          ? parseInt(document.getElementById("player-grade").value)
          : null,

        heightInches: document.getElementById("player-height").value
          ? parseInt(document.getElementById("player-height").value)
          : null,

        weightLbs: document.getElementById("player-weight").value
          ? parseInt(document.getElementById("player-weight").value)
          : null,

        shoots: document.getElementById("player-shoots").value,
        position: document.getElementById("player-position").value,

        jerseyNumber: document.getElementById("player-jersey").value
          ? parseInt(document.getElementById("player-jersey").value)
          : null,

        teamIds: selectedTeams,
        organizationId: document.getElementById("player-org").value || null,

        isActive: document.getElementById("player-active").checked,
      };
    },
  });
}

// =========================================================
// ADD / EDIT / DELETE
// =========================================================
function openAddPlayer() {
  AdminPage.openAdd();
}

async function openEditPlayer(id) {
  AdminPage.openEdit(id);
}

function openDeletePlayer(id) {
  AdminPage.openDelete(id);
}

// =========================================================
// FILTERS (multi-team aware)
// =========================================================
function applyPlayerFilters() {
  const tbody = document.getElementById("players-table-body");
  if (!tbody) return;

  const search = document
    .getElementById("players-search-bar")
    .value.toLowerCase();
  const org = document.getElementById("filter-player-org").value;
  const team = document.getElementById("filter-player-team").value;
  const grade = document.getElementById("filter-player-grade").value;
  const status = document
    .getElementById("filter-player-status")
    .value.toLowerCase();

  Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
    const teamIds = row.dataset.teamIds?.split(",") || [];
    const levelIds = row.dataset.levelIds?.split(",") || [];

    const matchesSearch =
      !search || row.textContent.toLowerCase().includes(search);

    const matchesOrg = !org || row.dataset.orgId === org;

    const matchesTeam = !team || teamIds.includes(team);

    const matchesGrade = !grade || row.dataset.grade === grade;

    const matchesStatus = !status || row.dataset.status === status;

    row.style.display =
      matchesSearch &&
      matchesOrg &&
      matchesTeam &&
      matchesGrade &&
      matchesStatus
        ? ""
        : "none";
  });
}

function wirePlayerFilterEvents() {
  [
    "players-search-bar",
    "filter-player-org",
    "filter-player-team",
    "filter-player-grade",
    "filter-player-status",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", applyPlayerFilters);
    el.addEventListener("change", applyPlayerFilters);

    if (id === "filter-player-org") {
      el.addEventListener("change", async (e) => {
        await reloadTeamFilterByOrg(e.target.value);
        applyPlayerFilters();
      });
    }
  });
}

// =========================================================
// INIT
// =========================================================
document.addEventListener("layoutLoaded", initPlayersPage);
