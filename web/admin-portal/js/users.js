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
  },

  collectFormData() {
    return {
      firstName: document.getElementById("user-first").value,
      lastName: document.getElementById("user-last").value,
      email: document.getElementById("user-email").value,
      password: document.getElementById("user-password").value || null,
      organizationId:
        document.getElementById("user-organization").value || null,
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
// BOOTSTRAP PAGE
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  UsersPage.init();
});
