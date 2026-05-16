const tbody = document.querySelector(".permissions-table tbody");
const modal = document.getElementById("permission-modal");
const modalTitle = document.getElementById("modal-title");

const nameInput = document.getElementById("perm-name");
const descInput = document.getElementById("perm-desc");

let editingPermissionId = null;

// Load permissions
async function loadPermissions() {
    const res = await fetch("http://localhost:7071/api/permissions");
    const perms = await res.json();

    tbody.innerHTML = "";

    perms.forEach(p => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td style="text-align:left;">
                <p style="margin:0;font-weight:bold;color:#FF8C00;">${p.name}</p>
                <p style="margin:0;font-size:8pt;color:#78909c;">${p.description}</p>
            </td>

            <td><input type="checkbox" class="toggle" data-role="admin" data-id="${p.id}" ${p.admin ? "checked" : ""}></td>
            <td><input type="checkbox" class="toggle" data-role="org" data-id="${p.id}" ${p.orgAdmin ? "checked" : ""}></td>
            <td><input type="checkbox" class="toggle" data-role="coach" data-id="${p.id}" ${p.coach ? "checked" : ""}></td>
            <td><input type="checkbox" class="toggle" data-role="score" data-id="${p.id}" ${p.scorekeeper ? "checked" : ""}></td>
            <td><input type="checkbox" class="toggle" data-role="stat" data-id="${p.id}" ${p.statManager ? "checked" : ""}></td>

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
}

async function updatePermissionRole(e) {
    const id = e.target.dataset.id;
    const role = e.target.dataset.role;
    const value = e.target.checked;

    await fetch(`http://localhost:7071/api/permissions/${id}/role/${role}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value })
    });
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

    const res = await fetch(`http://localhost:7071/api/permissions/${id}`);
    const p = await res.json();

    modalTitle.textContent = "Edit Permission";

    nameInput.value = p.name;
    descInput.value = p.description;

    modal.classList.remove("hidden");
}

async function savePermission() {
    const payload = {
        name: nameInput.value,
        description: descInput.value
    };

    if (editingPermissionId) {
        await fetch(`http://localhost:7071/api/permissions/${editingPermissionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } else {
        await fetch("http://localhost:7071/api/permissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }

    modal.classList.add("hidden");
    loadPermissions();
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
