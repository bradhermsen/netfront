// =========================================================
// OFFICIALS PAGE
// =========================================================

const OFFICIALS_GROUP_PAGE_SIZE = 10;
const officialsGroupPaginationState = {};

function resetOfficialsGroupPagination() {
  Object.keys(officialsGroupPaginationState).forEach((k) => delete officialsGroupPaginationState[k]);
}

function getOfficialRoleState(roleValue) {
  const role = (roleValue || "").toString().toLowerCase();
  return {
    isReferee: role.includes("ref"),
    isLinesman: role.includes("line"),
  };
}

function buildOfficialRoleValue(isReferee, isLinesman) {
  if (isReferee && isLinesman) return "Referee, Linesman";
  if (isReferee) return "Referee";
  if (isLinesman) return "Linesman";
  return "";
}

function formatOfficialRoleLabel(roleValue) {
  const { isReferee, isLinesman } = getOfficialRoleState(roleValue);
  if (isReferee && isLinesman) return "Referee / Linesman";
  if (isReferee) return "Referee";
  if (isLinesman) return "Linesman";
  return "";
}

function getOfficialRoleFilterValue(roleValue) {
  const { isReferee, isLinesman } = getOfficialRoleState(roleValue);
  if (isReferee && isLinesman) return "both";
  if (isReferee) return "referee";
  if (isLinesman) return "linesman";
  return "none";
}

function getFilteredOfficials() {
  const source = Array.isArray(AdminPage?.allItems) ? AdminPage.allItems : [];
  const searchTerm = (document.getElementById("officials-search-bar")?.value || "").toLowerCase();
  const roleFilter = (document.getElementById("filter-official-role")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("filter-official-status")?.value || "";

  return source.filter((official) => {
    const rowText = JSON.stringify(official || {}).toLowerCase();
    const rowRole = getOfficialRoleFilterValue(official?.role);
    const rowStatus = official?.isActive ? "active" : "inactive";

    const matchesSearch = !searchTerm || rowText.includes(searchTerm);
    const matchesRole =
      !roleFilter ||
      (roleFilter === "referee" && (rowRole === "referee" || rowRole === "both")) ||
      (roleFilter === "linesman" && (rowRole === "linesman" || rowRole === "both")) ||
      (roleFilter === "both" && rowRole === "both");
    const matchesStatus = !statusFilter || rowStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });
}

function renderOfficialsGrouped(officials) {
  const container = document.getElementById("officialsGroupedList");
  if (!container) return;

  if (!officials.length) {
    container.innerHTML = `<div class="nf-empty-state">No officials match your current filters.</div>`;
    return;
  }

  const statusGroups = {
    active: officials.filter((official) => official.isActive),
    inactive: officials.filter((official) => !official.isActive),
  };

  const statusOrder = ["active", "inactive"].filter((key) => statusGroups[key].length > 0);

  container.innerHTML = statusOrder
    .map((statusKey, statusIndex) => {
      const statusItems = [...statusGroups[statusKey]].sort((a, b) => {
        const left = a.displayName || `${a.firstName || ""} ${a.lastName || ""}`.trim();
        const right = b.displayName || `${b.firstName || ""} ${b.lastName || ""}`.trim();
        return left.localeCompare(right);
      });

      const totalPages = Math.max(1, Math.ceil(statusItems.length / OFFICIALS_GROUP_PAGE_SIZE));
      const currentPage = Math.min(officialsGroupPaginationState[statusKey] || 1, totalPages);
      officialsGroupPaginationState[statusKey] = currentPage;

      const paged = statusItems.slice((currentPage - 1) * OFFICIALS_GROUP_PAGE_SIZE, currentPage * OFFICIALS_GROUP_PAGE_SIZE);

      const roleGroups = new Map();
      paged.forEach((official) => {
        const roleLabel = formatOfficialRoleLabel(official.role) || "Unassigned Role";
        if (!roleGroups.has(roleLabel)) roleGroups.set(roleLabel, []);
        roleGroups.get(roleLabel).push(official);
      });

      const roleMarkup = [...roleGroups.entries()]
        .map(([roleLabel, roleItems], roleIndex) => {
          const cards = roleItems
            .map((official) => {
              const displayName = official.displayName || `${official.firstName || ""} ${official.lastName || ""}`.trim();
              return `
                <article class="nf-item-card official-item-card">
                  <div class="nf-item-card-top">
                    <h4>${displayName || "Unnamed Official"}</h4>
                    <span class="status-badge ${official.isActive ? "active" : "inactive"}">${official.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <div class="nf-item-card-meta">
                    <span><i class="fa fa-envelope"></i> ${official.email || "No email"}</span>
                    <span><i class="fa fa-user-tag"></i> ${formatOfficialRoleLabel(official.role) || "No role"}</span>
                  </div>
                  <div class="nf-item-card-actions">
                    <button class="nf-btn-icon edit official-edit-btn" data-id="${official.officialId}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="nf-btn-icon delete official-delete-btn" data-id="${official.officialId}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </article>
              `;
            })
            .join("");

          return `
            <details class="nf-subgroup" ${roleIndex === 0 ? "open" : ""}>
              <summary>
                <span>${roleLabel}</span>
                <span class="nf-group-count">${roleItems.length}</span>
              </summary>
              <div class="nf-card-grid">${cards}</div>
            </details>
          `;
        })
        .join("");

      return `
        <details class="nf-group" ${statusIndex === 0 ? "open" : ""}>
          <summary>
            <span>${statusKey === "active" ? "Active" : "Inactive"}</span>
            <span class="nf-group-count">${statusItems.length}</span>
          </summary>
          <div class="nf-group-content">
            ${roleMarkup}
            ${statusItems.length > OFFICIALS_GROUP_PAGE_SIZE ? `
              <div class="nf-pagination">
                <button class="nf-btn nf-btn-secondary official-page-btn" data-status="${statusKey}" data-direction="prev" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
                <span>Page ${currentPage} of ${totalPages}</span>
                <button class="nf-btn nf-btn-secondary official-page-btn" data-status="${statusKey}" data-direction="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
              </div>
            ` : ""}
          </div>
        </details>
      `;
    })
    .join("");

  wireOfficialCardActions();
  wireOfficialPagination();
}

function wireOfficialCardActions() {
  document.querySelectorAll(".official-edit-btn").forEach((btn) => {
    btn.onclick = () => openEditOfficial(btn.dataset.id);
  });

  document.querySelectorAll(".official-delete-btn").forEach((btn) => {
    btn.onclick = () => openDeleteOfficial(btn.dataset.id);
  });
}

function wireOfficialPagination() {
  document.querySelectorAll(".official-page-btn").forEach((btn) => {
    btn.onclick = () => {
      const status = btn.dataset.status;
      const direction = btn.dataset.direction;
      const current = officialsGroupPaginationState[status] || 1;

      officialsGroupPaginationState[status] = direction === "prev"
        ? Math.max(1, current - 1)
        : current + 1;

      applyOfficialFiltersAndSearch();
    };
  });
}

AdminPage.init({
  tableBodyId: "officialsGroupedList",
  searchInputId: "officials-search-bar",

  modalId: "officialModalOverlay",
  modalTitleId: "officialModalTitle",
  addButtonId: "btnAddOfficial",
  saveButtonId: "officialSave",
  cancelButtonId: "officialCancel",

  deleteModalId: "officialDeleteModalOverlay",
  deleteConfirmId: "officialDeleteConfirm",
  deleteCancelId: "officialDeleteCancel",

  editHandlerName: "openEditOfficial",
  deleteHandlerName: "openDeleteOfficial",

  addTitle: "Add Official",
  editTitle: "Edit Official",

  api: OfficialsApi,

  saveHandler: async () => {
    const payload = AdminPage.config.collectFormData();
    if (!payload.role) {
      throw new Error("Select at least one role: Referee or Linesman");
    }

    if (AdminPage.editingId) {
      await OfficialsApi.update(AdminPage.editingId, payload);
    } else {
      await OfficialsApi.create(payload);
    }

    AdminPage.closeModal();
    await AdminPage.loadData();
  },

  loadDropdowns: async () => {
    wireOfficialFilterEvents();
  },

  renderTable: (officials) => {
    renderOfficialsGrouped(officials);
  },

  clearForm: () => {
    document.getElementById("official-first-name").value = "";
    document.getElementById("official-last-name").value = "";
    document.getElementById("official-email").value = "";
    document.getElementById("official-role-referee").checked = true;
    document.getElementById("official-role-linesman").checked = false;
    document.getElementById("official-active").checked = true;
  },

  populateForm: (official) => {
    const roleState = getOfficialRoleState(official.role);
    document.getElementById("official-first-name").value = official.firstName || "";
    document.getElementById("official-last-name").value = official.lastName || "";
    document.getElementById("official-email").value = official.email || "";
    document.getElementById("official-role-referee").checked = roleState.isReferee;
    document.getElementById("official-role-linesman").checked = roleState.isLinesman;
    document.getElementById("official-active").checked = !!official.isActive;
  },

  collectFormData: () => {
    const isReferee = document.getElementById("official-role-referee").checked;
    const isLinesman = document.getElementById("official-role-linesman").checked;

    return {
      firstName: document.getElementById("official-first-name").value.trim(),
      lastName: document.getElementById("official-last-name").value.trim(),
      email: document.getElementById("official-email").value.trim() || null,
      role: buildOfficialRoleValue(isReferee, isLinesman),
      isActive: document.getElementById("official-active").checked,
    };
  },
});

function applyOfficialFiltersAndSearch() {
  renderOfficialsGrouped(getFilteredOfficials());
}

function wireOfficialFilterEvents() {
  const search = document.getElementById("officials-search-bar");
  const role = document.getElementById("filter-official-role");
  const status = document.getElementById("filter-official-status");

  if (search) {
    search.addEventListener("input", () => {
      resetOfficialsGroupPagination();
      applyOfficialFiltersAndSearch();
    });
  }

  if (role) {
    role.addEventListener("change", () => {
      resetOfficialsGroupPagination();
      applyOfficialFiltersAndSearch();
    });
  }

  if (status) {
    status.addEventListener("change", () => {
      resetOfficialsGroupPagination();
      applyOfficialFiltersAndSearch();
    });
  }
}

async function openEditOfficial(id) {
  await AdminPage.openEdit(id);
}

function openDeleteOfficial(id) {
  AdminPage.openDelete(id);
}
