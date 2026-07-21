(function checkPermission() {
  if (!Auth.hasRole(window.ROLES.SuperAdmin, window.ROLES.OrgAdmin, window.ROLES.TeamManager, window.ROLES.Coach, window.ROLES.Viewer)) {
    window.location.href = "./not-authorized.html";
  }
})();

function notifyStats(message, type = "info") {
  if (typeof window.showMessage === "function") {
    window.showMessage(message, type);
    return;
  }
  console[type === "error" ? "error" : "warn"](`[${type}] ${message}`);
}

const statsState = {
  teams: [],
  rows: {
    team: [],
    player: [],
    game: [],
    season: [],
  },
  sort: {
    team: { field: "gf", direction: "desc" },
    player: { field: "pts", direction: "desc" },
    game: { field: "gameDateTime", direction: "desc" },
    season: { field: "seasonName", direction: "asc" },
  },
};

const STATS_TABLE_IDS = {
  team: "stats-team-table",
  player: "stats-player-table",
  game: "stats-game-table",
  season: "stats-season-table",
};

async function initStatsPage() {
  if (!document.getElementById("stats-team-body")) return;

  await populateStatsFilters();
  wireStatsEvents();
  wireStatsSortEvents();
  await refreshStats();
}

function getStatsFilters() {
  return {
    seasonId: document.getElementById("stats-filter-season")?.value || "",
    levelId: document.getElementById("stats-filter-level")?.value || "",
    teamType: document.getElementById("stats-filter-team-type")?.value || "",
    teamId: document.getElementById("stats-filter-team")?.value || "",
    limit: 10,
  };
}

async function populateStatsFilters() {
  const seasonSelect = document.getElementById("stats-filter-season");
  const levelSelect = document.getElementById("stats-filter-level");
  const teamTypeSelect = document.getElementById("stats-filter-team-type");
  const teamSelect = document.getElementById("stats-filter-team");
  if (!seasonSelect || !levelSelect || !teamTypeSelect || !teamSelect) return;

  const previousSeasonId = seasonSelect.value || "";
  const previousLevelId = levelSelect.value || "";
  const previousTeamType = teamTypeSelect.value || "";

  try {
    const [seasonRes, teamRes] = await Promise.all([
      authFetch("/seasons"),
      authFetch("/teams"),
    ]);

    const seasons = seasonRes?.ok ? await seasonRes.json() : [];
    const teams = teamRes?.ok ? await teamRes.json() : [];
  statsState.teams = Array.isArray(teams) ? teams : [];

    seasonSelect.innerHTML = '<option value="">Season: All</option>';
    (Array.isArray(seasons) ? seasons : [])
      .sort((a, b) => (b.seasonName || "").localeCompare(a.seasonName || ""))
      .forEach((season) => {
        const opt = document.createElement("option");
        opt.value = season.seasonId;
        opt.textContent = season.seasonName;
        seasonSelect.appendChild(opt);
      });

    const hasSeason = Array.from(seasonSelect.options).some(
      (opt) => opt.value === previousSeasonId,
    );
    seasonSelect.value = hasSeason ? previousSeasonId : "";

    const levelMap = new Map();
    statsState.teams.forEach((team) => {
      const id = team.levelId || team.LevelId;
      const name = team.levelName || team.LevelName;
      if (id && name) levelMap.set(id, name);
    });

    levelSelect.innerHTML = '<option value="">Level: All</option>';
    Array.from(levelMap.entries())
      .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
      .forEach(([id, name]) => {
        const opt = document.createElement("option");
        opt.value = String(id);
        opt.textContent = String(name);
        levelSelect.appendChild(opt);
      });

    const hasLevel = Array.from(levelSelect.options).some(
      (opt) => opt.value === previousLevelId,
    );
    levelSelect.value = hasLevel ? previousLevelId : "";

    const teamTypes = Array.from(
      new Set(
        statsState.teams
          .map((team) => (team.teamType || team.TeamType || "").toString().trim())
          .filter((type) => !!type),
      ),
    ).sort((a, b) => a.localeCompare(b));

    teamTypeSelect.innerHTML = '<option value="">Type: All</option>';
    teamTypes.forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = type;
      teamTypeSelect.appendChild(opt);
    });

    const hasType = Array.from(teamTypeSelect.options).some(
      (opt) => opt.value === previousTeamType,
    );
    teamTypeSelect.value = hasType ? previousTeamType : "";

    populateTeamOptionsForLevel();
  } catch (error) {
    console.error("Failed to load stats filters", error);
    notifyStats("Failed to load stats filters", "error");
  }
}

function populateTeamOptionsForLevel() {
  const levelSelect = document.getElementById("stats-filter-level");
  const teamTypeSelect = document.getElementById("stats-filter-team-type");
  const teamSelect = document.getElementById("stats-filter-team");
  if (!levelSelect || !teamTypeSelect || !teamSelect) return;

  const selectedLevelId = levelSelect.value || "";
  const selectedTeamType = teamTypeSelect.value || "";
  const previousTeamId = teamSelect.value || "";

  const teams = [...(statsState.teams || [])]
    .filter((team) => {
      const levelId = team.levelId || team.LevelId || "";
      if (selectedLevelId && String(levelId) !== selectedLevelId) return false;

      if (!selectedTeamType) return true;
      const teamType = (team.teamType || team.TeamType || "").toString().trim();
      return teamType === selectedTeamType;
    })
    .sort((a, b) => {
      const aName = String(a.name || a.Name || "");
      const bName = String(b.name || b.Name || "");
      if (aName !== bName) return aName.localeCompare(bName);
      const aLevel = String(a.levelName || a.LevelName || "");
      const bLevel = String(b.levelName || b.LevelName || "");
      return aLevel.localeCompare(bLevel);
    });

  teamSelect.innerHTML = '<option value="">Team: All</option>';
  teams.forEach((team) => {
    const teamId = team.teamId || team.id || team.TeamId || team.Id;
    if (!teamId) return;

    const name = team.name || team.Name || "Unnamed Team";
    const level = team.levelName || team.LevelName || "Unspecified";

    const opt = document.createElement("option");
    opt.value = teamId;
    opt.textContent = `${name} - ${level}`;
    teamSelect.appendChild(opt);
  });

  const hasPrevious = Array.from(teamSelect.options).some(
    (opt) => opt.value === previousTeamId,
  );
  teamSelect.value = hasPrevious ? previousTeamId : "";
}

function wireStatsEvents() {
  const seasonSelect = document.getElementById("stats-filter-season");
  const levelSelect = document.getElementById("stats-filter-level");
  const teamTypeSelect = document.getElementById("stats-filter-team-type");
  const teamSelect = document.getElementById("stats-filter-team");
  const refreshBtn = document.getElementById("stats-refresh");

  if (seasonSelect) seasonSelect.onchange = () => refreshStats();
  if (levelSelect)
    levelSelect.onchange = () => {
      populateTeamOptionsForLevel();
      refreshStats();
    };
  if (teamTypeSelect)
    teamTypeSelect.onchange = () => {
      populateTeamOptionsForLevel();
      refreshStats();
    };
  if (teamSelect) teamSelect.onchange = () => refreshStats();
  if (refreshBtn) refreshBtn.onclick = () => refreshStats();
}

function wireStatsSortEvents() {
  Object.entries(STATS_TABLE_IDS).forEach(([tableKey, tableId]) => {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = table.querySelectorAll("th.stats-sortable[data-field]");
    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const field = header.getAttribute("data-field");
        if (!field) return;

        const current = statsState.sort[tableKey];
        const direction =
          current.field === field && current.direction === "asc"
            ? "desc"
            : "asc";
        statsState.sort[tableKey] = { field, direction };
        renderAllStatsTables();
      });
    });
  });
}

async function refreshStats() {
  const filters = getStatsFilters();

  try {
    const [teamStats, playerStats, gameStats, seasonStats, leaders] = await Promise.allSettled([
      StatsApi.getTeamStats(filters),
      StatsApi.getPlayerStats(filters),
      StatsApi.getGameStats(filters),
      StatsApi.getSeasonStats(filters),
      StatsApi.getLeaders(filters),
    ]);

    statsState.rows.team =
      teamStats.status === "fulfilled" && Array.isArray(teamStats.value)
        ? teamStats.value
        : [];
    statsState.rows.player =
      playerStats.status === "fulfilled" && Array.isArray(playerStats.value)
        ? playerStats.value
        : [];
    statsState.rows.game =
      gameStats.status === "fulfilled" && Array.isArray(gameStats.value)
        ? gameStats.value
        : [];
    statsState.rows.season =
      seasonStats.status === "fulfilled" && Array.isArray(seasonStats.value)
        ? seasonStats.value
        : [];

    renderAllStatsTables();
    renderLeaders(leaders.status === "fulfilled" ? leaders.value || {} : {});

    const failedSections = [];
    if (teamStats.status === "rejected") failedSections.push("team");
    if (playerStats.status === "rejected") failedSections.push("player");
    if (gameStats.status === "rejected") failedSections.push("game");
    if (seasonStats.status === "rejected") failedSections.push("season");
    if (leaders.status === "rejected") failedSections.push("leaders");

    if (failedSections.length) {
      notifyStats(`Some stats failed to load: ${failedSections.join(", ")}`, "error");
    }
  } catch (error) {
    console.error("Failed to refresh stats", error);
    notifyStats("Failed to load stats data", "error");
  }
}

function renderAllStatsTables() {
  renderTeamStats(getSortedRows("team", statsState.rows.team));
  renderPlayerStats(getSortedRows("player", statsState.rows.player));
  renderGameStats(getSortedRows("game", statsState.rows.game));
  renderSeasonStats(getSortedRows("season", statsState.rows.season));
  updateSortIndicators();
}

function getSortedRows(tableKey, rows) {
  const sortState = statsState.sort[tableKey];
  const directionFactor = sortState.direction === "asc" ? 1 : -1;
  const field = sortState.field;

  return [...rows].sort((a, b) => {
    const av = normalizeSortValue(a?.[field]);
    const bv = normalizeSortValue(b?.[field]);

    if (av < bv) return -1 * directionFactor;
    if (av > bv) return 1 * directionFactor;

    const aName = String(a?.teamName || a?.fullName || a?.seasonName || "").toLowerCase();
    const bName = String(b?.teamName || b?.fullName || b?.seasonName || "").toLowerCase();
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    return 0;
  });
}

function normalizeSortValue(value) {
  if (value === null || value === undefined || value === "") return -Infinity;
  if (typeof value === "number") return value;

  const dateValue = Date.parse(value);
  if (!Number.isNaN(dateValue)) return dateValue;

  const numValue = Number(value);
  if (!Number.isNaN(numValue)) return numValue;

  return String(value).toLowerCase();
}

function updateSortIndicators() {
  Object.entries(STATS_TABLE_IDS).forEach(([tableKey, tableId]) => {
    const table = document.getElementById(tableId);
    if (!table) return;

    const sortState = statsState.sort[tableKey];
    const headers = table.querySelectorAll("th.stats-sortable[data-field]");
    headers.forEach((header) => {
      const field = header.getAttribute("data-field");
      const isActive = field === sortState.field;
      header.classList.toggle("is-sorted", isActive);
      header.classList.toggle("is-sorted-asc", isActive && sortState.direction === "asc");
      header.classList.toggle("is-sorted-desc", isActive && sortState.direction === "desc");
    });
  });
}

function formatStatNumber(value, decimals = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return numeric.toFixed(decimals);
}

function renderTeamStats(rows) {
  const body = document.getElementById("stats-team-body");
  if (!body) return;

  body.innerHTML = rows.length
    ? rows
        .map((r) => `
          <tr>
            <td>${r.teamName ?? ""}</td>
            <td>${r.seasonName ?? ""}</td>
            <td>${r.gp ?? 0}</td>
            <td>${r.gf ?? 0}</td>
            <td>${r.ga ?? 0}</td>
            <td>${r.goalDiff ?? 0}</td>
            <td>${r.shotsFor ?? 0}</td>
            <td>${r.shotsAgainst ?? 0}</td>
            <td>${formatStatNumber(r.shootingPct, 2)}%</td>
            <td>${r.pim ?? 0}</td>
            <td>${r.ppGoals ?? 0}</td>
            <td>${r.shGoals ?? 0}</td>
          </tr>
        `)
        .join("")
    : '<tr><td colspan="12">No team stats found.</td></tr>';
}

function renderPlayerStats(rows) {
  const body = document.getElementById("stats-player-body");
  if (!body) return;

  body.innerHTML = rows.length
    ? rows
        .map((r) => `
          <tr>
            <td>${r.fullName ?? ""}</td>
            <td>${r.position ?? ""}</td>
            <td>${r.gp ?? 0}</td>
            <td>${r.g ?? 0}</td>
            <td>${r.a ?? 0}</td>
            <td>${r.pts ?? 0}</td>
            <td>${r.pim ?? 0}</td>
            <td>${formatStatNumber(r.estShotsAgainst, 2)}</td>
            <td>${formatStatNumber(r.estSaves, 2)}</td>
            <td>${formatStatNumber(r.estSavePct, 2)}%</td>
            <td>${formatStatNumber(r.estGAA, 2)}</td>
          </tr>
        `)
        .join("")
    : '<tr><td colspan="11">No player stats found.</td></tr>';
}

function renderGameStats(rows) {
  const body = document.getElementById("stats-game-body");
  if (!body) return;

  body.innerHTML = rows.length
    ? rows
        .map((r) => {
          const date = r.gameDateTime ? new Date(r.gameDateTime).toLocaleString() : "";
          return `
            <tr>
              <td>${date}</td>
              <td>${r.seasonName ?? ""}</td>
              <td>${r.homeTeamName ?? ""}</td>
              <td>${r.awayTeamName ?? ""}</td>
              <td>${r.homeGoals ?? 0}</td>
              <td>${r.awayGoals ?? 0}</td>
              <td>${r.homeShots ?? 0}</td>
              <td>${r.awayShots ?? 0}</td>
              <td>${r.homePIM ?? 0}</td>
              <td>${r.awayPIM ?? 0}</td>
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="10">No game stats found.</td></tr>';
}

function renderSeasonStats(rows) {
  const body = document.getElementById("stats-season-body");
  if (!body) return;

  body.innerHTML = rows.length
    ? rows
        .map((r) => `
          <tr>
            <td>${r.seasonName ?? ""}</td>
            <td>${r.gamesFinal ?? 0}</td>
            <td>${r.goals ?? 0}</td>
            <td>${r.shots ?? 0}</td>
            <td>${r.penalties ?? 0}</td>
            <td>${r.pim ?? 0}</td>
            <td>${formatStatNumber(r.avgGoalsPerGame, 2)}</td>
            <td>${formatStatNumber(r.avgShotsPerGame, 2)}</td>
          </tr>
        `)
        .join("")
    : '<tr><td colspan="8">No season stats found.</td></tr>';
}

function renderSimpleLeaderTable(bodyId, rows, field) {
  const body = document.getElementById(bodyId);
  if (!body) return;

  body.innerHTML = (rows || []).length
    ? rows
        .map((r) => `
          <tr>
            <td>${r.fullName ?? ""}</td>
            <td>${r[field] ?? 0}</td>
          </tr>
        `)
        .join("")
    : '<tr><td colspan="2">No data</td></tr>';
}

function renderLeaders(payload) {
  renderSimpleLeaderTable("leaders-points-body", payload.topPoints || [], "points");
  renderSimpleLeaderTable("leaders-goals-body", payload.topGoals || [], "goals");
  renderSimpleLeaderTable("leaders-assists-body", payload.topAssists || [], "assists");
  renderSimpleLeaderTable("leaders-pim-body", payload.topPim || [], "pim");
}

document.addEventListener("layoutLoaded", initStatsPage);
if (window.__layoutAlreadyLoaded) initStatsPage();
