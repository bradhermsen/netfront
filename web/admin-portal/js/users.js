// =========================================================
// USERS PAGE — MODERN ADMINPAGE VERSION
// =========================================================

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
  // LOAD ORGANIZATION DROPDOWN
  // -------------------------------------------------------
  async loadDropdowns() {
    const orgs = await OrgApi.getAll();
    const select = document.getElementById("user-organization");

    select.innerHTML = `
      <option value="">None</option>
      ${orgs.map((o) => `<option value="${o.organizationId}">${o.name}</option>`).join("")}
    `;
  },

  // -------------------------------------------------------
  // LOAD TEAMS FOR ORG (TOGGLES)
  // -------------------------------------------------------
  async loadTeamsForOrganization(orgId, selectedTeamIds = []) {
    const container = document.getElementById("user-teams-container");
    container.innerHTML = "";

    if (!orgId) return;

    const res = await fetch(`${window.apiBase}/teams/by-organization/${orgId}`);
    const teams = await res.json();

    teams.forEach((t) => {
      const row = document.createElement("div");
      row.className = "team-toggle-row";

      row.innerHTML = `
        <label class="switch">
          <input type="checkbox" class="team-toggle-input" value="${t.id}"
            ${selectedTeamIds.includes(t.id) ? "checked" : ""}>
          <span class="slider"></span>
        </label>
        <span class="label-text">${t.name}</span>
      `;

      container.appendChild(row);
    });
  },

  // -------------------------------------------------------
  // RENDER TABLE
  // -------------------------------------------------------
  renderTable(users) {
    const body = document.getElementById("userTableBody");
    body.innerHTML = "";

    users.forEach((u) => {
      const row = document.createElement("tr");

      const teamList = u.teams?.map((t) => t.teamName).join(", ") || "None";

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
    ].forEach((id) => (document.getElementById(id).value = ""));

    document.getElementById("user-role").value = "Coach";
    document.getElementById("user-active").checked = true;

    document.getElementById("user-teams-container").innerHTML = "";
  },

  // -------------------------------------------------------
  // POPULATE FORM
  // -------------------------------------------------------
  async populateForm(u) {
    document.getElementById("user-first").value = u.firstName;
    document.getElementById("user-last").value = u.lastName;
    document.getElementById("user-email").value = u.email;
    document.getElementById("user-password").value = "";

    document.getElementById("user-organization").value = u.organizationId || "";

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
  orgSelect.onchange = (e) =>
    UsersPage.loadTeamsForOrganization(e.target.value);
}

async function openEditUser(id) {
  AdminPage.openEdit(id);
  await UsersPage.loadDropdowns();

  const orgSelect = document.getElementById("user-organization");
  orgSelect.onchange = (e) =>
    UsersPage.loadTeamsForOrganization(e.target.value);
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

  document.addEventListener("nf-page-ready", () => {
    document.getElementById("btnGeneratePassword").onclick = () => {
      document.getElementById("user-password").value = generatePassword();
    };
  });
});
