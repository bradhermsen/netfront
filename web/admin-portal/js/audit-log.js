const tbody = document.querySelector(".audit-table tbody");
const modal = document.getElementById("audit-modal");

const timeInput = document.getElementById("detail-time");
const userInput = document.getElementById("detail-user");
const actionInput = document.getElementById("detail-action");
const entityInput = document.getElementById("detail-entity");
const infoInput = document.getElementById("detail-info");
const ipInput = document.getElementById("detail-ip");

// Load audit logs
async function loadAuditLogs() {
    const res = await fetch("http://localhost:7071/api/audit");
    const logs = await res.json();

    tbody.innerHTML = "";

    logs.forEach(log => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${log.timestamp}</td>
            <td>${log.userName}</td>
            <td>${log.action}</td>
            <td>${log.entity}</td>
            <td>${log.summary}</td>
            <td>${log.ip}</td>
            <td style="text-align:center;">
                <button class="btn-sm view-btn" data-id="${log.id}">🔍 View</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".view-btn").forEach(btn =>
        btn.addEventListener("click", () => openDetailModal(btn.dataset.id))
    );
}

async function openDetailModal(id) {
    const res = await fetch(`http://localhost:7071/api/audit/${id}`);
    const log = await res.json();

    timeInput.value = log.timestamp;
    userInput.value = log.userName;
    actionInput.value = log.action;
    entityInput.value = log.entity;
    infoInput.value = log.details;
    ipInput.value = log.ip;

    modal.classList.remove("hidden");
}

document.getElementById("close-modal").addEventListener("click", () => {
    modal.classList.add("hidden");
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("nf_admin_token");
    localStorage.removeItem("nf_admin_role");
    window.location.href = "./login.html";
});

// Init
await loadAuditLogs();
