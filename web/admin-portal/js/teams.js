console.log("Teams.js loaded");

// =========================================================
// TEAMS PAGE — MODERNIZED + MATCHED DESIGN
// =========================================================

// Enforce SuperAdmin/OrgAdmin/TeamManager access
(function checkPermission() {
  if (!Auth.canManageTeams()) {
    showMessage("Access Denied: Team management requires Super Admin, Org Admin, or Team Manager role", "error");
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
    showMessage("Failed to load organizations", "error");
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
    showMessage("Failed to load levels", "error");
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
              <div class="code-badge gm-code">GM-${team.gameManagerCode ?? ""}</div>
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
        team.gameManagerCode ?? "";
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
        gameManagerCode: document.getElementById("team-score-code").value,
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
document.addEventListener("click", async (e) => {
  if (e.target.id === "btnGenerateCodes") {
    // Check role permission
    if (!Auth.canGenerateAccessCodes()) {
      showMessage("Only Team Manager or OrgAdmin can generate access codes", "error");
      return;
    }

    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "Generating...";

    try {
      // Get the team ID from the modal
      const teamIdInput = document.getElementById("team-id");
      if (!teamIdInput || !teamIdInput.value) {
        showMessage("Team ID not found", "error");
        return;
      }

      const teamId = teamIdInput.value;

      // Call backend to generate codes
      const res = await authFetch(`/teams/${teamId}/generate-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const data = await res.json();
        document.getElementById("team-score-code").value = data.gameManagerCode || "";
        document.getElementById("team-stat-code").value = data.statManagerCode || "";
        showMessage("✓ Access codes generated successfully (GM-XXXXXX and SM-XXXXXX format)", "success");
      } else if (res.status === 403) {
        showMessage("You do not have permission to generate access codes for this team", "error");
      } else if (res.status === 401) {
        showMessage("Your session has expired. Please log in again.", "error");
      } else {
        showMessage("Failed to generate access codes", "error");
      }
    } catch (err) {
      console.error("Error generating codes:", err);
      showMessage("Error generating codes: " + err.message, "error");
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
