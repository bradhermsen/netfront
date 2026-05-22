// ===============================
// DOM ELEMENTS
// ===============================
const orgModal = document.getElementById("orgModal");
const orgModalTitle = document.getElementById("orgModalTitle");
const btnAddOrganization = document.getElementById("btnAddOrganization");
const btnSaveOrg = document.getElementById("btnSaveOrg");
const btnCancelOrg = document.getElementById("btnCancelOrg");

const orgNameInput = document.getElementById("org-name");
const orgAbbrevInput = document.getElementById("org-abbrev");
const orgStreetInput = document.getElementById("org-street");
const orgCityInput = document.getElementById("org-city");
const orgStateInput = document.getElementById("org-state");
const orgZipInput = document.getElementById("org-zip");
const orgCountryInput = document.getElementById("org-country");
const orgDistrictInput = document.getElementById("org-district");
const orgMascotInput = document.getElementById("org-mascot");
const orgLeagueInput = document.getElementById("org-league");

const orgContactFirstInput = document.getElementById("org-contact-first");
const orgContactLastInput = document.getElementById("org-contact-last");
const orgContactEmailInput = document.getElementById("org-contact-email");

const billingStreetInput = document.getElementById("billing-street");
const billingCityInput = document.getElementById("billing-city");
const billingStateInput = document.getElementById("billing-state");
const billingZipInput = document.getElementById("billing-zip");
const billingContactNameInput = document.getElementById("billing-contact-name");
const billingContactEmailInput = document.getElementById("billing-contact-email");

const orgCreatedInput = document.getElementById("org-created");
const orgUpdatedInput = document.getElementById("org-updated");

const orgActiveInput = document.getElementById("org-active");

const organizationsBody = document.getElementById("organizationsBody");

let editingId = null;

// ===============================
// MODAL CONTROL
// ===============================
function showModal() {
    orgModal.classList.remove("hidden");
}

function closeModal() {
    orgModal.classList.add("hidden");
    clearForm();
    editingId = null;
}

btnCancelOrg.addEventListener("click", closeModal);

// ESC closes modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !orgModal.classList.contains("hidden")) {
        closeModal();
    }
});

// ===============================
// CLEAR FORM
// ===============================
function clearForm() {
    orgNameInput.value = "";
    orgAbbrevInput.value = "";
    orgStreetInput.value = "";
    orgCityInput.value = "";
    orgStateInput.value = "";
    orgZipInput.value = "";
    orgCountryInput.value = "";
    orgDistrictInput.value = "";
    orgMascotInput.value = "";
    orgLeagueInput.value = "";

    orgContactFirstInput.value = "";
    orgContactLastInput.value = "";
    orgContactEmailInput.value = "";

    billingStreetInput.value = "";
    billingCityInput.value = "";
    billingStateInput.value = "";
    billingZipInput.value = "";
    billingContactNameInput.value = "";
    billingContactEmailInput.value = "";

    orgCreatedInput.value = "";
    orgUpdatedInput.value = "";

    orgActiveInput.checked = true;
}

// ===============================
// LOAD ORGANIZATIONS TABLE
// ===============================
async function loadOrganizations() {
    const orgs = await OrgApi.getAll();
    organizationsBody.innerHTML = "";

    orgs.forEach(org => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${org.name}</td>
            <td>${org.leagueName ?? ""}</td>
            <td>${org.districtConference ?? ""}</td>
            <td>${org.teamCount}</td>
            <td>${org.primaryContactFirstName ?? ""} ${org.primaryContactLastName ?? ""}</td>
            <td>
                <span class="status-badge ${org.isActive ? "active" : "inactive"}">
                    ${org.isActive ? "Active" : "Inactive"}
                </span>
            </td>
            <td class="actions-col">
                <button class="btn-small" onclick="openEditModal('${org.organizationId}')">Edit</button>
                <button class="btn-small btn-danger" onclick="openDeleteModal('${org.organizationId}')">Delete</button>
            </td>
        `;

        organizationsBody.appendChild(row);
    });
}
// ===============================
// LOAD LEAGUES DROPDOWN
// ===============================
async function loadLeagues() {
    const response = await fetch("http://localhost:7071/api/leagues");
    const leagues = await response.json();

    orgLeagueInput.innerHTML = `<option value="">Select League</option>`;

    leagues.forEach(l => {
        const option = document.createElement("option");
        option.value = l.leagueId;
        option.textContent = l.leagueName;
        orgLeagueInput.appendChild(option);
    });
}

// ===============================
// OPEN ADD MODAL
// ===============================
btnAddOrganization.addEventListener("click", () => {
    editingId = null;
    orgModalTitle.textContent = "Add Organization";
    clearForm();
    showModal();
});

// ===============================
// OPEN EDIT MODAL
// ===============================
async function openEditModal(id) {
    editingId = id;
    orgModalTitle.textContent = "Edit Organization";

    const org = await OrgApi.getById(id);

    orgNameInput.value = org.name;
    orgAbbrevInput.value = org.abbreviation;
    orgStreetInput.value = org.streetAddress;
    orgCityInput.value = org.city;
    orgStateInput.value = org.state;
    orgZipInput.value = org.zipCode;
    orgCountryInput.value = org.country;
    orgDistrictInput.value = org.districtConference;
    orgMascotInput.value = org.mascot;
    orgLeagueInput.value = org.leagueId ?? "";

    orgContactFirstInput.value = org.primaryContactFirstName;
    orgContactLastInput.value = org.primaryContactLastName;
    orgContactEmailInput.value = org.primaryContactEmail;

    billingStreetInput.value = org.billingStreetAddress;
    billingCityInput.value = org.billingCity;
    billingStateInput.value = org.billingState;
    billingZipInput.value = org.billingZipCode;
    billingContactNameInput.value = org.billingContactName;
    billingContactEmailInput.value = org.billingContactEmail;

    orgCreatedInput.value = org.createdAt ? new Date(org.createdAt).toLocaleString() : "";
    orgUpdatedInput.value = org.updatedAt ? new Date(org.updatedAt).toLocaleString() : "";

    orgActiveInput.checked = org.isActive;

    showModal();
}

// ===============================
// SAVE ORGANIZATION
// ===============================
btnSaveOrg.addEventListener("click", saveOrganization);

async function saveOrganization() {
    const payload = {
        name: orgNameInput.value,
        abbreviation: orgAbbrevInput.value,
        streetAddress: orgStreetInput.value,
        city: orgCityInput.value,
        state: orgStateInput.value,
        zipCode: orgZipInput.value,
        country: orgCountryInput.value,
        districtConference: orgDistrictInput.value,
        mascot: orgMascotInput.value,
        leagueId: orgLeagueInput.value || null,

        primaryContactFirstName: orgContactFirstInput.value,
        primaryContactLastName: orgContactLastInput.value,
        primaryContactEmail: orgContactEmailInput.value,

        billingStreetAddress: billingStreetInput.value,
        billingCity: billingCityInput.value,
        billingState: billingStateInput.value,
        billingZipCode: billingZipInput.value,
        billingContactName: billingContactNameInput.value,
        billingContactEmail: billingContactEmailInput.value,

        isActive: orgActiveInput.checked
    };

    if (editingId) {
        await OrgApi.update(editingId, payload);
    } else {
        await OrgApi.create(payload);
    }

    closeModal();
    loadOrganizations();
}

// ===============================
// DELETE ORGANIZATION
// ===============================
let deleteId = null;

function openDeleteModal(id) {
    deleteId = id;
    document.getElementById("deleteModal").classList.remove("hidden");
}

document.getElementById("btnCancelDelete").addEventListener("click", () => {
    deleteId = null;
    document.getElementById("deleteModal").classList.add("hidden");
});

document.getElementById("btnConfirmDelete").addEventListener("click", async () => {
    if (deleteId) {
        await OrgApi.delete(deleteId);
        deleteId = null;
        document.getElementById("deleteModal").classList.add("hidden");
        loadOrganizations();
    }
});

// ===============================
// INITIAL LOAD
// ===============================
loadLeagues();
loadOrganizations();
