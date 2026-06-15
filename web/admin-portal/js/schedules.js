console.log("🔥 schedules.js LOADED");

// =========================================================
// GAME SCHEDULES MODULE (UNIFIED MODAL SYSTEM)
// Matches Org / Teams / Rosters / Players patterns
// =========================================================

let allTeams = [];
let allGameTypes = [];
let allGameRounds = [];
let allGames = [];

let currentGameId = null;

// =========================================================
// LOOKUPS
// =========================================================
async function loadScheduleLookups() {
  const [teamsRes, typesRes, roundsRes] = await Promise.all([
    fetch(`${apiBase}/teams`),
    fetch(`${apiBase}/gametypes`),
    fetch(`${apiBase}/gamerounds`),
  ]);

  allTeams = await teamsRes.json();
  allGameTypes = await typesRes.json();
  allGameRounds = await roundsRes.json();
}

function fillSelect(id, list, valueField, textField, includeNone = false) {
  const el = document.getElementById(id);
  el.innerHTML = includeNone ? `<option value="">None</option>` : "";

  list.forEach((item) => {
    el.innerHTML += `<option value="${item[valueField]}">${item[textField]}</option>`;
  });
}

function populateScheduleDropdowns() {
  fillSelect("game-home-team", allTeams, "teamId", "name");
  fillSelect("game-away-team", allTeams, "teamId", "name");
  fillSelect("game-type", allGameTypes, "gameTypeId", "name");
  fillSelect("game-round", allGameRounds, "gameRoundId", "roundName", true);
}

// =========================================================
// FORMAT HELPERS
// =========================================================
function formatDate(dt) {
  return new Date(dt).toISOString().split("T")[0];
}

function formatTime(dt) {
  return new Date(dt).toISOString().substring(11, 16);
}

// =========================================================
// LOAD + RENDER GAMES
// =========================================================
async function loadGames() {
  const res = await fetch(`${apiBase}/games`);
  allGames = await res.json();
  renderGamesTable(allGames);
}

function renderGamesTable(list) {
  const tbody = document.getElementById("gamesTableBody");
  tbody.innerHTML = "";

  list.forEach((g) => {
    tbody.innerHTML += `
      <tr>
        <td>${g.homeTeamName}</td>
        <td>${g.awayTeamName}</td>
        <td>${formatDate(g.gameDateTime)}</td>
        <td>${formatTime(g.gameDateTime)}</td>
        <td>${g.arenaName}</td>
        <td>${g.rinkName}</td>
        <td>${g.gameTypeName}</td>
        <td>${g.gameRoundName ?? ""}</td>
        <td>${g.status}</td>
        <td class="actions-col">
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
  document.querySelectorAll(".nf-btn-icon.edit").forEach((btn) => {
    btn.onclick = () => openEditGame(btn.dataset.id);
  });

  document.querySelectorAll(".nf-btn-icon.delete").forEach((btn) => {
    btn.onclick = () => openDeleteGame(btn.dataset.id);
  });
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
  document.getElementById("game-notes").value = "";
  document.getElementById("game-status").value = "Scheduled";

  document.getElementById("gameModalOverlay").classList.add("active");
}

async function openEditGame(id) {
  currentGameId = id;

  const res = await fetch(`${apiBase}/games/${id}`);
  const g = await res.json();

  populateScheduleDropdowns();

  document.getElementById("gameModalTitle").textContent = "Edit Game";

  const dt = new Date(g.gameDateTime);

  document.getElementById("game-home-team").value = g.homeTeamId;
  document.getElementById("game-away-team").value = g.awayTeamId;
  document.getElementById("game-date").value = dt.toISOString().split("T")[0];
  document.getElementById("game-time").value = dt
    .toISOString()
    .substring(11, 16);

  document.getElementById("game-arena-select").value = g.arenaName;
  document.getElementById("game-arena-custom").value = "";
  document.getElementById("game-rink-select").value = g.rinkName;
  document.getElementById("game-rink-custom").value = "";

  document.getElementById("game-type").value = g.gameTypeId;
  document.getElementById("game-round").value = g.gameRoundId ?? "";
  document.getElementById("game-notes").value = g.notes ?? "";
  document.getElementById("game-status").value = g.status;

  document.getElementById("gameModalOverlay").classList.add("active");
}

// =========================================================
// SAVE GAME
// =========================================================
async function saveGame() {
  const date = document.getElementById("game-date").value;
  const time = document.getElementById("game-time").value;
  const gameDateTime = new Date(`${date}T${time}:00`);

  const payload = {
    homeTeamId: document.getElementById("game-home-team").value,
    awayTeamId: document.getElementById("game-away-team").value,
    gameDateTime: gameDateTime.toISOString(),
    arenaName:
      document.getElementById("game-arena-custom").value ||
      document.getElementById("game-arena-select").value,
    rinkName:
      document.getElementById("game-rink-custom").value ||
      document.getElementById("game-rink-select").value,
    gameTypeId: parseInt(document.getElementById("game-type").value),
    gameRoundId: document.getElementById("game-round").value || null,
    notes: document.getElementById("game-notes").value,
    // status: document.getElementById("game-status").value,
  };

  const method = currentGameId ? "PUT" : "POST";
  const url = currentGameId
    ? `${apiBase}/games/${currentGameId}`
    : `${apiBase}/games`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

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
  await fetch(`${apiBase}/games/${currentGameId}`, { method: "DELETE" });
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
// PAGE SCRIPT REGISTRATION
// =========================================================
function waitForSchedulesPageReady() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (
        window.PageScriptRegistry &&
        document.getElementById("gamesTableBody") // page content loaded
      ) {
        clearInterval(check);
        resolve();
      }
    }, 30);
  });
}

waitForSchedulesPageReady().then(() => {
  console.log("schedules.js loaded");

  window.PageScriptRegistry.schedules = () => {
    document.getElementById("btnAddGame").onclick = openAddGame;

    document.getElementById("gameSave").onclick = saveGame;
    document.getElementById("gameCancel").onclick = closeGameModal;

    document.getElementById("gameDeleteConfirm").onclick = confirmDeleteGame;
    document.getElementById("gameDeleteCancel").onclick = closeDeleteGameModal;

    loadScheduleLookups().then(loadGames);
  };
});
waitForSchedulesPageReady().then(() => {
  if (window.PageScriptRegistry.schedules) {
    console.log("🔥 schedules.js: auto-running schedules page script");
    window.PageScriptRegistry.schedules();
  }
});

// =========================================================
// PAGE SCRIPT REGISTRATION (DIAGNOSTIC MODE)
// =========================================================

console.log("🔥 schedules.js loaded (top of file)");

function waitForSchedulesPageReady() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      const registryReady = !!window.PageScriptRegistry;
      const pageReady = !!document.getElementById("gamesTableBody");

      console.log("⏳ waiting... registry:", registryReady, "page:", pageReady);

      if (registryReady && pageReady) {
        console.log("✅ PageScriptRegistry + Schedules page content READY");
        clearInterval(check);
        resolve();
      }
    }, 300);
  });
}

waitForSchedulesPageReady().then(() => {
  console.log("🔥 Registering PageScriptRegistry.schedules");

  window.PageScriptRegistry.schedules = () => {
    console.log("🔥 PageScriptRegistry.schedules RUN");

    document.getElementById("btnAddGame").onclick = openAddGame;

    document.getElementById("gameSave").onclick = saveGame;
    document.getElementById("gameCancel").onclick = closeGameModal;

    document.getElementById("gameDeleteConfirm").onclick = confirmDeleteGame;
    document.getElementById("gameDeleteCancel").onclick = closeDeleteGameModal;

    console.log("🔥 Calling loadScheduleLookups...");
    loadScheduleLookups().then(() => {
      console.log("🔥 Lookups loaded, calling loadGames...");
      loadGames();
    });
  };
});
