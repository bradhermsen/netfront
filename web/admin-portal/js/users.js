// =========================================================
// USERS PAGE — MODERN ADMINPAGE VERSION (FIXED FILTERS)
// =========================================================

function formatTeamLabel(teamName, teamType, levelName) {
  const allowedTypes = new Map([
    ["boys", "Boys"],
    ["girls", "Girls"],
    ["co-ed", "Co-Ed"],
    ["coed", "Co-Ed"],
    ["men", "Men"],
    ["women", "Women"],
  ]);

  const normalizedType = allowedTypes.get((teamType || "").toString().trim().toLowerCase()) || "";

  return [teamName, normalizedType, levelName]
    .map((value) => (value || "").toString().trim())
    .filter((value) => value.length > 0)
    .join(" ");
}

// Enforce SuperAdmin/OrgAdmin-only access
(function checkPermission() {
  if (!Auth.canManageUsers()) {
    showMessage("Access Denied: SuperAdmin/OrgAdmin role required", "error");
    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 2000);
  }
})();

window.UsersPage = {
  init() {
    AdminPage.init({
      tableBodyId: "userTableBody",
      searchInputId: "user-search-bar",

      modalId: "userModalOverlay",
      modalTitleId: "userModalTitle",
      addButtonId: "btnAddUser",
      saveButtonId: "userSave",
      cancelButtonId: "userCancel",

      deleteModalId: "userDeleteModalOverlay",
      deleteConfirmId: "userDeleteConfirm",
      deleteCancelId: "userDeleteCancel",

      addTitle: "Add User",
      editTitle: "Edit User",

      api: UsersAPI,
      renderTable: this.renderTable.bind(this),
      clearForm: this.clearForm.bind(this),
      populateForm: this.populateForm.bind(this),
      collectFormData: this.collectFormData.bind(this),

      addHandler: openAddUser,
      editHandler: openEditUser,
      deleteHandler: openDeleteUser,
    });
  },

  // -------------------------------------------------------
  // LOAD ORGANIZATION DROPDOWNS (Modal + Filter Bar)
  // -------------------------------------------------------
  async loadDropdowns() {
    const orgs = await OrgApi.getAll();

    // Modal dropdown
    const select = document.getElementById("user-organization");
    if (select) {
      select.innerHTML = `
        <option value="">None</option>
        ${orgs.map((o) => `<option value="${o.organizationId}">${o.name}</option>`).join("")}
      `;
    }

    // Filter dropdown
    const filterOrg = document.getElementById("filter-org");
    if (filterOrg) {
      filterOrg.innerHTML = `
        <option value="">All Organizations</option>
        ${orgs.map((o) => `<option value="${o.organizationId}">${o.name}</option>`).join("")}
      `;
    }
  },

  // -------------------------------------------------------
  // LOAD TEAMS FOR ORG (TOGGLES)
  // -------------------------------------------------------
  async loadTeamsForOrganization(orgId, selectedTeamIds = []) {
    const container = document.getElementById("user-teams-container");
    if (!container) return;

    container.innerHTML = "";
    if (!orgId) return;

    const res = await authFetch(`/teams/by-organization/${orgId}`);
    const teams = await res.json();

    teams.forEach((t) => {
      const row = document.createElement("div");
      row.className = "team-toggle-row";
      const teamLabel = formatTeamLabel(t.name, t.teamType, t.levelName);

      row.innerHTML = `
        <label class="switch">
          <input type="checkbox" class="team-toggle-input" value="${t.id}"
            ${selectedTeamIds.includes(t.id) ? "checked" : ""}>
          <span class="slider"></span>
        </label>
        <span class="label-text">${teamLabel}</span>
      `;

      container.appendChild(row);
    });
  },

  // -------------------------------------------------------
  // FILTER USERS
  // -------------------------------------------------------
  filterUsers(allUsers) {
    const roleEl = document.getElementById("filter-role");
    const orgEl = document.getElementById("filter-org");
    const statusEl = document.getElementById("filter-status");
    const searchEl = document.getElementById("user-search-bar");

    const role = roleEl?.value || "";
    const org = orgEl?.value || "";
    const status = statusEl?.value || "";
    const search = (searchEl?.value || "").toLowerCase();

    return allUsers.filter((u) => {
      const matchesRole = !role || u.role === role;
      const matchesOrg = !org || u.organizationId === org;
      const matchesStatus =
        !status || (status === "Active" ? u.isActive : !u.isActive);
      const matchesSearch =
        !search ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search);

      return matchesRole && matchesOrg && matchesStatus && matchesSearch;
    });
  },

  // -------------------------------------------------------
  // RENDER TABLE (with filters)
  // -------------------------------------------------------
  renderTable(users) {
    const filtered = this.filterUsers(users);
    const body = document.getElementById("userTableBody");
    if (!body) return;

    body.innerHTML = "";

    filtered.forEach((u) => {
      const row = document.createElement("tr");

      const teamList = u.teams?.length
        ? u.teams
            .map((t) => formatTeamLabel(t.teamName, t.teamType, t.levelName))
            .join("<br>")
        : "None";

      row.innerHTML = `
        <td>${u.firstName} ${u.lastName}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.organizationName || "None"}</td>
        <td>${teamList}</td>
        <td>${u.isActive ? "Active" : "Inactive"}</td>
        <td class="actions-col">
          <button class="nf-btn-icon edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="nf-btn-icon delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;

      row.querySelector(".edit").onclick = () => openEditUser(u.id);
      row.querySelector(".delete").onclick = () => openDeleteUser(u.id);

      body.appendChild(row);
    });
  },

  // -------------------------------------------------------
  // CLEAR FORM
  // -------------------------------------------------------
  clearForm() {
    [
      "user-first",
      "user-last",
      "user-email",
      "user-password",
      "user-organization",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    const roleEl = document.getElementById("user-role");
    const activeEl = document.getElementById("user-active");
    const teamsContainer = document.getElementById("user-teams-container");

    if (roleEl) roleEl.value = "Coach";
    if (activeEl) activeEl.checked = true;
    if (teamsContainer) teamsContainer.innerHTML = "";
  },

  // -------------------------------------------------------
  // POPULATE FORM (Edit User)
  // -------------------------------------------------------
  async populateForm(u) {
    document.getElementById("user-first").value = u.firstName;
    document.getElementById("user-last").value = u.lastName;
    document.getElementById("user-email").value = u.email;
    document.getElementById("user-password").value = "";

    const orgSelect = document.getElementById("user-organization");
    if (orgSelect) orgSelect.value = u.organizationId || "";

    const selectedTeamIds = u.teams?.map((t) => t.teamId) || [];
    await this.loadTeamsForOrganization(u.organizationId, selectedTeamIds);

    document.getElementById("user-role").value = u.role;
    document.getElementById("user-active").checked = u.isActive;
  },

  // -------------------------------------------------------
  // COLLECT FORM DATA
  // -------------------------------------------------------
  collectFormData() {
    const selectedTeams = [
      ...document.querySelectorAll(".team-toggle-input:checked"),
    ].map((t) => t.value);

    return {
      email: document.getElementById("user-email").value,
      firstName: document.getElementById("user-first").value,
      lastName: document.getElementById("user-last").value,
      organizationId:
        document.getElementById("user-organization").value || null,
      teamIds: selectedTeams,
      role: document.getElementById("user-role").value,
      isActive: document.getElementById("user-active").checked,
      password: document.getElementById("user-password").value || null,
    };
  },
};

// -------------------------------------------------------
// GLOBAL HANDLERS
// -------------------------------------------------------
async function openAddUser() {
  AdminPage.openAdd();
  await UsersPage.loadDropdowns();

  const orgSelect = document.getElementById("user-organization");
  if (orgSelect) {
    orgSelect.onchange = (e) =>
      UsersPage.loadTeamsForOrganization(e.target.value);
  }
}

async function openEditUser(id) {
  await UsersPage.loadDropdowns();
  AdminPage.openEdit(id);

  const orgSelect = document.getElementById("user-organization");
  if (orgSelect) {
    orgSelect.onchange = (e) =>
      UsersPage.loadTeamsForOrganization(e.target.value);
  }
}

function openDeleteUser(id) {
  AdminPage.openDelete(id);
}

// -------------------------------------------------------
// PASSWORD GENERATOR
// -------------------------------------------------------
function generatePassword(length = 12) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  return [...Array(length)]
    .map(() => charset[Math.floor(Math.random() * charset.length)])
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  UsersPage.init();

  document.addEventListener("nf-page-ready", async () => {
    // Load dropdowns AFTER page content exists
    await UsersPage.loadDropdowns();

    // Wire filters AFTER they exist
    const filterRole = document.getElementById("filter-role");
    const filterOrg = document.getElementById("filter-org");
    const filterStatus = document.getElementById("filter-status");
    const searchBar = document.getElementById("user-search-bar");

    const applyFilters = () => UsersPage.renderTable(AdminPage.allItems || []);
    if (filterRole) filterRole.onchange = applyFilters;
    if (filterOrg) filterOrg.onchange = applyFilters;
    if (filterStatus) filterStatus.onchange = applyFilters;
    if (searchBar) searchBar.oninput = applyFilters;

    // Password generator
    const btnGen = document.getElementById("btnGeneratePassword");
    if (btnGen) {
      btnGen.onclick = () => {
        document.getElementById("user-password").value = generatePassword();
      };
    }
  });
});
