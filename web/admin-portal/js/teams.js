console.log("Teams.js loaded");

// =========================================================
// TEAMS PAGE — MODERNIZED + MATCHED DESIGN
// =========================================================

const notify = (message, type = "info") => {
  if (typeof window.showMessage === "function") {
    window.showMessage(message, type);
    return;
  }
  console[type === "error" ? "error" : "log"](message);
};

function getAccessCodeSuffix(value) {
  const raw = (value ?? "").toString().trim().toUpperCase();
  const withoutPrefix = raw.replace(/^(GM|SM)\s*-\s*/i, "");
  const alnum = withoutPrefix.replace(/[^A-Z0-9]/g, "");
  return alnum.slice(0, 6);
}

const teamConferenceDistrictState = {
  list: [],
};

const teamSectionRegionState = {
  list: [],
};

const teamOrganizationState = {
  byId: new Map(),
};

const allowedTeamTypes = new Map([
  ["boys", "Boys"],
  ["girls", "Girls"],
  ["co-ed", "Co-Ed"],
  ["coed", "Co-Ed"],
  ["men", "Men"],
  ["women", "Women"],
]);

const TEAMS_GROUP_PAGE_SIZE = 10;
const teamsGroupPaginationState = {};

function resetTeamsGroupPagination() {
  Object.keys(teamsGroupPaginationState).forEach((k) => delete teamsGroupPaginationState[k]);
}

function normalizeTeamTypeValue(value) {
  const raw = (value || "").toString().trim();
  if (!raw) return "";

  const key = raw.toLowerCase();
  return allowedTeamTypes.get(key) || "";
}

function getDisplayTeamType(team) {
  const fromType = normalizeTeamTypeValue(team?.teamType);
  if (fromType) return fromType;

  return normalizeTeamTypeValue(team?.gender);
}

function getOrganizationMascot(orgId) {
  if (!orgId) return "";
  return teamOrganizationState.byId.get(orgId)?.mascot || "";
}

function isExternalOrganizationById(orgId) {
  if (!orgId) return false;

  const orgName = (teamOrganizationState.byId.get(orgId)?.name || "")
    .toString()
    .trim()
    .toLowerCase();

  return (
    orgName === "external" ||
    orgName === "external team" ||
    orgName.includes("external team")
  );
}

function applyTeamMascotRules() {
  const orgSelect = document.getElementById("team-org");
  const mascotInput = document.getElementById("team-mascot");
  if (!orgSelect || !mascotInput) return;

  const selectedOrgId = orgSelect.value || "";
  const isExternal = isExternalOrganizationById(selectedOrgId);

  if (isExternal) {
    mascotInput.placeholder = "Optional for external teams";
    return;
  }

  mascotInput.placeholder = "Defaults to organization mascot";
  const current = (mascotInput.value || "").trim();
  const orgMascot = (getOrganizationMascot(orgSelect.value) || "").trim();

  if (!current || current.toLowerCase() === orgMascot.toLowerCase()) {
    mascotInput.value = orgMascot;
  }
}

function populateTeamTypeFilterFromTeams(teams) {
  const typeFilter = document.getElementById("filter-team-type");
  if (!typeFilter) return;

  const selected = typeFilter.value || "";
  const uniqueTypes = Array.from(
    new Set(
      (Array.isArray(teams) ? teams : [])
        .map((team) => getDisplayTeamType(team))
        .filter((type) => !!type),
    ),
  ).sort((a, b) => a.localeCompare(b));

  typeFilter.innerHTML = '<option value="">Type: All</option>';
  uniqueTypes.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    typeFilter.appendChild(opt);
  });

  const hasSelected = Array.from(typeFilter.options).some(
    (opt) => opt.value === selected,
  );
  typeFilter.value = hasSelected ? selected : "";
}

function normalizeConferenceDistrict(item) {
  return {
    id: item?.id || item?.conferenceDistrictId || "",
    name: item?.name || item?.conferenceDistrictName || "",
    sortOrder: item?.sortOrder ?? 0,
    isActive: item?.isActive ?? true,
  };
}

function getTeamConferenceName(team) {
  if (team?.conferenceDistrictName) return team.conferenceDistrictName;

  const conferenceId =
    team?.conferenceDistrictId ||
    team?.conferenceDistrictID ||
    team?.conferenceId ||
    "";

  if (!conferenceId) return "";

  const match = teamConferenceDistrictState.list.find(
    (c) => c.id === conferenceId,
  );

  return match?.name || "";
}

function normalizeSectionRegion(item) {
  return {
    id: item?.id || item?.sectionRegionId || "",
    name: item?.name || item?.sectionRegionName || "",
    sortOrder: item?.sortOrder ?? 0,
    isActive: item?.isActive ?? true,
  };
}

function getTeamSectionName(team) {
  if (team?.sectionRegionName) return team.sectionRegionName;

  const sectionId =
    team?.sectionRegionId ||
    team?.sectionRegionID ||
    team?.sectionId ||
    "";

  if (!sectionId) return "";

  const match = teamSectionRegionState.list.find(
    (s) => s.id === sectionId,
  );

  return match?.name || "";
}

async function loadConferenceDistricts() {
  const payload = await ConferenceDistrictApi.getAll();
  const conferences = (payload || []).map(normalizeConferenceDistrict);

  teamConferenceDistrictState.list = conferences;

  const modalSelect = document.getElementById("team-conference-district");
  if (modalSelect) {
    const selectedValue = modalSelect.value || "";
    modalSelect.innerHTML = `<option value="">Select Conference</option>`;

    conferences
      .filter((c) => c.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
      .forEach((conference) => {
        const opt = document.createElement("option");
        opt.value = conference.id;
        opt.textContent = conference.name;
        modalSelect.appendChild(opt);
      });

    modalSelect.value = selectedValue;
  }

  const filter = document.getElementById("filter-team-conference");
  if (filter) {
    const selectedValue = filter.value || "";
    filter.innerHTML = `<option value="">Conference: All</option>`;

    conferences
      .filter((c) => c.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((conference) => {
        const opt = document.createElement("option");
        opt.value = conference.id;
        opt.textContent = conference.name;
        filter.appendChild(opt);
      });

    filter.value = selectedValue;
  }
}

async function loadSectionRegions() {
  const payload = await SectionRegionApi.getAll();
  const sections = (payload || []).map(normalizeSectionRegion);

  teamSectionRegionState.list = sections;

  const modalSelect = document.getElementById("team-section-region");
  if (modalSelect) {
    const selectedValue = modalSelect.value || "";
    modalSelect.innerHTML = `<option value="">Select Section</option>`;

    sections
      .filter((s) => s.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
      .forEach((section) => {
        const opt = document.createElement("option");
        opt.value = section.id;
        opt.textContent = section.name;
        modalSelect.appendChild(opt);
      });

    modalSelect.value = selectedValue;
  }

  const filter = document.getElementById("filter-team-section");
  if (filter) {
    const selectedValue = filter.value || "";
    filter.innerHTML = `<option value="">Section: All</option>`;

    sections
      .filter((s) => s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((section) => {
        const opt = document.createElement("option");
        opt.value = section.id;
        opt.textContent = section.name;
        filter.appendChild(opt);
      });

    filter.value = selectedValue;
  }
}

// Enforce SuperAdmin/OrgAdmin/TeamManager access
(function checkPermission() {
  if (!Auth.canManageTeams()) {
    notify("Access Denied: Team management requires Super Admin, Org Admin, or Team Manager role", "error");
    setTimeout(() => {
      window.location.href = "./not-authorized.html";
    }, 2000);
  }
})();

// =========================================================
// LOAD ALL TEAM DROPDOWNS
// =========================================================
async function loadAllTeamDropdowns() {
  await Promise.all([
    loadTeamOrganizations(),
    loadTeamLevels(),
    loadTeamSeasons(),
    loadConferenceDistricts(),
    loadSectionRegions(),
  ]);
}

// ------------------------------
// ORGANIZATIONS DROPDOWN
// ------------------------------
async function loadTeamOrganizations() {
  try {
    const res = await authFetch(`/organizations`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const orgs = await res.json();
    if (!Array.isArray(orgs)) {
      throw new Error(orgs?.error || "Organizations response was not an array");
    }

    teamOrganizationState.byId.clear();
    orgs.forEach((o) => {
      if (o?.organizationId) {
        teamOrganizationState.byId.set(o.organizationId, {
          name: o.name || "",
          mascot: o.mascot || "",
        });
      }
    });

    const select = document.getElementById("team-org");
    if (!select) return;

    select.innerHTML = `<option value="">Select Organization</option>`;
    orgs.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.organizationId;
      opt.textContent = o.name;
      select.appendChild(opt);
    });

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
    notify("Failed to load organizations", "error");
  }
}

// ------------------------------
// LEVELS DROPDOWN
// ------------------------------
async function loadTeamLevels() {
  try {
    const res = await authFetch(`/levels`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const levels = await res.json();
    if (!Array.isArray(levels)) {
      throw new Error(levels?.error || "Levels response was not an array");
    }

    const select = document.getElementById("team-level");
    if (!select) return;

    select.innerHTML = `<option value="">Select Level</option>`;
    levels.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.levelId;
      opt.textContent = l.levelName;
      select.appendChild(opt);
    });

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
    notify("Failed to load levels", "error");
  }
}

// ------------------------------
// SEASONS DISPLAY
// ------------------------------
async function loadTeamSeasons() {
  try {
    console.log("loadTeamSeasons() fired");

    const res = await authFetch(`/seasons`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const seasons = await res.json();
    if (!Array.isArray(seasons)) {
      throw new Error(seasons?.error || "Seasons response was not an array");
    }

    const display = document.getElementById("team-season-display");
    if (!display) return;

    console.log("Seasons:", seasons);

    const activeSeason = seasons.find(
      (s) => s.isActive === true || s.isActive === "true",
    );

    console.log("Active season:", activeSeason);

    // Store globally for new teams
    window.activeSeasonId = activeSeason?.seasonId || null;

    if (activeSeason) {
      display.textContent = activeSeason.seasonName;
    } else {
      display.textContent = "No Active Season";
    }
  } catch (err) {
    console.error("Failed to load seasons:", err);
  }
}

// =========================================================
// LIVE ABBREVIATION GENERATION (ORG-TEAM-LEVEL-SEASON)
// =========================================================
function generateTeamAbbreviation(
  orgName,
  teamName,
  levelName,
  seasonName,
  existingAbbreviations = [],
) {
  // Generate as soon as teamName + levelName exist
  if (!teamName || !levelName) return "";

  // Helper: first letter of each word
  const prefixFromWords = (str) =>
    str
      .trim()
      .split(/\s+/)
      .map((w) => w[0].toLowerCase())
      .join("");

  // ORG prefix (fallback: "unk")
  const orgPrefix = orgName ? prefixFromWords(orgName) : "unk";

  // TEAM prefix
  const teamPrefix = prefixFromWords(teamName);

  // LEVEL prefix
  let levelPrefix = "";
  if (levelName.toLowerCase() === "varsity") levelPrefix = "v";
  else if (levelName.toLowerCase() === "jv") levelPrefix = "jv";
  else levelPrefix = "unk";

  // SEASON prefix (fallback: "0000")
  let seasonPrefix = "0000";
  if (seasonName && seasonName.includes("-")) {
    const parts = seasonName.split("-");
    seasonPrefix = parts[0].slice(-2) + parts[1].slice(-2);
  }

  const base = `${orgPrefix}-${teamPrefix}-${levelPrefix}-${seasonPrefix}`;

  // Collision handling
  let finalAbbr = base;
  let counter = 2;

  while (existingAbbreviations.includes(finalAbbr)) {
    finalAbbr = `${base}-${counter}`;
    counter++;
  }

  return finalAbbr;
}

// =========================================================
// AUTO-UPDATE ABBREVIATION (LIVE)
// =========================================================
function updateTeamAbbreviation() {
  const nameEl = document.getElementById("team-name");
  const levelSelect = document.getElementById("team-level");
  const seasonSelect = document.getElementById("team-season-display"); // FIXED
  const orgSelect = document.getElementById("team-org"); // FIXED
  const abbrEl = document.getElementById("team-abbreviation");

  if (!nameEl || !levelSelect || !abbrEl) return;

  const currentAbbr = abbrEl.value?.trim();
  if (AdminPage?.editingId && currentAbbr) return;

  const teamName = nameEl.value;
  const levelName =
    levelSelect.options[levelSelect.selectedIndex]?.textContent || "";
  const seasonName = seasonSelect?.textContent || ""; // FIXED (season is a display div)
  const orgName =
    orgSelect?.options[orgSelect.selectedIndex]?.textContent || "";

  if (!teamName || !levelName) return;

  const existing =
    (window.loadedTeams || []).map((t) => t.abbreviation).filter((a) => !!a) ||
    [];

  const abbr = generateTeamAbbreviation(
    orgName,
    teamName,
    levelName,
    seasonName,
    existing,
  );
  abbrEl.value = abbr;
}

function wireTeamAbbreviation() {
  const nameEl = document.getElementById("team-name");
  const levelSelect = document.getElementById("team-level");
  const seasonSelect = document.getElementById("team-season-display"); // FIXED
  const orgSelect = document.getElementById("team-org"); // FIXED

  if (!nameEl || !levelSelect) return;

  nameEl.addEventListener("input", updateTeamAbbreviation);
  levelSelect.addEventListener("change", updateTeamAbbreviation);
  if (seasonSelect)
    seasonSelect.addEventListener("DOMSubtreeModified", updateTeamAbbreviation); // season is a display div
  if (orgSelect) orgSelect.addEventListener("change", updateTeamAbbreviation);
}

function isExternalTeamRow(team) {
  if (!team) return false;

  if (team.isExternal === true || team.external === true) {
    return true;
  }

  const organizationName = (team.organizationName ?? "")
    .toString()
    .trim()
    .toLowerCase();

  return organizationName === "external team" || organizationName === "external";
}

function getFilteredTeams() {
  const source = Array.isArray(AdminPage?.allItems) ? AdminPage.allItems : [];

  const searchTerm = (document.getElementById("teams-search-bar")?.value || "").toLowerCase();
  const orgFilter = document.getElementById("filter-org")?.value || "";
  const conferenceFilter = document.getElementById("filter-team-conference")?.value || "";
  const sectionFilter = document.getElementById("filter-team-section")?.value || "";
  const levelFilter = document.getElementById("filter-level")?.value || "";
  const typeFilter = document.getElementById("filter-team-type")?.value || "";
  const statusFilter = document.getElementById("filter-status")?.value || "";
  const showExternal = !!document.getElementById("teams-show-external")?.checked;

  return source.filter((team) => {
    const conferenceId = team.conferenceDistrictId || team.conferenceDistrictID || "";
    const sectionId = team.sectionRegionId || team.sectionRegionID || "";
    const teamType = getDisplayTeamType(team);
    const isExternal = isExternalTeamRow(team);
    const status = team.isActive ? "active" : "inactive";

    const matchesSearch = !searchTerm || JSON.stringify(team || {}).toLowerCase().includes(searchTerm);
    const matchesOrg = !orgFilter || (team.organizationId || "") === orgFilter;
    const matchesConference = !conferenceFilter || conferenceId === conferenceFilter;
    const matchesSection = !sectionFilter || sectionId === sectionFilter;
    const matchesLevel = !levelFilter || (team.levelId || "") === levelFilter;
    const matchesType = !typeFilter || teamType === typeFilter;
    const matchesStatus = !statusFilter || status === statusFilter;
    const matchesExternal = showExternal || !isExternal;

    return (
      matchesSearch &&
      matchesOrg &&
      matchesConference &&
      matchesSection &&
      matchesLevel &&
      matchesType &&
      matchesStatus &&
      matchesExternal
    );
  });
}

function renderTeamsGrouped(teams) {
  const container = document.getElementById("teamsGroupedList");
  if (!container) return;

  if (!teams.length) {
    container.innerHTML = `<div class="nf-empty-state">No teams match your current filters.</div>`;
    return;
  }

  const statusGroups = {
    active: teams.filter((team) => team.isActive),
    inactive: teams.filter((team) => !team.isActive),
  };

  const statusOrder = ["active", "inactive"].filter((key) => statusGroups[key].length > 0);

  container.innerHTML = statusOrder
    .map((statusKey, statusIndex) => {
      const statusItems = [...statusGroups[statusKey]].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      const totalPages = Math.max(1, Math.ceil(statusItems.length / TEAMS_GROUP_PAGE_SIZE));
      const currentPage = Math.min(teamsGroupPaginationState[statusKey] || 1, totalPages);
      teamsGroupPaginationState[statusKey] = currentPage;

      const paged = statusItems.slice((currentPage - 1) * TEAMS_GROUP_PAGE_SIZE, currentPage * TEAMS_GROUP_PAGE_SIZE);
      const orgGroups = new Map();

      paged.forEach((team) => {
        const orgLabel = team.organizationName || "External Team";
        if (!orgGroups.has(orgLabel)) orgGroups.set(orgLabel, []);
        orgGroups.get(orgLabel).push(team);
      });

      const orgMarkup = [...orgGroups.entries()]
        .map(([orgLabel, orgTeams], orgIndex) => {
          const cards = orgTeams
            .map((team) => {
              const conferenceName = getTeamConferenceName(team) || "No conference";
              const sectionName = getTeamSectionName(team) || "No section";
              const displayTeamType = getDisplayTeamType(team) || "No type";
              const rosterCount = team.rosterCount ?? team.playerCount ?? 0;
              const gmCode = getAccessCodeSuffix(team.gameManagerCode);
              const smCode = getAccessCodeSuffix(team.statManagerCode);

              return `
                <article class="nf-item-card team-item-card">
                  <div class="nf-item-card-top">
                    <h4>${team.name || "Unnamed Team"}</h4>
                    <span class="status-badge ${team.isActive ? "active" : "inactive"}">${team.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <div class="nf-item-card-meta">
                    <span><i class="fa fa-building"></i> ${team.organizationName || "External Team"}</span>
                    <span><i class="fa fa-shield"></i> ${conferenceName} • ${sectionName}</span>
                    <span><i class="fa fa-layer-group"></i> ${team.levelName || "No level"} • ${displayTeamType}</span>
                    <span><i class="fa fa-users"></i> ${rosterCount} rostered • ${team.headCoachName || "No head coach"}</span>
                  </div>
                  <div class="code-stack">
                    <div class="code-badge gm-code">GM-${gmCode}</div>
                    <div class="code-badge sm-code">SM-${smCode}</div>
                  </div>
                  <div class="nf-item-card-actions">
                    <button class="nf-btn-icon view team-view-btn" data-id="${team.teamId}" title="View Team"><i class="fa-solid fa-users"></i></button>
                    <button class="nf-btn-icon edit team-edit-btn" data-id="${team.teamId}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="nf-btn-icon delete team-delete-btn" data-id="${team.teamId}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </article>
              `;
            })
            .join("");

          return `
            <details class="nf-subgroup" ${orgIndex === 0 ? "open" : ""}>
              <summary>
                <span>${orgLabel}</span>
                <span class="nf-group-count">${orgTeams.length}</span>
              </summary>
              <div class="nf-card-grid">${cards}</div>
            </details>
          `;
        })
        .join("");

      return `
        <details class="nf-group" ${statusIndex === 0 ? "open" : ""}>
          <summary>
            <span>${statusKey === "active" ? "Active" : "Inactive"}</span>
            <span class="nf-group-count">${statusItems.length}</span>
          </summary>
          <div class="nf-group-content">
            ${orgMarkup}
            ${statusItems.length > TEAMS_GROUP_PAGE_SIZE ? `
              <div class="nf-pagination">
                <button class="nf-btn nf-btn-secondary team-page-btn" data-status="${statusKey}" data-direction="prev" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
                <span>Page ${currentPage} of ${totalPages}</span>
                <button class="nf-btn nf-btn-secondary team-page-btn" data-status="${statusKey}" data-direction="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
              </div>
            ` : ""}
          </div>
        </details>
      `;
    })
    .join("");

  wireTeamCardActions();
  wireTeamPagination();
}

function wireTeamCardActions() {
  document.querySelectorAll(".team-view-btn").forEach((btn) => {
    btn.onclick = () => openEditTeam(btn.dataset.id);
  });

  document.querySelectorAll(".team-edit-btn").forEach((btn) => {
    btn.onclick = () => openEditTeam(btn.dataset.id);
  });

  document.querySelectorAll(".team-delete-btn").forEach((btn) => {
    btn.onclick = () => openDeleteTeam(btn.dataset.id);
  });
}

function wireTeamPagination() {
  document.querySelectorAll(".team-page-btn").forEach((btn) => {
    btn.onclick = () => {
      const status = btn.dataset.status;
      const direction = btn.dataset.direction;
      const current = teamsGroupPaginationState[status] || 1;

      teamsGroupPaginationState[status] = direction === "prev"
        ? Math.max(1, current - 1)
        : current + 1;

      applyTeamFiltersAndSearch();
    };
  });
}

// =========================================================
// MAIN PAGE INITIALIZER
// =========================================================
function initTeamsPage() {
  if (!document.getElementById("teamsGroupedList")) return;

  AdminPage.init({
    tableBodyId: "teamsGroupedList",
    searchInputId: "teams-search-bar",

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
    addHandler: openAddTeam,

    addTitle: "Add Team",
    editTitle: "Edit Team",

    saveHandler: saveTeam,

    api: TeamApi,

    // -------------------------------------------------------
    // DROPDOWNS + FILTERS
    // -------------------------------------------------------
    loadDropdowns: async () => {
      await loadAllTeamDropdowns();
      wireTeamFilterEvents();
      wireAssistantCoachLoginToggles();
      wireTeamAbbreviation();

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
      if (!Array.isArray(teams)) {
        console.error("Teams response was not an array:", teams);
        notify("Failed to load teams", "error");
        return;
      }

      // Keep a copy for abbreviation duplicate detection
      window.loadedTeams = teams || [];
      populateTeamTypeFilterFromTeams(teams);
      renderTeamsGrouped(teams);
    },

    // -------------------------------------------------------
    // CLEAR FORM
    // -------------------------------------------------------
    clearForm: () => {
      [
        "team-name",
        "team-abbreviation",
        "team-org",
        "team-conference-district",
        "team-section-region",
        "team-level",
        "team-type",
        "team-head-coach",
        "team-asst1",
        "team-asst2",
        "team-asst3",
        "team-asst4",
        "team-notes",
        "team-mascot",
        "team-score-code",
        "team-stat-code",
        "team-head-coach-email",
        "team-asst1-email",
        "team-asst2-email",
        "team-asst3-email",
        "team-asst4-email",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      [
        "team-asst1-has-login",
        "team-asst2-has-login",
        "team-asst3-has-login",
        "team-asst4-has-login",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.checked = false;
          el.disabled = true;
        }
      });

      document.getElementById("team-active").checked = true;
      window.currentTeamIsExternal = false;
      applyTeamMascotRules();

      // Re-wire toggles after clearing
      wireAssistantCoachLoginToggles();
    },

    // -------------------------------------------------------
    // POPULATE FORM
    // -------------------------------------------------------
    populateForm: (team) => {
      const conferenceId =
        team.conferenceDistrictId ||
        team.conferenceDistrictID ||
        teamConferenceDistrictState.list.find(
          (c) =>
            c.name &&
            (c.name === team.conferenceDistrictName ||
              c.name === team.conferenceName),
        )?.id ||
        "";

      const sectionId =
        team.sectionRegionId ||
        team.sectionRegionID ||
        teamSectionRegionState.list.find(
          (s) =>
            s.name &&
            (s.name === team.sectionRegionName || s.name === team.sectionName),
        )?.id ||
        "";

      document.getElementById("team-name").value = team.name ?? "";
      document.getElementById("team-abbreviation").value =
        team.abbreviation ?? "";
      document.getElementById("team-org").value = team.organizationId || "";
      document.getElementById("team-conference-district").value =
        conferenceId;
      document.getElementById("team-section-region").value = sectionId;
      document.getElementById("team-level").value = team.levelId || "";
      document.getElementById("team-type").value = getDisplayTeamType(team);
      document.getElementById("team-mascot").value = team.teamMascot || "";

      // Store seasonId for editing so collectFormData can use it
      window.editingSeasonId = team.seasonId || null;

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

      document.getElementById("team-head-coach-email").value =
        team.headCoachEmail ?? "";
      document.getElementById("team-asst1-email").value =
        team.assistantCoach1Email ?? "";
      document.getElementById("team-asst2-email").value =
        team.assistantCoach2Email ?? "";
      document.getElementById("team-asst3-email").value =
        team.assistantCoach3Email ?? "";
      document.getElementById("team-asst4-email").value =
        team.assistantCoach4Email ?? "";

      document.getElementById("team-score-code").value =
        getAccessCodeSuffix(team.gameManagerCode);
      document.getElementById("team-stat-code").value =
        getAccessCodeSuffix(team.statManagerCode);
      window.currentTeamIsExternal = !!team.isExternal;
      applyTeamMascotRules();

      const togglePairs = [
        {
          email: "team-asst1-email",
          toggle: "team-asst1-has-login",
          value: team.assistantCoach1HasLogin,
        },
        {
          email: "team-asst2-email",
          toggle: "team-asst2-has-login",
          value: team.assistantCoach2HasLogin,
        },
        {
          email: "team-asst3-email",
          toggle: "team-asst3-has-login",
          value: team.assistantCoach3HasLogin,
        },
        {
          email: "team-asst4-email",
          toggle: "team-asst4-has-login",
          value: team.assistantCoach4HasLogin,
        },
      ];

      togglePairs.forEach(({ email, toggle, value }) => {
        const emailEl = document.getElementById(email);
        const toggleEl = document.getElementById(toggle);

        if (!emailEl || !toggleEl) return;

        const hasEmail = emailEl.value.trim().length > 0;
        toggleEl.disabled = !hasEmail;
        toggleEl.checked = hasEmail ? !!value : false;
      });

      // Re-wire toggles after populating
      wireAssistantCoachLoginToggles();
    },

    // -------------------------------------------------------
    // COLLECT FORM DATA
    // -------------------------------------------------------
    collectFormData: () => {
      const selectedOrgId = document.getElementById("team-org").value || null;
      const inferredExternal = selectedOrgId
        ? isExternalOrganizationById(selectedOrgId)
        : !!window.currentTeamIsExternal;

      return {
        name: document.getElementById("team-name").value,
        abbreviation:
          document.getElementById("team-abbreviation").value || null,
        organizationId: selectedOrgId,
        conferenceDistrictId:
          document.getElementById("team-conference-district").value || null,
        sectionRegionId:
          document.getElementById("team-section-region").value || null,

        // Correct season logic
        seasonId: AdminPage.editingId
          ? window.editingSeasonId
          : window.activeSeasonId,

        levelId: document.getElementById("team-level").value || null,
        teamType: document.getElementById("team-type").value || null,
        teamMascot: document.getElementById("team-mascot").value || null,

        headCoachName: document.getElementById("team-head-coach").value,
        assistantCoach1Name: document.getElementById("team-asst1").value,
        assistantCoach2Name: document.getElementById("team-asst2").value,
        assistantCoach3Name: document.getElementById("team-asst3").value,
        assistantCoach4Name: document.getElementById("team-asst4").value,

        headCoachEmail: document.getElementById("team-head-coach-email").value,
        assistantCoach1Email: document.getElementById("team-asst1-email").value,
        assistantCoach2Email: document.getElementById("team-asst2-email").value,
        assistantCoach3Email: document.getElementById("team-asst3-email").value,
        assistantCoach4Email: document.getElementById("team-asst4-email").value,

        assistantCoach1HasLogin: document.getElementById("team-asst1-has-login")
          .checked,
        assistantCoach2HasLogin: document.getElementById("team-asst2-has-login")
          .checked,
        assistantCoach3HasLogin: document.getElementById("team-asst3-has-login")
          .checked,
        assistantCoach4HasLogin: document.getElementById("team-asst4-has-login")
          .checked,

        notes: document.getElementById("team-notes").value,
        gameManagerCode: getAccessCodeSuffix(document.getElementById("team-score-code").value),
        statManagerCode: getAccessCodeSuffix(document.getElementById("team-stat-code").value),
        isActive: document.getElementById("team-active").checked,
        isExternal: inferredExternal,
      };
    },
  });

  const showExternalToggle = document.getElementById("teams-show-external");
  if (showExternalToggle) {
    showExternalToggle.checked = false;
  }

  const teamOrg = document.getElementById("team-org");
  if (teamOrg) {
    teamOrg.addEventListener("change", applyTeamMascotRules);
  }
}

// =========================================================
// ASSISTANT COACH LOGIN TOGGLE LOGIC
// =========================================================
function wireAssistantCoachLoginToggles() {
  const pairs = [
    { email: "team-asst1-email", toggle: "team-asst1-has-login" },
    { email: "team-asst2-email", toggle: "team-asst2-has-login" },
    { email: "team-asst3-email", toggle: "team-asst3-has-login" },
    { email: "team-asst4-email", toggle: "team-asst4-has-login" },
  ];

  pairs.forEach(({ email, toggle }) => {
    const emailEl = document.getElementById(email);
    const toggleEl = document.getElementById(toggle);

    if (!emailEl || !toggleEl) return;

    const update = () => {
      const hasEmail = emailEl.value.trim().length > 0;
      toggleEl.disabled = !hasEmail;
      if (!hasEmail) toggleEl.checked = false;
    };

    emailEl.addEventListener("input", update);
    update();
  });
}

// =========================================================
// USER CREATION + TEAM ASSIGNMENT (FIXED VERSION)
// =========================================================
function generatePassword() {
  return "Temp1234!";
}

async function ensureCoachUser(name, email, orgId, teamId) {
  console.log(">>> ensureCoachUser() START");

  if (!email || email.trim() === "") {
    console.log(">>> No email provided — skipping coach user creation");
    return;
  }

  const parts = (name || "").trim().split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  console.log(">>> Parsed coach name:", { firstName, lastName });

  let user = null;

  try {
    user = await UsersAPI.getByEmail(email);
    console.log(">>> Existing user found:", user);
  } catch {
    console.log(">>> No existing user found — will create new one");
  }

  if (!user) {
    const password = generatePassword();

    const payload = {
      email,
      password,
      role: "Coach",
      organizationId: orgId,
      firstName,
      lastName,
      isActive: true,
    };

    console.log(">>> Creating NEW coach user:", payload);

    try {
      user = await UsersAPI.create(payload);
      console.log(">>> Coach user created:", user);
    } catch (err) {
      console.error("❌ Failed to create coach user:", err);
      throw err;
    }
  }

  try {
    console.log(`>>> Assigning coach ${user.id} to team ${teamId}`);
    await CoachTeamsApi.assign(user.id, teamId);
    console.log(">>> Coach assigned successfully");
  } catch (err) {
    console.error("❌ Failed to assign coach to team:", err);
    throw err;
  }

  console.log(">>> ensureCoachUser() COMPLETE");
}

// =========================================================
// ADD TEAM
// =========================================================
async function openAddTeam() {
  AdminPage.editingId = null;
  window.editingSeasonId = null;
  window.currentTeamIsExternal = false;
  window.currentEditingTeamId = null;
  const modalOverlay = document.getElementById("teamModalOverlay");
  if (modalOverlay) {
    delete modalOverlay.dataset.teamId;
  }
  await loadConferenceDistricts();
  await loadSectionRegions();
  AdminPage.config.clearForm();
  applyTeamMascotRules();

  document.getElementById("teamModalTitle").textContent = "Add Team";
  document.getElementById("teamModalOverlay").classList.add("active");

  wireAssistantCoachLoginToggles();
}

// =========================================================
// EDIT TEAM
// =========================================================
async function openEditTeam(id) {
  try {
    const team = await TeamApi.getById(id);
    await loadConferenceDistricts();
    await loadSectionRegions();
    AdminPage.editingId = id;
    window.currentEditingTeamId = id;
    const modalOverlay = document.getElementById("teamModalOverlay");
    if (modalOverlay) {
      modalOverlay.dataset.teamId = id;
    }
    AdminPage.config.populateForm(team);

    document.getElementById("teamModalTitle").textContent = "Edit Team";
    document.getElementById("teamModalOverlay").classList.add("active");
  } catch (err) {
    console.error("Failed to load team:", err);
    alert("Unable to load team details.");
  }
}

// =========================================================
// DELETE TEAM
// =========================================================
function openDeleteTeam(id) {
  AdminPage.deleteId = id;
  document.getElementById("teamDeleteModalOverlay").classList.add("active");
}

// =========================================================
// SAVE TEAM (AUTO-CREATE COACH USERS)
// =========================================================
async function saveTeam() {
  console.log(">>> saveTeam() START");
  console.log(">>> saveTeam() FIRED");

  const payload = AdminPage.config.collectFormData();
  if (!payload.teamType) {
    notify("Team type is required.", "error");
    return;
  }

  console.log(">>> PAYLOAD:", payload);

  let teamId;
  const orgId = payload.organizationId;

  try {
    if (AdminPage.editingId) {
      console.log(">>> Updating existing team:", AdminPage.editingId);
      await TeamApi.update(AdminPage.editingId, payload);
      teamId = AdminPage.editingId;
    } else {
      console.log(">>> Creating NEW team...");
      teamId = await TeamApi.create(payload);
      console.log(">>> Team created with ID:", teamId);
    }
  } catch (err) {
    const message = err?.message || "Failed to save team.";
    notify(message, "error");
    throw err;
  }

  console.log(">>> Processing HEAD COACH");
  console.log(">>> Head coach name:", payload.headCoachName);
  console.log(">>> Head coach email:", payload.headCoachEmail);

  await ensureCoachUser(
    payload.headCoachName,
    payload.headCoachEmail,
    orgId,
    teamId,
  );

  const assistants = [
    {
      name: payload.assistantCoach1Name,
      email: payload.assistantCoach1Email,
      hasLogin: payload.assistantCoach1HasLogin,
    },
    {
      name: payload.assistantCoach2Name,
      email: payload.assistantCoach2Email,
      hasLogin: payload.assistantCoach2HasLogin,
    },
    {
      name: payload.assistantCoach3Name,
      email: payload.assistantCoach3Email,
      hasLogin: payload.assistantCoach3HasLogin,
    },
    {
      name: payload.assistantCoach4Name,
      email: payload.assistantCoach4Email,
      hasLogin: payload.assistantCoach4HasLogin,
    },
  ];

  console.log(">>> Assistant coaches payload:", assistants);

  for (const ac of assistants) {
    console.log(">>> Checking assistant:", ac);

    if (ac.hasLogin && ac.email) {
      console.log(">>> Calling ensureCoachUser for assistant:", ac.email);
      await ensureCoachUser(ac.name, ac.email, orgId, teamId);
    } else {
      console.log(">>> Skipping assistant (no login or no email):", ac.email);
    }
  }

  console.log(">>> saveTeam() COMPLETE — closing modal and reloading data");

  AdminPage.closeModal();
  AdminPage.loadData();
}

// =========================================================
// FILTERS
// =========================================================
function applyTeamFiltersAndSearch() {
  renderTeamsGrouped(getFilteredTeams());
}

function wireTeamFilterEvents() {
  [
    "teams-search-bar",
    "filter-org",
    "filter-team-conference",
    "filter-team-section",
    "filter-level",
    "filter-team-type",
    "filter-status",
    "teams-show-external",
  ].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => {
          resetTeamsGroupPagination();
          applyTeamFiltersAndSearch();
        });
      }
      if (el) {
        el.addEventListener("change", () => {
          resetTeamsGroupPagination();
          applyTeamFiltersAndSearch();
        });
      }
    },
  );
}

// =========================================================
// GENERATE ACCESS CODES
// =========================================================
document.addEventListener("click", async (e) => {
  const btn = e.target?.closest?.("#btnGenerateCodes");
  if (btn) {
    // Check role permission
    if (!Auth.canGenerateAccessCodes()) {
      notify("Only Team Manager or OrgAdmin can generate access codes", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Generating...";

    try {
      // Only supported while editing an existing team.
      const teamId =
        window.currentEditingTeamId ||
        AdminPage.editingId ||
        document.getElementById("teamModalOverlay")?.dataset?.teamId ||
        "";

      if (!teamId) {
        notify("Open an existing team in Edit mode before generating access codes.", "warning");
        return;
      }

      // Call backend to generate codes
      const res = await authFetch(`/teams/${teamId}/generate-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const data = await res.json();
        document.getElementById("team-score-code").value = getAccessCodeSuffix(data.gameManagerCode);
        document.getElementById("team-stat-code").value = getAccessCodeSuffix(data.statManagerCode);
        notify("✓ Access codes generated successfully (GM-XXXXXX and SM-XXXXXX format)", "success");
      } else if (res.status === 403) {
        notify("You do not have permission to generate access codes for this team", "error");
      } else if (res.status === 401) {
        notify("Your session has expired. Please log in again.", "error");
      } else {
        notify("Failed to generate access codes", "error");
      }
    } catch (err) {
      console.error("Error generating codes:", err);
      notify("Error generating codes: " + err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate Access Codes";
    }
  }
});

// =========================================================
// INIT
// =========================================================
document.addEventListener("layoutLoaded", initTeamsPage);
if (window.__layoutAlreadyLoaded) initTeamsPage();
window.addEventListener("DOMContentLoaded", initTeamsPage);
