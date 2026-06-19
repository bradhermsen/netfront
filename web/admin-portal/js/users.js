// =========================================================
// USERS PAGE — MODERN ADMINPAGE VERSION
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

      editHandlerName: "openEditUser",
      deleteHandlerName: "openDeleteUser",

      // ⭐ REQUIRED FOR ORGANIZATION DROPDOWN
      loadDropdowns: () => UsersPage.loadDropdowns(),
    });
  },

  // -------------------------------------------------------
  // LOAD ORGANIZATION DROPDOWN
  // -------------------------------------------------------
  async loadDropdowns() {
    const orgs = await OrganizationsAPI.getAll();
    const select = document.getElementById("user-organization");

    select.innerHTML = `
      <option value="">Select Organization</option>
      ${orgs
        .map((o) => `<option value="${o.organizationId}">${o.name}</option>`)
        .join("")}
    `;
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
        <td>${u.teams?.length || 0}</td>
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
  // FORM HELPERS
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
  },

  populateForm(u) {
    document.getElementById("user-first").value = u.firstName || "";
    document.getElementById("user-last").value = u.lastName || "";
    document.getElementById("user-email").value = u.email || "";
    document.getElementById("user-password").value = ""; // never prefill passwords
    document.getElementById("user-organization").value = u.organizationId || "";
    document.getElementById("user-role").value = u.role || "Coach";
    document.getElementById("user-active").checked = u.isActive ?? true;
  },

  collectFormData() {
    return {
      email: document.getElementById("user-email").value,
      firstName: document.getElementById("user-first").value,
      lastName: document.getElementById("user-last").value,
      organizationId:
        document.getElementById("user-organization").value || null,
      role: document.getElementById("user-role").value,
      isActive: document.getElementById("user-active").checked,
      password: document.getElementById("user-password").value || null,
    };
  },
};

// =========================================================
// GLOBAL HANDLERS (MATCHING PLAYERS PATTERN)
// =========================================================
function openAddUser() {
  AdminPage.openAdd();
}

async function openEditUser(id) {
  await AdminPage.waitForModal();
  AdminPage.openEdit(id);
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
// BOOTSTRAP PAGE + ATTACH PASSWORD BUTTONS
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
