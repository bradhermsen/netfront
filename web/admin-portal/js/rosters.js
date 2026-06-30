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
let rmSearch = "";
let rmFilters = { position: "", shoots: "", status: "" };

let globalFilters = {
  search: "",
  organization: "",
  teamId: "",
  levelId: "",
  status: "",
};

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
  if (!document.getElementById("teamsRosterBody")) return;

  console.log("ROSTERS: Initializing page…");

  await loadTeamsList();
  await loadPlayersList();

  populateRosterFilterDropdowns();
  attachGlobalFilterEvents();

  renderTeamsTable(allTeams);

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
      applyMainRosterFilters();
    });
  }

  const orgFilter = document.getElementById("filter-organization");
  if (orgFilter) {
    orgFilter.onchange = (e) => {
      globalFilters.organization = e.target.value;
      applyMainRosterFilters();
    };
  }

  const teamFilter = document.getElementById("filter-team");
  if (teamFilter) {
    teamFilter.onchange = (e) => {
      globalFilters.teamId = e.target.value;
      applyMainRosterFilters();
    };
  }

  const levelFilter = document.getElementById("filter-level");
  if (levelFilter) {
    levelFilter.onchange = (e) => {
      globalFilters.levelId = e.target.value;
      applyMainRosterFilters();
    };
  }

  const statusFilter = document.getElementById("filter-status");
  if (statusFilter) {
    statusFilter.onchange = (e) => {
      globalFilters.status = e.target.value;
      applyMainRosterFilters();
    };
  }
}

// =========================================================
// APPLY FILTERS
// =========================================================
function applyMainRosterFilters() {
  let filtered = [...allTeams];

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

  renderTeamsTable(filtered);
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
  const body = document.getElementById("teamsRosterBody");
  if (!body) return;

  body.innerHTML = "";

  teams.forEach((team) => {
    const row = document.createElement("tr");
    row.dataset.teamId = team.teamId;

    row.innerHTML = `
      <td>${team.name}</td>
      <td>${team.levelName}</td>
      <td>${team.organizationName}</td>
      <td>${team.rosterCount ?? 0}</td>
      <td>${team.isActive ? "Active" : "Inactive"}</td>
      <td class="actions-col">
        <button class="nf-btn-icon" title="Manage Roster"
          onclick="openRosterManager('${team.teamId}')">
          <i class="fa-solid fa-users"></i>
        </button>
      </td>
    `;

    body.appendChild(row);
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

  document.getElementById("rosterManagerTitle").textContent =
    `Manage Roster — ${team.name} ${team.levelName}`;

  document.getElementById("rm-current-team").textContent = team.name;

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
      const A = (a[rmSort.field] ?? "").toString().toLowerCase();
      const B = (b[rmSort.field] ?? "").toString().toLowerCase();
      return rmSort.direction === "asc"
        ? A.localeCompare(B)
        : B.localeCompare(A);
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
