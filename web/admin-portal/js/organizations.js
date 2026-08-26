// =========================================================
// ORGANIZATIONS PAGE — MODERNIZED + COMPATIBLE VERSION
// =========================================================

const ORG_GROUP_PAGE_SIZE = 10;
const orgGroupPaginationState = {};
const orgFacilityEscape = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

async function loadOrganizationFacilities(organizationId) {
  const section = document.getElementById("org-facilities-section");
  const divider = document.getElementById("org-facilities-divider");
  const list = document.getElementById("org-facilities-list");
  section.classList.remove("hidden");
  divider.classList.remove("hidden");
  document.getElementById("org-manage-facilities").href = `facilities.html?organizationId=${encodeURIComponent(organizationId)}`;
  document.getElementById("org-add-arena").href = `facilities.html?organizationId=${encodeURIComponent(organizationId)}&action=addArena`;
  list.innerHTML = '<div class="org-facility-rinks">Loading arenas...</div>';
  try {
    const arenas = await FacilityApi.getForOrganization(organizationId);
    list.innerHTML = arenas.length
      ? arenas.map((arena) => `<div class="org-facility-row"><div><strong>${orgFacilityEscape(arena.name)} · ${orgFacilityEscape(arena.accessLevel)}</strong><div class="org-facility-rinks">${arena.rinks?.length ? arena.rinks.map((rink) => orgFacilityEscape(rink.name)).join(" · ") : "No rinks configured"}</div></div>${arena.accessLevel === "Manage" ? `<a class="nf-btn nf-btn-secondary" href="facilities.html?organizationId=${encodeURIComponent(organizationId)}&action=addRink&arenaId=${encodeURIComponent(arena.arenaId)}">Add Rink</a>` : ""}</div>`).join("")
      : '<div class="org-facility-rinks">No Arenas are associated with this organization.</div>';
  } catch (error) {
    list.innerHTML = `<div class="org-facility-rinks">${orgFacilityEscape(error.message)}</div>`;
  }
}

function resetOrgGroupPagination() {
  Object.keys(orgGroupPaginationState).forEach((k) => delete orgGroupPaginationState[k]);
}

function getFilteredOrganizations() {
  const source = Array.isArray(AdminPage?.allItems) ? AdminPage.allItems : [];
  const searchTerm = (document.getElementById("org-search-bar")?.value || "").toLowerCase();
  const leagueFilter = document.getElementById("filter-league")?.value || "";
  const statusFilter = document.getElementById("filter-status")?.value || "";

  return source.filter((org) => {
    const orgText = JSON.stringify(org || {}).toLowerCase();
    const orgLeague = org?.leagueId || "";
    const orgStatus = org?.isActive ? "active" : "inactive";

    const matchesSearch = !searchTerm || orgText.includes(searchTerm);
    const matchesLeague = !leagueFilter || orgLeague === leagueFilter;
    const matchesStatus = !statusFilter || orgStatus === statusFilter;

    return matchesSearch && matchesLeague && matchesStatus;
  });
}

function applyOrgFiltersAndSearch() {
  renderOrganizationsGrouped(getFilteredOrganizations());
}

function renderOrganizationsGrouped(orgs) {
  const container = document.getElementById("orgGroupedList");
  if (!container) return;

  if (!orgs.length) {
    container.innerHTML = `<div class="nf-empty-state">No organizations match your current filters.</div>`;
    return;
  }

  const statusGroups = {
    active: orgs.filter((org) => org.isActive),
    inactive: orgs.filter((org) => !org.isActive),
  };

  const statusOrder = ["active", "inactive"].filter((key) => statusGroups[key].length > 0);

  container.innerHTML = statusOrder
    .map((statusKey, statusIndex) => {
      const statusLabel = statusKey === "active" ? "Active" : "Inactive";
      const statusItems = [...statusGroups[statusKey]].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      const totalPages = Math.max(1, Math.ceil(statusItems.length / ORG_GROUP_PAGE_SIZE));
      const currentPage = Math.min(orgGroupPaginationState[statusKey] || 1, totalPages);
      orgGroupPaginationState[statusKey] = currentPage;

      const paged = statusItems.slice((currentPage - 1) * ORG_GROUP_PAGE_SIZE, currentPage * ORG_GROUP_PAGE_SIZE);

      const byLeague = new Map();
      paged.forEach((org) => {
        const leagueLabel = org.leagueName || "No League";
        if (!byLeague.has(leagueLabel)) byLeague.set(leagueLabel, []);
        byLeague.get(leagueLabel).push(org);
      });

      const leagueMarkup = [...byLeague.entries()]
        .map(([leagueLabel, leagueItems], leagueIndex) => {
          const cards = leagueItems
            .map((org) => `
              <article class="nf-item-card org-item-card">
                <div class="nf-item-card-top">
                  <h4>${org.name || "Unnamed Organization"}</h4>
                  <span class="status-badge ${org.isActive ? "active" : "inactive"}">${org.isActive ? "Active" : "Inactive"}</span>
                </div>
                <div class="nf-item-card-meta">
                  <span><i class="fa fa-building"></i> ${org.abbreviation || "No abbreviation"}</span>
                  <span><i class="fa fa-map-marker-alt"></i> ${org.city || "Unknown city"}${org.state ? `, ${org.state}` : ""}</span>
                  <span><i class="fa fa-users"></i> ${org.teamCount || 0} teams</span>
                </div>
                <div class="nf-item-card-actions">
                  <button class="nf-btn-icon view org-view-btn" data-id="${org.organizationId}" title="View Teams"><i class="fa-solid fa-users"></i></button>
                  <button class="nf-btn-icon edit org-edit-btn" data-id="${org.organizationId}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                  <button class="nf-btn-icon delete org-delete-btn" data-id="${org.organizationId}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
              </article>
            `)
            .join("");

          return `
            <details class="nf-subgroup" ${leagueIndex === 0 ? "open" : ""}>
              <summary>
                <span>${leagueLabel}</span>
                <span class="nf-group-count">${leagueItems.length}</span>
              </summary>
              <div class="nf-card-grid">${cards}</div>
            </details>
          `;
        })
        .join("");

      return `
        <details class="nf-group" ${statusIndex === 0 ? "open" : ""}>
          <summary>
            <span>${statusLabel}</span>
            <span class="nf-group-count">${statusItems.length}</span>
          </summary>
          <div class="nf-group-content">
            ${leagueMarkup}
            ${statusItems.length > ORG_GROUP_PAGE_SIZE ? `
              <div class="nf-pagination">
                <button class="nf-btn nf-btn-secondary org-page-btn" data-status="${statusKey}" data-direction="prev" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
                <span>Page ${currentPage} of ${totalPages}</span>
                <button class="nf-btn nf-btn-secondary org-page-btn" data-status="${statusKey}" data-direction="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
              </div>
            ` : ""}
          </div>
        </details>
      `;
    })
    .join("");

  wireOrganizationCardActions();
  wireOrganizationPagination();
}

function wireOrganizationCardActions() {
  document.querySelectorAll(".org-view-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      window.location.href = `teams.html?orgId=${id}`;
    };
  });

  document.querySelectorAll(".org-edit-btn").forEach((btn) => {
    btn.onclick = () => openEditOrganization(btn.dataset.id);
  });

  document.querySelectorAll(".org-delete-btn").forEach((btn) => {
    btn.onclick = () => openDeleteOrganization(btn.dataset.id);
  });
}

function wireOrganizationPagination() {
  document.querySelectorAll(".org-page-btn").forEach((btn) => {
    btn.onclick = () => {
      const status = btn.dataset.status;
      const direction = btn.dataset.direction;
      const current = orgGroupPaginationState[status] || 1;

      orgGroupPaginationState[status] = direction === "prev"
        ? Math.max(1, current - 1)
        : current + 1;

      applyOrgFiltersAndSearch();
    };
  });
}

// ---------------------------------------------------------
// ADMIN PAGE INITIALIZATION
// ---------------------------------------------------------
AdminPage.init({
  tableBodyId: "orgGroupedList",
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
  addHandler: openAddOrganization,

  addTitle: "Add Organization",
  editTitle: "Edit Organization",

  api: OrgApi,

  // -------------------------------------------------------
  // DROPDOWNS
  // -------------------------------------------------------
  loadDropdowns: async () => {
    await loadLeagues();
    wireOrgFilterEvents();
  },

  // -------------------------------------------------------
  // TABLE RENDERING (MODERNIZED)
  // -------------------------------------------------------
  renderTable: (orgs) => {
    renderOrganizationsGrouped(orgs);
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

// =========================================================
// LEAGUES
// =========================================================
async function loadLeagues() {
  try {
    const res = await authFetch(`/leagues`);
    if (!res || !res.ok) {
      throw new Error("Failed to load leagues");
    }
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
// FILTER + SEARCH
// =========================================================
function wireOrgFilterEvents() {
  const search = document.getElementById("org-search-bar");
  const league = document.getElementById("filter-league");
  const status = document.getElementById("filter-status");

  if (search) {
    search.addEventListener("input", () => {
      resetOrgGroupPagination();
      applyOrgFiltersAndSearch();
    });
  }

  if (league) {
    league.addEventListener("change", () => {
      resetOrgGroupPagination();
      applyOrgFiltersAndSearch();
    });
  }

  if (status) {
    status.addEventListener("change", () => {
      resetOrgGroupPagination();
      applyOrgFiltersAndSearch();
    });
  }
}

// =========================================================
// ADD ORGANIZATION HANDLER
// =========================================================
function openAddOrganization() {
  AdminPage.editingId = null;
  AdminPage.config.clearForm();
  document.getElementById("orgModalTitle").textContent = "Add Organization";
  document.getElementById("org-facilities-section").classList.add("hidden");
  document.getElementById("org-facilities-divider").classList.add("hidden");

  const overlay = document.getElementById("orgModalOverlay");
  overlay.classList.remove("hidden");
  overlay.classList.add("active");
  document.getElementById("orgModal").classList.add("active");
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
    void loadOrganizationFacilities(id);

    const overlay = document.getElementById("orgModalOverlay");
    overlay.classList.remove("hidden");
    overlay.classList.add("active");
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
