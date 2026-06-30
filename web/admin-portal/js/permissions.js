const tbody = document.querySelector(".permissions-table tbody");
const modal = document.getElementById("permission-modal");
const modalTitle = document.getElementById("modal-title");

const nameInput = document.getElementById("perm-name");
const descInput = document.getElementById("perm-desc");

let editingPermissionId = null;

// Enforce SuperAdmin-only access
(function checkPermission() {
  if (!Auth.canManagePermissions()) {
    showMessage("Access Denied: SuperAdmin role required", "error");
    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 2000);
  }
})();

// Load permissions
async function loadPermissions() {
    try {
      const res = await authFetch("/permissions");
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const perms = await res.json();

      tbody.innerHTML = "";

      perms.forEach(p => {
          const tr = document.createElement("tr");

          tr.innerHTML = `
              <td style="text-align:left;">
                  <p style="margin:0;font-weight:bold;color:#FF8C00;">${p.name}</p>
                  <p style="margin:0;font-size:8pt;color:#78909c;">${p.description}</p>
              </td>

              <td><input type="checkbox" class="toggle" data-role="superAdmin" data-id="${p.id}" ${p.superAdmin ? "checked" : ""}></td>
              <td><input type="checkbox" class="toggle" data-role="orgAdmin" data-id="${p.id}" ${p.orgAdmin ? "checked" : ""}></td>
              <td><input type="checkbox" class="toggle" data-role="teamManager" data-id="${p.id}" ${p.teamManager ? "checked" : ""}></td>
              <td><input type="checkbox" class="toggle" data-role="coach" data-id="${p.id}" ${p.coach ? "checked" : ""}></td>
              <td><input type="checkbox" class="toggle" data-role="gameManager" data-id="${p.id}" ${p.gameManager ? "checked" : ""}></td>
              <td><input type="checkbox" class="toggle" data-role="statManager" data-id="${p.id}" ${p.statManager ? "checked" : ""}></td>
              <td><input type="checkbox" class="toggle" data-role="viewer" data-id="${p.id}" ${p.viewer ? "checked" : ""}></td>

              <td>
                  <button class="btn-sm edit-btn" data-id="${p.id}">✏️ Edit</button>
                  <button class="btn-sm delete-btn" data-id="${p.id}">🗑️ Delete</button>
              </td>
          `;

          tbody.appendChild(tr);
      });

      document.querySelectorAll(".toggle").forEach(t =>
          t.addEventListener("change", updatePermissionRole)
      );

      document.querySelectorAll(".edit-btn").forEach(btn =>
          btn.addEventListener("click", () => openEditModal(btn.dataset.id))
      );
    } catch (err) {
      console.error("Failed to load permissions:", err);
      showMessage("Failed to load permissions", "error");
    }
}

async function updatePermissionRole(e) {
    const id = e.target.dataset.id;
    const role = e.target.dataset.role;
    const value = e.target.checked;

    try {
      const res = await authFetch(`/permissions/${id}/role/${role}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      showMessage("Permission updated", "success");
    } catch (err) {
      console.error("Failed to update permission:", err);
      showMessage("Failed to update permission", "error");
      loadPermissions(); // Reload to reset checkboxes
    }
}

function openAddModal() {
    editingPermissionId = null;
    modalTitle.textContent = "Add Permission";

    nameInput.value = "";
    descInput.value = "";

    modal.classList.remove("hidden");
}

async function openEditModal(id) {
    editingPermissionId = id;

    try {
      const res = await authFetch(`/permissions/${id}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const p = await res.json();

      modalTitle.textContent = "Edit Permission";
      nameInput.value = p.name;
      descInput.value = p.description;

      modal.classList.remove("hidden");
    } catch (err) {
      console.error("Failed to load permission:", err);
      showMessage("Failed to load permission", "error");
    }
}

async function savePermission() {
    const payload = {
        name: nameInput.value,
        description: descInput.value
    };

    try {
      if (editingPermissionId) {
          const res = await authFetch(`/permissions/${editingPermissionId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
      } else {
          const res = await authFetch("/permissions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
      }

      modal.classList.add("hidden");
      showMessage("Permission saved", "success");
      loadPermissions();
    } catch (err) {
      console.error("Failed to save permission:", err);
      showMessage("Failed to save permission", "error");
    }
}

// Event Listeners
document.getElementById("add-permission-btn").addEventListener("click", openAddModal);
document.getElementById("cancel-modal").addEventListener("click", () => modal.classList.add("hidden"));
document.getElementById("save-permission-btn").addEventListener("click", savePermission);

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("nf_admin_token");
    localStorage.removeItem("nf_admin_role");
    window.location.href = "./login.html";
});

// Init
await loadPermissions();
