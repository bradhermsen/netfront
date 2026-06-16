//=================================================================
// USERS PAGE LOGIC
//=================================================================

const UsersPage = {
  users: [],
  organizations: [],

  init() {
    this.loadOrganizations();
    this.loadUsers();

    // Add User button
    document.addEventListener("click", (e) => {
      if (e.target.id === "btnAddUser") {
        UsersPage.openAddUserModal();
      }
    });

    // Save button
    document.addEventListener("click", (e) => {
      if (e.target.id === "userSave") {
        UsersPage.saveUser();
      }
    });

    // Cancel button
    document.addEventListener("click", (e) => {
      if (e.target.id === "userCancel") {
        AdminPage.closeModal();
      }
    });

    // Delete confirm
    document.addEventListener("click", (e) => {
      if (e.target.id === "userDeleteConfirm") {
        UsersPage.confirmDeleteUser();
      }
    });

    // Delete cancel
    document.addEventListener("click", (e) => {
      if (e.target.id === "userDeleteCancel") {
        AdminPage.closeModal();
      }
    });
  },

  //===============================================================
  // LOAD USERS
  //===============================================================
  async loadUsers() {
    try {
      const res = await authFetch("/users"); // You will add this endpoint next
      this.users = await res.json();
      this.renderUsersTable();
    } catch (err) {
      console.error("Error loading users:", err);
      AdminPage.showToast("Error loading users", "error");
    }
  },

  //===============================================================
  // RENDER TABLE
  //===============================================================
  renderUsersTable() {
    const tbody = document.getElementById("userTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    this.users.forEach((u) => {
      const org = this.organizations.find((o) => o.id === u.organizationId);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.firstName} ${u.lastName}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${org ? org.name : "—"}</td>
        <td>${u.isActive ? "Active" : "Inactive"}</td>
        <td class="actions-col">
          <button class="nf-btn nf-btn-small nf-btn-secondary" onclick="UsersPage.openEditUserModal('${u.id}')">
            Edit
          </button>
          <button class="nf-btn nf-btn-small nf-btn-danger" onclick="UsersPage.openDeleteUserModal('${u.id}')">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  //===============================================================
  // LOAD ORGANIZATIONS FOR DROPDOWN
  //===============================================================
  async loadOrganizations() {
    try {
      const res = await authFetch("/organizations");
      this.organizations = await res.json();

      const select = document.getElementById("user-organization");
      if (select) {
        select.innerHTML = `<option value="">None</option>`;
        this.organizations.forEach((o) => {
          const opt = document.createElement("option");
          opt.value = o.id;
          opt.textContent = o.name;
          select.appendChild(opt);
        });
      }
    } catch (err) {
      console.error("Error loading organizations:", err);
    }
  },

  //===============================================================
  // OPEN ADD USER MODAL
  //===============================================================
  openAddUserModal() {
    document.getElementById("userModalTitle").textContent = "Add User";

    document.getElementById("user-first").value = "";
    document.getElementById("user-last").value = "";
    document.getElementById("user-email").value = "";
    document.getElementById("user-password").value = "";
    document.getElementById("user-role").value = "Admin";
    document.getElementById("user-organization").value = "";
    document.getElementById("user-active").checked = true;

    document.getElementById("userSave").setAttribute("data-mode", "create");

    AdminPage.openModal("userModalOverlay");
  },

  //===============================================================
  // OPEN EDIT USER MODAL
  //===============================================================
  openEditUserModal(id) {
    const user = this.users.find((u) => u.id === id);
    if (!user) return;

    document.getElementById("userModalTitle").textContent = "Edit User";

    document.getElementById("user-first").value = user.firstName;
    document.getElementById("user-last").value = user.lastName;
    document.getElementById("user-email").value = user.email;
    document.getElementById("user-password").value = ""; // blank on edit
    document.getElementById("user-role").value = user.role;
    document.getElementById("user-organization").value =
      user.organizationId || "";
    document.getElementById("user-active").checked = user.isActive;

    document.getElementById("userSave").setAttribute("data-mode", "edit");
    document.getElementById("userSave").setAttribute("data-id", id);

    AdminPage.openModal("userModalOverlay");
  },

  //===============================================================
  // SAVE USER (CREATE OR EDIT)
  //===============================================================
  async saveUser() {
    const mode = document.getElementById("userSave").getAttribute("data-mode");

    const payload = {
      firstName: document.getElementById("user-first").value,
      lastName: document.getElementById("user-last").value,
      email: document.getElementById("user-email").value,
      password: document.getElementById("user-password").value,
      role: document.getElementById("user-role").value,
      organizationId:
        document.getElementById("user-organization").value || null,
      isActive: document.getElementById("user-active").checked,
    };

    try {
      if (mode === "create") {
        await authFetch("/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        AdminPage.showToast("User created", "success");
      } else {
        const id = document.getElementById("userSave").getAttribute("data-id");
        await authFetch(`/users/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        AdminPage.showToast("User updated", "success");
      }

      AdminPage.closeModal();
      this.loadUsers();
    } catch (err) {
      console.error("Error saving user:", err);
      AdminPage.showToast("Error saving user", "error");
    }
  },

  //===============================================================
  // DELETE USER
  //===============================================================
  openDeleteUserModal(id) {
    document.getElementById("userDeleteConfirm").setAttribute("data-id", id);
    AdminPage.openModal("userDeleteModalOverlay");
  },

  async confirmDeleteUser() {
    const id = document
      .getElementById("userDeleteConfirm")
      .getAttribute("data-id");

    try {
      await authFetch(`/users/${id}`, { method: "DELETE" });
      AdminPage.showToast("User deleted", "success");
      AdminPage.closeModal();
      this.loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      AdminPage.showToast("Error deleting user", "error");
    }
  },
};

// Initialize when page loads
document.addEventListener("nf-page-ready", () => {
  if (window.AdminPage?.currentPage === "users") {
    UsersPage.init();
  }
});
