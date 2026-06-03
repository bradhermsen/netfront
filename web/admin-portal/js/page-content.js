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
      <button id="btnAddTeam" class="btn-primary nf-btn">+Add Team</button>
    </div>
  </div>

  <!-- UNIFIED TOOLBAR -->
  <div class="toolbar">
    <input 
      type="text" 
      id="teams-search-bar" 
      class="toolbar-input"
      placeholder="🔍 Search teams..."
    />

    <select id="filter-org" class="toolbar-select">
      <option value="">Org: All</option>
    </select>

    <select id="filter-level" class="toolbar-select">
      <option value="">Level: All</option>
    </select>

    <select id="filter-season" class="toolbar-select">
      <option value="">Season: All</option>
    </select>
  </div>

  <!-- TEAMS TABLE -->
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
`;
//=================================================================
// ORGANIZATIONS PAGE CONTENT
//=================================================================
window.PageContentRegistry.organizations = () => `
  <div class="page-header-block">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-header">Organizations</h1>
        <p class="page-subtext">Manage all organizations across the NetFront platform</p>
      </div>
      <button id="btnAddOrganization" class="btn-primary nf-btn">+Add Organization</button>
    </div>
  </div>

  <!-- UNIFIED TOOLBAR -->
  <div class="toolbar">
    <input 
      type="text" 
      id="org-search-bar" 
      class="toolbar-input"
      placeholder="🔍 Search organizations..."
    />

    <select id="filter-league" class="toolbar-select">
      <option value="">League: All</option>
    </select>

    <select id="filter-conference" class="toolbar-select">
      <option value="">Conference: All</option>
    </select>

    <select id="filter-status" class="toolbar-select">
      <option value="">Status: All</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  </div>

  <!-- ORGANIZATIONS TABLE -->
  <div class="table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Organization</th>
          <th>League</th>
          <th>Conference</th>
          <th>Teams</th>
          <th>Org Admin</th>
          <th>Status</th>
          <th class="actions-col">Actions</th>
        </tr>
      </thead>
      <tbody id="organizationsBody"></tbody>
    </table>
  </div>
`;
//=================================================================
// PLAYERS PAGE CONTENT
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

  <!-- UNIFIED TOOLBAR -->
  <div class="toolbar">
    <input 
      type="text" 
      id="globalSearch"
      class="toolbar-input"
      placeholder="🔍 Search teams or organizations..."
    />

    <select id="globalTeam" class="toolbar-select">
      <option value="">All Teams</option>
    </select>

    <select id="globalOrg" class="toolbar-select">
      <option value="">All Organizations</option>
    </select>

    <select id="globalStatus" class="toolbar-select">
      <option value="">All Status</option>
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  </div>

  <!-- ROSTERS TABLE -->
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
`;
