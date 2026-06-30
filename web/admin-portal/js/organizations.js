// =========================================================
// ORGANIZATIONS PAGE — MODERNIZED + COMPATIBLE VERSION
// =========================================================

// ---------------------------------------------------------
// ADMIN PAGE INITIALIZATION
// ---------------------------------------------------------
AdminPage.init({
  tableBodyId: "orgTableBody",
  searchInputId: "org-search-bar",

  modalId: "orgModalOverlay",
  modalTitleId: "orgModalTitle",
  addButtonId: "btnAddOrganization",
  saveButtonId: "orgSave",
  cancelButtonId: "orgCancel",

  deleteModalId: "orgDeleteModalOverlay",
  deleteConfirmId: "deleteConfirm",
  deleteCancelId: "deleteCancel",

  editHandlerName: "openEditOrganization",
  deleteHandlerName: "openDeleteOrganization",
  addHandlerName: "openAddOrganization",

  addTitle: "Add Organization",
  editTitle: "Edit Organization",

  api: OrgApi,

  // -------------------------------------------------------
  // DROPDOWNS (LEAGUES + CONFERENCES)
  // -------------------------------------------------------
  loadDropdowns: async () => {
    await Promise.all([loadLeagues(), loadConferences()]);
    wireOrgFilterEvents();
  },

  // -------------------------------------------------------
  // TABLE RENDERING (MODERNIZED)
  // -------------------------------------------------------
  renderTable: (orgs) => {
    const body = document.getElementById("orgTableBody");
    body.innerHTML = "";

    orgs.forEach((org) => {
      const row = document.createElement("tr");

      row.dataset.leagueId = org.leagueId || "";
      row.dataset.conference = org.districtConference || "";
      row.dataset.status = org.isActive ? "active" : "inactive";

      const orgDisplay = `
        <div class="org-col">
          <div class="org-name">${org.name}</div>
          <div class="org-sub muted">
            ${org.abbreviation ?? ""} • ${org.city ?? ""}, ${org.state ?? ""}
          </div>
        </div>
      `;

      row.innerHTML = `
        <td>${orgDisplay}</td>
        <td>${org.leagueName ?? ""}</td>
        <td>${org.districtConference ?? ""}</td>
        <td>${org.teamCount ?? 0}</td>
        <td>
          <span class="status-badge ${org.isActive ? "active" : "inactive"}">
            ${org.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td class="actions-col">
          <button class="nf-btn-icon view" title="View Team"><i class="fa-solid fa-users"></i></button>
          <button class="nf-btn-icon edit" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="nf-btn-icon delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      const [btnView, btnEdit, btnDelete] = row.querySelectorAll("button");

      btnView.addEventListener("click", () => {
        window.location.href = `teams.html?orgId=${org.organizationId}`;
      });

      btnEdit.addEventListener("click", () => {
        openEditOrganization(org.organizationId);
      });

      btnDelete.addEventListener("click", () => {
        openDeleteOrganization(org.organizationId);
      });

      body.appendChild(row);
    });

    applyOrgFiltersAndSearch();
  },

  // -------------------------------------------------------
  // CLEAR FORM
  // -------------------------------------------------------
  clearForm: () => {
    [
      "org-name",
      "org-abbrev",
      "org-street",
      "org-city",
      "org-state",
      "org-zip",
      "org-country",
      "org-district",
      "org-mascot",
      "org-contact-first",
      "org-contact-last",
      "org-contact-email",
      "billing-street",
      "billing-city",
      "billing-state",
      "billing-zip",
      "billing-contact-name",
      "billing-contact-email",
    ].forEach((id) => (document.getElementById(id).value = ""));

    document.getElementById("org-league").value = "";
    document.getElementById("org-active").checked = true;
  },

  // -------------------------------------------------------
  // POPULATE FORM
  // -------------------------------------------------------
  populateForm: (org) => {
    document.getElementById("org-name").value = org.name;
    document.getElementById("org-abbrev").value = org.abbreviation;

    document.getElementById("org-street").value = org.streetAddress ?? "";
    document.getElementById("org-city").value = org.city ?? "";
    document.getElementById("org-state").value = org.state ?? "";
    document.getElementById("org-zip").value = org.zipCode ?? "";
    document.getElementById("org-country").value = org.country ?? "";
    document.getElementById("org-district").value =
      org.districtConference ?? "";
    document.getElementById("org-mascot").value = org.mascot ?? "";
    document.getElementById("org-league").value = org.leagueId ?? "";

    document.getElementById("org-contact-first").value =
      org.primaryContactFirstName ?? "";
    document.getElementById("org-contact-last").value =
      org.primaryContactLastName ?? "";
    document.getElementById("org-contact-email").value =
      org.primaryContactEmail ?? "";

    document.getElementById("billing-street").value =
      org.billingStreetAddress ?? "";
    document.getElementById("billing-city").value = org.billingCity ?? "";
    document.getElementById("billing-state").value = org.billingState ?? "";
    document.getElementById("billing-zip").value = org.billingZipCode ?? "";
    document.getElementById("billing-contact-name").value =
      org.billingContactName ?? "";
    document.getElementById("billing-contact-email").value =
      org.billingContactEmail ?? "";

    document.getElementById("org-active").checked = org.isActive;
  },
  
  // -------------------------------------------------------
  // COLLECT FORM DATA
  // -------------------------------------------------------
  collectFormData: () => ({
    name: document.getElementById("org-name").value,
    abbreviation: document.getElementById("org-abbrev").value,

    streetAddress: document.getElementById("org-street").value,
    city: document.getElementById("org-city").value,
    state: document.getElementById("org-state").value,
    zipCode: document.getElementById("org-zip").value,
    country: document.getElementById("org-country").value,
    districtConference: document.getElementById("org-district").value,
    mascot: document.getElementById("org-mascot").value,
    leagueId: document.getElementById("org-league").value,

    primaryContactFirstName: document.getElementById("org-contact-first").value,
    primaryContactLastName: document.getElementById("org-contact-last").value,
    primaryContactEmail: document.getElementById("org-contact-email").value,

    billingStreetAddress: document.getElementById("billing-street").value,
    billingCity: document.getElementById("billing-city").value,
    billingState: document.getElementById("billing-state").value,
    billingZipCode: document.getElementById("billing-zip").value,
    billingContactName: document.getElementById("billing-contact-name").value,
    billingContactEmail: document.getElementById("billing-contact-email").value,

    isActive: document.getElementById("org-active").checked,
  }),
});

//=========================================================
// Map AdminPage internal add handler to your function
//=========================================================
AdminPage.openAdd = openAddOrganization;

// =========================================================
// LEAGUES
// =========================================================
async function loadLeagues() {
  try {
    const res = await fetch(`${window.apiBase}/leagues`);
    const leagues = await res.json();

    const modalSelect = document.getElementById("org-league");
    if (modalSelect) {
      modalSelect.innerHTML = `<option value="">Select League</option>`;
      leagues.forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l.leagueId;
        opt.textContent = l.leagueName;
        modalSelect.appendChild(opt);
      });
    }

    const filterSelect = document.getElementById("filter-league");
    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">League: All</option>`;
      leagues.forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l.leagueId;
        opt.textContent = l.leagueName;
        filterSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Failed to load leagues:", err);
  }
}

// =========================================================
// CONFERENCES
// =========================================================
async function loadConferences() {
  try {
    // Load all organizations
    const res = await fetch(`${window.apiBase}/organizations`);
    if (!res.ok) return;

    const orgs = await res.json();

    // Extract unique conference names
    const conferences = [
      ...new Set(
        orgs
          .map((o) => o.districtConference)
          .filter((c) => c && c.trim() !== ""),
      ),
    ];

    // Populate filter dropdown
    const filterSelect = document.getElementById("filter-conference");
    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">Conference: All</option>`;
      conferences.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        filterSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Failed to load conferences:", err);
  }
}

// =========================================================
// FILTER + SEARCH
// =========================================================
function applyOrgFiltersAndSearch() {
  const tbody = document.getElementById("orgTableBody");
  if (!tbody) return;

  const searchTerm = (
    document.getElementById("org-search-bar")?.value || ""
  ).toLowerCase();

  const leagueFilter = document.getElementById("filter-league")?.value || "";
  const confFilter = document.getElementById("filter-conference")?.value || "";
  const statusFilter = document.getElementById("filter-status")?.value || "";

  Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
    const rowText = row.textContent.toLowerCase();

    const rowLeague = row.dataset.leagueId || "";
    const rowConf = row.dataset.conference || "";
    const rowStatus = row.dataset.status || "";

    const matchesSearch = !searchTerm || rowText.includes(searchTerm);
    const matchesLeague = !leagueFilter || rowLeague === leagueFilter;
    const matchesConf = !confFilter || rowConf === confFilter;
    const matchesStatus = !statusFilter || rowStatus === statusFilter;

    row.style.display =
      matchesSearch && matchesLeague && matchesConf && matchesStatus
        ? ""
        : "none";
  });
}

function wireOrgFilterEvents() {
  const search = document.getElementById("org-search-bar");
  const league = document.getElementById("filter-league");
  const conf = document.getElementById("filter-conference");
  const status = document.getElementById("filter-status");

  if (search) search.addEventListener("input", applyOrgFiltersAndSearch);
  if (league) league.addEventListener("change", applyOrgFiltersAndSearch);
  if (conf) conf.addEventListener("change", applyOrgFiltersAndSearch);
  if (status) status.addEventListener("change", applyOrgFiltersAndSearch);
}

// =========================================================
// ADD ORGANIZATION HANDLER
// =========================================================
function openAddOrganization() {
  AdminPage.editingId = null;
  AdminPage.config.clearForm();
  document.getElementById("orgModalTitle").textContent = "Add Organization";

  document.getElementById("orgModalOverlay").classList.add("active");
}

// =========================================================
// EDIT HANDLER
// =========================================================
async function openEditOrganization(id) {
  try {
    const org = await OrgApi.getById(id);
    AdminPage.editingId = id;
    AdminPage.config.populateForm(org);

    document.getElementById("orgModalTitle").textContent = "Edit Organization";

    document.getElementById("orgModal").classList.add("active");
  } catch (err) {
    console.error("Failed to load organization:", err);
    alert("Unable to load organization details.");
  }
}

// =========================================================
// DELETE HANDLER
// =========================================================
function openDeleteOrganization(id) {
  AdminPage.deleteId = id;
  document.getElementById("deleteModal").classList.add("active");
}
