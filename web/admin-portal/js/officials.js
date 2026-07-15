// =========================================================
// OFFICIALS PAGE
// =========================================================

AdminPage.init({
  tableBodyId: "officialsTableBody",
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

  loadDropdowns: async () => {
    wireOfficialFilterEvents();
  },

  renderTable: (officials) => {
    const body = document.getElementById("officialsTableBody");
    body.innerHTML = "";

    officials.forEach((official) => {
      const row = document.createElement("tr");
      row.dataset.role = official.role || "";
      row.dataset.status = official.isActive ? "active" : "inactive";

      row.innerHTML = `
        <td>
          <div class="official-col">
            <div class="official-name">${official.displayName || `${official.firstName || ""} ${official.lastName || ""}`.trim()}</div>
            <div class="official-sub muted">${official.firstName || ""} ${official.lastName || ""}</div>
          </div>
        </td>
        <td>${official.role || ""}</td>
        <td>
          <span class="status-badge ${official.isActive ? "active" : "inactive"}">
            ${official.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td class="actions-col">
          <button class="nf-btn-icon edit" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="nf-btn-icon delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;

      row.querySelector(".edit").addEventListener("click", () => {
        openEditOfficial(official.officialId);
      });

      row.querySelector(".delete").addEventListener("click", () => {
        openDeleteOfficial(official.officialId);
      });

      body.appendChild(row);
    });

    applyOfficialFiltersAndSearch();
  },

  clearForm: () => {
    document.getElementById("official-first-name").value = "";
    document.getElementById("official-last-name").value = "";
    document.getElementById("official-role").value = "Referee";
    document.getElementById("official-active").checked = true;
  },

  populateForm: (official) => {
    document.getElementById("official-first-name").value = official.firstName || "";
    document.getElementById("official-last-name").value = official.lastName || "";
    document.getElementById("official-role").value = official.role || "Referee";
    document.getElementById("official-active").checked = !!official.isActive;
  },

  collectFormData: () => ({
    firstName: document.getElementById("official-first-name").value.trim(),
    lastName: document.getElementById("official-last-name").value.trim(),
    role: document.getElementById("official-role").value,
    isActive: document.getElementById("official-active").checked,
  }),
});

function applyOfficialFiltersAndSearch() {
  const tbody = document.getElementById("officialsTableBody");
  if (!tbody) return;

  const searchTerm = (
    document.getElementById("officials-search-bar")?.value || ""
  ).toLowerCase();

  const roleFilter = document.getElementById("filter-official-role")?.value || "";
  const statusFilter = document.getElementById("filter-official-status")?.value || "";

  Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
    const rowText = row.textContent.toLowerCase();
    const rowRole = row.dataset.role || "";
    const rowStatus = row.dataset.status || "";

    const matchesSearch = !searchTerm || rowText.includes(searchTerm);
    const matchesRole = !roleFilter || rowRole === roleFilter;
    const matchesStatus = !statusFilter || rowStatus === statusFilter;

    row.style.display = matchesSearch && matchesRole && matchesStatus ? "" : "none";
  });
}

function wireOfficialFilterEvents() {
  const search = document.getElementById("officials-search-bar");
  const role = document.getElementById("filter-official-role");
  const status = document.getElementById("filter-official-status");

  if (search) search.addEventListener("input", applyOfficialFiltersAndSearch);
  if (role) role.addEventListener("change", applyOfficialFiltersAndSearch);
  if (status) status.addEventListener("change", applyOfficialFiltersAndSearch);
}

async function openEditOfficial(id) {
  await AdminPage.openEdit(id);
}

function openDeleteOfficial(id) {
  AdminPage.openDelete(id);
}
