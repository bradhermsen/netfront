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
let managedArenas = [];
let venueMode = "external";

let currentGameId = null;
let gameDatePicker = null;
let gameTimePicker = null;

const PERIOD_LENGTH_PRESETS = [12, 15, 17, 20];

const allowedTeamTypes = new Map([
  ["boys", "Boys"],
  ["girls", "Girls"],
  ["co-ed", "Co-Ed"],
  ["coed", "Co-Ed"],
  ["men", "Men"],
  ["women", "Women"],
]);

const officialScheduleSelectIds = [
  "game-referee-1",
  "game-referee-2",
  "game-linesman-1",
  "game-linesman-2",
];

const STATUS_GROUP_ORDER = [
  "In Progress",
  "Scheduled",
  "Needs Setup",
  "Missing Roster",
  "Final",
  "Cancelled / Postponed",
];

const STATUS_PAGE_SIZE = 10;
const statusPaginationState = {};

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

function setVenueMode(mode) {
  venueMode = mode === "managed" ? "managed" : "external";
  document.getElementById("game-managed-venue-fields").classList.toggle("hidden", venueMode !== "managed");
  document.getElementById("game-external-venue-fields").classList.toggle("hidden", venueMode !== "external");
  document.getElementById("game-venue-managed").classList.toggle("active", venueMode === "managed");
  document.getElementById("game-venue-external").classList.toggle("active", venueMode === "external");
}

async function loadManagedVenues(selectedArenaId = "", selectedRinkId = "") {
  const teamIds = [document.getElementById("game-home-team").value, document.getElementById("game-away-team").value];
  const organizationIds = [...new Set(teamIds.map((teamId) => allTeams.find((team) => team.teamId === teamId)?.organizationId).filter(Boolean))];
  const results = await Promise.all(organizationIds.map((organizationId) => FacilityApi.getForOrganization(organizationId).catch(() => [])));
  const byId = new Map();
  results.flat().filter((arena) => arena.isActive).forEach((arena) => byId.set(arena.arenaId, arena));
  managedArenas = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));

  const arenaSelect = document.getElementById("game-arena-id");
  arenaSelect.innerHTML = `<option value="">Select Arena</option>${managedArenas.map((arena) => `<option value="${arena.arenaId}">${arena.name}</option>`).join("")}`;
  if (selectedArenaId && byId.has(selectedArenaId)) arenaSelect.value = selectedArenaId;
  populateManagedRinks(selectedRinkId);
}

function populateManagedRinks(selectedRinkId = "") {
  const arena = managedArenas.find((item) => item.arenaId === document.getElementById("game-arena-id").value);
  const rinks = (arena?.rinks || []).filter((rink) => rink.isActive);
  const rinkSelect = document.getElementById("game-rink-id");
  rinkSelect.innerHTML = `<option value="">Select Rink</option>${rinks.map((rink) => `<option value="${rink.rinkId}">${rink.name}</option>`).join("")}`;
  if (selectedRinkId && rinks.some((rink) => rink.rinkId === selectedRinkId)) rinkSelect.value = selectedRinkId;
  updateManagedGatewayStatus();
}

function updateManagedGatewayStatus() {
  const arena = managedArenas.find((item) => item.arenaId === document.getElementById("game-arena-id").value);
  const rink = arena?.rinks.find((item) => item.rinkId === document.getElementById("game-rink-id").value);
  const gateway = rink?.gateways?.find((item) => item.isPrimary && item.isActive);
  document.getElementById("game-gateway-status").textContent = !rink
    ? "Select a rink to view scoreboard mode."
    : gateway || rink.gatewayAvailable
      ? "NetFront Gateway configured for this rink."
      : "No gateway configured. Game Manager will use manual scoreboard mode.";
}

function wireVenueControls() {
  document.getElementById("game-venue-managed").onclick = () => setVenueMode("managed");
  document.getElementById("game-venue-external").onclick = () => setVenueMode("external");
  document.getElementById("game-arena-id").onchange = () => populateManagedRinks();
  document.getElementById("game-rink-id").onchange = updateManagedGatewayStatus;
}

function getTeamsForModalTypeFilter(teamType) {
  if (!teamType) {
    return [...allTeams];
  }

  return allTeams.filter((team) => {
    const normalized = normalizeTeamTypeValue(team.teamType) || normalizeTeamTypeValue(team.gender);
    return normalized === teamType;
  });
}

function populateGameTeamTypeFilter(selectedTeamType = "") {
  const teamTypeSelect = document.getElementById("game-team-type");
  if (!teamTypeSelect) return;

  const typeOptions = new Set(
    allTeams
      .map((team) => normalizeTeamTypeValue(team.teamType) || normalizeTeamTypeValue(team.gender))
      .filter(Boolean),
  );

  teamTypeSelect.innerHTML = `<option value="">All Team Types</option>`;
  [...typeOptions]
    .sort((a, b) => a.localeCompare(b))
    .forEach((teamType) => {
      teamTypeSelect.innerHTML += `<option value="${teamType}">${teamType}</option>`;
    });

  if (selectedTeamType && typeOptions.has(selectedTeamType)) {
    teamTypeSelect.value = selectedTeamType;
  }
}

function populateGameOrganizationDropdowns(selectedHomeTeamId = "", selectedAwayTeamId = "") {
  const organizations = getOrganizations();
  const homeOrganizationId = allTeams.find((team) => team.teamId === selectedHomeTeamId)?.organizationId || organizations[0]?.organizationId || "";
  const awayOrganizationId = allTeams.find((team) => team.teamId === selectedAwayTeamId)?.organizationId || homeOrganizationId;

  [["game-home-organization", homeOrganizationId], ["game-away-organization", awayOrganizationId]].forEach(([id, selectedId]) => {
    const select = document.getElementById(id);
    select.innerHTML = organizations.map((org) => `<option value="${org.organizationId}">${org.organizationName}</option>`).join("");
    select.value = selectedId;
  });
}

function populateGameTeamDropdowns({ selectedTeamType = "", selectedHomeTeamId = "", selectedAwayTeamId = "" } = {}) {
  const typeFilteredTeams = getTeamsForModalTypeFilter(selectedTeamType);

  ["game-home-team", "game-away-team"].forEach((id) => {
    const el = document.getElementById(id);
    const organizationSelectId = id === "game-home-team" ? "game-home-organization" : "game-away-organization";
    const organizationId = document.getElementById(organizationSelectId)?.value || "";
    const sorted = typeFilteredTeams
      .filter((team) => !organizationId || team.organizationId === organizationId)
      .sort((a, b) => teamLabel(a).localeCompare(teamLabel(b)));
    el.innerHTML = "";
    sorted.forEach((t) => {
      el.innerHTML += `<option value="${t.teamId}">${teamLabel(t)}</option>`;
    });

    if (id === "game-home-team" && selectedHomeTeamId && sorted.some((team) => team.teamId === selectedHomeTeamId)) {
      el.value = selectedHomeTeamId;
    }

    if (id === "game-away-team" && selectedAwayTeamId && sorted.some((team) => team.teamId === selectedAwayTeamId)) {
      el.value = selectedAwayTeamId;
    }
  });
}

function wireGameTeamTypeModalFilter() {
  const teamTypeSelect = document.getElementById("game-team-type");
  if (!teamTypeSelect) return;

  teamTypeSelect.onchange = () => {
    const selectedHomeTeamId = document.getElementById("game-home-team")?.value || "";
    const selectedAwayTeamId = document.getElementById("game-away-team")?.value || "";

    populateGameTeamDropdowns({
      selectedTeamType: teamTypeSelect.value,
      selectedHomeTeamId,
      selectedAwayTeamId,
    });

    autoDefaultPeriodLengthFromHomeTeam();
    loadManagedVenues();
  };

  [["game-home-organization", "game-home-team"], ["game-away-organization", "game-away-team"]].forEach(([organizationId, teamId]) => {
    document.getElementById(organizationId).onchange = () => {
      populateGameTeamDropdowns({
        selectedTeamType: teamTypeSelect.value,
        selectedHomeTeamId: teamId === "game-home-team" ? "" : document.getElementById("game-home-team").value,
        selectedAwayTeamId: teamId === "game-away-team" ? "" : document.getElementById("game-away-team").value,
      });
      autoDefaultPeriodLengthFromHomeTeam();
      loadManagedVenues();
    };
  });
}

function populateScheduleDropdowns({ selectedTeamType = "", selectedHomeTeamId = "", selectedAwayTeamId = "" } = {}) {
  populateGameTeamTypeFilter(selectedTeamType);
  populateGameOrganizationDropdowns(selectedHomeTeamId, selectedAwayTeamId);
  populateGameTeamDropdowns({ selectedTeamType, selectedHomeTeamId, selectedAwayTeamId });
  wireGameTeamTypeModalFilter();

  fillSelect("game-type", allGameTypes, "gameTypeId", "name");
  fillSelect("game-round", allGameRounds, "gameRoundId", "roundName", true);
  populateOfficialsSelect("game-referee-1", "Referee", "Select Referee 1");
  populateOfficialsSelect("game-referee-2", "Referee", "Select Referee 2");
  populateOfficialsSelect("game-linesman-1", "Linesman", "Select Linesman 1");
  populateOfficialsSelect("game-linesman-2", "Linesman", "Select Linesman 2");
  wireOfficialSelectionUniqueness();
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

function getSelectedOfficialValues() {
  return officialScheduleSelectIds
    .map((id) => document.getElementById(id)?.value || "")
    .filter(Boolean);
}

function hasDuplicateOfficials() {
  const selected = getSelectedOfficialValues();
  return new Set(selected).size !== selected.length;
}

function syncOfficialSelectOptions() {
  const selectedValues = new Set(getSelectedOfficialValues());

  officialScheduleSelectIds.forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = select.value;
    Array.from(select.options).forEach((option) => {
      if (!option.value) {
        option.disabled = false;
        return;
      }

      option.disabled = selectedValues.has(option.value) && option.value !== currentValue;
    });
  });
}

function wireOfficialSelectionUniqueness() {
  officialScheduleSelectIds.forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.onchange = syncOfficialSelectOptions;
  });

  syncOfficialSelectOptions();
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

function lockPickerWheelScroll(instance) {
  const picker = instance?.calendarContainer;
  if (!picker || picker.dataset.wheelLocked === "1") return;

  const blockWheel = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  picker.addEventListener("wheel", blockWheel, { passive: false });
  picker.dataset.wheelLocked = "1";
}

function setGameModalBackgroundScrollLock(isLocked) {
  document.body.classList.toggle("nf-modal-open", !!isLocked);
}

function initDateTimePickers() {
  const dateInput = document.getElementById("game-date");
  const timeInput = document.getElementById("game-time");
  if (!dateInput || !timeInput) return;

  if (typeof window.flatpickr !== "function") {
    // Fallback: use native controls so pickers still open if CDN/lib is unavailable.
    dateInput.type = "date";
    timeInput.type = "time";
    dateInput.classList.add("nf-input");
    timeInput.classList.add("nf-input");
    dateInput.placeholder = "";
    timeInput.placeholder = "";
    console.warn("flatpickr not available; falling back to native date/time pickers.");
    return;
  }

  dateInput.type = "text";
  timeInput.type = "text";

  if (!gameDatePicker) {
    gameDatePicker = window.flatpickr(dateInput, {
      dateFormat: "m/d/Y",
      allowInput: false,
      disableMobile: true,
      clickOpens: true,
      positionElement: dateInput,
      position: "below left",
      onOpen: [(_, __, instance) => lockPickerWheelScroll(instance)],
    });
  }

  if (!gameTimePicker) {
    gameTimePicker = window.flatpickr(timeInput, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "h:i K",
      allowInput: false,
      disableMobile: true,
      minuteIncrement: 5,
      time_24hr: false,
      clickOpens: true,
      positionElement: timeInput,
      position: "below left",
      onOpen: [(_, __, instance) => lockPickerWheelScroll(instance)],
    });
  }
}

function setGameDateInputValue(value) {
  const input = document.getElementById("game-date");
  if (!input) return;

  if (gameDatePicker) {
    if (value) {
      gameDatePicker.setDate(value, true, "Y-m-d");
    } else {
      gameDatePicker.clear();
    }
    return;
  }

  input.value = value || "";
}

function setGameTimeInputValue(value) {
  const input = document.getElementById("game-time");
  if (!input) return;

  if (gameTimePicker) {
    if (value) {
      gameTimePicker.setDate(value, true, "H:i");
    } else {
      gameTimePicker.clear();
    }
    return;
  }

  input.value = value || "";
}

function getGameDateInputValue() {
  if (gameDatePicker?.selectedDates?.[0] && typeof window.flatpickr?.formatDate === "function") {
    return window.flatpickr.formatDate(gameDatePicker.selectedDates[0], "Y-m-d");
  }

  const raw = (document.getElementById("game-date")?.value || "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  return "";
}

function getGameTimeInputValue() {
  if (gameTimePicker?.selectedDates?.[0] && typeof window.flatpickr?.formatDate === "function") {
    return window.flatpickr.formatDate(gameTimePicker.selectedDates[0], "H:i");
  }

  const raw = (document.getElementById("game-time")?.value || "").trim();
  if (!raw) return "";

  if (/^\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = match[2];
    const meridiem = match[3].toUpperCase();

    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  return "";
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

function normalizeStatusGroup(statusLabel) {
  const normalized = String(statusLabel || "").trim().toLowerCase();

  if (normalized === "cancelled" || normalized === "postponed") {
    return "Cancelled / Postponed";
  }

  if (normalized === "in progress") {
    return "In Progress";
  }

  if (normalized === "scheduled") {
    return "Scheduled";
  }

  if (normalized === "final" || normalized === "completed" || normalized === "closed") {
    return "Final";
  }

  if (normalized === "needs setup") {
    return "Needs Setup";
  }

  if (normalized === "missing roster") {
    return "Missing Roster";
  }

  return statusLabel || "Scheduled";
}

function getMonthGroupLabel(dt) {
  const parsed = new Date(dt);
  if (Number.isNaN(parsed.getTime())) return "Unknown Month";
  return parsed.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function resetStatusPagination() {
  Object.keys(statusPaginationState).forEach((key) => {
    delete statusPaginationState[key];
  });
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

  renderGamesGrouped(filtered);
}

function wireGameFilters() {
  ["games-search-bar", "filter-game-org", "filter-game-team", "filter-game-level", "filter-game-team-type", "filter-game-type", "filter-game-status"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => {
      if (id === "filter-game-org") {
        populateScheduleFilters();
      }
      resetStatusPagination();
      applyGameFilters();
    });

    el.addEventListener("change", () => {
      if (id === "filter-game-org") {
        populateScheduleFilters();
      }
      resetStatusPagination();
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
    resetStatusPagination();
    renderGamesGrouped(allGames);
  } catch (err) {
    console.error("Failed to load games:", err);
    showMessage("Failed to load games", "error");
  }
}

function renderGamesGrouped(list) {
  const container = document.getElementById("gamesGroupedList");
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `<div class="schedules-empty">No games match your current filters.</div>`;
    return;
  }

  const groups = new Map();

  [...list]
    .sort((a, b) => new Date(a.gameDateTime) - new Date(b.gameDateTime))
    .forEach((game) => {
      const statusKey = normalizeStatusGroup(game.status);
      if (!groups.has(statusKey)) {
        groups.set(statusKey, []);
      }

      groups.get(statusKey).push(game);
    });

  const statusKeys = [
    ...STATUS_GROUP_ORDER.filter((status) => groups.has(status)),
    ...[...groups.keys()].filter((status) => !STATUS_GROUP_ORDER.includes(status)),
  ];

  container.innerHTML = statusKeys
    .map((statusKey, statusIndex) => {
      const statusGames = groups.get(statusKey) || [];
      const totalPages = Math.max(1, Math.ceil(statusGames.length / STATUS_PAGE_SIZE));
      const currentPage = Math.min(statusPaginationState[statusKey] || 1, totalPages);
      statusPaginationState[statusKey] = currentPage;

      const start = (currentPage - 1) * STATUS_PAGE_SIZE;
      const pagedGames = statusGames.slice(start, start + STATUS_PAGE_SIZE);

      const monthGroups = new Map();
      pagedGames.forEach((game) => {
        const monthLabel = getMonthGroupLabel(game.gameDateTime);
        if (!monthGroups.has(monthLabel)) {
          monthGroups.set(monthLabel, []);
        }

        monthGroups.get(monthLabel).push(game);
      });

      const monthMarkup = [...monthGroups.entries()]
        .map(([monthLabel, monthGames], monthIndex) => {
          const cards = monthGames
            .map((g) => {
              const statusLabel = String(g.status || "");
              const statusNormalized = statusLabel.trim().toLowerCase();
              const canDownloadFinalPdf = statusNormalized === "final" || statusNormalized === "completed";
              const homeTeam = allTeams.find((t) => t.teamId === g.homeTeamId);
              const awayTeam = allTeams.find((t) => t.teamId === g.awayTeamId);
              const homeLabel = homeTeam ? teamLabel(homeTeam) : g.homeTeamName;
              const awayLabel = awayTeam ? teamLabel(awayTeam) : g.awayTeamName;

              return `
                <article class="schedule-game-card">
                  <div class="schedule-game-top">
                    <h4>${homeLabel} vs ${awayLabel}</h4>
                    <span class="schedule-status-badge">${statusLabel || statusKey}</span>
                  </div>

                  <div class="schedule-game-meta">
                    <span><i class="fa fa-calendar"></i> ${formatDate(g.gameDateTime)} ${formatTime(g.gameDateTime)}</span>
                    <span><i class="fa fa-map-marker-alt"></i> ${g.arenaName || "TBD"} ${g.rinkName ? `• ${g.rinkName}` : ""}</span>
                    <span><i class="fa fa-flag"></i> ${g.gameTypeName || "Unspecified"}</span>
                  </div>

                  <div class="schedule-game-officials">
                    <span>Ref 1: ${formatOfficialName(g.referee1)}</span>
                    <span>Ref 2: ${formatOfficialName(g.referee2)}</span>
                    <span>Line 1: ${formatOfficialName(g.linesman1)}</span>
                    <span>Line 2: ${formatOfficialName(g.linesman2)}</span>
                  </div>

                  <div class="schedule-game-actions">
                    ${canDownloadFinalPdf ? `
                    <button class="nf-btn-icon pdf" data-id="${g.gameId}" title="Download Final PDF">
                      <i class="fa fa-file-pdf"></i>
                    </button>
                    ` : ""}
                    <button class="nf-btn-icon edit" data-id="${g.gameId}" title="Edit">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="nf-btn-icon delete" data-id="${g.gameId}" title="Delete">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </article>
              `;
            })
            .join("");

          return `
            <details class="schedule-month-group" ${monthIndex === 0 ? "open" : ""}>
              <summary>
                <span>${monthLabel}</span>
                <span class="schedule-count">${monthGames.length}</span>
              </summary>
              <div class="schedule-month-cards">${cards}</div>
            </details>
          `;
        })
        .join("");

      return `
        <details class="schedule-status-group" ${statusIndex < 2 ? "open" : ""}>
          <summary>
            <span>${statusKey}</span>
            <span class="schedule-count">${statusGames.length}</span>
          </summary>

          <div class="schedule-status-content">
            ${monthMarkup}

            ${statusGames.length > STATUS_PAGE_SIZE ? `
            <div class="schedule-pagination">
              <button class="nf-btn nf-btn-secondary schedule-page-btn" data-status-key="${statusKey}" data-direction="prev" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
              <span>Page ${currentPage} of ${totalPages}</span>
              <button class="nf-btn nf-btn-secondary schedule-page-btn" data-status-key="${statusKey}" data-direction="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
            </div>
            ` : ""}
          </div>
        </details>
      `;
    })
    .join("");

  wireGameRowButtons();
  wireStatusPaginationButtons();
}

function wireStatusPaginationButtons() {
  document.querySelectorAll(".schedule-page-btn").forEach((btn) => {
    btn.onclick = () => {
      const statusKey = btn.dataset.statusKey;
      const direction = btn.dataset.direction;
      const current = statusPaginationState[statusKey] || 1;

      if (direction === "prev") {
        statusPaginationState[statusKey] = Math.max(1, current - 1);
      } else {
        statusPaginationState[statusKey] = current + 1;
      }

      applyGameFilters();
    };
  });
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

function getScheduleDeepLinkOptions() {
  const params = new URLSearchParams(window.location.search);
  const action = (params.get("action") || "").toLowerCase();
  const teamId = params.get("teamId") || "";

  if (action !== "add-game") {
    return null;
  }

  const team = allTeams.find((item) => item.teamId === teamId);
  if (!team) {
    return null;
  }

  const selectedTeamType = normalizeTeamTypeValue(team.teamType) || normalizeTeamTypeValue(team.gender);
  return {
    selectedTeamType,
    selectedHomeTeamId: team.teamId,
  };
}

function clearScheduleDeepLinkQuery() {
  if (!window.location.search) return;
  const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
  window.history.replaceState({}, document.title, cleanUrl);
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
async function openAddGame(options = {}) {
  currentGameId = null;

  initDateTimePickers();
  populateScheduleDropdowns(options);

  document.getElementById("gameModalTitle").textContent = "Add Game";

  document.getElementById("game-team-type").value = options.selectedTeamType || "";
  document.getElementById("game-home-team").value = "";
  document.getElementById("game-away-team").value = "";
  setGameDateInputValue("");
  setGameTimeInputValue("");
  document.getElementById("game-arena-custom").value = "";
  document.getElementById("game-rink-custom").value = "";
  document.getElementById("game-venue-address").value = "";
  document.getElementById("game-type").value = "";
  document.getElementById("game-round").value = "";
  document.getElementById("game-referee-1").value = "";
  document.getElementById("game-referee-2").value = "";
  document.getElementById("game-linesman-1").value = "";
  document.getElementById("game-linesman-2").value = "";
  setPeriodLengthControls(17);
  document.getElementById("game-notes").value = "";
  document.getElementById("game-status").value = "Scheduled";

  if (options.selectedHomeTeamId) {
    document.getElementById("game-home-team").value = options.selectedHomeTeamId;
  }

  if (options.selectedAwayTeamId) {
    document.getElementById("game-away-team").value = options.selectedAwayTeamId;
  }

  await loadManagedVenues();
  setVenueMode(managedArenas.length ? "managed" : "external");
  wireVenueControls();

  wirePeriodLengthControls();
  document.getElementById("game-home-team").onchange = async () => { autoDefaultPeriodLengthFromHomeTeam(); await loadManagedVenues(); };
  document.getElementById("game-away-team").onchange = () => loadManagedVenues();
  autoDefaultPeriodLengthFromHomeTeam();

  setGameModalBackgroundScrollLock(true);
  document.getElementById("gameModalOverlay").classList.add("active");
}

async function openEditGame(id) {
  currentGameId = id;
  initDateTimePickers();
  populateScheduleDropdowns();
  document.getElementById("gameModalTitle").textContent = "Edit Game";
  setGameModalBackgroundScrollLock(true);
  document.getElementById("gameModalOverlay").classList.add("active");

  try {
    const res = await authFetch(`/games/${id}`);
    if (!res || !res.ok) {
      throw new Error(`HTTP ${res?.status ?? "no response"}`);
    }

    const g = await res.json();

    populateGameOrganizationDropdowns(g.homeTeamId, g.awayTeamId);
    populateGameTeamDropdowns({ selectedHomeTeamId: g.homeTeamId, selectedAwayTeamId: g.awayTeamId });
    document.getElementById("game-home-team").value = g.homeTeamId;
    document.getElementById("game-away-team").value = g.awayTeamId;
    setGameDateInputValue(formatInputDate(g.gameDateTime));
    setGameTimeInputValue(formatInputTime(g.gameDateTime));

    document.getElementById("game-arena-custom").value = g.arenaId ? "" : (g.arenaName || "");
    document.getElementById("game-rink-custom").value = g.rinkId ? "" : (g.rinkName || "");
    document.getElementById("game-venue-address").value = g.venueAddress || "";
    await loadManagedVenues(g.arenaId || "", g.rinkId || "");
    setVenueMode(g.arenaId && g.rinkId ? "managed" : "external");
    wireVenueControls();

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
    document.getElementById("game-home-team").onchange = async () => { autoDefaultPeriodLengthFromHomeTeam(); await loadManagedVenues(); };
    document.getElementById("game-away-team").onchange = () => loadManagedVenues();
  } catch (err) {
    console.error("Failed to load game for edit:", err);
    showMessage("Unable to load game details for editing", "error");
  }
}

// =========================================================
// SAVE GAME
// =========================================================
async function saveGame() {
  const date = getGameDateInputValue();
  const time = getGameTimeInputValue();
  const gameDateTime = `${date}T${time}:00`;

  if (!date || !time) {
    showMessage("Game date and time are required", "error");
    return;
  }

  const payload = {
    homeTeamId: document.getElementById("game-home-team").value,
    awayTeamId: document.getElementById("game-away-team").value,
    gameDateTime,
    arenaId: venueMode === "managed" ? document.getElementById("game-arena-id").value || null : null,
    rinkId: venueMode === "managed" ? document.getElementById("game-rink-id").value || null : null,
    arenaName: venueMode === "external" ? document.getElementById("game-arena-custom").value : "",
    rinkName: venueMode === "external" ? document.getElementById("game-rink-custom").value : "",
    venueAddress: venueMode === "external" ? document.getElementById("game-venue-address").value || null : null,
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

  if (venueMode === "managed" && (!payload.arenaId || !payload.rinkId)) {
    showMessage("Select both a managed arena and rink", "error");
    return;
  }

  if (venueMode === "external" && !payload.arenaName.trim()) {
    showMessage("Enter an external arena or venue name", "error");
    return;
  }

  if (!payload.periodLengthMinutes) {
    showMessage("Please select a valid period length", "error");
    return;
  }

  if (hasDuplicateOfficials()) {
    showMessage("Each official can only be assigned once per schedule", "error");
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
  if (gameDatePicker?.isOpen) gameDatePicker.close();
  if (gameTimePicker?.isOpen) gameTimePicker.close();
  setGameModalBackgroundScrollLock(false);
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
  if (!document.getElementById("gamesGroupedList")) return;

  window.__schedulesPageInitialized = true;
document.getElementById("btnAddGame").onclick = openAddGame;

  document.getElementById("gameSave").onclick = saveGame;
  document.getElementById("gameCancel").onclick = closeGameModal;

  document.getElementById("gameDeleteConfirm").onclick = confirmDeleteGame;
  document.getElementById("gameDeleteCancel").onclick = closeDeleteGameModal;

  initDateTimePickers();

  await loadScheduleLookups();
  populateScheduleFilters();
  wireGameFilters();
  loadGames();

  const deepLinkOptions = getScheduleDeepLinkOptions();
  if (deepLinkOptions) {
    openAddGame(deepLinkOptions);
    clearScheduleDeepLinkQuery();
  }
}

document.addEventListener("layoutLoaded", initSchedulesPage);
if (document.getElementById("gamesGroupedList")) {
  initSchedulesPage();
}
