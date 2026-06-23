// =========================================================
// USERS PAGE — MODERN ADMINPAGE VERSION (TEAM SUPPORT ADDED)
// =========================================================

window.UsersPage = {
  // -------------------------------------------------------
  // INITIALIZE PAGE
  // -------------------------------------------------------
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
      renderTable: this.renderTable,
      clearForm: this.clearForm,
      populateForm: this.populateForm,
      collectFormData: this.collectFormData,

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

    if (!select) return;

    select.innerHTML = `
      <option value="">None</option>
      ${orgs
        .map((o) => `<option value="${o.organizationId}">${o.name}</option>`)
        .join("")}
    `;
  },

  // -------------------------------------------------------
  // LOAD TEAMS FOR SELECTED ORG
  // -------------------------------------------------------
  async loadTeamsForOrganization(orgId) {
    const teamSelect = document.getElementById("user-team");
    if (!teamSelect) return;

    // IMPORTANT: Clear existing options
    teamSelect.innerHTML = `<option value="">None</option>`;

    if (!orgId) return;

    try {
      const res = await fetch(
        `${window.apiBase}/teams/by-organization/${orgId}`,
      );
      const teams = await res.json();

      teams.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t.id; // or t.teamId depending on your API
        opt.textContent = `${t.name} (${t.abbreviation})`;
        teamSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to load teams:", err);
    }
  },

  // -------------------------------------------------------
  // RENDER TABLE
  // -------------------------------------------------------
  renderTable(users) {
    const body = document.getElementById("userTableBody");
    body.innerHTML = "";

    users.forEach((u) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${u.firstName || ""} ${u.lastName || ""}</td>
        <td>${u.email || ""}</td>
        <td>${u.role || "None"}</td>
        <td>${u.organizationName || "None"}</td>
        <td>${u.teamName || "None"}</td>
        <td>${u.isActive ? "Active" : "Inactive"}</td>
        <td class="actions-col">
          <button type="button" class="nf-btn-icon edit">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="nf-btn-icon delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

      const [btnEdit, btnDelete] = row.querySelectorAll("button");

      btnEdit.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        openEditUser(u.id);
      });

      btnDelete.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        openDeleteUser(u.id);
      });

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
      "user-team",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    document.getElementById("user-role").value = "Coach";
    document.getElementById("user-active").checked = true;
  },

  // -------------------------------------------------------
  // POPULATE FORM
  // -------------------------------------------------------
  async populateForm(u) {
    document.getElementById("user-first").value = u.firstName || "";
    document.getElementById("user-last").value = u.lastName || "";
    document.getElementById("user-email").value = u.email || "";
    document.getElementById("user-password").value = "";

    document.getElementById("user-organization").value = u.organizationId || "";

    // Load teams for this org
    await UsersPage.loadTeamsForOrganization(u.organizationId);

    // Select team
    document.getElementById("user-team").value = u.teamId || "";

    document.getElementById("user-role").value = u.role || "Coach";
    document.getElementById("user-active").checked = u.isActive ?? true;
  },

  // -------------------------------------------------------
  // COLLECT FORM DATA
  // -------------------------------------------------------
  collectFormData() {
    return {
      email: document.getElementById("user-email").value,
      firstName: document.getElementById("user-first").value,
      lastName: document.getElementById("user-last").value,
      organizationId:
        document.getElementById("user-organization").value || null,
      teamId: document.getElementById("user-team").value || null,
      role: document.getElementById("user-role").value,
      isActive: document.getElementById("user-active").checked,
      password: document.getElementById("user-password").value || null,
    };
  },
};

// =========================================================
// GLOBAL HANDLERS
// =========================================================
async function openAddUser() {
  AdminPage.openAdd();
  await AdminPage.waitForModal();
  await UsersPage.loadDropdowns();

  document
    .getElementById("user-organization")
    .addEventListener("change", (e) => {
      UsersPage.loadTeamsForOrganization(e.target.value);
    });
}

async function openEditUser(id) {
  AdminPage.openEdit(id);
  await AdminPage.waitForModal();
  await UsersPage.loadDropdowns();

  document
    .getElementById("user-organization")
    .addEventListener("change", (e) => {
      UsersPage.loadTeamsForOrganization(e.target.value);
    });
}

function openDeleteUser(id) {
  AdminPage.openDelete(id);
}

// =========================================================
// PASSWORD GENERATOR + COPY
// =========================================================
function generatePassword(length = 12) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  return password;
}

function copyPassword() {
  const field = document.getElementById("user-password");
  if (field && field.value) {
    navigator.clipboard.writeText(field.value);
    alert("Password copied to clipboard");
  }
}

// =========================================================
// BOOTSTRAP PAGE
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  UsersPage.init();

  document.addEventListener("nf-page-ready", () => {
    const btnGen = document.getElementById("btnGeneratePassword");
    if (btnGen) {
      btnGen.addEventListener("click", () => {
        const field = document.getElementById("user-password");
        field.value = generatePassword();
      });
    }

    const btnCopy = document.getElementById("btnCopyPassword");
    if (btnCopy) {
      btnCopy.addEventListener("click", copyPassword);
    }
  });
});
