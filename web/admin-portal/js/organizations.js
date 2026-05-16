console.log("Organizations JS loaded");

const tbody = document.querySelector(".org-table tbody");

// Modal elements
const orgModal = document.getElementById("org-modal");
const orgModalTitle = document.getElementById("org-modal-title");

const orgNameInput = document.getElementById("org-name");
const orgAbbrevInput = document.getElementById("org-abbrev");
const orgCityInput = document.getElementById("org-city");
const orgStateInput = document.getElementById("org-state");
const orgCountryInput = document.getElementById("org-country");
const orgEmailInput = document.getElementById("org-email");
const orgContactFirstInput = document.getElementById("org-contact-first");
const orgContactLastInput = document.getElementById("org-contact-last");

const addOrgBtn = document.getElementById("add-org-btn");
const orgCancelBtn = document.getElementById("org-cancel");
const orgSaveBtn = document.getElementById("org-save");

// Bulk modal
const bulkOrgModal = document.getElementById("bulk-org-modal");
const bulkOrgBtn = document.getElementById("bulk-org-btn");
const bulkOrgCancel = document.getElementById("bulk-org-cancel");
const bulkOrgFile = document.getElementById("bulk-org-file");
const bulkOrgPreview = document.getElementById("bulk-org-preview");

// Search
const orgSearchInput = document.getElementById("org-search");

let editingOrgId = null;
let allOrgs = [];

/* -----------------------------------------
   LOAD ORGANIZATIONS
----------------------------------------- */

async function loadOrganizations() {
    const res = await fetch("http://localhost:7071/api/organizations");
    allOrgs = await res.json();
    renderOrganizations(allOrgs);
}

function renderOrganizations(orgs) {
    tbody.innerHTML = "";

    orgs.forEach(o => {
        const tr = document.createElement("tr");

        const contactName =
            o.primaryContactFirstName && o.primaryContactLastName
                ? `${o.primaryContactFirstName} ${o.primaryContactLastName}`
                : "";

        tr.innerHTML = `
            <td>${o.name}</td>
            <td>${o.abbreviation}</td>
            <td>${o.city ?? ""}</td>
            <td>${o.state ?? ""}</td>
            <td>${contactName}</td>
            <td>${o.primaryContactEmail ?? ""}</td>
            <td style="text-align:center;">
                <button class="btn-sm edit-btn" data-id="${o.id}">✏️ Edit</button>
                <button class="btn-sm delete-btn" data-id="${o.id}">🗑️ Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", () => openEditModal(btn.dataset.id))
    );

    document.querySelectorAll(".delete-btn").forEach(btn =>
        btn.addEventListener("click", () => deleteOrganization(btn.dataset.id))
    );
}

/* -----------------------------------------
   ADD / EDIT MODAL
----------------------------------------- */

function openAddModal() {
    editingOrgId = null;
    orgModalTitle.textContent = "Add Organization";

    orgNameInput.value = "";
    orgAbbrevInput.value = "";
    orgCityInput.value = "";
    orgStateInput.value = "";
    orgCountryInput.value = "USA";
    orgEmailInput.value = "";
    orgContactFirstInput.value = "";
    orgContactLastInput.value = "";

    orgModal.classList.remove("hidden");
}

async function openEditModal(id) {
    editingOrgId = id;

    const res = await fetch(`http://localhost:7071/api/organizations/${id}`);
    const o = await res.json();

    orgModalTitle.textContent = "Edit Organization";

    orgNameInput.value = o.name;
    orgAbbrevInput.value = o.abbreviation;
    orgCityInput.value = o.city ?? "";
    orgStateInput.value = o.state ?? "";
    orgCountryInput.value = o.country ?? "USA";
    orgEmailInput.value = o.primaryContactEmail ?? "";
    orgContactFirstInput.value = o.primaryContactFirstName ?? "";
    orgContactLastInput.value = o.primaryContactLastName ?? "";

    orgModal.classList.remove("hidden");
}

/* -----------------------------------------
   SAVE ORGANIZATION (POST + PUT)
----------------------------------------- */

async function saveOrganization() {
    console.log("🔵 saveOrganization() called");

    // Normalize + sanitize all fields
    const safe = v => {
        if (v === undefined || v === null) return null;
        const trimmed = String(v).trim();
        return trimmed.length === 0 ? null : trimmed;
    };

    const payload = {
        name: safe(orgNameInput.value),
        abbreviation: safe(orgAbbrevInput.value),
        city: safe(orgCityInput.value),
        state: safe(orgStateInput.value),
        country: safe(orgCountryInput.value) || "USA",
        primaryContactEmail: safe(orgEmailInput.value),
        primaryContactFirstName: safe(orgContactFirstInput.value),
        primaryContactLastName: safe(orgContactLastInput.value)
    };

    console.log("📦 Payload being sent:", payload);

    const url = editingOrgId
        ? `http://localhost:7071/api/organizations/${editingOrgId}`
        : "http://localhost:7071/api/organizations";

    const method = editingOrgId ? "PUT" : "POST";

    try {
        console.log(`➡️ Sending ${method} to ${url}`);

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("⬅️ Response status:", res.status);

        if (!res.ok) {
            const text = await res.text();
            console.error("❌ Server returned error:", text);
            alert("Error saving organization. Check console.");
            return;
        }

        console.log("✅ Organization saved successfully");

        orgModal.classList.add("hidden");
        await loadOrganizations();

    } catch (err) {
        console.error("🔥 FETCH ERROR:", err);
        alert("Network error saving organization. Check console.");
    }
}


/* -----------------------------------------
   DELETE ORGANIZATION
----------------------------------------- */

async function deleteOrganization(id) {
    const confirmDelete = confirm("Delete this organization?");
    if (!confirmDelete) return;

    await fetch(`http://localhost:7071/api/organizations/${id}`, {
        method: "DELETE"
    });

    await loadOrganizations();
}

/* -----------------------------------------
   CSV PARSER
----------------------------------------- */

function parseCSV(text) {
    return text.trim().split("\n").map(r => r.split(","));
}

/* -----------------------------------------
   BULK ADD
----------------------------------------- */

bulkOrgBtn.addEventListener("click", () => {
    bulkOrgPreview.innerHTML = "";
    bulkOrgFile.value = "";
    bulkOrgModal.classList.remove("hidden");
});

bulkOrgCancel.addEventListener("click", () => {
    bulkOrgModal.classList.add("hidden");
});

bulkOrgFile.addEventListener("change", async () => {
    const file = bulkOrgFile.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCSV(text);

    let html = `<table class="admin-table"><thead><tr>`;
    rows[0].forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;

    rows.slice(1).forEach(r => {
        html += "<tr>";
        r.forEach(c => html += `<td>${c}</td>`);
        html += "</tr>";
    });

    html += "</tbody></table>";
    bulkOrgPreview.innerHTML = html;
});

document.getElementById("bulk-org-import").addEventListener("click", async () => {
    const file = bulkOrgFile.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCSV(text);

    const headers = rows[0];
    const data = rows.slice(1).map(r => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = r[i]);
        return obj;
    });

    await fetch("http://localhost:7071/api/organizations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    bulkOrgModal.classList.add("hidden");
    await loadOrganizations();
});

/* -----------------------------------------
   SEARCH
----------------------------------------- */

orgSearchInput.addEventListener("input", () => {
    const term = orgSearchInput.value.toLowerCase();
    const filtered = allOrgs.filter(o =>
        o.name.toLowerCase().includes(term) ||
        (o.abbreviation ?? "").toLowerCase().includes(term)
    );
    renderOrganizations(filtered);
});

/* -----------------------------------------
   MODAL BUTTONS
----------------------------------------- */

addOrgBtn.addEventListener("click", openAddModal);
orgCancelBtn.addEventListener("click", () => orgModal.classList.add("hidden"));
orgSaveBtn.addEventListener("click", saveOrganization);

/* -----------------------------------------
   LOGOUT
----------------------------------------- */

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("nf_admin_token");
    localStorage.removeItem("nf_admin_role");
    window.location.href = "./login.html";
});

/* -----------------------------------------
   INIT
----------------------------------------- */

await loadOrganizations();
