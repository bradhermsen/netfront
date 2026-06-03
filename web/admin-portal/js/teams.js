// =========================================================
// SAFE INITIALIZER — RUNS WHENEVER LAYOUT IS READY
// =========================================================

function initTeamsPage() {
  if (window.__teamsPageInitialized) return;
  window.__teamsPageInitialized = true;

  console.log("Teams page initializing…");

  // Read orgId from query string if present
  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  const orgIdFromUrl = getQueryParam("orgId");

  // =========================================================
  // TOAST NOTIFICATION
  // =========================================================
  function showToast(message) {
    const toast = document.getElementById("nf-toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  // =========================================================
  // DROPDOWN LOADERS (MODAL + FILTER BAR)
  // =========================================================

  async function loadOrganizationsForTeams() {
    const modalSelect = document.getElementById("team-org");
    const filterSelect = document.getElementById("filter-org");

    const res = await fetch(`${window.apiBase}/organizations`);
    const orgs = await res.json();

    if (modalSelect) {
      modalSelect.innerHTML = `<option value="">Select Organization</option>`;
      orgs.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.organizationId;
        opt.textContent = o.name;
        modalSelect.appendChild(opt);
      });
    }

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">Org: All</option>`;

      // Add External Teams option
      const externalOpt = document.createElement("option");
      externalOpt.value = "external";
      externalOpt.textContent = "External Teams";
      filterSelect.appendChild(externalOpt);

      orgs.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.organizationId;
        opt.textContent = o.name;
        filterSelect.appendChild(opt);
      });
    }
  }

  async function loadLevelsForTeams() {
    const modalSelect = document.getElementById("team-level");
    const filterSelect = document.getElementById("filter-level");

    const res = await fetch(`${window.apiBase}/levels`);
    const levels = await res.json();

    if (modalSelect) {
      modalSelect.innerHTML = `<option value="">Select Level</option>`;
      levels.forEach((lvl) => {
        const opt = document.createElement("option");
        opt.value = lvl.levelId || lvl.id;
        opt.textContent = lvl.levelName || lvl.name;
        modalSelect.appendChild(opt);
      });
    }

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">Level: All</option>`;
      levels.forEach((lvl) => {
        const opt = document.createElement("option");
        opt.value = lvl.levelId || lvl.id;
        opt.textContent = lvl.levelName || lvl.name;
        filterSelect.appendChild(opt);
      });
    }
  }

  async function loadSeasonsForTeams() {
    const modalSelect = document.getElementById("team-season");
    const filterSelect = document.getElementById("filter-season");

    const res = await fetch(`${window.apiBase}/seasons`);
    const seasons = await res.json();

    if (modalSelect) {
      modalSelect.innerHTML = `<option value="">Select Season</option>`;
      seasons.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.seasonId;
        opt.textContent = s.seasonName;
        modalSelect.appendChild(opt);
      });
    }

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">Season: All</option>`;
      seasons.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.seasonId;
        opt.textContent = s.seasonName;
        filterSelect.appendChild(opt);
      });
    }
  }

  async function loadAllTeamDropdowns() {
    await Promise.all([
      loadOrganizationsForTeams(),
      loadLevelsForTeams(),
      loadSeasonsForTeams(),
    ]);
  }

  // =========================================================
  // FILTER + SEARCH (APPLY ON TABLE ROWS)
  // =========================================================

  function applyTeamFiltersAndSearch() {
    const tbody = document.getElementById("teamsBody");
    if (!tbody) return;

    const searchInput = document.getElementById("teams-search-bar");
    const orgSelect = document.getElementById("filter-org");
    const levelSelect = document.getElementById("filter-level");
    const seasonSelect = document.getElementById("filter-season");

    const searchTerm = (searchInput?.value || "").toLowerCase();
    const orgFilter = orgSelect?.value || "";
    const levelFilter = levelSelect?.value || "";
    const seasonFilter = seasonSelect?.value || "";

    Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
      const rowText = row.textContent.toLowerCase();
      const rowOrg = row.dataset.orgId || "";
      const rowLevel = row.dataset.levelId || "";
      const rowSeason = row.dataset.seasonId || "";

      const matchesSearch = !searchTerm || rowText.includes(searchTerm);

      // ⭐ Updated logic — supports "External Teams"
      const matchesOrg =
        !orgFilter ||
        rowOrg === orgFilter ||
        (orgFilter === "external" &&
          (!rowOrg || rowOrg === "00000000-0000-0000-0000-000000000000"));

      const matchesLevel = !levelFilter || rowLevel === levelFilter;
      const matchesSeason = !seasonFilter || rowSeason === seasonFilter;

      row.style.display =
        matchesSearch && matchesOrg && matchesLevel && matchesSeason
          ? ""
          : "none";
    });
  }

  function wireFilterEvents() {
    const searchInput = document.getElementById("teams-search-bar");
    const orgSelect = document.getElementById("filter-org");
    const levelSelect = document.getElementById("filter-level");
    const seasonSelect = document.getElementById("filter-season");

    if (searchInput)
      searchInput.addEventListener("input", applyTeamFiltersAndSearch);
    if (orgSelect)
      orgSelect.addEventListener("change", applyTeamFiltersAndSearch);
    if (levelSelect)
      levelSelect.addEventListener("change", applyTeamFiltersAndSearch);
    if (seasonSelect)
      seasonSelect.addEventListener("change", applyTeamFiltersAndSearch);
  }

  // =========================================================
  // GENERATE ACCESS CODES BUTTON
  // =========================================================

  const generateBtn = document.getElementById("btnGenerateCodes");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const sk = Math.random().toString(36).substring(2, 8).toUpperCase();
      const sm = Math.random().toString(36).substring(2, 8).toUpperCase();

      document.getElementById("team-score-code").value = sk;
      document.getElementById("team-stat-code").value = sm;

      showToast("Codes generated!");
    });
  }

  // =========================================================
  // MODAL OPEN FUNCTIONS
  // =========================================================

  window.openAddTeamModal = async function () {
    await loadAllTeamDropdowns();

    AdminPage.currentEditId = null;
    AdminPage.clearForm();

    const orgSelect = document.getElementById("team-org");
    if (orgSelect) orgSelect.disabled = false;

    document.getElementById("team-abbreviation").value = "";
    document.getElementById("team-external").checked = false;

    document.getElementById("teamModalTitle").textContent = "Add Team";
    document.getElementById("teamModal").classList.add("show");
  };

  window.openEditTeamModal = async function (teamId) {
    await loadAllTeamDropdowns();

    const team = await TeamApi.getById(teamId);

    AdminPage.populateForm(team);

    const orgSelect = document.getElementById("team-org");
    const extToggle = document.getElementById("team-external");

    const orgId = team.organizationId;

    const isExternalTeam =
      team.isExternal ||
      orgId === null ||
      orgId === undefined ||
      orgId === "" ||
      orgId === "00000000-0000-0000-0000-000000000000";

    if (isExternalTeam) {
      if (orgSelect) {
        orgSelect.innerHTML = "";
        const externalOption = document.createElement("option");
        externalOption.value = "";
        externalOption.textContent = "External Team";
        externalOption.selected = true;
        orgSelect.appendChild(externalOption);
        orgSelect.disabled = true;
      }
      if (extToggle) extToggle.checked = true;
    } else {
      if (orgSelect) {
        orgSelect.disabled = false;
        await loadOrganizationsForTeams();
        orgSelect.value = orgId || "";
      }
      if (extToggle) extToggle.checked = false;
    }

    document.getElementById("teamModalTitle").textContent = "Edit Team";
    document.getElementById("teamModal").classList.add("show");
  };

  // =========================================================
  // EXTERNAL TEAM TOGGLE
  // =========================================================

  const extToggle = document.getElementById("team-external");
  if (extToggle) {
    extToggle.addEventListener("change", async (e) => {
      const orgSelect = document.getElementById("team-org");
      if (!orgSelect) return;

      if (e.target.checked) {
        orgSelect.innerHTML = "";
        const externalOption = document.createElement("option");
        externalOption.value = "";
        externalOption.textContent = "External Team";
        externalOption.selected = true;
        orgSelect.appendChild(externalOption);

        orgSelect.disabled = true;
      } else {
        orgSelect.disabled = false;
        await loadOrganizationsForTeams();
        orgSelect.value = "";
      }
    });
  }

  // =========================================================
  // ADMIN PAGE INIT
  // =========================================================

  AdminPage.init({
    tableBodyId: "teamsBody",
    searchInputId: "teams-search-bar",

    modalId: "teamModal",
    modalTitleId: "teamModalTitle",
    addButtonId: "btnAddTeam",
    saveButtonId: "btnSaveTeam",
    cancelButtonId: "btnCancelTeam",

    deleteModalId: "teamDeleteModal",
    deleteConfirmId: "btnConfirmTeamDelete",
    deleteCancelId: "btnCancelTeamDelete",

    editHandlerName: "openEditTeamModal",
    deleteHandlerName: "openDeleteTeamModal",

    addTitle: "Add Team",
    editTitle: "Edit Team",

    api: TeamApi,

    loadDropdowns: async () => {
      await loadAllTeamDropdowns();
      wireFilterEvents();

      if (orgIdFromUrl) {
        const orgFilter = document.getElementById("filter-org");
        if (orgFilter) {
          orgFilter.value = orgIdFromUrl;
          applyTeamFiltersAndSearch();
        }
      }
    },

    renderTable: (teams) => {
      const body = document.getElementById("teamsBody");
      if (!body) return;

      body.innerHTML = "";

      teams.forEach((team) => {
        const row = document.createElement("tr");

        const rosterCount = team.rosterCount ?? team.playerCount ?? 0;

        row.dataset.orgId = team.organizationId || "";
        row.dataset.levelId = team.levelId || "";
        row.dataset.seasonId = team.seasonId || "";

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
          <td>${team.isActive ? "Active" : "Inactive"}</td>
          <td class="actions-col">
            <button class="action-btn roster-btn" onclick="window.location.href='team-roster.html?teamId=${team.teamId}'">Roster</button>
            <button class="action-btn edit-btn" onclick="openEditTeamModal('${team.teamId}')">Edit</button>
            <button class="action-btn delete-btn" onclick="openDeleteTeamModal('${team.teamId}')">Delete</button>
          </td>
        `;

        body.appendChild(row);
      });

      applyTeamFiltersAndSearch();
      wireFilterEvents();
    },

    clearForm: () => {
      document.getElementById("team-name").value = "";
      document.getElementById("team-abbreviation").value = "";
      document.getElementById("team-org").value = "";
      document.getElementById("team-level").value = "";
      document.getElementById("team-season").value = "";
      document.getElementById("team-head-coach").value = "";
      document.getElementById("team-asst1").value = "";
      document.getElementById("team-asst2").value = "";
      document.getElementById("team-asst3").value = "";
      document.getElementById("team-asst4").value = "";
      document.getElementById("team-notes").value = "";
      document.getElementById("team-score-code").value = "";
      document.getElementById("team-stat-code").value = "";
      document.getElementById("team-active").checked = true;
      document.getElementById("team-external").checked = false;

      const orgSelect = document.getElementById("team-org");
      if (orgSelect) orgSelect.disabled = false;
    },

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
    },

    collectFormData: () => {
      const isExternal = document.getElementById("team-external").checked;

      const payload = {
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

      return payload;
    },
  });

  // =========================================================
  // DELETE HANDLER
  // =========================================================

  window.openDeleteTeamModal = function (id) {
    AdminPage.currentDeleteId = id;
    document.getElementById("teamDeleteModal").classList.add("show");
  };
}

// =========================================================
// RUN INIT WHENEVER POSSIBLE
// =========================================================

document.addEventListener("layoutLoaded", initTeamsPage);
if (window.__layoutAlreadyLoaded) initTeamsPage();
window.addEventListener("DOMContentLoaded", initTeamsPage);
