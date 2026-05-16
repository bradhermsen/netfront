const tbody = document.querySelector(".users-table tbody");
const modal = document.getElementById("user-modal");
const modalTitle = document.getElementById("modal-title");

const firstInput = document.getElementById("user-first");
const lastInput = document.getElementById("user-last");
const emailInput = document.getElementById("user-email");
const roleInput = document.getElementById("user-role");
const orgInput = document.getElementById("user-org");
const teamInput = document.getElementById("user-team");
const statusInput = document.getElementById("user-status");

let editingUserId = null;

// Load orgs + teams
async function loadDropdowns() {
    const orgRes = await fetch("http://localhost:7071/api/organizations");
    const orgs = await orgRes.json();

    orgInput.innerHTML = "";
    orgs.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.id;
        opt.textContent = o.name;
        orgInput.appendChild(opt);
    });

    const teamRes = await fetch("http://localhost:7071/api/teams");
    const teams = await teamRes.json();

    teamInput.innerHTML = "";
    teams.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.name;
        teamInput.appendChild(opt);
    });
}

// Load users
async function loadUsers() {
    const res = await fetch("http://localhost:7071/api/users");
    const users = await res.json();

    tbody.innerHTML = "";

    users.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.firstName} ${u.lastName}</td>
            <td>${u.email}</td>
            <td><span class="role-badge role-${u.role.toLowerCase().replace(' ', '')}">${u.role}</span></td>
            <td>${u.organizationName ?? "—"}</td>
            <td>${u.teamName ?? "—"}</td>
            <td style="text-align:center;"><span class="badge-active">${u.status}</span></td>
            <td style="text-align:center;">
                <button class="btn-sm edit-btn" data-id="${u.id}">✏️ Edit</button>
                <button class="btn-sm delete-btn" data-id="${u.id}">🗑️ Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", () => openEditModal(btn.dataset.id))
    );
}

function openAddModal() {
    editingUserId = null;
    modalTitle.textContent = "Add User";

    firstInput.value = "";
    lastInput.value = "";
    emailInput.value = "";
    roleInput.value = "Coach";
    statusInput.value = "Active";

    modal.classList.remove("hidden");
}

async function openEditModal(id) {
    editingUserId = id;

    const res = await fetch(`http://localhost:7071/api/users/${id}`);
    const u = await res.json();

    modalTitle.textContent = "Edit User";

    firstInput.value = u.firstName;
    lastInput.value = u.lastName;
    emailInput.value = u.email;
    roleInput.value = u.role;
    orgInput.value = u.organizationId;
    teamInput.value = u.teamId;
    statusInput.value = u.status;

    modal.classList.remove("hidden");
}

async function saveUser() {
    const payload = {
        firstName: firstInput.value,
        lastName: lastInput.value,
        email: emailInput.value,
        role: roleInput.value,
        organizationId: orgInput.value,
        teamId: teamInput.value,
        status: statusInput.value
    };

    if (editingUserId) {
        await fetch(`http://localhost:7071/api/users/${editingUserId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } else {
        await fetch("http://localhost:7071/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }

    modal.classList.add("hidden");
    loadUsers();
}

// Event Listeners
document.getElementById("add-user-btn").addEventListener("click", openAddModal);
document.getElementById("cancel-modal").addEventListener("click", () => modal.classList.add("hidden"));
document.getElementById("save-user-btn").addEventListener("click", saveUser);

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("nf_admin_token");
    localStorage.removeItem("nf_admin_role");
    window.location.href = "./login.html";
});

// Init
await loadDropdowns();
await loadUsers();
