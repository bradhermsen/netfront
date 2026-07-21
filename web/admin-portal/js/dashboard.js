// dashboard.js — Role-specific dashboard logic

// =========================================================
// ROLE-BASED DASHBOARD INITIALIZATION
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
  const userRole = Auth.getRole();
// Initialize role-specific dashboard
  if (userRole === window.ROLES.TeamManager) {
    await initializeTeamManagerDashboard();
  } else if (userRole === window.ROLES.SuperAdmin || userRole === window.ROLES.OrgAdmin) {
    await initializeAdminDashboard();
  } else if (userRole === window.ROLES.Coach) {
    await initializeCoachDashboard();
  }
});

// =========================================================
// TEAM MANAGER DASHBOARD
// =========================================================
async function initializeTeamManagerDashboard() {
try {
    // Load assigned teams
    const assignedTeams = await loadAssignedTeamsForManager();
    displayTeamManagerOptions(assignedTeams);
  } catch (err) {
    console.error("Failed to initialize Team Manager dashboard:", err);
    showMessage("Failed to load dashboard data", "error");
  }
}

// Get teams assigned to the current user
async function loadAssignedTeamsForManager() {
  try {
    const userId = localStorage.getItem("nf_user_id");
    if (!userId) {
      console.warn("No user ID found in localStorage");
      return [];
    }

    const res = await authFetch(`/coachteams/coach/${userId}`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const teams = await res.json();
return teams;
  } catch (err) {
    console.error("Failed to load assigned teams:", err);
    return [];
  }
}

// Display Team Manager options in dashboard
function displayTeamManagerOptions(assignedTeams) {
  const contentArea = document.querySelector(".page-content") || 
                     document.querySelector("main") || 
                     document.querySelector("[role='main']");
  
  if (!contentArea) {
    console.warn("Could not find content area for dashboard");
    return;
  }

  let html = `
    <div class="dashboard-section team-manager-section">
      <h2 class="section-title">Team Manager Dashboard</h2>
      <p class="section-subtitle">Manage your assigned teams and their resources</p>

      <div class="dashboard-grid">
  `;

  if (assignedTeams && assignedTeams.length > 0) {
    html += `
      <div class="dashboard-card">
        <h3>📋 Assigned Teams (${assignedTeams.length})</h3>
        <p class="card-description">View and manage your assigned teams</p>
        <ul class="team-list">
    `;
    
    assignedTeams.forEach(team => {
      html += `
        <li class="team-item">
          <span class="team-name">${team.teamName || team.name || 'Unnamed Team'}</span>
        </li>
      `;
    });

    html += `
        </ul>
        <button class="btn-primary" onclick="navigateToPage('teams.html')">
          Manage Teams
        </button>
      </div>
    `;
  } else {
    html += `
      <div class="dashboard-card">
        <h3>📋 Assigned Teams</h3>
        <p class="card-description">No teams assigned yet</p>
      </div>
    `;
  }

  html += `
      <div class="dashboard-card">
        <h3>📅 Schedule Management</h3>
        <p class="card-description">Create and manage game schedules</p>
        <button class="btn-primary" onclick="navigateToPage('schedules.html')">
          Manage Schedules
        </button>
      </div>

      <div class="dashboard-card">
        <h3>👥 Roster Management</h3>
        <p class="card-description">Manage team rosters and player assignments</p>
        <button class="btn-primary" onclick="navigateToPage('rosters.html')">
          Manage Rosters
        </button>
      </div>

      <div class="dashboard-card">
        <h3>🎮 Players</h3>
        <p class="card-description">Manage player master data</p>
        <button class="btn-primary" onclick="navigateToPage('players.html')">
          Manage Players
        </button>
      </div>

      <div class="dashboard-card">
        <h3>🔐 Access Codes</h3>
        <p class="card-description">Generate and manage Game Manager and Stat Manager access codes</p>
        <button class="btn-primary" onclick="navigateToPage('access-codes.html')">
          Generate Codes
        </button>
      </div>
    </div>
    </div>
  `;

  contentArea.innerHTML = html;
}

// =========================================================
// ADMIN DASHBOARD (Super Admin / Org Admin)
// =========================================================
async function initializeAdminDashboard() {
try {
    displayAdminOptions();
  } catch (err) {
    console.error("Failed to initialize Admin dashboard:", err);
    showMessage("Failed to load dashboard data", "error");
  }
}

function displayAdminOptions() {
  const contentArea = document.querySelector(".page-content") || 
                     document.querySelector("main") || 
                     document.querySelector("[role='main']");
  
  if (!contentArea) {
    console.warn("Could not find content area for dashboard");
    return;
  }

  const userRole = Auth.getRole();
  const isSuperAdmin = userRole === window.ROLES.SuperAdmin;

  let html = `
    <div class="dashboard-section admin-section">
      <h2 class="section-title">Admin Dashboard</h2>
      <p class="section-subtitle">System and organization management</p>

      <div class="dashboard-grid">
  `;

  if (isSuperAdmin) {
    html += `
      <div class="dashboard-card">
        <h3>🏢 Organizations</h3>
        <p class="card-description">Create and manage organizations</p>
        <button class="btn-primary" onclick="navigateToPage('organizations.html')">
          Manage Organizations
        </button>
      </div>

      <div class="dashboard-card">
        <h3>👥 Users</h3>
        <p class="card-description">Create and manage system users</p>
        <button class="btn-primary" onclick="navigateToPage('users.html')">
          Manage Users
        </button>
      </div>

      <div class="dashboard-card">
        <h3>🔐 Permissions</h3>
        <p class="card-description">Configure role-based permissions</p>
        <button class="btn-primary" onclick="navigateToPage('permissions.html')">
          Manage Permissions
        </button>
      </div>
    `;
  }

  html += `
      <div class="dashboard-card">
        <h3>📋 Teams</h3>
        <p class="card-description">Manage teams and team assignments</p>
        <button class="btn-primary" onclick="navigateToPage('teams.html')">
          Manage Teams
        </button>
      </div>

      <div class="dashboard-card">
        <h3>📅 Schedules</h3>
        <p class="card-description">Create and manage game schedules</p>
        <button class="btn-primary" onclick="navigateToPage('schedules.html')">
          Manage Schedules
        </button>
      </div>

      <div class="dashboard-card">
        <h3>👥 Rosters</h3>
        <p class="card-description">Manage team rosters</p>
        <button class="btn-primary" onclick="navigateToPage('rosters.html')">
          Manage Rosters
        </button>
      </div>

      <div class="dashboard-card">
        <h3>🎮 Players</h3>
        <p class="card-description">Manage players</p>
        <button class="btn-primary" onclick="navigateToPage('players.html')">
          Manage Players
        </button>
      </div>

      <div class="dashboard-card">
        <h3>🔐 Access Codes</h3>
        <p class="card-description">Generate and manage access codes</p>
        <button class="btn-primary" onclick="navigateToPage('access-codes.html')">
          Manage Access Codes
        </button>
      </div>
    </div>
    </div>
  `;

  contentArea.innerHTML = html;
}

// =========================================================
// COACH DASHBOARD
// =========================================================
async function initializeCoachDashboard() {
try {
    displayCoachOptions();
  } catch (err) {
    console.error("Failed to initialize Coach dashboard:", err);
    showMessage("Failed to load dashboard data", "error");
  }
}

function displayCoachOptions() {
  const contentArea = document.querySelector(".page-content") || 
                     document.querySelector("main") || 
                     document.querySelector("[role='main']");
  
  if (!contentArea) {
    console.warn("Could not find content area for dashboard");
    return;
  }

  let html = `
    <div class="dashboard-section coach-section">
      <h2 class="section-title">Coach Dashboard</h2>
      <p class="section-subtitle">Manage rosters and players for your assigned teams</p>

      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3>👥 Rosters</h3>
          <p class="card-description">Manage team rosters and player assignments</p>
          <button class="btn-primary" onclick="navigateToPage('rosters.html')">
            Manage Rosters
          </button>
        </div>

        <div class="dashboard-card">
          <h3>🎮 Players</h3>
          <p class="card-description">Manage players for your teams</p>
          <button class="btn-primary" onclick="navigateToPage('players.html')">
            Manage Players
          </button>
        </div>

        <div class="dashboard-card">
          <h3>📅 Schedules</h3>
          <p class="card-description">View game schedules</p>
          <button class="btn-primary" onclick="navigateToPage('schedules.html')">
            View Schedules
          </button>
        </div>
      </div>
    </div>
  `;

  contentArea.innerHTML = html;
}

// =========================================================
// UTILITY FUNCTIONS
// =========================================================

function navigateToPage(page) {
  window.location.href = `./${page}`;
}

// Show message helper (must match the one in other pages)
function showMessage(message, type = "info", duration = 3500) {
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
      background: ${bgColor};
      border: 2px solid ${borderColor};
      border-radius: 8px;
      padding: 20px 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      max-width: 500px;
      min-width: 300px;
      color: ${textColor};
      font-size: 14px;
      line-height: 1.6;
    ">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="font-size: 20px; flex-shrink: 0;">${icon}</div>
        <div style="flex: 1;">${message}</div>
        <button onclick="this.closest('div').parentElement.remove()" style="
          background: none;
          border: none;
          color: ${textColor};
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          flex-shrink: 0;
        ">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  if (duration > 0) {
    setTimeout(() => {
      container.remove();
    }, duration);
  }
}
