// Load dashboard data
async function loadDashboard() {
    try {
        const res = await fetch("http://localhost:7071/api/admin/dashboard");
        const data = await res.json();

        document.querySelector(".org-count").textContent = data.organizations;
        document.querySelector(".team-count").textContent = data.teams;
        document.querySelector(".active-games").textContent = data.activeGames;
        document.querySelector(".user-count").textContent = data.users;
        document.querySelector(".access-codes").textContent = data.accessCodes;

        document.querySelector(".last-updated").textContent = data.lastUpdated;

        loadRecentActivity(data.recentActivity);
        loadOrgOverview(data.orgOverview);

    } catch (err) {
        console.error("Dashboard load failed:", err);
    }
}

function loadRecentActivity(rows) {
    const tbody = document.querySelector(".recent-activity-table tbody");
    tbody.innerHTML = "";

    rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.time}</td>
            <td style="color:#fff;font-weight:bold;">${r.user}</td>
            <td><span class="badge-superadmin">${r.role}</span></td>
            <td>${r.action}</td>
        `;
        tbody.appendChild(tr);
    });
}

function loadOrgOverview(rows) {
    const tbody = document.querySelector(".org-overview-table tbody");
    tbody.innerHTML = "";

    rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="color:#fff;font-weight:bold;">${r.name}</td>
            <td style="text-align:center;">${r.teams}</td>
            <td style="text-align:center;">${r.users}</td>
            <td style="text-align:center;">${r.games}</td>
            <td style="text-align:center;"><span class="badge-active">ACTIVE</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("nf_admin_token");
    localStorage.removeItem("nf_admin_role");
    window.location.href = "./login.html";
});

loadDashboard();
