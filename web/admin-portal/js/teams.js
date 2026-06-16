// =========================================================
// TEAMS PAGE — MODERNIZED + MATCHED DESIGN
// =========================================================

// =========================================================
// LOAD ALL TEAM DROPDOWNS (NEW + COMPLETE)
// =========================================================
async function loadAllTeamDropdowns() {
  await Promise.all([
    loadTeamOrganizations(),
    loadTeamLevels(),
    loadTeamSeasons(),
  ]);
}

// ------------------------------
// ORGANIZATIONS DROPDOWN
// ------------------------------
async function loadTeamOrganizations() {
  try {
    const res = await fetch(`${window.apiBase}/organizations`);
    const orgs = await res.json();

    const select = document.getElementById("team-org");
    if (!select) return;

    select.innerHTML = `<option value="">Select Organization</option>`;
    orgs.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.organizationId;
      opt.textContent = o.name;
      select.appendChild(opt);
    });

    // Populate filter dropdown
    const filter = document.getElementById("filter-org");
    if (filter) {
      filter.innerHTML = `<option value="">Organization: All</option>`;
      orgs.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.organizationId;
        opt.textContent = o.name;
        filter.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Failed to load organizations:", err);
  }
}

// ------------------------------
// LEVELS DROPDOWN
// ------------------------------
async function loadTeamLevels() {
  try {
    const res = await fetch(`${window.apiBase}/levels`);
    const levels = await res.json();

    const select = document.getElementById("team-level");
    if (!select) return;

    select.innerHTML = `<option value="">Select Level</option>`;
    levels.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.levelId;
      opt.textContent = l.levelName;
      select.appendChild(opt);
    });

    // Populate filter dropdown
    const filter = document.getElementById("filter-level");
    if (filter) {
      filter.innerHTML = `<option value="">Level: All</option>`;
      levels.forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l.levelId;
        opt.textContent = l.levelName;
        filter.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Failed to load levels:", err);
  }
}

// ------------------------------
// SEASONS DROPDOWN
// ------------------------------
async function loadTeamSeasons() {
  try {
    const res = await fetch(`${window.apiBase}/seasons`);
    const seasons = await res.json();

    const select = document.getElementById("team-season");
    if (!select) return;

    select.innerHTML = `<option value="">Select Season</option>`;
    seasons.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.seasonId;
      opt.textContent = s.seasonName;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load seasons:", err);
  }
}

// =========================================================
// MAIN PAGE INITIALIZER
// =========================================================
function initTeamsPage() {
  if (!document.getElementById("teamsBody")) return;

  AdminPage.init({
    tableBodyId: "teamsBody",
    searchInputId: "teams-search-bar",

    // ⭐ FIXED MODAL IDS
    modalId: "teamModalOverlay",
    modalTitleId: "teamModalTitle",
    addButtonId: "btnAddTeam",
    saveButtonId: "btnSaveTeam",
    cancelButtonId: "btnCancelTeam",

    deleteModalId: "teamDeleteModalOverlay",
    deleteConfirmId: "btnConfirmTeamDelete",
    deleteCancelId: "btnCancelTeamDelete",

    editHandlerName: "openEditTeam",
    deleteHandlerName: "openDeleteTeam",
    addHandlerName: "openAddTeam",

    addTitle: "Add Team",
    editTitle: "Edit Team",

    api: TeamApi,

    // -------------------------------------------------------
    // DROPDOWNS + FILTERS
    // -------------------------------------------------------
    loadDropdowns: async () => {
      await loadAllTeamDropdowns();
      wireTeamFilterEvents();

      if (window.orgIdFromUrl) {
        const orgFilter = document.getElementById("filter-org");
        if (orgFilter) {
          orgFilter.value = window.orgIdFromUrl;
          applyTeamFiltersAndSearch();
        }
      }
    },

    // -------------------------------------------------------
    // TABLE RENDERING
    // -------------------------------------------------------
    renderTable: (teams) => {
      const body = document.getElementById("teamsBody");
      body.innerHTML = "";

      teams.forEach((team) => {
        const row = document.createElement("tr");

        row.dataset.orgId = team.organizationId || "";
        row.dataset.levelId = team.levelId || "";
        row.dataset.status = team.isActive ? "active" : "inactive";

        const rosterCount = team.rosterCount ?? team.playerCount ?? 0;

        row.innerHTML = `
          <td>${team.name}</td>
          <td>${team.organizationName || "External Team"}</td>
          <td>${team.levelName ?? ""}</td>
          <td>${team.seasonName ?? ""}</td>
          <td>${rosterCount}</td>
          <td>${team.headCoachName ?? ""}</td>
          <td>
            <div class="code-stack">
              <div class="code-badge sk-code">SK-${team.scorekeeperCode ?? ""}</div>
              <div class="code-badge sm-code">SM-${team.statManagerCode ?? ""}</div>
            </div>
          </td>
          <td>
            <span class="status-badge ${team.isActive ? "active" : "inactive"}">
              ${team.isActive ? "Active" : "Inactive"}
            </span>
          </td>
          <td class="actions-col">
            <button class="nf-btn-icon view"><i class="fa-solid fa-users"></i></button>
            <button class="nf-btn-icon edit"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="nf-btn-icon delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;

        const [btnView, btnEdit, btnDelete] = row.querySelectorAll("button");

        
        

        btnEdit.addEventListener("click", () => openEditTeam(team.teamId));
        btnDelete.addEventListener("click", () => openDeleteTeam(team.teamId));

        body.appendChild(row);
      });

      applyTeamFiltersAndSearch();
    },

    // -------------------------------------------------------
    // CLEAR FORM
    // -------------------------------------------------------
    clearForm: () => {
      [
        "team-name",
        "team-abbreviation",
        "team-org",
        "team-level",
        "team-season",
        "team-head-coach",
        "team-asst1",
        "team-asst2",
        "team-asst3",
        "team-asst4",
        "team-notes",
        "team-score-code",
        "team-stat-code",
      ].forEach((id) => (document.getElementById(id).value = ""));

      document.getElementById("team-active").checked = true;
      document.getElementById("team-external").checked = false;
      document.getElementById("team-org").disabled = false;
    },

    // -------------------------------------------------------
    // POPULATE FORM
    // -------------------------------------------------------
    populateForm: (team) => {
      document.getElementById("team-name").value = team.name ?? "";
      document.getElementById("team-abbreviation").value =
        team.abbreviation ?? "";
      document.getElementById("team-org").value = team.organizationId || "";
      document.getElementById("team-level").value = team.levelId || "";
      document.getElementById("team-season").value = team.seasonId || "";

      document.getElementById("team-head-coach").value =
        team.headCoachName ?? "";
      document.getElementById("team-asst1").value =
        team.assistantCoach1Name ?? "";
      document.getElementById("team-asst2").value =
        team.assistantCoach2Name ?? "";
      document.getElementById("team-asst3").value =
        team.assistantCoach3Name ?? "";
      document.getElementById("team-asst4").value =
        team.assistantCoach4Name ?? "";

      document.getElementById("team-notes").value = team.notes ?? "";
      document.getElementById("team-score-code").value =
        team.scorekeeperCode ?? "";
      document.getElementById("team-stat-code").value =
        team.statManagerCode ?? "";

      document.getElementById("team-active").checked = !!team.isActive;
      document.getElementById("team-external").checked = !!team.isExternal;

      document.getElementById("team-org").disabled = !!team.isExternal;
    },

    // -------------------------------------------------------
    // COLLECT FORM DATA
    // -------------------------------------------------------
    collectFormData: () => {
      const isExternal = document.getElementById("team-external").checked;

      return {
        name: document.getElementById("team-name").value,
        abbreviation:
          document.getElementById("team-abbreviation").value || null,
        organizationId: isExternal
          ? null
          : document.getElementById("team-org").value || null,
        levelId: document.getElementById("team-level").value || null,
        seasonId: document.getElementById("team-season").value || null,
        headCoachName: document.getElementById("team-head-coach").value,
        assistantCoach1Name: document.getElementById("team-asst1").value,
        assistantCoach2Name: document.getElementById("team-asst2").value,
        assistantCoach3Name: document.getElementById("team-asst3").value,
        assistantCoach4Name: document.getElementById("team-asst4").value,
        notes: document.getElementById("team-notes").value,
        scorekeeperCode: document.getElementById("team-score-code").value,
        statManagerCode: document.getElementById("team-stat-code").value,
        isActive: document.getElementById("team-active").checked,
        isExternal: isExternal,
      };
    },
  });

  // Map AdminPage internal add handler
  AdminPage.openAdd = openAddTeam;
}

// =========================================================
// ADD TEAM (FIXED)
// =========================================================
function openAddTeam() {
  AdminPage.editingId = null;
  AdminPage.config.clearForm();
  document.getElementById("teamModalTitle").textContent = "Add Team";
  document.getElementById("teamModalOverlay").classList.add("active");
}

// =========================================================
// EDIT TEAM (FIXED)
// =========================================================
async function openEditTeam(id) {
  try {
    const team = await TeamApi.getById(id);
    AdminPage.editingId = id;
    AdminPage.config.populateForm(team);

    document.getElementById("teamModalTitle").textContent = "Edit Team";
    document.getElementById("teamModalOverlay").classList.add("active");
  } catch (err) {
    console.error("Failed to load team:", err);
    alert("Unable to load team details.");
  }
}

// =========================================================
// DELETE TEAM (FIXED)
// =========================================================
function openDeleteTeam(id) {
  AdminPage.deleteId = id;
  document.getElementById("teamDeleteModalOverlay").classList.add("active");
}

// =========================================================
// FILTERS
// =========================================================
function applyTeamFiltersAndSearch() {
  const tbody = document.getElementById("teamsBody");
  if (!tbody) return;

  const searchTerm = (
    document.getElementById("teams-search-bar")?.value || ""
  ).toLowerCase();
  const orgFilter = document.getElementById("filter-org")?.value || "";
  const levelFilter = document.getElementById("filter-level")?.value || "";
  const statusFilter = document.getElementById("filter-status")?.value || "";

  Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
    const rowText = row.textContent.toLowerCase();

    const matchesSearch = !searchTerm || rowText.includes(searchTerm);
    const matchesOrg = !orgFilter || row.dataset.orgId === orgFilter;
    const matchesLevel = !levelFilter || row.dataset.levelId === levelFilter;
    const matchesStatus = !statusFilter || row.dataset.status === statusFilter;

    row.style.display =
      matchesSearch && matchesOrg && matchesLevel && matchesStatus
        ? ""
        : "none";
  });
}

function wireTeamFilterEvents() {
  ["teams-search-bar", "filter-org", "filter-level", "filter-status"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", applyTeamFiltersAndSearch);
      if (el) el.addEventListener("change", applyTeamFiltersAndSearch);
    },
  );
}

// =========================================================
// INIT
// =========================================================
document.addEventListener("layoutLoaded", initTeamsPage);
if (window.__layoutAlreadyLoaded) initTeamsPage();
window.addEventListener("DOMContentLoaded", initTeamsPage);
