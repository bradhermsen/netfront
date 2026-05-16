const tbody = document.querySelector(".codes-table tbody");
const modal = document.getElementById("code-modal");
const modalTitle = document.getElementById("modal-title");

const scoreInput = document.getElementById("score-code");
const statInput = document.getElementById("stat-code");

let editingTeamId = null;

// Load teams + codes
async function loadCodes() {
    const res = await fetch("http://localhost:7071/api/teams");
    const teams = await res.json();

    tbody.innerHTML = "";

    teams.forEach(t => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${t.name}</td>
            <td>${t.organizationName}</td>
            <td style="text-align:center;"><code style="color:#FFB300;">${t.scorekeeperCode}</code></td>
            <td style="text-align:center;"><code style="color:#42a5f5;">${t.statManagerCode}</code></td>
            <td style="text-align:center;">
                <button class="btn-sm edit-btn" data-id="${t.id}">✏️ Edit</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", () => openEditModal(btn.dataset.id))
    );
}

async function openEditModal(id) {
    editingTeamId = id;

    const res = await fetch(`http://localhost:7071/api/teams/${id}`);
    const t = await res.json();

    modalTitle.textContent = `Edit Codes — ${t.name}`;

    scoreInput.value = t.scorekeeperCode;
    statInput.value = t.statManagerCode;

    modal.classList.remove("hidden");
}

async function saveCodes() {
    const payload = {
        scorekeeperCode: scoreInput.value,
        statManagerCode: statInput.value
    };

    await fetch(`http://localhost:7071/api/teams/${editingTeamId}/codes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    modal.classList.add("hidden");
    loadCodes();
}

// Event Listeners
document.getElementById("cancel-modal").addEventListener("click", () => modal.classList.add("hidden"));
document.getElementById("save-code-btn").addEventListener("click", saveCodes);

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("nf_admin_token");
    localStorage.removeItem("nf_admin_role");
    window.location.href = "./login.html";
});

// Init
await loadCodes();
