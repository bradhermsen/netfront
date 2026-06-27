console.log("Teams.js loaded");

// =========================================================
// TEAMS PAGE — MODERNIZED + MATCHED DESIGN
// =========================================================

// =========================================================
// LOAD ALL TEAM DROPDOWNS
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
// SEASONS DISPLAY
// ------------------------------
async function loadTeamSeasons() {
  try {
    console.log("loadTeamSeasons() fired");

    const res = await fetch(`${window.apiBase}/seasons`);
    const seasons = await res.json();

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
/* ABBREVIATION GENERATION */
// =========================================================
function generateTeamAbbreviation(
  teamName,
  levelName,
  existingAbbreviations = [],
) {
  if (!teamName || !levelName) return "";

  const highSchoolLevels = [
    "Varsity Boys",
    "Varsity Girls",
    "JV Boys",
    "JV Girls",
  ];

  const removeWords = [
    "High School",
    "Senior",
    "School",
    "HS",
    "North",
    "South",
    "East",
    "West",
  ];

  let cleaned = teamName;
  removeWords.forEach((w) => {
    cleaned = cleaned.replace(new RegExp(w, "gi"), "");
  });

  cleaned = cleaned.trim();

  const consonants = cleaned
    .replace(/[^A-Za-z]/g, "")
    .replace(/[AEIOU]/gi, "")
    .toUpperCase();

  const teamPrefix = consonants.substring(0, 3);

  const typePrefix = highSchoolLevels.includes(levelName) ? "HS" : "YO";

  const levelParts = levelName.split(" ");
  const levelPrefix = levelParts
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const base = `${teamPrefix}-${typePrefix}-${levelPrefix}`;

  let finalAbbr = base;
  let counter = 2;

  while (existingAbbreviations.includes(finalAbbr)) {
    finalAbbr = `${base}-${counter}`;
    counter++;
  }

  return finalAbbr;
}

function updateTeamAbbreviation() {
  const nameEl = document.getElementById("team-name");
  const levelSelect = document.getElementById("team-level");
  const abbrEl = document.getElementById("team-abbreviation");

  if (!nameEl || !levelSelect || !abbrEl) return;

  const currentAbbr = abbrEl.value?.trim();

  // Don’t overwrite existing abbreviation when editing unless it’s empty
  if (AdminPage?.editingId && currentAbbr) return;

  const name = nameEl.value;
  const levelName =
    levelSelect.options[levelSelect.selectedIndex]?.textContent || "";

  if (!name || !levelName) {
    return;
  }

  const existing =
    (window.loadedTeams || []).map((t) => t.abbreviation).filter((a) => !!a) ||
    [];

  const abbr = generateTeamAbbreviation(name, levelName, existing);
  abbrEl.value = abbr;
}

function wireTeamAbbreviation() {
  const nameEl = document.getElementById("team-name");
  const levelSelect = document.getElementById("team-level");

  if (!nameEl || !levelSelect) return;

  nameEl.addEventListener("input", updateTeamAbbreviation);
  levelSelect.addEventListener("change", updateTeamAbbreviation);
}

// =========================================================
// MAIN PAGE INITIALIZER
// =========================================================
function initTeamsPage() {
  if (!document.getElementById("teamsBody")) return;

  AdminPage.init({
    tableBodyId: "teamsBody",
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
      const body = document.getElementById("teamsBody");
      body.innerHTML = "";

      // Keep a copy for abbreviation duplicate detection
      window.loadedTeams = teams || [];

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
        "team-head-coach",
        "team-asst1",
        "team-asst2",
        "team-asst3",
        "team-asst4",
        "team-notes",
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
      document.getElementById("team-external").checked = false;
      document.getElementById("team-org").disabled = false;

      // Re-wire toggles after clearing
      wireAssistantCoachLoginToggles();
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
        team.scorekeeperCode ?? "";
      document.getElementById("team-stat-code").value =
        team.statManagerCode ?? "";

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
      const isExternal = document.getElementById("team-external").checked;

      return {
        name: document.getElementById("team-name").value,
        abbreviation:
          document.getElementById("team-abbreviation").value || null,
        organizationId: isExternal
          ? null
          : document.getElementById("team-org").value || null,

        // Correct season logic
        seasonId: AdminPage.editingId
          ? window.editingSeasonId
          : window.activeSeasonId,

        levelId: document.getElementById("team-level").value || null,

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
        scorekeeperCode: document.getElementById("team-score-code").value,
        statManagerCode: document.getElementById("team-stat-code").value,
        isActive: document.getElementById("team-active").checked,
        isExternal: isExternal,
      };
    },
  });
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
function openAddTeam() {
  AdminPage.editingId = null;
  window.editingSeasonId = null;
  AdminPage.config.clearForm();

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
  console.log(">>> PAYLOAD:", payload);

  let teamId;
  const orgId = payload.organizationId;

  if (AdminPage.editingId) {
    console.log(">>> Updating existing team:", AdminPage.editingId);
    await TeamApi.update(AdminPage.editingId, payload);
    teamId = AdminPage.editingId;
  } else {
    console.log(">>> Creating NEW team...");
    teamId = await TeamApi.create(payload);
    console.log(">>> Team created with ID:", teamId);
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
// GENERATE ACCESS CODES
// =========================================================
document.addEventListener("click", (e) => {
  if (e.target.id === "btnGenerateCodes") {
    const sk = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sm = Math.random().toString(36).substring(2, 8).toUpperCase();

    document.getElementById("team-score-code").value = sk;
    document.getElementById("team-stat-code").value = sm;
  }
});

// =========================================================
// INIT
// =========================================================
document.addEventListener("layoutLoaded", initTeamsPage);
if (window.__layoutAlreadyLoaded) initTeamsPage();
window.addEventListener("DOMContentLoaded", initTeamsPage);
