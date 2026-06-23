// =========================================================
// PAGE CONTENT REGISTRY
// (Static pages + generated pages)
// =========================================================

window.PageContentRegistry = window.PageContentRegistry || {};

//=================================================================
// TEAMS PAGE CONTENT
//=================================================================
window.PageContentRegistry.teams = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Teams</h1>
        <p class="page-subtext">Manage all teams across the NetFront platform</p>
      </div>
      <button id="btnAddTeam" class="nf-btn nf-btn-primary">
        <i class="fa fa-plus"></i> Add Team
      </button>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- TEAMS FILTER BAR COMPONENT                               -->
  <!-- ========================================================= -->
  <div class="nf-card">
    <div class="nf-filter-bar" id="teams-filter-bar-component">

      <!-- Search -->
      <input
        id="teams-search-bar"
        class="nf-search"
        type="text"
        placeholder="🔍  Search teams…"
      />

      <!-- Organization Filter -->
      <select id="filter-org" class="nf-select">
        <option value="">Organization: All</option>
      </select>

      <!-- Level Filter -->
      <select id="filter-level" class="nf-select">
        <option value="">Level: All</option>
      </select>

      <!-- Status Filter -->
      <select id="filter-status" class="nf-select">
        <option value="">Status: All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  </div>

  <!-- TEAMS TABLE -->
  <div class="nf-card mt-4">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Team Name</th>
            <th>Organization</th>
            <th>Level</th>
            <th>Season</th>
            <th>Roster</th>
            <th>Head Coach</th>
            <th>Access Codes</th>
            <th>Active</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody id="teamsBody"></tbody>
      </table>
    </div>
  </div>
`;

//=================================================================
// TEAMS MODALS (NEW SYSTEM, OVERLAY-BASED)
//=================================================================
window.PageContentRegistry.teamsModals = () => `
  <!-- TEAM MODAL -->
  <div id="teamModalOverlay" class="nf-modal-overlay">
    <div id="teamModal" class="nf-modal large">
      <div class="nf-modal-header">
        <h2 id="teamModalTitle">Add Team</h2>
        <button class="modal-close" onclick="AdminPage.closeModal()">×</button>
      </div>

      <div class="nf-modal-body">
        <div class="clean-team-grid">

          <!-- =============================== -->
          <!-- TEAM INFORMATION -->
          <!-- =============================== -->
          <h3 class="section-header">Team Information</h3>

          <div class="two-col">
            <div>
              <label>Team Name</label>
              <input id="team-name" type="text" class="nf-input" />
            </div>

            <div>
              <label>Abbreviation</label>
              <input id="team-abbreviation" type="text" class="nf-input" readonly />
            </div>

            <div>
              <label>Organization</label>
              <select id="team-org" class="nf-input"></select>
            </div>

            <div>
              <label>Level</label>
              <select id="team-level" class="nf-input"></select>
            </div>

            <div>
              <label>Season</label>
              <div id="team-season-display" class="season-display"></div>
            </div>

            <div class="full-width">
              <label>Notes</label>
              <textarea id="team-notes" class="nf-input" rows="2"></textarea>
            </div>
          </div>

          <!-- =============================== -->
          <!-- COACHING STAFF -->
          <!-- =============================== -->
          <h3 class="section-header">Coaching Staff</h3>

          <!-- HEAD COACH -->
          <div class="three-col">
            <div>
              <label>Head Coach Name</label>
              <input id="team-head-coach" type="text" class="nf-input" />
            </div>

            <div>
              <label>Head Coach Email</label>
              <input id="team-head-coach-email" type="email" class="nf-input" />
            </div>

            <div class="checkbox-col"></div>
          </div>

          <!-- ASSISTANT COACHES -->
          ${[1, 2, 3, 4]
            .map(
              (i) => `
            <div class="three-col">
              <div>
                <label>Assistant Coach ${i} Name</label>
                <input id="team-asst${i}" type="text" class="nf-input" />
              </div>

              <div>
                <label>Assistant Coach ${i} Email</label>
                <input id="team-asst${i}-email" type="email" class="nf-input" />
              </div>

              <div class="checkbox-col">
                <label class="checkbox-inline">
                  <input type="checkbox" id="team-asst${i}-has-login" disabled />
                  Create Login
                </label>
              </div>
            </div>
          `,
            )
            .join("")}

          <!-- =============================== -->
          <!-- ACCESS CODES -->
          <!-- =============================== -->
          <h3 class="section-header">Access Codes</h3>

          <div class="two-col">
            <div>
              <label>Scorekeeper Code</label>
              <input id="team-score-code" type="text" class="nf-input" readonly />
            </div>

            <div>
              <label>Stat Manager Code</label>
              <input id="team-stat-code" type="text" class="nf-input" readonly />
            </div>

            <div class="full-width">
              <button id="btnGenerateCodes" class="nf-btn nf-btn-primary">
                Generate Access Codes
              </button>
            </div>
          </div>

          <!-- =============================== -->
          <!-- SETTINGS -->
          <!-- =============================== -->
          <h3 class="section-header">Settings</h3>

          <div class="toggle-row">
            <label>Active</label>
            <label class="switch">
              <input type="checkbox" id="team-active" />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="toggle-row">
            <label>External Team</label>
            <label class="switch">
              <input type="checkbox" id="team-external" />
              <span class="slider round"></span>
            </label>
          </div>

        </div>
      </div>

      <div class="nf-modal-footer">
        <button id="btnCancelTeam" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="btnSaveTeam" class="nf-btn nf-btn-primary">Save</button>
      </div>
    </div>
  </div>

  <!-- DELETE TEAM MODAL -->
  <div id="teamDeleteModalOverlay" class="nf-modal-overlay">
    <div id="teamDeleteModal" class="nf-modal small">
      <div class="nf-modal-header">
        <h2>Delete Team</h2>
      </div>

      <div class="nf-modal-body full">
        <p>Are you sure you want to delete this team?</p>
      </div>

      <div class="nf-modal-footer">
        <button id="btnCancelTeamDelete" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="btnConfirmTeamDelete" class="nf-btn nf-btn-danger">Delete</button>
      </div>
    </div>
  </div>

`;

//=================================================================
// ORGANIZATIONS PAGE CONTENT
//=================================================================
window.PageContentRegistry.organizations = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Organizations</h1>
        <p class="page-subtext">Manage schools, clubs, and associations</p>
      </div>

      <div class="page-header-actions">
        <button id="btnAddOrganization" class="nf-btn nf-btn-primary">
          <i class="fa fa-plus"></i> Add Organization
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- ORGANIZATIONS FILTER BAR COMPONENT                       -->
  <!-- ========================================================= -->
  <div class="nf-card">
    <div class="nf-filter-bar" id="org-filter-bar-component">

      <!-- Search -->
      <input
        id="org-search-bar"
        class="nf-search"
        type="text"
        placeholder="🔍  Search organizations…"
      />

      <!-- League Filter -->
      <select id="filter-league" class="nf-select">
        <option value="">League: All</option>
      </select>

      <!-- Conference Filter -->
      <select id="filter-conference" class="nf-select">
        <option value="">Conference: All</option>
      </select>

      <!-- Status Filter -->
      <select id="filter-status" class="nf-select">
        <option value="">Status: All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

    </div>
  </div>

  <div class="nf-card mt-4">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Organization</th>
            <th>League</th>
            <th>Conference</th>
            <th>Teams</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody id="orgTableBody"></tbody>
      </table>
    </div>
  </div>
`;

//=================================================================
// ORGANIZATIONS MODALS (OVERLAY-BASED)
//=================================================================
window.PageContentRegistry.organizationsModals = () => `
  <!-- ADD / EDIT ORGANIZATION MODAL -->
  <div id="orgModalOverlay" class="nf-modal-overlay">
    <div id="orgModal" class="nf-modal large">
      <div class="nf-modal-header">
        <h2 id="orgModalTitle"></h2>
        <button class="modal-close" onclick="AdminPage.closeModal()">×</button>
      </div>

      <div class="nf-modal-body">
        <h3 class="modal-section-title">Organization Information</h3>

        <div class="modal-grid">
          <div>
            <label>Name</label>
            <input id="org-name" class="nf-input" />
          </div>

          <div>
            <label>Abbreviation</label>
            <input id="org-abbrev" class="nf-input" />
          </div>

          <div>
            <label>Street Address</label>
            <input id="org-street" class="nf-input" />
          </div>

          <div>
            <label>City</label>
            <input id="org-city" class="nf-input" />
          </div>

          <div>
            <label>State</label>
            <input id="org-state" class="nf-input" />
          </div>

          <div>
            <label>Zip Code</label>
            <input id="org-zip" class="nf-input" />
          </div>

          <div>
            <label>Country</label>
            <input id="org-country" class="nf-input" />
          </div>

          <div>
            <label>District / Conference</label>
            <input id="org-district" class="nf-input" />
          </div>

          <div>
            <label>Mascot</label>
            <input id="org-mascot" class="nf-input" />
          </div>

          <div>
            <label>League</label>
            <select id="org-league" class="nf-input"></select>
          </div>

          <div class="checkbox-row">
            <input type="checkbox" id="org-active" />
            <label for="org-active">Active Organization</label>
          </div>
        </div>

        <h3 class="modal-section-title">Primary Contact</h3>

        <div class="modal-grid">
          <div>
            <label>First Name</label>
            <input id="org-contact-first" class="nf-input" />
          </div>

          <div>
            <label>Last Name</label>
            <input id="org-contact-last" class="nf-input" />
          </div>

          <div>
            <label>Email</label>
            <input id="org-contact-email" class="nf-input" />
          </div>
        </div>

        <h3 class="modal-section-title">Billing Information</h3>

        <div class="modal-grid">
          <div>
            <label>Billing Street</label>
            <input id="billing-street" class="nf-input" />
          </div>

          <div>
            <label>Billing City</label>
            <input id="billing-city" class="nf-input" />
          </div>

          <div>
            <label>Billing State</label>
            <input id="billing-state" class="nf-input" />
          </div>

          <div>
            <label>Billing Zip</label>
            <input id="billing-zip" class="nf-input" />
          </div>

          <div>
            <label>Billing Contact Name</label>
            <input id="billing-contact-name" class="nf-input" />
          </div>

          <div>
            <label>Billing Contact Email</label>
            <input id="billing-contact-email" class="nf-input" />
          </div>
        </div>
      </div>

      <div class="nf-modal-footer">
        <button id="orgCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="orgSave" class="nf-btn nf-btn-primary">Save</button>
      </div>
    </div>
  </div>

  <!-- DELETE MODAL -->
  <div id="orgDeleteModalOverlay" class="nf-modal-overlay">
    <div id="orgDeleteModal" class="nf-modal small">
      <div class="nf-modal-header">
        <h2>Confirm Delete</h2>
      </div>

      <div class="nf-modal-body full">
        Are you sure you want to delete this organization?
      </div>

      <div class="nf-modal-footer">
        <button id="deleteCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="deleteConfirm" class="nf-btn nf-btn-danger">Delete</button>
      </div>
    </div>
  </div>
`;

//=================================================================
// ROSTERS PAGE CONTENT + MODALS (FULL ROSTER MANAGER SYSTEM)
//=================================================================
window.PageContentRegistry.rosters = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Team Rosters</h1>
        <p class="page-subtext">View and manage rosters across all teams</p>
      </div>
    </div>
  </div>

  <!-- ROSTERS FILTER BAR COMPONENT -->
  <div class="nf-card">
    <div class="nf-filter-bar" id="rosters-filter-bar-component">

      <!-- Search -->
      <input
        id="rosters-search-bar"
        class="nf-search"
        type="text"
        placeholder="🔍  Search rosters…"
      />

      <!-- Team Filter -->
      <select id="filter-roster-team" class="nf-select">
        <option value="">Team: All</option>
      </select>

      <!-- Organization Filter -->
      <select id="filter-roster-org" class="nf-select">
        <option value="">Organization: All</option>
      </select>

      <!-- Status Filter -->
      <select id="filter-roster-status" class="nf-select">
        <option value="">Status: All</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

    </div>
  </div>

  <!-- ROSTERS TABLE -->
  <div class="nf-card mt-4">
    <div class="table-wrapper">
      <table class="data-table" id="teamsRosterTable">
        <thead>
          <tr>
            <th>Team Name</th>
            <th>Organization</th>
            <th>Roster Count</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody id="teamsRosterBody"></tbody>
      </table>
    </div>
  </div>
`;

//=================================================================
// ROSTERS MODALS (ROSTER MANAGER + CRUD)
//=================================================================
window.PageContentRegistry.rostersModals = () => `
  <!-- ============================= -->
  <!-- ROSTER MANAGER (LARGE MODAL) -->
  <!-- ============================= -->
  <div id="rosterManagerOverlay" class="nf-modal-overlay">
    <div id="rosterManagerModal" class="nf-modal large">

      <div class="nf-modal-header">
        <h2 id="rosterManagerTitle">Manage Roster</h2>
        <button class="modal-close rm-close">X</button>
      </div>

      <div class="nf-modal-body">

        <!-- FILTER BAR INSIDE MODAL -->
        <div class="nf-filter-bar mb-3">
          <input id="rm-search" class="nf-search" placeholder="Search players…" />

          <select id="rm-filter-position" class="nf-select">
            <option value="">Position: All</option>
            <option value="F">Forward</option>
            <option value="D">Defense</option>
            <option value="G">Goalie</option>
          </select>

          <select id="rm-filter-shoots" class="nf-select">
            <option value="">Shoots: All</option>
            <option value="L">Left</option>
            <option value="R">Right</option>
          </select>

          <select id="rm-filter-status" class="nf-select">
            <option value="">Status: All</option>
            <option value="Active">Active</option>
            <option value="Scratched">Scratched</option>
          </select>

          <button id="rm-add-player" class="nf-btn nf-btn-primary ml-auto">
            + Add Player
          </button>
        </div>

        <!-- ROSTER TABLE -->
        <div class="table-wrapper">
          <table class="data-table" id="rm-roster-table">
            <thead>
              <tr>
                <th class="sortable" data-field="fullName">Player</th>
                <th class="sortable" data-field="position">Pos</th>
                <th class="sortable" data-field="shoots">Shoots</th>
                <th class="sortable" data-field="jerseyNumber">#</th>
                <th class="sortable" data-field="grade">Grade</th>
                <th class="sortable" data-field="status">Status</th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody id="rm-roster-body"></tbody>
          </table>
        </div>

      </div>

      <div class="nf-modal-footer">
        <button class="nf-btn nf-btn-secondary rm-close">Close</button>
      </div>

    </div>
  </div>

  <!-- ============================= -->
  <!-- ADD / EDIT ROSTER ENTRY MODAL -->
  <!-- ============================= -->
  <div id="rosterModalOverlay" class="nf-modal-overlay">
    <div id="rosterModal" class="nf-modal medium">
      <div class="nf-modal-header">
        <h2 id="rosterModalTitle">Roster Entry</h2>
        <button class="modal-close">×</button>
      </div>

      <div class="nf-modal-body">
        <div class="modal-grid">

          <div>
            <label>Player</label>
            <select id="rosterPlayerId" class="nf-input"></select>
          </div>

          <div>
            <label>Jersey Number</label>
            <input id="rosterJersey" class="nf-input" />
          </div>

          <div>
            <label>Position</label>
            <select id="rosterPosition" class="nf-input">
              <option value="">Select</option>
              <option value="F">Forward</option>
              <option value="D">Defense</option>
              <option value="G">Goalie</option>
            </select>
          </div>

          <div>
            <label>Status</label>
            <select id="rosterStatus" class="nf-input">
              <option value="Active">Active</option>
              <option value="Scratched">Scratched</option>
            </select>
          </div>

          <div>
            <label>Grade</label>
            <input id="rosterGrade" class="nf-input" readonly />
          </div>

        </div>
      </div>

      <div class="nf-modal-footer">
        <button id="rosterCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="rosterSave" class="nf-btn nf-btn-primary">Save</button>
      </div>
    </div>
  </div>

  <!-- ============================= -->
  <!-- DELETE ROSTER ENTRY MODAL -->
  <!-- ============================= -->
  <div id="rosterDeleteModalOverlay" class="nf-modal-overlay">
    <div id="rosterDeleteModal" class="nf-modal small">
      <div class="nf-modal-header">
        <h2>Delete Roster Entry</h2>
      </div>

      <div class="nf-modal-body full">
        Are you sure you want to delete this roster entry?
      </div>

      <div class="nf-modal-footer">
        <button id="rosterDeleteCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="rosterDeleteConfirm" class="nf-btn nf-btn-danger">Delete</button>
      </div>
    </div>
  </div>
`;

//=================================================================
// GAME SCHEDULES PAGE CONTENT (FULL CRUD)
//=================================================================
window.PageContentRegistry.schedules = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Game Schedules</h1>
        <p class="page-subtext">Manage season and team game schedules</p>
      </div>

      <div class="page-header-actions">
        <button id="btnAddGame" class="nf-btn nf-btn-primary">
          <i class="fa fa-plus"></i> Add Game
        </button>
      </div>
    </div>
  </div>

  <!-- GAME SCHEDULES FILTER BAR COMPONENT -->
  <div class="nf-card">
    <div class="nf-filter-bar" id="games-filter-bar-component">

      <!-- Search -->
      <input
        id="games-search-bar"
        class="nf-search"
        type="text"
        placeholder="🔍  Search games…"
      />

      <!-- Home Team Filter -->
      <select id="filter-home-team" class="nf-select">
        <option value="">Home Team: All</option>
      </select>

      <!-- Away Team Filter -->
      <select id="filter-away-team" class="nf-select">
        <option value="">Away Team: All</option>
      </select>

      <!-- Arena Filter -->
      <select id="filter-arena" class="nf-select">
        <option value="">Arena: All</option>
      </select>

      <!-- Status Filter -->
      <select id="filter-game-status" class="nf-select">
        <option value="">Status: All</option>
        <option value="Scheduled">Scheduled</option>
        <option value="Final">Final</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Postponed">Postponed</option>
      </select>

    </div>
  </div>

  <div class="nf-card mt-4">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Home</th>
            <th>Away</th>
            <th>Date</th>
            <th>Time</th>
            <th>Arena</th>
            <th>Rink</th>
            <th>Type</th>
            <th>Round</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody id="gamesTableBody"></tbody>
      </table>
    </div>
  </div>
`;

//=================================================================
// GAME SCHEDULES MODALS (MODERNIZED TO MATCH USERS + TEAMS)
//=================================================================
window.PageContentRegistry.schedulesModals = () => `
  <!-- ADD / EDIT GAME MODAL -->
  <div id="gameModalOverlay" class="nf-modal-overlay">
    <div id="gameModal" class="nf-modal large">

      <!-- HEADER -->
      <div class="nf-modal-header">
        <h2 id="gameModalTitle">Add Game</h2>
        <button class="modal-close" onclick="AdminPage.closeModal()">×</button>
      </div>

      <!-- BODY -->
      <div class="nf-modal-body">
        <div class="clean-team-grid">

          <!-- ========================= -->
          <!-- TEAMS SECTION -->
          <!-- ========================= -->
          <h3 class="section-header">Teams</h3>

          <div class="two-col">
            <div class="form-group">
              <label for="game-home-team">Home Team</label>
              <select id="game-home-team" class="nf-input"></select>
            </div>

            <div class="form-group">
              <label for="game-away-team">Away Team</label>
              <select id="game-away-team" class="nf-input"></select>
            </div>
          </div>

          <!-- ========================= -->
          <!-- DATE & TIME -->
          <!-- ========================= -->
          <h3 class="section-header">Date & Time</h3>

          <div class="two-col">
            <div class="form-group">
              <label for="game-date">Date</label>
              <input id="game-date" type="date" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="game-time">Time</label>
              <input id="game-time" type="time" class="nf-input" />
            </div>
          </div>

          <!-- ========================= -->
          <!-- LOCATION -->
          <!-- ========================= -->
          <h3 class="section-header">Location</h3>

          <div class="two-col">
            <div class="form-group">
              <label for="game-arena-select">Arena (select or type)</label>
              <select id="game-arena-select" class="nf-input">
                <option value="">Select Arena</option>
                <option value="Four Seasons Centre">Four Seasons Centre</option>
                <option value="Bud King Ice Arena">Bud King Ice Arena</option>
                <option value="Riverside Arena">Riverside Arena</option>
                <option value="Northfield Ice Arena">Northfield Ice Arena</option>
                <option value="Albert Lea City Arena">Albert Lea City Arena</option>
                <option value="Mankato All Seasons Arena">Mankato All Seasons Arena</option>
                <option value="Faribault Ice Arena">Faribault Ice Arena</option>
                <option value="Budking">Budking</option>
              </select>
            </div>

            <div class="form-group">
              <label for="game-arena-custom">Custom Arena</label>
              <input id="game-arena-custom" type="text" class="nf-input" placeholder="Override arena name" />
            </div>
          </div>

          <div class="two-col">
            <div class="form-group">
              <label for="game-rink-select">Rink (select or type)</label>
              <select id="game-rink-select" class="nf-input">
                <option value="">Select Rink</option>
                <option value="Rink 1">Rink 1</option>
                <option value="Rink 2">Rink 2</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="Main">Main</option>
                <option value="West">West</option>
              </select>
            </div>

            <div class="form-group">
              <label for="game-rink-custom">Custom Rink</label>
              <input id="game-rink-custom" type="text" class="nf-input" placeholder="Override rink name" />
            </div>
          </div>

          <!-- ========================= -->
          <!-- CLASSIFICATION -->
          <!-- ========================= -->
          <h3 class="section-header">Classification</h3>

          <div class="two-col">
            <div class="form-group">
              <label for="game-type">Game Type</label>
              <select id="game-type" class="nf-input"></select>
            </div>

            <div class="form-group">
              <label for="game-round">Game Round</label>
              <select id="game-round" class="nf-input"></select>
            </div>
          </div>

          <!-- ========================= -->
          <!-- NOTES & STATUS -->
          <!-- ========================= -->
          <h3 class="section-header">Notes & Status</h3>

          <div class="two-col">
            <div class="form-group full-width">
              <label for="game-notes">Notes</label>
              <textarea id="game-notes" class="nf-input"></textarea>
            </div>

            <div class="form-group">
              <label for="game-status">Status</label>
              <select id="game-status" class="nf-input">
                <option value="Scheduled">Scheduled</option>
                <option value="Final">Final</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Postponed">Postponed</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      <!-- FOOTER -->
      <div class="nf-modal-footer">
        <button id="gameCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="gameSave" class="nf-btn nf-btn-primary">Save</button>
      </div>

    </div>
  </div>

  <!-- DELETE GAME MODAL -->
  <div id="gameDeleteModalOverlay" class="nf-modal-overlay">
    <div id="gameDeleteModal" class="nf-modal small">
      <div class="nf-modal-header">
        <h2>Confirm Delete</h2>
      </div>

      <div class="nf-modal-body full">
        Are you sure you want to delete this game?
      </div>

      <div class="nf-modal-footer">
        <button id="gameDeleteCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="gameDeleteConfirm" class="nf-btn nf-btn-danger">Delete</button>
      </div>
    </div>
  </div>
`;

//=================================================================
// PLAYERS PAGE CONTENT (TABLE + FILTER BAR)
//=================================================================
window.PageContentRegistry.players = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Players</h1>
        <p class="page-subtext">Manage all players across the NetFront platform</p>
      </div>
      <button id="btnAddPlayer" class="nf-btn nf-btn-primary">
        <i class="fa fa-plus"></i> Add Player
      </button>
    </div>
  </div>

  <!-- FILTER BAR -->
  <div class="nf-card">
    <div class="nf-filter-bar" id="players-filter-bar-component">

      <input
        id="players-search-bar"
        class="nf-search"
        type="text"
        placeholder="🔍  Search players…"
      />

      <select id="filter-player-org" class="nf-select">
        <option value="">Organization: All</option>
      </select>

      <select id="filter-player-team" class="nf-select">
        <option value="">Team: All</option>
      </select>

      <select id="filter-player-level" class="nf-select">
        <option value="">Level: All</option>
      </select>

      <select id="filter-player-grade" class="nf-select">
        <option value="">Grade: All</option>
        <option value="12">12</option>
        <option value="11">11</option>
        <option value="10">10</option>
        <option value="9">9</option>
        <option value="8">8</option>
      </select>

      <select id="filter-player-status" class="nf-select">
        <option value="">Status: All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

    </div>
  </div>

  <!-- PLAYERS TABLE -->
  <div class="nf-card mt-4">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Organization</th>
            <th>Team</th>
            <th>Level</th>
            <th>Grade</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody id="players-table-body"></tbody>
      </table>
    </div>
  </div>

`;
//=================================================================
// PLAYERS MODALS (MODERNIZED TO MATCH USERS + TEAMS)
//=================================================================
window.PageContentRegistry.playersModals = () => `
<div id="playersModalsRoot">

  <!-- ADD / EDIT PLAYER MODAL -->
  <div id="playerModalOverlay" class="nf-modal-overlay" data-page="players">
    <div id="playerModal" class="nf-modal medium">

      <!-- HEADER -->
      <div class="nf-modal-header">
        <h2 id="playerModalTitle">Add Player</h2>
        <button class="modal-close" onclick="AdminPage.closeModal()">×</button>
      </div>

      <!-- BODY -->
      <div class="nf-modal-body">
        <div class="clean-team-grid">

          <!-- SECTION HEADER -->
          <h3 class="section-header">Player Information</h3>

          <!-- NAME -->
          <div class="two-col">
            <div class="form-group">
              <label for="player-first-name">First Name</label>
              <input id="player-first-name" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="player-last-name">Last Name</label>
              <input id="player-last-name" class="nf-input" />
            </div>
          </div>

          <!-- BIRTHDATE + GRADE -->
          <div class="two-col">
            <div class="form-group">
              <label for="player-birthdate">Birthdate</label>
              <input id="player-birthdate" type="date" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="player-grade">Grade</label>
              <input id="player-grade" type="number" class="nf-input" />
            </div>
          </div>

          <!-- HEIGHT + WEIGHT -->
          <div class="two-col">
            <div class="form-group">
              <label for="player-height">Height (inches)</label>
              <input id="player-height" type="number" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="player-weight">Weight (lbs)</label>
              <input id="player-weight" type="number" class="nf-input" />
            </div>
          </div>

          <!-- SHOOTS + POSITION -->
          <div class="two-col">
            <div class="form-group">
              <label for="player-shoots">Shoots</label>
              <select id="player-shoots" class="nf-input">
                <option value="">Select</option>
                <option value="L">Left</option>
                <option value="R">Right</option>
              </select>
            </div>

            <div class="form-group">
              <label for="player-position">Position</label>
              <select id="player-position" class="nf-input">
                <option value="">Select</option>
                <option value="F">Forward</option>
                <option value="D">Defense</option>
                <option value="G">Goalie</option>
              </select>
            </div>
          </div>

          <!-- JERSEY -->
          <div class="form-group full-width">
            <label for="player-jersey">Jersey #</label>
            <input id="player-jersey" type="number" class="nf-input" />
          </div>

          <!-- ORG + TEAM -->
          <div class="two-col">
            <div class="form-group">
              <label for="player-org">Organization</label>
              <select id="player-org" class="nf-input"></select>
            </div>

            <div class="form-group">
              <label for="player-team">Team</label>
              <select id="player-team" class="nf-input"></select>
            </div>
          </div>

          <!-- LEVEL -->
          <div class="form-group full-width">
            <label for="player-level">Level</label>
            <select id="player-level" class="nf-input"></select>
          </div>

          <!-- ACTIVE -->
          <div class="checkbox-col full-width">
            <input type="checkbox" id="player-active" />
            <label for="player-active">Active Player</label>
          </div>

        </div>
      </div>

      <!-- FOOTER -->
      <div class="nf-modal-footer">
        <button id="playerCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="playerSave" class="nf-btn nf-btn-primary">Save</button>
      </div>

    </div>
  </div>

  <!-- DELETE PLAYER MODAL -->
  <div id="playerDeleteModalOverlay" class="nf-modal-overlay" data-page="players">
    <div id="playerDeleteModal" class="nf-modal small">

      <div class="nf-modal-header">
        <h2>Delete Player</h2>
      </div>

      <div class="nf-modal-body full">
        Are you sure you want to delete this player?
      </div>

      <div class="nf-modal-footer">
        <button id="playerDeleteCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="playerDeleteConfirm" class="nf-btn nf-btn-danger">Delete</button>
      </div>

    </div>
  </div>

</div>
`;

//=================================================================
// DASHBOARD PAGE CONTENT
//=================================================================
window.PageContentRegistry.dashboard = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Dashboard</h1>
        <p class="page-subtext">NetFront Game Manager - Organizations, Teams, Players, and Game Schedules</p>
      </div>
    </div>
  </div>

  <!-- Dashboard content injected by dashboard.js -->
  <div id="sandboxContent"></div>
`;
//=================================================================
// USERS PAGE CONTENT
//=================================================================
window.PageContentRegistry.users = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Users</h1>
        <p class="page-subtext">Manage admin accounts, roles, teams, and organization access</p>
      </div>

      <div class="page-header-actions">
        <button id="btnAddUser" class="nf-btn nf-btn-primary">
          <i class="fa fa-plus"></i> Add User
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- USERS FILTER BAR COMPONENT (Search Only)                  -->
  <!-- ========================================================= -->
  <div class="nf-card">
    <div class="nf-filter-bar" id="user-filter-bar-component">

      <!-- Search -->
      <input
        id="user-search-bar"
        class="nf-search"
        type="text"
        placeholder="🔍  Search users…"
      />

    </div>
  </div>

  <div class="nf-card mt-4">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Organization</th>
            <th>Teams</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody id="userTableBody"></tbody>
      </table>
    </div>
  </div>
`;
//=================================================================
// ORGANIZATIONS MODALS (OVERLAY-BASED)
//=================================================================
window.PageContentRegistry.organizationsModals = () => `
  <!-- ADD / EDIT ORGANIZATION MODAL -->
  <div id="orgModalOverlay" class="nf-modal-overlay">
    <div id="orgModal" class="nf-modal medium">

      <!-- HEADER -->
      <div class="nf-modal-header">
        <h2 id="orgModalTitle"></h2>
        <button class="modal-close" onclick="AdminPage.closeModal()">×</button>
      </div>

      <!-- BODY -->
      <div class="nf-modal-body">
        <div class="clean-team-grid">

          <!-- SECTION HEADER -->
          <h3 class="section-header">Organization Information</h3>

          <!-- NAME + ABBREVIATION -->
          <div class="two-col">
            <div class="form-group">
              <label for="org-name">Organization Name</label>
              <input id="org-name" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="org-abbrev">Abbreviation</label>
              <input id="org-abbrev" class="nf-input" />
            </div>
          </div>

          <!-- STREET + CITY -->
          <div class="two-col">
            <div class="form-group">
              <label for="org-street">Street Address</label>
              <input id="org-street" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="org-city">City</label>
              <input id="org-city" class="nf-input" />
            </div>
          </div>

          <!-- STATE + ZIP -->
          <div class="two-col">
            <div class="form-group">
              <label for="org-state">State</label>
              <input id="org-state" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="org-zip">Zip Code</label>
              <input id="org-zip" class="nf-input" />
            </div>
          </div>

          <!-- COUNTRY + DISTRICT -->
          <div class="two-col">
            <div class="form-group">
              <label for="org-country">Country</label>
              <input id="org-country" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="org-district">District / Conference</label>
              <input id="org-district" class="nf-input" />
            </div>
          </div>

          <!-- MASCOT + LEAGUE -->
          <div class="two-col">
            <div class="form-group">
              <label for="org-mascot">Mascot</label>
              <input id="org-mascot" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="org-league">League</label>
              <select id="org-league" class="nf-input">
                <option value="">None</option>
              </select>
            </div>
          </div>

          <!-- CONTACT FIRST + LAST -->
          <div class="two-col">
            <div class="form-group">
              <label for="org-contact-first">Primary Contact First Name</label>
              <input id="org-contact-first" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="org-contact-last">Primary Contact Last Name</label>
              <input id="org-contact-last" class="nf-input" />
            </div>
          </div>

          <!-- CONTACT EMAIL -->
          <div class="form-group full-width">
            <label for="org-contact-email">Primary Contact Email</label>
            <input id="org-contact-email" class="nf-input" />
          </div>

          <!-- BILLING SECTION HEADER -->
          <h3 class="section-header">Billing Information</h3>

          <!-- BILLING STREET + CITY -->
          <div class="two-col">
            <div class="form-group">
              <label for="billing-street">Billing Street</label>
              <input id="billing-street" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="billing-city">Billing City</label>
              <input id="billing-city" class="nf-input" />
            </div>
          </div>

          <!-- BILLING STATE + ZIP -->
          <div class="two-col">
            <div class="form-group">
              <label for="billing-state">Billing State</label>
              <input id="billing-state" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="billing-zip">Billing Zip Code</label>
              <input id="billing-zip" class="nf-input" />
            </div>
          </div>

          <!-- BILLING CONTACT NAME + EMAIL -->
          <div class="two-col">
            <div class="form-group">
              <label for="billing-contact-name">Billing Contact Name</label>
              <input id="billing-contact-name" class="nf-input" />
            </div>

            <div class="form-group">
              <label for="billing-contact-email">Billing Contact Email</label>
              <input id="billing-contact-email" class="nf-input" />
            </div>
          </div>

          <!-- ACTIVE CHECKBOX -->
          <div class="checkbox-col full-width">
            <input type="checkbox" id="org-active" />
            <label for="org-active">Active Organization</label>
          </div>

        </div>
      </div>

      <!-- FOOTER -->
      <div class="nf-modal-footer">
        <button id="orgCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="orgSave" class="nf-btn nf-btn-primary">Save</button>
      </div>

    </div>
  </div>

  <!-- DELETE ORGANIZATION MODAL -->
  <div id="orgDeleteModalOverlay" class="nf-modal-overlay">
    <div id="orgDeleteModal" class="nf-modal small">

      <div class="nf-modal-header">
        <h2>Confirm Delete</h2>
      </div>

      <div class="nf-modal-body full">
        Are you sure you want to delete this organization?
      </div>

      <div class="nf-modal-footer">
        <button id="deleteCancel" class="nf-btn nf-btn-secondary">Cancel</button>
        <button id="deleteConfirm" class="nf-btn nf-btn-danger">Delete</button>
      </div>

    </div>
  </div>
`;

//=================================================================
// COMPONENT SANDBOX PAGE CONTENT
//=================================================================
window.PageContentRegistry.components = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Component Sandbox</h1>
        <p class="page-subtext">Preview and copy reusable UI components</p>
      </div>
    </div>
  </div>

  <!-- Sandbox content injected by components.js -->
  <div id="sandboxContent"></div>
`;
