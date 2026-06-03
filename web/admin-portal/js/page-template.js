// =========================================================
// PAGE INITIALIZER
// =========================================================
document.addEventListener("nf-page-ready", () => {
  resolveDom();
  bindStaticEvents();
  loadDropdowns(); // optional
  loadData(); // required
});

// =========================================================
// DOM REFERENCES (override IDs per page)
// =========================================================
let tableBody;
let searchInput;

let modal;
let modalTitle;
let btnAdd;
let btnSave;
let btnCancel;

let deleteModal;
let btnDeleteConfirm;
let btnDeleteCancel;

let editingId = null;
let deleteId = null;
let allItems = [];

// =========================================================
// RESOLVE DOM ELEMENTS (override IDs per page)
// =========================================================
function resolveDom() {
  tableBody = document.getElementById("tableBody");
  searchInput = document.getElementById("search-bar");

  // Override these IDs per page
  modal = document.getElementById("PAGE_MODAL_ID");
  modalTitle = document.getElementById("PAGE_MODAL_TITLE_ID");
  btnAdd = document.getElementById("PAGE_ADD_BUTTON_ID");
  btnSave = document.getElementById("PAGE_SAVE_BUTTON_ID");
  btnCancel = document.getElementById("PAGE_CANCEL_BUTTON_ID");

  deleteModal = document.getElementById("PAGE_DELETE_MODAL_ID");
  btnDeleteConfirm = document.getElementById("PAGE_DELETE_CONFIRM_ID");
  btnDeleteCancel = document.getElementById("PAGE_DELETE_CANCEL_ID");
}

// =========================================================
// BIND STATIC EVENTS
// =========================================================
function bindStaticEvents() {
  if (btnAdd) btnAdd.addEventListener("click", openAddModal);
  if (btnSave) btnSave.addEventListener("click", saveItem);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  if (btnDeleteCancel) {
    btnDeleteCancel.addEventListener("click", () => {
      deleteId = null;
      deleteModal.classList.remove("show");
    });
  }

  if (btnDeleteConfirm) {
    btnDeleteConfirm.addEventListener("click", async () => {
      if (deleteId) {
        await Api.delete(deleteId);
        deleteId = null;
        deleteModal.classList.remove("show");
        loadData();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", applySearchAndSort);
  }
}

// =========================================================
// OPTIONAL DROPDOWNS (override per page)
// =========================================================
async function loadDropdowns() {}

// =========================================================
// LOAD DATA
// =========================================================
async function loadData() {
  allItems = await Api.getAll();
  applySearchAndSort();
}

// =========================================================
// SEARCH + SORT PIPELINE
// =========================================================
function applySearchAndSort() {
  let filtered = [...allItems];

  if (searchInput) {
    const q = searchInput.value.toLowerCase();
    filtered = filtered.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(q),
    );
  }

  renderTable(filtered);
}

// =========================================================
// RENDER TABLE (override per page)
// =========================================================
function renderTable(items) {
  tableBody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.someField ?? ""}</td>
      <td>${item.otherField ?? ""}</td>

      <td class="actions-col">
        <button class="action-btn edit-btn" onclick="openEditModal('${item.id}')">
          <i class="fa fa-pencil"></i> Edit
        </button>

        <button class="action-btn delete-btn" onclick="openDeleteModal('${item.id}')">
          <i class="fa fa-trash"></i> Delete
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// =========================================================
// OPEN ADD MODAL
// =========================================================
function openAddModal() {
  editingId = null;
  modalTitle.textContent = "Add Item";
  clearForm();
  showModal();
}

// =========================================================
// OPEN EDIT MODAL (GLOBAL)
// =========================================================
window.openEditModal = async function (id) {
  editingId = id;
  modalTitle.textContent = "Edit Item";

  const item = await Api.getById(id);
  populateForm(item);
  showModal();
};

// =========================================================
// SAVE ITEM
// =========================================================
async function saveItem() {
  const payload = collectFormData();

  if (editingId) {
    await Api.update(editingId, payload);
  } else {
    await Api.create(payload);
  }

  closeModal();
  loadData();
}

// =========================================================
// DELETE ITEM (GLOBAL)
// =========================================================
window.openDeleteModal = function (id) {
  deleteId = id;
  deleteModal.classList.add("show");
};

// =========================================================
// MODAL CONTROL
// =========================================================
function showModal() {
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
  clearForm();
  editingId = null;
}

// =========================================================
// FORM HELPERS (override per page)
// =========================================================
function clearForm() {}
function populateForm(item) {}
function collectFormData() {
  return {};
}
