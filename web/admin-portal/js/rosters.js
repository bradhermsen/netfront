console.log("ROSTERS.JS LOADED");

// Enforce Coach/TeamManager access with team assignment validation
(function checkPermission() {
  if (!Auth.canManageRosters()) {
    showMessage("Access Denied: Coach or Team Manager role required", "error");
    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 2000);
  }
})();

// =========================================================
// DATA CACHES
// =========================================================
let allTeams = [];
let allPlayers = [];
let rosterCache = {}; // teamId → roster array

let rmSort = { field: null, direction: "asc" };
let teamsSort = { field: null, direction: "asc" };
let rmSearch = "";
let rmFilters = { position: "", shoots: "", status: "" };

let globalFilters = {
  search: "",
  organization: "",
  teamId: "",
  levelId: "",
  status: "",
  showExternal: false,
};

const ROSTERS_GROUP_PAGE_SIZE = 25; // Keep 25 teams per status page
const rostersGroupPaginationState = {};

function resetRostersGroupPagination() {
  Object.keys(rostersGroupPaginationState).forEach((k) => delete rostersGroupPaginationState[k]);
}

// =========================================================
// RESTORE MODAL VISUAL STATE
// =========================================================
function restoreModalState(backup) {
  if (!backup || !backup.overlay || !backup.modal) return;
  
  activeRosterModal = backup;
  backup.overlay.classList.add("active");
  backup.modal.classList.add("active");
  console.log("✓ Restored modal state for:", backup.modal?.id);
}

// =========================================================
// CUSTOM MESSAGE DIALOG (NetFront Theme)
// =========================================================
function showMessage(message, type = "info", duration = 3500) {
  // Create container
  const container = document.createElement("div");
  container.id = `msg-${Date.now()}`;
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 11000;
    animation: fadeIn 0.25s ease;
  `;

  // NetFront theme colors
  let bgColor = "#0f0f0f";
  let borderColor = "#333";
  let textColor = "#e8e8e8";
  let buttonBg = "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)";
  let icon = "ℹ️";
  
  if (type === "success") {
    borderColor = "#10b981";
    icon = "✓";
  } else if (type === "error") {
    borderColor = "#ef4444";
    icon = "✕";
  } else if (type === "warning") {
    borderColor = "#f59e0b";
    icon = "⚠";
  }

  container.innerHTML = `
    <div style="
      background-color: ${bgColor};
      color: ${textColor};
      border: 1px solid ${borderColor};
      border-radius: 10px;
      padding: 24px 32px;
      max-width: 450px;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="font-size: 18px; margin-bottom: 12px; font-weight: 600;">
        ${icon} ${message}
      </div>
      <button style="
        background: ${buttonBg};
        color: white;
        border: none;
        padding: 9px 28px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
      " id="msgOkBtn" onmouseover="this.style.boxShadow='0 4px 12px rgba(14, 165, 233, 0.5)';this.style.transform='scale(1.05)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(14, 165, 233, 0.3)';this.style.transform='scale(1)'">OK</button>
    </div>
  `;

  document.body.appendChild(container);

  const okBtn = container.querySelector("#msgOkBtn");
  const close = () => {
    container.style.animation = "fadeOut 0.25s ease";
    setTimeout(() => container.remove(), 250);
  };

  okBtn.onclick = close;

  if (duration > 0) {
    setTimeout(close, duration);
  }
}

// =========================================================
// PAGE INITIALIZATION
// =========================================================
async function initRostersPage() {
  if (!document.getElementById("teamsRosterGroupedList")) return;

  console.log("ROSTERS: Initializing page…");

  await loadTeamsList();
  await loadPlayersList();

  populateRosterFilterDropdowns();
  attachGlobalFilterEvents();
  attachTeamsTableSortEvents();

  applyMainRosterFilters();

  console.log("ROSTERS: Page initialized.");
}

document.addEventListener("layoutLoaded", initRostersPage);
if (window.__layoutAlreadyLoaded) initRostersPage();

// =========================================================
// POPULATE FILTER DROPDOWNS
// =========================================================
function populateRosterFilterDropdowns() {
  const orgSelect = document.getElementById("filter-organization");
  const teamSelect = document.getElementById("filter-team");
  const levelSelect = document.getElementById("filter-level");

  if (!orgSelect || !teamSelect || !levelSelect) return;

  orgSelect.innerHTML = `<option value="">Organization: All</option>`;
  teamSelect.innerHTML = `<option value="">Team: All</option>`;
  levelSelect.innerHTML = `<option value="">Level: All</option>`;

  // --- ORGANIZATIONS ---
  const orgMap = new Map();
  allTeams.forEach((t) => {
    if (t.organizationId && t.organizationName) {
      orgMap.set(t.organizationId, t.organizationName);
    }
  });

  [...orgMap.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .forEach(([orgId, orgName]) => {
      const opt = document.createElement("option");
      opt.value = orgId;
      opt.textContent = orgName;
      orgSelect.appendChild(opt);
    });

  // --- LEVELS ---
  const levelMap = new Map();
  allTeams.forEach((t) => {
    if (t.levelId && t.levelName) {
      levelMap.set(t.levelId, t.levelName);
    }
  });

  [...levelMap.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .forEach(([levelId, levelName]) => {
      const opt = document.createElement("option");
      opt.value = levelId;
      opt.textContent = levelName;
      levelSelect.appendChild(opt);
    });

  // --- TEAMS ---
  [...allTeams]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.teamId;
      opt.textContent = `${t.name} (${t.levelName})`;
      teamSelect.appendChild(opt);
    });
}

// =========================================================
// FILTER EVENTS
// =========================================================
function attachGlobalFilterEvents() {
  const searchEl = document.getElementById("rosters-search-bar");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      globalFilters.search = e.target.value.toLowerCase();
      resetRostersGroupPagination();
      applyMainRosterFilters();
    });
  }

  const orgFilter = document.getElementById("filter-organization");
  if (orgFilter) {
    orgFilter.onchange = (e) => {
      globalFilters.organization = e.target.value;
      resetRostersGroupPagination();
      applyMainRosterFilters();
    };
  }

  const teamFilter = document.getElementById("filter-team");
  if (teamFilter) {
    teamFilter.onchange = (e) => {
      globalFilters.teamId = e.target.value;
      resetRostersGroupPagination();
      applyMainRosterFilters();
    };
  }

  const levelFilter = document.getElementById("filter-level");
  if (levelFilter) {
    levelFilter.onchange = (e) => {
      globalFilters.levelId = e.target.value;
      resetRostersGroupPagination();
      applyMainRosterFilters();
    };
  }

  const statusFilter = document.getElementById("filter-status");
  if (statusFilter) {
    statusFilter.onchange = (e) => {
      globalFilters.status = e.target.value;
      resetRostersGroupPagination();
      applyMainRosterFilters();
    };
  }

  const showExternalToggle = document.getElementById("rosters-show-external");
  if (showExternalToggle) {
    showExternalToggle.checked = false;
    showExternalToggle.onchange = (e) => {
      globalFilters.showExternal = !!e.target.checked;
      resetRostersGroupPagination();
      applyMainRosterFilters();
    };
  }
}

function attachTeamsTableSortEvents() {
  document.querySelectorAll("#teamsRosterTable .sortable").forEach((header) => {
    header.onclick = () => {
      const field = header.dataset.field;
      if (!field) return;

      teamsSort.direction =
        teamsSort.field === field && teamsSort.direction === "asc" ? "desc" : "asc";
      teamsSort.field = field;

      applyMainRosterFilters();
    };
  });
}

function isExternalTeam(team) {
  if (!team) return false;

  if (team.isExternal === true || team.external === true) {
    return true;
  }

  const organizationName = (team.organizationName ?? "").toString().trim().toLowerCase();
  return organizationName === "external team" || organizationName === "external";
}

function sortTeamsForTable(teams) {
  if (!teamsSort.field) return teams;

  const direction = teamsSort.direction === "asc" ? 1 : -1;

  return teams.slice().sort((a, b) => {
    if (teamsSort.field === "rosterCount") {
      const countA = Number(a.rosterCount ?? 0);
      const countB = Number(b.rosterCount ?? 0);
      return (countA - countB) * direction;
    }

    if (teamsSort.field === "status") {
      const statusA = (a.isActive ? "Active" : "Inactive").toLowerCase();
      const statusB = (b.isActive ? "Active" : "Inactive").toLowerCase();
      return statusA.localeCompare(statusB) * direction;
    }

    const textA = (a[teamsSort.field] ?? "").toString().toLowerCase();
    const textB = (b[teamsSort.field] ?? "").toString().toLowerCase();
    return textA.localeCompare(textB) * direction;
  });
}

// =========================================================
// APPLY FILTERS
// =========================================================
function applyMainRosterFilters() {
  let filtered = [...allTeams];

  if (!globalFilters.showExternal) {
    filtered = filtered.filter((t) => !isExternalTeam(t));
  }

  // SEARCH
  if (globalFilters.search) {
    const s = globalFilters.search;
    filtered = filtered.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const org = (t.organizationName || "").toLowerCase();
      const level = (t.levelName || "").toLowerCase();
      return name.includes(s) || org.includes(s) || level.includes(s);
    });
  }

  // ORGANIZATION
  if (globalFilters.organization) {
    filtered = filtered.filter(
      (t) => t.organizationId === globalFilters.organization,
    );
  }

  // TEAM
  if (globalFilters.teamId) {
    filtered = filtered.filter((t) => t.teamId === globalFilters.teamId);
  }

  // LEVEL
  if (globalFilters.levelId) {
    filtered = filtered.filter((t) => t.levelId === globalFilters.levelId);
  }

  // STATUS (Option B — use r.gamedayStatus)
  if (globalFilters.status) {
    filtered = filtered.filter((t) => {
      const roster = rosterCache[t.teamId] || [];
      return roster.some((r) => {
        const st = r.gamedayStatus ?? "Inactive";
        return st === globalFilters.status;
      });
    });
  }

  renderTeamsTable(sortTeamsForTable(filtered));
}

// =========================================================
// LOAD PLAYERS
// =========================================================
async function loadPlayersList() {
  try {
    const res = await authFetch(`/players/dto`);
    if (!res || !res.ok) {
      console.error("Failed to load players:", res?.status);
      allPlayers = [];
      return allPlayers;
    }

    allPlayers = await res.json();
    return allPlayers;
  } catch (err) {
    console.error("Failed to load players:", err);
    allPlayers = [];
    return allPlayers;
  }
}

// =========================================================
// LOAD TEAMS
// =========================================================
async function loadTeamsList() {
  try {
    const res = await authFetch(`/teams`);
    if (!res || !res.ok) {
      console.error("Failed to load teams:", res?.status);
      allTeams = [];
      return [];
    }

    allTeams = await res.json();
    return allTeams;
  } catch (err) {
    console.error("Failed to load teams:", err);
    allTeams = [];
    return [];
  }
}
// =========================================================
// MAIN TEAM TABLE
// =========================================================
function renderTeamsTable(teams) {
  const container = document.getElementById("teamsRosterGroupedList");
  if (!container) return;

  if (!teams.length) {
    container.innerHTML = `<div class="nf-empty-state">No teams match your roster filters.</div>`;
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
      const totalPages = Math.max(1, Math.ceil(statusItems.length / ROSTERS_GROUP_PAGE_SIZE));
      const currentPage = Math.min(rostersGroupPaginationState[statusKey] || 1, totalPages);
      rostersGroupPaginationState[statusKey] = currentPage;

      const paged = statusItems.slice((currentPage - 1) * ROSTERS_GROUP_PAGE_SIZE, currentPage * ROSTERS_GROUP_PAGE_SIZE);
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
              const displayType = team.teamType || "No type";
              const rosterCount = team.rosterCount ?? 0;

              return `
                <article class="nf-item-card roster-team-item-card">
                  <div class="nf-item-card-top">
                    <h4>${team.name || "Unnamed Team"}</h4>
                    <span class="status-badge ${team.isActive ? "active" : "inactive"}">${team.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <div class="nf-item-card-meta">
                    <span><i class="fa fa-building"></i> ${team.organizationName || "External Team"}</span>
                    <span><i class="fa fa-layer-group"></i> ${team.levelName || "No level"} • ${displayType}</span>
                    <span><i class="fa fa-users"></i> ${rosterCount} rostered players</span>
                  </div>
                  <div class="nf-item-card-actions">
                    <button class="nf-btn-icon roster-manage-btn" data-team-id="${team.teamId}" title="Manage Roster">
                      <i class="fa-solid fa-users"></i>
                    </button>
                  </div>
                </article>
              `;
            })
            .join("");

          return `
            <details class="nf-subgroup" open>
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
            ${statusItems.length > ROSTERS_GROUP_PAGE_SIZE ? `
              <div class="nf-pagination">
                <button class="nf-btn nf-btn-secondary rosters-page-btn" data-status="${statusKey}" data-direction="prev" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
                <span>Page ${currentPage} of ${totalPages}</span>
                <button class="nf-btn nf-btn-secondary rosters-page-btn" data-status="${statusKey}" data-direction="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
              </div>
            ` : ""}
          </div>
        </details>
      `;
    })
    .join("");

  wireRosterGroupedActions();
  wireRostersPagination();
}

function wireRosterGroupedActions() {
  document.querySelectorAll(".roster-manage-btn").forEach((btn) => {
    btn.onclick = () => openRosterManager(btn.dataset.teamId);
  });
}

function wireRostersPagination() {
  document.querySelectorAll(".rosters-page-btn").forEach((btn) => {
    btn.onclick = () => {
      const status = btn.dataset.status;
      const direction = btn.dataset.direction;
      const current = rostersGroupPaginationState[status] || 1;

      rostersGroupPaginationState[status] = direction === "prev"
        ? Math.max(1, current - 1)
        : current + 1;

      applyMainRosterFilters();
    };
  });
}

// =========================================================
// OPEN ROSTER MANAGER (uses new modal system)
// =========================================================
async function openRosterManager(teamId) {
  console.log("🔵 openRosterManager called with teamId:", teamId);
  
  window.currentRosterTeamId = teamId;

  openModal("rosterManagerOverlay", "rosterManagerModal");
  wireRosterCloseButtons();
  console.log("✓ Modal opened");

  const team = allTeams.find((t) => t.teamId === teamId);
  console.log("✓ Found team:", team.name, team.levelName);

  const rosterHeadingParts = [team?.name, team?.teamType, team?.levelName]
    .map((value) => (value || "").toString().trim())
    .filter((value) => value.length > 0);
  const rosterHeading = rosterHeadingParts.join(" ");

  document.getElementById("rosterManagerTitle").textContent =
    `Manager Roster - ${rosterHeading}`;

  document.getElementById("rm-current-team").textContent = rosterHeading;
  const totalsEl = document.getElementById("rm-team-totals");
  if (totalsEl) totalsEl.textContent = "";

  // Render cached roster immediately
  console.log("Rendering from cache. Cache has entries:", rosterCache[teamId]?.length || 0);
  renderRosterManagerTable(rosterCache[teamId] || []);

  // Fetch fresh roster
  console.log("Fetching fresh roster...");
  await fetchRosterFresh(teamId);
  console.log("✅ openRosterManager completed");
}

// =========================================================
// FETCH ROSTER (fresh from API)
// =========================================================
async function fetchRosterFresh(teamId) {
  try {
    console.log("🔄 fetchRosterFresh starting for teamId:", teamId);
    
    if (!teamId) {
      throw new Error("No teamId provided to fetchRosterFresh!");
    }
    
    const url = `/teams/${teamId}/roster`;
    console.log("Fetching from:", url);
    
    const res = await authFetch(url);
    console.log("Fetch response status:", res?.status);
    
    if (!res || !res.ok) {
      throw new Error(`API returned ${res?.status ?? "no response"}`);
    }
    
    const fresh = await res.json();
    console.log("✓ Raw API response:", fresh);
    console.log("✓ Type of fresh:", typeof fresh);
    console.log("✓ Is Array?:", Array.isArray(fresh));
    console.log("✓ Got fresh roster data:", fresh.length, "entries");

    // Handle both direct array and wrapped response
    const entries = Array.isArray(fresh) ? fresh : fresh.data || fresh.entries || [];
    
    rosterCache[teamId] = entries;
    renderRosterManagerTable(entries);
    
    console.log("✅ fetchRosterFresh completed successfully");
  } catch (err) {
    console.error("❌ Roster refresh failed:", err);
    console.error("Error details:", err.message);
  }
}
// =========================================================
// ROSTER TABLE IN MODAL
// =========================================================
function renderRosterManagerTable(list) {
  console.log("🎨 renderRosterManagerTable called with", list.length, "items");
  
  const body = document.getElementById("rm-roster-body");
  console.log("✓ Found body element:", body ? "yes" : "NO");
  
  if (!Array.isArray(list)) list = [];

  // --- TEAM TOTALS (based on full roster, not filtered view) ---
  const totalsEl = document.getElementById("rm-team-totals");
  if (totalsEl) {
    const normalizePos = (value) => (value ?? "").toString().trim().toUpperCase();
    const forwards = list.filter((r) => normalizePos(r.position) === "F").length;
    const defense = list.filter((r) => normalizePos(r.position) === "D").length;
    const goalies = list.filter((r) => normalizePos(r.position) === "G").length;
    totalsEl.textContent = `Total Players: ${list.length}   Total Forwards: ${forwards}   Total Defensemen: ${defense}   Total Goalies: ${goalies}`;
  }

  // --- SEARCH FILTER ---
  let filtered = list.filter((r) => {
    const s = rmSearch.toLowerCase();
    const fullName =
      r.fullName || `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();

    return (
      fullName.toLowerCase().includes(s) ||
      (r.position ?? "").toLowerCase().includes(s)
    );
  });

  // --- POSITION FILTER ---
  filtered = filtered.filter((r) => {
    if (!rmFilters.position) return true;
    return r.position === rmFilters.position;
  });

  // --- SHOOTS FILTER ---
  filtered = filtered.filter((r) => {
    if (!rmFilters.shoots) return true;
    return r.shoots === rmFilters.shoots;
  });

  // --- STATUS FILTER (Option B — use r.gamedayStatus) ---
  filtered = filtered.filter((r) => {
    if (!rmFilters.status) return true;
    const st = r.gamedayStatus ?? "Inactive";
    return st === rmFilters.status;
  });

  // --- SORTING ---
  if (rmSort.field) {
    filtered = filtered.slice().sort((a, b) => {
      const direction = rmSort.direction === "asc" ? 1 : -1;

      // Sort jersey number numerically so 2 comes before 10.
      if (rmSort.field === "jerseyNumber") {
        const numA = Number.parseInt(a.jerseyNumber, 10);
        const numB = Number.parseInt(b.jerseyNumber, 10);
        const hasA = Number.isFinite(numA);
        const hasB = Number.isFinite(numB);

        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return (numA - numB) * direction;
      }

      let A = a[rmSort.field];
      let B = b[rmSort.field];

      if (rmSort.field === "fullName") {
        A = a.fullName || `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
        B = b.fullName || `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim();
      }

      const textA = (A ?? "").toString().toLowerCase();
      const textB = (B ?? "").toString().toLowerCase();
      return textA.localeCompare(textB) * direction;
    });
  }

  console.log("After filtering/sorting:", filtered.length, "items");
  
  // --- RENDER ---
  const html = filtered
    .map((r) => {
      const fullName =
        r.fullName || `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();

      const position = r.position || "-";
      const shoots = r.shoots || "-";
      const jersey = r.jerseyNumber ?? "-";
      const grade = r.grade ?? "-";
      const status = r.gamedayStatus ?? "Inactive";

      return `
      <tr data-roster-entry-id="${r.rosterEntryId}">
        <td>${fullName}</td>
        <td>${position}</td>
        <td>${shoots}</td>
        <td>${jersey}</td>
        <td>${grade}</td>
        <td>${status}</td>
        <td class="actions-col">
          <button class="nf-btn-icon edit" title="Edit">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="nf-btn-icon delete" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  if (body) {
    body.innerHTML = html;
    console.log("✓ Rendered", filtered.length, "rows into table");
  } else {
    console.error("❌ body element not found!");
  }

  attachRosterManagerEvents();
}

// =========================================================
// ROSTER MANAGER EVENTS
// =========================================================
function attachRosterManagerEvents() {
  // --- SEARCH ---
  const searchEl = document.getElementById("rm-search");
  if (searchEl) {
    searchEl.oninput = (e) => {
      rmSearch = e.target.value;
      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  }

  // --- POSITION FILTER ---
  const posFilter = document.getElementById("rm-filter-position");
  if (posFilter) {
    posFilter.onchange = (e) => {
      rmFilters.position = e.target.value;
      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  }

  // --- SHOOTS FILTER ---
  const shootsFilter = document.getElementById("rm-filter-shoots");
  if (shootsFilter) {
    shootsFilter.onchange = (e) => {
      rmFilters.shoots = e.target.value;
      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  }

  // --- STATUS FILTER ---
  const statusFilter = document.getElementById("rm-filter-status");
  if (statusFilter) {
    statusFilter.onchange = (e) => {
      rmFilters.status = e.target.value;
      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  }

  // --- SORTING ---
  document.querySelectorAll("#rm-roster-table .sortable").forEach((th) => {
    th.onclick = () => {
      const field = th.dataset.field;
      rmSort.direction =
        rmSort.field === field && rmSort.direction === "asc" ? "desc" : "asc";
      rmSort.field = field;

      renderRosterManagerTable(rosterCache[window.currentRosterTeamId] || []);
    };
  });

  // --- EDIT BUTTONS ---
  document.querySelectorAll("#rm-roster-body .edit").forEach((btn) => {
    btn.onclick = (e) => {
      const row = e.target.closest("tr");
      const entryId = row.dataset.rosterEntryId;
      roster_openEdit(entryId);
    };
  });

  // --- DELETE BUTTONS ---
  document.querySelectorAll("#rm-roster-body .delete").forEach((btn) => {
    btn.onclick = (e) => {
      const row = e.target.closest("tr");
      const entryId = row.dataset.rosterEntryId;
      openDeleteRoster(entryId);
    };
  });

  // --- CASCADE EVENTS (Org → Team → Player) ---
  if (!attachRosterManagerEvents._cascadeWired) {
    document.addEventListener("change", (e) => {
      if (e.target.id === "roster-org") {
        loadRosterTeams(e.target.value);
      }

      if (e.target.id === "roster-team") {
        loadRosterPlayersByTeam(e.target.value);
      }
    });

    attachRosterManagerEvents._cascadeWired = true;
  }
}
// =========================================================
// ROSTERS MODAL SYSTEM — CLEAN, RELIABLE, UNIFIED
// =========================================================

// Track active modal
let activeRosterModal = null;

// =========================================================
// OPEN / CLOSE HELPERS
// =========================================================
function openModal(overlayId, modalId) {
  const overlay = document.getElementById(overlayId);
  const modal = document.getElementById(modalId);

  if (!overlay || !modal) return;

  overlay.classList.add("active");
  modal.classList.add("active");

  activeRosterModal = { overlay, modal };
}

function closeModal(overlayId, modalId) {
  const overlay = document.getElementById(overlayId);
  const modal = document.getElementById(modalId);

  if (!overlay || !modal) return;

  overlay.classList.remove("active");
  modal.classList.remove("active");

  activeRosterModal = null;
}

// Close currently active modal
function closeActiveModal() {
  console.log("🔴 closeActiveModal called");
  console.log("   activeRosterModal:", activeRosterModal ? "HAS VALUE" : "NULL");
  if (!activeRosterModal) {
    console.log("   ❌ activeRosterModal is NULL - returning");
    return;
  }
  
  const { overlay, modal } = activeRosterModal;
  console.log("   Overlay ID:", overlay?.id);
  console.log("   Modal ID:", modal?.id);
  console.log("   Overlay has 'active' class:", overlay?.classList.contains("active"));
  console.log("   Modal has 'active' class:", modal?.classList.contains("active"));
  
  overlay.classList.remove("active");
  modal.classList.remove("active");
  
  console.log("   ✓ Removed 'active' class from both");
  activeRosterModal = null;
  console.log("   ✓ Set activeRosterModal to null");
}

// =========================================================
// ESC KEY CLOSE
// =========================================================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeActiveModal();
  }
});

// =========================================================
// OVERLAY CLICK CLOSE
// =========================================================
document.addEventListener("click", (e) => {
  if (!activeRosterModal) return;

  const { overlay, modal } = activeRosterModal;

  // If clicking the overlay (not the modal), close it
  if (e.target === overlay) {
    closeActiveModal();
  }
});

// =========================================================
// WIRE ALL CLOSE BUTTONS
// =========================================================
function wireRosterCloseButtons() {
  console.log("🔧 wireRosterCloseButtons called");
  const buttons = document.querySelectorAll(".rm-close, .modal-close");
  console.log("   Found", buttons.length, "close buttons to wire");
  
  buttons.forEach((btn, idx) => {
    const modalId = btn.closest(".nf-modal")?.id || "unknown";
    console.log(`   [${idx}] Button in modal: ${modalId}`);
    
    btn.onclick = () => {
      console.log(`🖱️  Close button clicked (from modal: ${modalId})`);
      console.log(`   Current activeRosterModal:`, activeRosterModal ? activeRosterModal.modal?.id : "NULL");
      
      // Special handling for add/delete modal close - restore manager modal
      if ((modalId === "addPlayerModal" || modalId === "rosterDeleteModal" || modalId === "rosterModal") && window.managerModalBackup) {
        console.log("   🔄 Special close - restoring manager modal...");
        closeActiveModal();
        restoreModalState(window.managerModalBackup);
        console.log("   ✓ Manager modal restored and visible");
        wireRosterCloseButtons();
      } else {
        closeActiveModal();
      }
    };
  });
  
  console.log("   ✓ All close buttons wired");
}

// =========================================================
// ADD PLAYER — OPEN
// =========================================================
async function openAddRoster() {
  console.log("🔵 openAddRoster called for teamId:", window.currentRosterTeamId);
  
  // Save the manager modal reference before opening add modal
  window.managerModalBackup = activeRosterModal;
  console.log("✓ Saved manager modal reference (for add)");
  console.log("  activeRosterModal is:", window.managerModalBackup ? "SET" : "NULL");

  try {
    // Open the Add Player modal
    openModal("addPlayerModalOverlay", "addPlayerModal");
    wireRosterCloseButtons();
    console.log("✓ Add Player modal opened");

    // Fetch available players for this team
    console.log("Fetching available players for team:", window.currentRosterTeamId);
    const availablePlayers = await RosterApi.getAvailablePlayersForTeam(window.currentRosterTeamId);
    console.log("✓ Got available players response:", availablePlayers);
    console.log("✓ Type:", typeof availablePlayers);
    console.log("✓ Is array?:", Array.isArray(availablePlayers));
    console.log("✓ Length:", availablePlayers?.length);

    if (!Array.isArray(availablePlayers)) {
      console.error("❌ Response is not an array!");
      throw new Error("API response is not an array");
    }

    console.log("✓ Available players count:", availablePlayers.length);

    // Render players list with checkboxes
    const playersList = document.getElementById("addPlayersList");
    
    if (availablePlayers.length === 0) {
      console.log("No available players to display");
      playersList.innerHTML = '<p style="color: #999; text-align: center;">No available players</p>';
    } else {
      console.log("Rendering", availablePlayers.length, "players...");
      playersList.innerHTML = availablePlayers.map((player) => {
        const fullName = player.fullName || `${player.firstName} ${player.lastName}`;
        const position = player.position || "—";
        const shoots = player.shoots || "—";
        
        return `
          <div style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #444;">
            <input 
              type="checkbox" 
              class="add-player-checkbox" 
              data-player-id="${player.playerId}"
              data-player-name="${fullName}"
              style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;">
            <div style="flex: 1;">
              <div style="font-weight: 500;">${fullName}</div>
              <div style="font-size: 12px; color: #999;">Pos: ${position} | Shoots: ${shoots}</div>
            </div>
          </div>
        `;
      }).join("");
      console.log("✓ Rendered all players");
    }

    console.log("✅ openAddRoster completed successfully");

  } catch (error) {
    console.error("❌ Failed to open add roster modal:", error);
    console.error("Error details:", error.message, error.stack);
    showMessage("Failed to load available players. Please try again.", "error", 4000);
    closeActiveModal();
    if (window.managerModalBackup) {
      activeRosterModal = window.managerModalBackup;
      wireRosterCloseButtons();
    }
  }
}

// =========================================================
// ADD PLAYERS — SAVE (multiple)
// =========================================================
async function saveSelectedPlayers() {
  const saveBtn = document.getElementById("addPlayersSave");
  const originalText = saveBtn.textContent;

  try {
    const teamId = window.currentRosterTeamId;
    
    // Get all checked checkboxes
    const checkedBoxes = document.querySelectorAll(".add-player-checkbox:checked");
    
    if (checkedBoxes.length === 0) {
      showMessage("Please select at least one player.", "warning", 2500);
      return;
    }

    console.log("saveSelectedPlayers: Adding", checkedBoxes.length, "players to teamId:", teamId);

    saveBtn.textContent = "Adding...";
    saveBtn.disabled = true;

    let successCount = 0;
    let failureCount = 0;

    // Create roster entries for each selected player
    for (const checkbox of checkedBoxes) {
      const playerId = checkbox.dataset.playerId;
      const playerName = checkbox.dataset.playerName;

      try {
        const payload = {
          teamId: teamId,
          playerId: playerId,
          position: null,  // Use player's default position
          jerseyNumber: null,
          gamedayStatus: "Active",
          isActive: true,
        };

        console.log(`Creating roster entry for ${playerName}...`);
        const response = await RosterApi.create(payload);
        console.log(`✓ Created roster entry for ${playerName}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to add ${playerName}:`, err);
        failureCount++;
      }
    }

    console.log(`Add completed: ${successCount} success, ${failureCount} failures`);

    // Close add modal
    closeActiveModal();

    // Restore manager modal visual state after closing add modal
    if (window.managerModalBackup) {
      restoreModalState(window.managerModalBackup);
      wireRosterCloseButtons();
    }

    // Refresh roster
    console.log("Fetching fresh roster...");
    await fetchRosterFresh(teamId);

    console.log("Roster refreshed!");

    // Reset button
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;

    if (failureCount === 0) {
      showMessage(`Successfully added ${successCount} player${successCount !== 1 ? 's' : ''}`, "success", 3500);
    } else {
      showMessage(`Added ${successCount} player${successCount !== 1 ? 's' : ''} | Failed: ${failureCount}`, "warning", 4000);
    }

  } catch (error) {
    console.error("❌ Save failed:", error);
    saveBtn.textContent = "Add Failed - Try Again";
    saveBtn.style.backgroundColor = "#d32f2f";

    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.backgroundColor = "";
      saveBtn.disabled = false;
    }, 3000);
  }
}

// =========================================================
// REFRESH JERSEY NUMBERS FROM PLAYERS DB
// =========================================================
async function refreshRosterJerseyNumbers() {
  const refreshBtn = document.getElementById("rm-refresh-jerseys");
  const originalText = refreshBtn?.textContent || "Refresh Jersey Numbers";

  try {
    const teamId = window.currentRosterTeamId;
    if (!teamId) {
      showMessage("No team selected.", "warning", 2500);
      return;
    }

    if (refreshBtn) {
      refreshBtn.textContent = "Refreshing...";
      refreshBtn.disabled = true;
    }

    if (!allPlayers || allPlayers.length === 0) {
      await loadPlayersList();
    }

    const roster = rosterCache[teamId] || [];
    if (!roster.length) {
      showMessage("No roster entries found for this team.", "warning", 2500);
      return;
    }

    const normalizeGuid = (value) =>
      value == null ? "" : String(value).trim().toLowerCase();

    const defaultJerseyByPlayerId = new Map();
    (allPlayers || []).forEach((p) => {
      const key = normalizeGuid(p.playerId ?? p.id ?? p.PlayerId ?? p.Id);
      if (!key) return;
      defaultJerseyByPlayerId.set(key, p.jerseyNumber ?? null);
    });

    const entriesToRefresh = roster.filter((entry) => {
      const playerKey = normalizeGuid(entry.playerId ?? entry.PlayerId);
      const defaultJersey = defaultJerseyByPlayerId.get(playerKey);
      return defaultJersey !== undefined && (entry.jerseyNumber ?? null) !== defaultJersey;
    });

    if (!entriesToRefresh.length) {
      showMessage("Jersey numbers are already up to date.", "info", 2500);
      return;
    }

    let updatedCount = 0;
    let failedCount = 0;

    for (const entry of entriesToRefresh) {
      try {
        const detail = await RosterApi.getById(entry.rosterEntryId);
        const playerKey = normalizeGuid(entry.playerId ?? entry.PlayerId);
        const defaultJersey = defaultJerseyByPlayerId.get(playerKey) ?? null;

        const payload = {
          jerseyNumber: defaultJersey,
          position: detail.position ?? null,
          shoots: detail.shoots ?? null,
          gamedayStatus:
            detail.gamedayStatus ?? (detail.isActive ? "Active" : "Inactive"),
          lineNumber: detail.lineNumber ?? null,
          grade: detail.grade ?? null,
          notes: detail.notes ?? null,
          isCaptain: !!detail.isCaptain,
          isAssistantCaptain: !!detail.isAssistantCaptain,
          isGoalie: !!detail.isGoalie,
          isActive: detail.isActive !== false,
        };

        await RosterApi.update(entry.rosterEntryId, payload);
        updatedCount++;
      } catch (err) {
        console.error("Failed to refresh jersey number for entry:", entry, err);
        failedCount++;
      }
    }

    await fetchRosterFresh(teamId);

    if (failedCount === 0) {
      showMessage(`Updated ${updatedCount} jersey number${updatedCount !== 1 ? "s" : ""}.`, "success", 3000);
    } else {
      showMessage(`Updated ${updatedCount}. Failed ${failedCount}.`, "warning", 3500);
    }
  } catch (error) {
    console.error("Refresh jersey numbers failed:", error);
    showMessage("Failed to refresh jersey numbers.", "error", 3500);
  } finally {
    if (refreshBtn) {
      refreshBtn.textContent = originalText;
      refreshBtn.disabled = false;
    }
  }
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  values.push(current);
  return values;
}

function normalizeCsvHeader(value) {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

function parseCsvText(text) {
  const lines = (text ?? "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]).map(normalizeCsvHeader);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").toString().trim();
    });

    rows.push(row);
  }

  return rows;
}

function normalizeRosterPosition(value) {
  const v = (value ?? "").toString().trim().toUpperCase();
  if (v === "F" || v === "FORWARD") return "F";
  if (v === "D" || v === "DEFENSE" || v === "DEFENCEMAN" || v === "DEFENSEMAN") return "D";
  if (v === "G" || v === "GOALIE" || v === "GOALTENDER") return "G";
  return null;
}

function splitFullName(value) {
  const clean = (value ?? "").toString().trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: "", lastName: "" };

  const parts = clean.split(" ");
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeNameKey(value) {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeGuidKey(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

async function fetchTeamRosterNow(teamId) {
  const res = await authFetch(`/teams/${teamId}/roster`);
  if (!res.ok) {
    throw new Error(`Failed to refresh roster (HTTP ${res.status})`);
  }
  const payload = await res.json();
  return Array.isArray(payload) ? payload : payload?.data || payload?.entries || [];
}

async function createPlayerForRosterUpload(teamId, teamOrganizationId, row) {
  const { firstName, lastName } = splitFullName(row.fullname);
  if (!firstName) {
    throw new Error("fullName is required.");
  }

  const parsedJersey = Number.parseInt(row.jerseynumber, 10);
  const parsedGrade = Number.parseInt(row.grade, 10);
  const position = normalizeRosterPosition(row.position) || null;

  const createPayload = {
    firstName,
    lastName,
    position,
    jerseyNumber: Number.isFinite(parsedJersey) ? parsedJersey : null,
    grade: Number.isFinite(parsedGrade) ? parsedGrade : null,
    organizationId: teamOrganizationId || null,
    teamIds: [teamId],
    isActive: true,
  };

  const res = await authFetch(`/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPayload),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.error || JSON.stringify(errBody);
    } catch {
      try {
        detail = await res.text();
      } catch {
        // keep default detail
      }
    }

    if (res.status === 403) {
      detail = "Permission denied creating players. Requires OrgAdmin or SuperAdmin.";
    }

    throw new Error(detail);
  }

  const createResult = await res.json().catch(() => ({}));
  const playerId =
    createResult?.id ||
    createResult?.playerId ||
    createResult?.player?.id ||
    "";

  if (!playerId) {
    throw new Error("Player created but response did not include an id.");
  }

  return {
    playerId,
    position,
    jerseyNumber: Number.isFinite(parsedJersey) ? parsedJersey : null,
    grade: Number.isFinite(parsedGrade) ? parsedGrade : null,
  };
}

function downloadRosterSampleCsv() {
  const sample = [
    "fullName,position,jerseyNumber,grade",
    "Alex Smith,F,12,10",
    "Jordan Lee,D,4,11",
    "Casey Brown,G,30,12",
  ].join("\n");

  const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "roster-upload-sample.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function showRosterImportSummaryModal(summary) {
  const overlayId = "rosterImportSummaryOverlay";
  const existing = document.getElementById(overlayId);
  if (existing) {
    existing.remove();
  }

  const addedItems = (summary.added || [])
    .map((item) => `<li>Line ${item.line}: ${item.name}</li>`)
    .join("");

  const skippedItems = (summary.skipped || [])
    .map((item) => `<li>Line ${item.line}: ${item.name} (${item.reason})</li>`)
    .join("");

  const failedItems = (summary.failed || [])
    .map((item) => `<li>Line ${item.line}: ${item.name} (${item.reason})</li>`)
    .join("");

  const overlay = document.createElement("div");
  overlay.id = overlayId;
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:12000;";

  overlay.innerHTML = `
    <div style="width:min(860px,95vw);max-height:88vh;overflow:auto;background:#0f172a;border:1px solid #334155;border-radius:10px;color:#e2e8f0;box-shadow:0 12px 36px rgba(0,0,0,.45);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #334155;">
        <h3 style="margin:0;font-size:18px;color:#f8fafc;">Roster Upload Summary</h3>
        <button id="rosterImportSummaryCloseX" style="background:none;border:none;color:#cbd5e1;font-size:22px;cursor:pointer;line-height:1;">×</button>
      </div>

      <div style="padding:14px 16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        <div style="background:#052e16;border:1px solid #14532d;border-radius:8px;padding:10px;">
          <div style="font-size:12px;color:#86efac;">Added</div>
          <div style="font-size:22px;font-weight:700;color:#dcfce7;">${summary.added.length}</div>
        </div>
        <div style="background:#3f2f00;border:1px solid #a16207;border-radius:8px;padding:10px;">
          <div style="font-size:12px;color:#fcd34d;">Skipped</div>
          <div style="font-size:22px;font-weight:700;color:#fef3c7;">${summary.skipped.length}</div>
        </div>
        <div style="background:#450a0a;border:1px solid #991b1b;border-radius:8px;padding:10px;">
          <div style="font-size:12px;color:#fca5a5;">Failed</div>
          <div style="font-size:22px;font-weight:700;color:#fee2e2;">${summary.failed.length}</div>
        </div>
      </div>

      <div style="padding:0 16px 16px;display:grid;grid-template-columns:1fr;gap:12px;">
        <div>
          <div style="font-weight:600;margin-bottom:6px;color:#86efac;">Added Players</div>
          <ul style="margin:0;padding-left:18px;max-height:160px;overflow:auto;">${addedItems || "<li>None</li>"}</ul>
        </div>
        <div>
          <div style="font-weight:600;margin-bottom:6px;color:#fcd34d;">Skipped Rows</div>
          <ul style="margin:0;padding-left:18px;max-height:160px;overflow:auto;">${skippedItems || "<li>None</li>"}</ul>
        </div>
        <div>
          <div style="font-weight:600;margin-bottom:6px;color:#fca5a5;">Failed Rows</div>
          <ul style="margin:0;padding-left:18px;max-height:200px;overflow:auto;">${failedItems || "<li>None</li>"}</ul>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid #334155;">
        <button id="rosterImportSummaryClose" class="nf-btn nf-btn-primary">Close</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  document.body.appendChild(overlay);
  const closeBtn = document.getElementById("rosterImportSummaryClose");
  const closeX = document.getElementById("rosterImportSummaryCloseX");
  if (closeBtn) closeBtn.onclick = close;
  if (closeX) closeX.onclick = close;
}

async function importRosterFromCsvFile(file) {
  const uploadBtn = document.getElementById("rm-upload-roster");
  const inputEl = document.getElementById("rm-upload-input");
  const originalBtnText = uploadBtn?.textContent || "Upload Roster CSV";

  try {
    const teamId = window.currentRosterTeamId;
    if (!teamId) {
      showMessage("No team selected.", "warning", 2500);
      return;
    }

    if (!file) {
      showMessage("Please select a CSV file.", "warning", 2500);
      return;
    }

    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";
    }

    const csvText = await file.text();
    const rows = parseCsvText(csvText);

    if (!rows.length) {
      showMessage("CSV file is empty.", "warning", 3000);
      return;
    }

    const requiredHeaders = ["fullname", "position", "jerseynumber", "grade"];
    const providedHeaders = Object.keys(rows[0] || {});
    const missingHeaders = requiredHeaders.filter((h) => !providedHeaders.includes(h));
    if (missingHeaders.length) {
      showMessage(
        `Missing required CSV columns: ${missingHeaders.join(", ")}. Expected: fullName, position, jerseyNumber, grade.`,
        "warning",
        5000,
      );
      return;
    }

    const selectedTeam = allTeams.find((t) => t.teamId === teamId) || null;
    const teamOrganizationId = selectedTeam?.organizationId || null;

    // Build lookup sets once so upload can dedupe before creating records.
    const existingRoster = rosterCache[teamId] || [];
    const existingRosterNames = new Set(
      existingRoster
        .map((entry) =>
          normalizeNameKey(
            entry.fullName || `${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim(),
          ),
        )
        .filter(Boolean),
    );
    const existingRosterPlayerIds = new Set(
      existingRoster
        .map((entry) => normalizeGuidKey(entry.playerId ?? entry.PlayerId))
        .filter(Boolean),
    );

    const availablePlayers = await RosterApi.getAvailablePlayersForTeam(teamId);
    const availablePlayersByName = new Map();
    (availablePlayers || []).forEach((player) => {
      const key = normalizeNameKey(
        player.fullName || `${player.firstName ?? ""} ${player.lastName ?? ""}`.trim(),
      );
      if (key && !availablePlayersByName.has(key)) {
        availablePlayersByName.set(key, player);
      }
    });

    const csvSeenNames = new Set();

    const summary = {
      added: [],
      skipped: [],
      failed: [],
    };

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const lineNumber = index + 2;

      const fullName = (row.fullname || "").toString().trim();
      const fullNameKey = normalizeNameKey(fullName);
      if (!fullName) {
        summary.failed.push({ line: lineNumber, name: "(blank)", reason: "fullName is required" });
        continue;
      }

      if (existingRosterNames.has(fullNameKey)) {
        summary.skipped.push({ line: lineNumber, name: fullName, reason: "already on roster" });
        continue;
      }

      if (csvSeenNames.has(fullNameKey)) {
        summary.skipped.push({ line: lineNumber, name: fullName, reason: "duplicate row in CSV" });
        continue;
      }

      try {
        let playerId = "";
        let resolvedPosition = normalizeRosterPosition(row.position) || null;
        const parsedJersey = Number.parseInt(row.jerseynumber, 10);
        const resolvedJersey = Number.isFinite(parsedJersey) ? parsedJersey : null;
        const parsedGrade = Number.parseInt(row.grade, 10);
        const resolvedGrade = Number.isFinite(parsedGrade) ? parsedGrade : null;

        const existingAvailablePlayer = availablePlayersByName.get(fullNameKey);
        if (existingAvailablePlayer?.playerId) {
          playerId = existingAvailablePlayer.playerId;
          resolvedPosition =
            resolvedPosition || normalizeRosterPosition(existingAvailablePlayer.position) || null;
        } else {
          const createdPlayer = await createPlayerForRosterUpload(
            teamId,
            teamOrganizationId,
            row,
          );
          playerId = createdPlayer.playerId;
          resolvedPosition = createdPlayer.position;
        }

        const payload = {
          teamId,
          playerId,
          position: resolvedPosition,
          jerseyNumber: resolvedJersey,
          grade: resolvedGrade,
          gamedayStatus: "Active",
          isActive: true,
        };

        const playerIdKey = normalizeGuidKey(playerId);
        if (existingRosterPlayerIds.has(playerIdKey)) {
          summary.skipped.push({ line: lineNumber, name: fullName, reason: "player already on roster" });
          existingRosterNames.add(fullNameKey);
          csvSeenNames.add(fullNameKey);
          continue;
        }

        // Defensive re-check: player creation with team assignment can materialize roster rows server-side.
        const latestRoster = await fetchTeamRosterNow(teamId);
        const alreadyOnRoster = latestRoster.some(
          (entry) => normalizeGuidKey(entry.playerId ?? entry.PlayerId) === playerIdKey,
        );

        if (alreadyOnRoster) {
          existingRosterPlayerIds.add(playerIdKey);
          summary.skipped.push({ line: lineNumber, name: fullName, reason: "player was already materialized on roster" });
          existingRosterNames.add(fullNameKey);
          csvSeenNames.add(fullNameKey);
          continue;
        }

        await RosterApi.create(payload);
        existingRosterPlayerIds.add(playerIdKey);
        existingRosterNames.add(fullNameKey);
        csvSeenNames.add(fullNameKey);
        summary.added.push({ line: lineNumber, name: fullName });
      } catch (error) {
        summary.failed.push({
          line: lineNumber,
          name: fullName,
          reason: error?.message || "failed to create player/roster entry",
        });
      }
    }

    await fetchRosterFresh(teamId);

    const addedCount = summary.added.length;
    const skippedCount = summary.skipped.length;
    const failedCount = summary.failed.length;
    showMessage(
      `Import finished. Added ${addedCount}, skipped ${skippedCount}, failed ${failedCount}.`,
      failedCount > 0 ? "warning" : "success",
      3500,
    );
    showRosterImportSummaryModal(summary);
  } catch (error) {
    console.error("Roster CSV upload failed:", error);
    showMessage("Roster CSV upload failed. Please verify the file format.", "error", 4500);
  } finally {
    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = originalBtnText;
    }
    if (inputEl) {
      inputEl.value = "";
    }
  }
}

function openRosterCsvPicker() {
  const inputEl = document.getElementById("rm-upload-input");
  if (!inputEl) {
    showMessage("Upload input is not available.", "error", 3000);
    return;
  }

  inputEl.click();
}

// =========================================================
// EDIT PLAYER — OPEN
// =========================================================
async function roster_openEdit(entryId) {
  console.log("🔵 roster_openEdit called with entryId:", entryId);
  
  try {
    const entry = await RosterApi.getById(entryId);
    
    console.log("=== ROSTER ENTRY API RESPONSE ===");
    console.log("Full entry object:", entry);
    console.log("jerseyNumber:", entry.jerseyNumber);
    console.log("position:", entry.position);
    console.log("gamedayStatus:", entry.gamedayStatus);
    console.log("===================================");

    // Set global state FIRST
    window.currentRosterEntryId = entryId;
    window.currentRosterTeamId = entry.teamId;
    console.log("✓ Set window.currentRosterEntryId:", window.currentRosterEntryId);
    console.log("✓ Set window.currentRosterTeamId:", window.currentRosterTeamId);

    // Save the manager modal reference before opening edit modal
    window.managerModalBackup = activeRosterModal;
    console.log("✓ Saved manager modal reference");

    // Open modal
    openModal("rosterModalOverlay", "rosterModal");
    wireRosterCloseButtons();
    console.log("✓ Modal opened");

    // Player name
    document.getElementById("editPlayerName").textContent =
      entry.fullName || `${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim();

    // Position (F/D/G) - null → empty string
    const posVal = entry.position;
    document.getElementById("editPosition").value = posVal ?? "";
    console.log("Set editPosition to:", document.getElementById("editPosition").value, "(raw:", posVal, ")");

    // Jersey # (null → empty string)
    const jerseyNumVal = entry.jerseyNumber;
    document.getElementById("editJersey").value =
      jerseyNumVal == null || jerseyNumVal === "" ? "" : String(jerseyNumVal);
    console.log("Set editJersey value to:", document.getElementById("editJersey").value, "(raw:", jerseyNumVal, ")");

    // Game Day Status: prefer gamedayStatus, fall back to isActive
    const isActive =
      entry.gamedayStatus === "Active" ||
      (entry.gamedayStatus == null && entry.isActive === true);

    document.getElementById("editStatus").checked = isActive;
    console.log("Set editStatus checkbox to:", isActive);
    console.log("✅ roster_openEdit completed successfully");
    
  } catch (error) {
    console.error("❌ Failed to open roster entry for edit:", error);
    console.error("Error stack:", error.stack);
    alert("Failed to load roster entry. Please try again.");
  }
}

// =========================================================
// DELETE MODAL — OPEN
// =========================================================
function openDeleteRoster(entryId) {
  window.currentRosterEntryId = entryId;

  openModal("rosterDeleteModalOverlay", "rosterDeleteModal");
  wireRosterCloseButtons();
}

// =========================================================
// SAVE ROSTER ENTRY (ADD OR EDIT)
// =========================================================
async function saveRosterEntry() {
  const saveBtn = document.getElementById("rosterSave");
  const originalText = saveBtn.textContent;
  
  try {
    const entryId = window.currentRosterEntryId;
    const teamId = window.currentRosterTeamId;
    
    console.log("Save starting. Entry ID:", entryId, "Team ID:", teamId);
    
    if (!entryId) {
      throw new Error("No entry ID set!");
    }
    
    const jerseyVal = document.getElementById("editJersey").value;
    const payload = {
      position: document.getElementById("editPosition").value || null,
      jerseyNumber: jerseyVal === "" ? null : parseInt(jerseyVal, 10),
      gamedayStatus: document.getElementById("editStatus").checked
        ? "Active"
        : "Inactive",
      isActive: document.getElementById("editStatus").checked,
    };

    console.log("Sending payload:", payload);
    
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    const response = await RosterApi.update(entryId, payload);
    console.log("Update response:", response);

    console.log("Save successful! Closing edit modal...");
    console.log("Before closeActiveModal - activeRosterModal:", activeRosterModal ? "HAS VALUE" : "NULL");
    closeActiveModal();
    console.log("After closeActiveModal - activeRosterModal:", activeRosterModal ? "HAS VALUE" : "NULL");
    
    // Restore manager modal visual state after closing edit modal
    if (window.managerModalBackup) {
      console.log("Restoring manager modal...");
      restoreModalState(window.managerModalBackup);
      wireRosterCloseButtons();
      console.log("✓ Re-wired close buttons for manager modal");
    }
    
    console.log("Modal closed. Fetching fresh roster...");
    await fetchRosterFresh(teamId);
    
    console.log("Roster refreshed!");
    
    // ✅ RESET BUTTON AFTER SUCCESS
    console.log("Resetting button to original state...");
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
    saveBtn.style.backgroundColor = "";
    
  } catch (error) {
    console.error("❌ Save failed:", error);
    console.error("Error details:", error.message, error.stack);
    
    saveBtn.textContent = "Save Failed - Try Again";
    saveBtn.style.backgroundColor = "#d32f2f";
    
    setTimeout(() => {
      console.log("Resetting button after error...");
      saveBtn.textContent = originalText;
      saveBtn.style.backgroundColor = "";
      saveBtn.disabled = false;
    }, 3000);
  }
}

// =========================================================
// DELETE CONFIRM
// =========================================================
async function confirmDeleteRoster() {
  if (!window.currentRosterEntryId) {
    console.error("No roster entry ID set!");
    return;
  }

  const delBtn = document.getElementById("rosterDeleteConfirm");
  const originalText = delBtn.textContent;
  const teamId = window.currentRosterTeamId;
  const entryId = window.currentRosterEntryId;

  try {
    console.log("🔴 confirmDeleteRoster starting for entryId:", entryId, "teamId:", teamId);
    
    delBtn.textContent = "Deleting...";
    delBtn.disabled = true;

    await RosterApi.delete(entryId);
    console.log("✓ Delete API call succeeded");

    console.log("Closing delete modal...");
    closeActiveModal();
    
    // Restore manager modal visual state after closing delete modal
    if (window.managerModalBackup) {
      console.log("Restoring manager modal...");
      restoreModalState(window.managerModalBackup);
      wireRosterCloseButtons();
      console.log("✓ Re-wired close buttons");
    } else {
      console.error("❌ managerModalBackup is NULL!");
    }
    
    console.log("Fetching fresh roster...");
    await fetchRosterFresh(teamId);
    console.log("✓ Roster refreshed after delete");
    
    // ✅ RESET BUTTON AFTER SUCCESS
    console.log("Resetting delete button to original state...");
    delBtn.textContent = originalText;
    delBtn.disabled = false;
    delBtn.style.backgroundColor = "";
    
    // Clear entry ID only (keep team ID for Add Player button to work)
    window.currentRosterEntryId = null;
    console.log("✓ Cleared entry ID");
    
  } catch (error) {
    console.error("❌ Delete failed:", error);
    delBtn.textContent = "Delete Failed - Try Again";
    delBtn.style.backgroundColor = "#d32f2f";
    setTimeout(() => {
      delBtn.textContent = originalText;
      delBtn.style.backgroundColor = "";
      delBtn.disabled = false;
    }, 3000);
  }
}

// =========================================================
// INITIALIZE MODAL BUTTONS
// =========================================================
function initRosterModalButtons() {
  // Add Player button inside Roster Manager
  const addBtn = document.getElementById("rm-add-player");
  if (addBtn) {
    addBtn.onclick = () => openAddRoster();
  }

  const refreshJerseysBtn = document.getElementById("rm-refresh-jerseys");
  if (refreshJerseysBtn) {
    refreshJerseysBtn.onclick = () => refreshRosterJerseyNumbers();
  }

  const uploadBtn = document.getElementById("rm-upload-roster");
  if (uploadBtn) {
    uploadBtn.onclick = () => openRosterCsvPicker();
  }

  const downloadSampleBtn = document.getElementById("rm-download-sample");
  if (downloadSampleBtn) {
    downloadSampleBtn.onclick = () => downloadRosterSampleCsv();
  }

  const uploadInput = document.getElementById("rm-upload-input");
  if (uploadInput) {
    uploadInput.onchange = async (e) => {
      const file = e.target?.files?.[0] || null;
      await importRosterFromCsvFile(file);
    };
  }

  // Add Players modal — Save button (multiple players)
  const addPlayersSaveBtn = document.getElementById("addPlayersSave");
  if (addPlayersSaveBtn) {
    addPlayersSaveBtn.onclick = () => saveSelectedPlayers();
  }

  // Save button (Edit modal)
  const saveBtn = document.getElementById("rosterSave");
  if (saveBtn) {
    saveBtn.onclick = () => saveRosterEntry();
  }

  // Cancel button
  const cancelBtn = document.getElementById("rosterCancel");
  if (cancelBtn) {
    cancelBtn.onclick = () => closeActiveModal();
  }

  // Delete confirm
  const delConfirm = document.getElementById("rosterDeleteConfirm");
  if (delConfirm) {
    delConfirm.onclick = () => confirmDeleteRoster();
  }

  // Delete cancel
  const delCancel = document.getElementById("rosterDeleteCancel");
  if (delCancel) {
    delCancel.onclick = () => closeActiveModal();
  }

  wireRosterCloseButtons();
}

// Call after layout loads
document.addEventListener("layoutLoaded", initRosterModalButtons);
