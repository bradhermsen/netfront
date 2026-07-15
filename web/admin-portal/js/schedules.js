console.log("🔥 schedules.js LOADED");

// =========================================================
// GAME SCHEDULES MODULE (UNIFIED MODAL SYSTEM)
// Matches Org / Teams / Rosters / Players patterns
// =========================================================

// Enforce Team Manager/OrgAdmin/SuperAdmin-only access
(function checkPermission() {
  if (!Auth.canManageSchedules()) {
    showMessage("Access Denied: Schedule management requires Team Manager or Admin role", "error");
    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 2000);
  }
})();

let allTeams = [];
let allGameTypes = [];
let allGameRounds = [];
let allOfficials = [];
let allGames = [];

let currentGameId = null;

const PERIOD_LENGTH_PRESETS = [12, 15, 17, 20];

const allowedTeamTypes = new Map([
  ["boys", "Boys"],
  ["girls", "Girls"],
  ["co-ed", "Co-Ed"],
  ["coed", "Co-Ed"],
  ["men", "Men"],
  ["women", "Women"],
]);

// =========================================================
// LOOKUPS
// =========================================================
async function loadScheduleLookups() {
  try {
    const [teamsRes, typesRes, roundsRes, officialsRes] = await Promise.all([
      authFetch(`/teams`),
      authFetch(`/gametypes`),
      authFetch(`/gamerounds`),
      authFetch(`/officials`),
    ]);

    if (!teamsRes.ok || !typesRes.ok || !roundsRes.ok || !officialsRes.ok) {
      throw new Error("Failed to load schedule lookups");
    }

    allTeams = await teamsRes.json();
    allGameTypes = await typesRes.json();
    allGameRounds = await roundsRes.json();
    allOfficials = await officialsRes.json();
  } catch (err) {
    console.error("Error loading schedule lookups:", err);
    showMessage("Failed to load schedule data", "error");
  }
}

function fillSelect(id, list, valueField, textField, includeNone = false) {
  const el = document.getElementById(id);
  el.innerHTML = includeNone ? `<option value="">None</option>` : "";

  list.forEach((item) => {
    el.innerHTML += `<option value="${item[valueField]}">${item[textField]}</option>`;
  });
}

function normalizeTeamTypeValue(value) {
  const key = (value || "").toString().trim().toLowerCase();
  return allowedTeamTypes.get(key) || "";
}

function teamLabel(t) {
  if (!t) return "";

  const teamType = normalizeTeamTypeValue(t.teamType) || normalizeTeamTypeValue(t.gender);

  return [t.name, teamType, t.levelName]
    .map((value) => (value || "").toString().trim())
    .filter((value) => value.length > 0)
    .join(" ");
}

function organizationLabel(team) {
  return team.organizationName || "Unassigned";
}

function getOrganizations() {
  const organizations = new Map();

  allTeams.forEach((team) => {
    if (team.organizationId) {
      organizations.set(team.organizationId, team.organizationName || "Unassigned");
    }
  });

  return [...organizations.entries()]
    .map(([organizationId, organizationName]) => ({ organizationId, organizationName }))
    .sort((a, b) => a.organizationName.localeCompare(b.organizationName));
}

function getTeamsForOrganization(organizationId) {
  if (!organizationId) {
    return [...allTeams];
  }

  return allTeams.filter((team) => team.organizationId === organizationId);
}

function populateScheduleDropdowns() {
  const sorted = [...allTeams].sort((a, b) => teamLabel(a).localeCompare(teamLabel(b)));

  ["game-home-team", "game-away-team"].forEach((id) => {
    const el = document.getElementById(id);
    el.innerHTML = "";
    sorted.forEach((t) => {
      el.innerHTML += `<option value="${t.teamId}">${teamLabel(t)}</option>`;
    });
  });

  fillSelect("game-type", allGameTypes, "gameTypeId", "name");
  fillSelect("game-round", allGameRounds, "gameRoundId", "roundName", true);
  populateOfficialsSelect("game-referee-1", "Referee", "Select Referee 1");
  populateOfficialsSelect("game-referee-2", "Referee", "Select Referee 2");
  populateOfficialsSelect("game-linesman-1", "Linesman", "Select Linesman 1");
  populateOfficialsSelect("game-linesman-2", "Linesman", "Select Linesman 2");
}

function populateOfficialsSelect(selectId, role, placeholder) {
  const el = document.getElementById(selectId);
  if (!el) return;

  const filtered = allOfficials
    .filter((o) => {
      const officialRole = (o.role || "").toLowerCase();
      return role === "Referee"
        ? officialRole.includes("ref")
        : officialRole.includes("line");
    })
    .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));

  el.innerHTML = `<option value="">${placeholder}</option>`;
  filtered.forEach((o) => {
    const label = o.displayName || `${o.firstName || ""} ${o.lastName || ""}`.trim();
    el.innerHTML += `<option value="${o.officialId}">${label}</option>`;
  });
}

function getTeamLevelNameById(teamId) {
  const team = allTeams.find((t) => t.teamId === teamId);
  return team?.levelName ?? "";
}

function getDefaultPeriodLengthForLevel(levelName) {
  const normalized = (levelName || "").toLowerCase();
  if (normalized.includes("jv")) return 15;
  return 17;
}

function setPeriodLengthControls(value) {
  const select = document.getElementById("game-period-length");
  const customWrap = document.getElementById("game-period-length-custom-wrap");
  const customInput = document.getElementById("game-period-length-custom");
  const parsed = Number(value);

  if (Number.isFinite(parsed) && PERIOD_LENGTH_PRESETS.includes(parsed)) {
    select.value = String(parsed);
    customWrap.style.display = "none";
    customInput.value = "";
    return;
  }

  select.value = "custom";
  customWrap.style.display = "";
  customInput.value = Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
}

function getSelectedPeriodLengthMinutes() {
  const select = document.getElementById("game-period-length");
  const customInput = document.getElementById("game-period-length-custom");

  if (select.value === "custom") {
    const custom = Number(customInput.value);
    return Number.isFinite(custom) && custom > 0 ? custom : null;
  }

  const preset = Number(select.value);
  return Number.isFinite(preset) ? preset : null;
}

function wirePeriodLengthControls() {
  const select = document.getElementById("game-period-length");
  const customWrap = document.getElementById("game-period-length-custom-wrap");

  select.onchange = () => {
    if (select.value === "custom") {
      customWrap.style.display = "";
    } else {
      customWrap.style.display = "none";
    }
  };
}

function autoDefaultPeriodLengthFromHomeTeam() {
  if (currentGameId) return;
  const homeTeamId = document.getElementById("game-home-team").value;
  const levelName = getTeamLevelNameById(homeTeamId);
  const defaultMinutes = getDefaultPeriodLengthForLevel(levelName);
  setPeriodLengthControls(defaultMinutes);
}

function populateScheduleFilters() {
  const orgFilter = document.getElementById("filter-game-org");
  const selectedOrgId = orgFilter?.value ?? "";
  const teamFilter = document.getElementById("filter-game-team");
  const selectedTeamId = teamFilter?.value ?? "";
  const teamTypeFilter = document.getElementById("filter-game-team-type");
  const selectedTeamType = teamTypeFilter?.value ?? "";

  if (orgFilter) {
    orgFilter.innerHTML = `<option value="">Organization: All</option>`;
    getOrganizations().forEach((org) => {
      orgFilter.innerHTML += `<option value="${org.organizationId}">${org.organizationName}</option>`;
    });
    orgFilter.value = selectedOrgId;
  }

  // Team filter (unique teams from allTeams, sorted)
  if (teamFilter) {
    teamFilter.innerHTML = `<option value="">Team: All</option>`;
    getTeamsForOrganization(selectedOrgId)
      .sort((a, b) => teamLabel(a).localeCompare(teamLabel(b)))
      .forEach((t) => {
        teamFilter.innerHTML += `<option value="${t.teamId}">${teamLabel(t)}</option>`;
      });

    const selectedTeam = allTeams.find((team) => team.teamId === selectedTeamId);
    if (selectedTeam && (!selectedOrgId || selectedTeam.organizationId === selectedOrgId)) {
      teamFilter.value = selectedTeamId;
    }
  }

  // Level filter
  const levelFilter = document.getElementById("filter-game-level");
  if (levelFilter) {
    const levels = new Map();
    allTeams.forEach((t) => { if (t.levelId && t.levelName) levels.set(t.levelId, t.levelName); });
    levelFilter.innerHTML = `<option value="">Level: All</option>`;
    [...levels.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([id, name]) => {
        levelFilter.innerHTML += `<option value="${id}">${name}</option>`;
      });
  }

  // Team Type filter
  if (teamTypeFilter) {
    const typeOptions = new Map();
    getTeamsForOrganization(selectedOrgId).forEach((t) => {
      const teamType = normalizeTeamTypeValue(t.teamType) || normalizeTeamTypeValue(t.gender);
      if (teamType) typeOptions.set(teamType, teamType);
    });

    teamTypeFilter.innerHTML = `<option value="">Team Type: All</option>`;
    [...typeOptions.values()]
      .sort((a, b) => a.localeCompare(b))
      .forEach((teamType) => {
        teamTypeFilter.innerHTML += `<option value="${teamType}">${teamType}</option>`;
      });

    if ([...typeOptions.values()].includes(selectedTeamType)) {
      teamTypeFilter.value = selectedTeamType;
    }
  }

  // Type filter — use name as value since GameListItemDto only returns gameTypeName
  const typeFilter = document.getElementById("filter-game-type");
  if (typeFilter) {
    typeFilter.innerHTML = `<option value="">Type: All</option>`;
    allGameTypes.forEach((gt) => {
      typeFilter.innerHTML += `<option value="${gt.name}">${gt.name}</option>`;
    });
  }
}

// =========================================================
// FORMAT HELPERS
// =========================================================
function formatDate(dt) {
  const parts = extractDateTimeParts(dt);
  if (!parts) return "";

  const [year, month, day] = parts.date.split("-");
  return `${Number(month)}/${Number(day)}/${year}`;
}

function formatTime(dt) {
  const parts = extractDateTimeParts(dt);
  if (!parts) return "";

  const [h, m] = parts.time.split(":");
  let hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${m} ${ampm}`;
}

function formatInputDate(dt) {
  const parts = extractDateTimeParts(dt);
  return parts?.date || "";
}

function formatInputTime(dt) {
  const parts = extractDateTimeParts(dt);
  return parts?.time || "";
}

function extractDateTimeParts(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})/);
    if (match) {
      return {
        date: match[1],
        time: `${match[2]}:${match[3]}`,
      };
    }
  }

  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return null;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

function formatOfficialName(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "—";
}

// =========================================================
// FILTERS
// =========================================================
function applyGameFilters() {
  const search = document.getElementById("games-search-bar")?.value.toLowerCase() ?? "";
  const organizationId = document.getElementById("filter-game-org")?.value ?? "";
  const teamId = document.getElementById("filter-game-team")?.value ?? "";
  const levelId = document.getElementById("filter-game-level")?.value ?? "";
  const teamType = document.getElementById("filter-game-team-type")?.value ?? "";
  const typeName = document.getElementById("filter-game-type")?.value ?? "";
  const status = document.getElementById("filter-game-status")?.value ?? "";

  const filtered = allGames.filter((g) => {
    const homeTeam = allTeams.find((t) => t.teamId === g.homeTeamId);
    const awayTeam = allTeams.find((t) => t.teamId === g.awayTeamId);
    const homeLabel = homeTeam ? teamLabel(homeTeam) : g.homeTeamName;
    const awayLabel = awayTeam ? teamLabel(awayTeam) : g.awayTeamName;

    if (search && !homeLabel.toLowerCase().includes(search) && !awayLabel.toLowerCase().includes(search) && !g.arenaName?.toLowerCase().includes(search)) return false;
    if (organizationId && homeTeam?.organizationId !== organizationId && awayTeam?.organizationId !== organizationId) return false;
    if (teamId && g.homeTeamId !== teamId && g.awayTeamId !== teamId) return false;
    if (levelId) {
      const homeLevelMatch = homeTeam?.levelId === levelId;
      const awayLevelMatch = awayTeam?.levelId === levelId;
      if (!homeLevelMatch && !awayLevelMatch) return false;
    }
    if (teamType) {
      const homeType = homeTeam
        ? normalizeTeamTypeValue(homeTeam.teamType) || normalizeTeamTypeValue(homeTeam.gender)
        : "";
      const awayType = awayTeam
        ? normalizeTeamTypeValue(awayTeam.teamType) || normalizeTeamTypeValue(awayTeam.gender)
        : "";
      if (homeType !== teamType && awayType !== teamType) return false;
    }
    if (typeName && g.gameTypeName !== typeName) return false;
    if (status && g.status !== status) return false;
    return true;
  });

  renderGamesTable(filtered);
}

function wireGameFilters() {
  ["games-search-bar", "filter-game-org", "filter-game-team", "filter-game-level", "filter-game-team-type", "filter-game-type", "filter-game-status"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => {
      if (id === "filter-game-org") {
        populateScheduleFilters();
      }
      applyGameFilters();
    });

    el.addEventListener("change", () => {
      if (id === "filter-game-org") {
        populateScheduleFilters();
      }
      applyGameFilters();
    });
  });
}

// =========================================================
// LOAD + RENDER GAMES
// =========================================================
async function loadGames() {
  try {
    const res = await authFetch(`/games`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    allGames = await res.json();
    renderGamesTable(allGames);
  } catch (err) {
    console.error("Failed to load games:", err);
    showMessage("Failed to load games", "error");
  }
}

function renderGamesTable(list) {
  const tbody = document.getElementById("gamesTableBody");
  tbody.innerHTML = "";

  list.forEach((g) => {
    const statusLabel = String(g.status || "");
    const statusNormalized = statusLabel.trim().toLowerCase();
    const canDownloadFinalPdf = statusNormalized === "final" || statusNormalized === "completed";
    const homeTeam = allTeams.find((t) => t.teamId === g.homeTeamId);
    const awayTeam = allTeams.find((t) => t.teamId === g.awayTeamId);
    const homeLabel = homeTeam ? teamLabel(homeTeam) : g.homeTeamName;
    const awayLabel = awayTeam ? teamLabel(awayTeam) : g.awayTeamName;

    tbody.innerHTML += `
      <tr>
        <td>${homeLabel}</td>
        <td>${awayLabel}</td>
        <td>${formatDate(g.gameDateTime)}</td>
        <td>${formatTime(g.gameDateTime)}</td>
        <td>${g.arenaName}</td>
        <td>${g.rinkName}</td>
        <td>${g.gameTypeName}</td>
        <td class="officials-cell">
          <span>${formatOfficialName(g.referee1)}</span>
          <span>${formatOfficialName(g.referee2)}</span>
          <span>${formatOfficialName(g.linesman1)}</span>
          <span>${formatOfficialName(g.linesman2)}</span>
        </td>
        <td>${statusLabel}</td>
        <td class="actions-col">
          ${canDownloadFinalPdf ? `
          <button class="nf-btn-icon pdf" data-id="${g.gameId}" title="Download Final PDF">
            <i class="fa fa-file-pdf"></i>
          </button>
          ` : ""}
          <button class="nf-btn-icon edit" data-id="${g.gameId}">
            <i class="fa fa-edit"></i>
          </button>
          <button class="nf-btn-icon delete" data-id="${g.gameId}">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  wireGameRowButtons();
}

function wireGameRowButtons() {
  document.querySelectorAll(".nf-btn-icon.pdf").forEach((btn) => {
    btn.onclick = () => downloadFinalPdf(btn.dataset.id);
  });

  document.querySelectorAll(".nf-btn-icon.edit").forEach((btn) => {
    btn.onclick = () => openEditGame(btn.dataset.id);
  });

  document.querySelectorAll(".nf-btn-icon.delete").forEach((btn) => {
    btn.onclick = () => openDeleteGame(btn.dataset.id);
  });
}

async function downloadFinalPdf(gameId) {
  if (!gameId) return;

  try {
    const res = await authFetch(`/games/${gameId}/summary-pdf`);
    if (!res || !res.ok) {
      throw new Error(`HTTP ${res?.status ?? "no response"}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NetFront-GameSummary-${gameId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to download final PDF:", err);
    showMessage("Failed to download final PDF", "error");
  }
}

// =========================================================
// MODALS: OPEN ADD / EDIT
// =========================================================
function openAddGame() {
  currentGameId = null;

  populateScheduleDropdowns();

  document.getElementById("gameModalTitle").textContent = "Add Game";

  document.getElementById("game-home-team").value = "";
  document.getElementById("game-away-team").value = "";
  document.getElementById("game-date").value = "";
  document.getElementById("game-time").value = "";
  document.getElementById("game-arena-select").value = "";
  document.getElementById("game-arena-custom").value = "";
  document.getElementById("game-rink-select").value = "";
  document.getElementById("game-rink-custom").value = "";
  document.getElementById("game-type").value = "";
  document.getElementById("game-round").value = "";
  document.getElementById("game-referee-1").value = "";
  document.getElementById("game-referee-2").value = "";
  document.getElementById("game-linesman-1").value = "";
  document.getElementById("game-linesman-2").value = "";
  setPeriodLengthControls(17);
  document.getElementById("game-notes").value = "";
  document.getElementById("game-status").value = "Scheduled";

  wirePeriodLengthControls();
  document.getElementById("game-home-team").onchange = autoDefaultPeriodLengthFromHomeTeam;
  autoDefaultPeriodLengthFromHomeTeam();

  document.getElementById("gameModalOverlay").classList.add("active");
}

async function openEditGame(id) {
  currentGameId = id;
  populateScheduleDropdowns();
  document.getElementById("gameModalTitle").textContent = "Edit Game";
  document.getElementById("gameModalOverlay").classList.add("active");

  try {
    const res = await authFetch(`/games/${id}`);
    if (!res || !res.ok) {
      throw new Error(`HTTP ${res?.status ?? "no response"}`);
    }

    const g = await res.json();

    document.getElementById("game-home-team").value = g.homeTeamId;
    document.getElementById("game-away-team").value = g.awayTeamId;
    document.getElementById("game-date").value = formatInputDate(g.gameDateTime);
    document.getElementById("game-time").value = formatInputTime(g.gameDateTime);

    document.getElementById("game-arena-select").value = g.arenaName;
    document.getElementById("game-arena-custom").value = "";
    document.getElementById("game-rink-select").value = g.rinkName;
    document.getElementById("game-rink-custom").value = "";

    document.getElementById("game-type").value = g.gameTypeId;
    document.getElementById("game-round").value = g.gameRoundId ?? "";
    document.getElementById("game-referee-1").value = g.referee1OfficialId ?? "";
    document.getElementById("game-referee-2").value = g.referee2OfficialId ?? "";
    document.getElementById("game-linesman-1").value = g.linesman1OfficialId ?? "";
    document.getElementById("game-linesman-2").value = g.linesman2OfficialId ?? "";
    setPeriodLengthControls(g.periodLengthMinutes);
    document.getElementById("game-notes").value = g.notes ?? "";
    document.getElementById("game-status").value = g.status;

    wirePeriodLengthControls();
    document.getElementById("game-home-team").onchange = autoDefaultPeriodLengthFromHomeTeam;
  } catch (err) {
    console.error("Failed to load game for edit:", err);
    showMessage("Unable to load game details for editing", "error");
  }
}

// =========================================================
// SAVE GAME
// =========================================================
async function saveGame() {
  const date = document.getElementById("game-date").value;
  const time = document.getElementById("game-time").value;
  const gameDateTime = `${date}T${time}:00`;

  if (!date || !time) {
    showMessage("Game date and time are required", "error");
    return;
  }

  const payload = {
    homeTeamId: document.getElementById("game-home-team").value,
    awayTeamId: document.getElementById("game-away-team").value,
    gameDateTime,
    arenaName:
      document.getElementById("game-arena-custom").value ||
      document.getElementById("game-arena-select").value,
    rinkName:
      document.getElementById("game-rink-custom").value ||
      document.getElementById("game-rink-select").value,
    gameTypeId: parseInt(document.getElementById("game-type").value),
    gameRoundId: document.getElementById("game-round").value
      ? parseInt(document.getElementById("game-round").value)
      : null,
    referee1OfficialId: document.getElementById("game-referee-1").value || null,
    referee2OfficialId: document.getElementById("game-referee-2").value || null,
    linesman1OfficialId: document.getElementById("game-linesman-1").value || null,
    linesman2OfficialId: document.getElementById("game-linesman-2").value || null,
    periodLengthMinutes: getSelectedPeriodLengthMinutes(),
    notes: document.getElementById("game-notes").value,
    status: document.getElementById("game-status").value,
  };

  if (!payload.periodLengthMinutes) {
    showMessage("Please select a valid period length", "error");
    return;
  }

  const method = currentGameId ? "PUT" : "POST";
  const url = currentGameId
    ? `/games/${currentGameId}`
    : `/games`;

  const res = await authFetch(url, {
    method,
    body: JSON.stringify(payload),
  });

  if (!res || !res.ok) {
    showMessage("Failed to save game", "error");
    return;
  }

  closeGameModal();
  loadGames();
}

// =========================================================
// DELETE GAME
// =========================================================
function openDeleteGame(id) {
  currentGameId = id;
  document.getElementById("gameDeleteModalOverlay").classList.add("active");
}

async function confirmDeleteGame() {
  const res = await authFetch(`/games/${currentGameId}`, {
    method: "DELETE",
  });

  if (!res || !res.ok) {
    showMessage("Failed to delete game", "error");
    return;
  }

  closeDeleteGameModal();
  loadGames();
}

// =========================================================
// CLOSE MODALS
// =========================================================
function closeGameModal() {
  document.getElementById("gameModalOverlay").classList.remove("active");
}

function closeDeleteGameModal() {
  document.getElementById("gameDeleteModalOverlay").classList.remove("active");
}

// =========================================================
// PAGE INITIALIZATION
// =========================================================
async function initSchedulesPage() {
  if (window.__schedulesPageInitialized) return;
  if (!document.getElementById("gamesTableBody")) return;

  window.__schedulesPageInitialized = true;
  console.log("schedules.js initialized");

  document.getElementById("btnAddGame").onclick = openAddGame;

  document.getElementById("gameSave").onclick = saveGame;
  document.getElementById("gameCancel").onclick = closeGameModal;

  document.getElementById("gameDeleteConfirm").onclick = confirmDeleteGame;
  document.getElementById("gameDeleteCancel").onclick = closeDeleteGameModal;

  await loadScheduleLookups();
  populateScheduleFilters();
  wireGameFilters();
  loadGames();
}

document.addEventListener("layoutLoaded", initSchedulesPage);
if (document.getElementById("gamesTableBody")) {
  initSchedulesPage();
}
