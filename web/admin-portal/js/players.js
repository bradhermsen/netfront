// =========================================================
// PLAYERS PAGE — MODERN ADMINPAGE VERSION (FIXED)
// =========================================================

// =========================================================
// LOAD DROPDOWNS
// =========================================================
async function loadPlayerDropdowns() {
  await Promise.all([
    loadPlayerOrganizations(),
    loadPlayerLevels(),
    loadPlayerTeamsForFilter(), // correct for filter
  ]);
}

async function loadPlayerOrganizations() {
  const res = await fetch(`${window.apiBase}/organizations`);
  const orgs = await res.json();

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

async function loadPlayerLevels() {
  const res = await fetch(`${window.apiBase}/levels`);
  const levels = await res.json();

  const select = document.getElementById("player-level");
  if (select) {
    select.innerHTML = `<option value="">Select Level</option>`;
    levels.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.levelId;
      opt.textContent = l.levelName;
      select.appendChild(opt);
    });
  }

  const filter = document.getElementById("filter-player-level");
  if (filter) {
    filter.innerHTML = `<option value="">Level: All</option>`;
    levels.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.levelId;
      opt.textContent = l.levelName;
      filter.appendChild(opt);
    });
  }
}

// =========================================================
// LOAD TEAMS FOR PLAYER MODAL (FILTERED BY ORG)
// =========================================================
async function loadTeamsForPlayer(orgId) {
  const teamSelect = document.getElementById("player-team");
  if (!teamSelect) return;

  teamSelect.innerHTML = `<option value="">Select Team</option>`;

  if (!orgId) return;

  try {
    const res = await fetch(`${window.apiBase}/teams/by-organization/${orgId}`);
    const teams = await res.json();

    teams.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id; // FIXED: Teams API uses id
      opt.textContent = `${t.name}`;
      teamSelect.appendChild(opt);
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
      opt.value = t.teamId; // CORRECT: /teams returns teamId
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
    opt.value = t.id; // FIXED
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

    renderTable: (players) => {
      const body = document.getElementById("players-table-body");
      body.innerHTML = "";

      players.forEach((p) => {
        const row = document.createElement("tr");

        row.dataset.orgId = p.organizationId || "";
        row.dataset.teamId = p.teamId || "";
        row.dataset.levelId = p.levelId || "";
        row.dataset.grade = p.grade || "";
        row.dataset.status = (p.status || "").toLowerCase();

        row.innerHTML = `
          <td>${p.firstName} ${p.lastName}</td>
          <td>${p.organizationName || "External Team"}</td>
          <td>${p.teamName || ""}</td>
          <td>${p.levelName || ""}</td>
          <td>${p.grade || ""}</td>
          <td>${p.status || ""}</td>
          <td class="actions-col">
            <button class="nf-btn-icon edit"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="nf-btn-icon delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;

        const [btnEdit, btnDelete] = row.querySelectorAll("button");

        btnEdit.addEventListener("click", () => openEditPlayer(p.id));
        btnDelete.addEventListener("click", () => openDeletePlayer(p.id));

        body.appendChild(row);
      });

      applyPlayerFilters();
    },

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
        "player-team",
        "player-org",
        "player-level",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      document.getElementById("player-active").checked = true;
    },

    populateForm: async (p) => {
      document.getElementById("player-org").value = p.organizationId || "";

      await loadTeamsForPlayer(p.organizationId);

      document.getElementById("player-first-name").value = p.firstName || "";
      document.getElementById("player-last-name").value = p.lastName || "";
      document.getElementById("player-birthdate").value = p.birthDate || "";
      document.getElementById("player-grade").value = p.grade || "";
      document.getElementById("player-height").value = p.heightInches || "";
      document.getElementById("player-weight").value = p.weightLbs || "";
      document.getElementById("player-shoots").value = p.shoots || "";
      document.getElementById("player-position").value = p.position || "";
      document.getElementById("player-jersey").value = p.jerseyNumber || "";
      document.getElementById("player-team").value = p.teamId || "";
      document.getElementById("player-level").value = p.levelId || "";
      document.getElementById("player-active").checked = p.isActive;
    },

    collectFormData: () => ({
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

      teamId: document.getElementById("player-team").value || null,
      organizationId: document.getElementById("player-org").value || null,
      levelId: document.getElementById("player-level").value || null,

      isActive: document.getElementById("player-active").checked,
    }),
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
// FILTERS
// =========================================================
function applyPlayerFilters() {
  const tbody = document.getElementById("players-table-body");
  if (!tbody) return;

  const search = document
    .getElementById("players-search-bar")
    .value.toLowerCase();
  const org = document.getElementById("filter-player-org").value;
  const team = document.getElementById("filter-player-team").value;
  const level = document.getElementById("filter-player-level").value;
  const grade = document.getElementById("filter-player-grade").value;
  const status = document.getElementById("filter-player-status").value;

  const statusLower = status ? status.toLowerCase() : "";

  Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
    const matchesSearch =
      !search || row.textContent.toLowerCase().includes(search);
    const matchesOrg = !org || row.dataset.orgId === org;
    const matchesTeam = !team || row.dataset.teamId === team;
    const matchesLevel = !level || row.dataset.levelId === level;
    const matchesGrade = !grade || row.dataset.grade === grade;
    const matchesStatus = !statusLower || row.dataset.status === statusLower;

    row.style.display =
      matchesSearch &&
      matchesOrg &&
      matchesTeam &&
      matchesLevel &&
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
    "filter-player-level",
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
