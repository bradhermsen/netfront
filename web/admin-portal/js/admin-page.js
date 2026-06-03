// =========================================================
// ADMIN PAGE ENGINE (GLOBAL, STABLE VERSION)
// =========================================================

window.AdminPage = {
  config: {},

  // -------------------------------------------------------
  // INITIALIZER
  // -------------------------------------------------------
  init(config) {
    this.config = config;

    // Wait for layout + page content to be injected
    document.addEventListener("nf-page-ready", () => {
      this.resolveDom();
      this.bindEvents();
      this.loadDropdowns();
      this.loadData();
    });
  },

  // -------------------------------------------------------
  // DOM RESOLUTION
  // -------------------------------------------------------
  resolveDom() {
    const c = this.config;

    this.tableBody = document.getElementById(c.tableBodyId);
    this.searchInput = document.getElementById(c.searchInputId);

    this.modal = document.getElementById(c.modalId);
    this.modalTitle = document.getElementById(c.modalTitleId);

    this.btnAdd = document.getElementById(c.addButtonId);
    this.btnSave = document.getElementById(c.saveButtonId);
    this.btnCancel = document.getElementById(c.cancelButtonId);

    this.deleteModal = document.getElementById(c.deleteModalId);
    this.btnDeleteConfirm = document.getElementById(c.deleteConfirmId);
    this.btnDeleteCancel = document.getElementById(c.deleteCancelId);

    this.editingId = null;
    this.deleteId = null;
    this.allItems = [];
  },

  // -------------------------------------------------------
  // EVENT BINDING
  // -------------------------------------------------------
  bindEvents() {
    const c = this.config;

    if (this.btnAdd)
      this.btnAdd.addEventListener("click", () => this.openAdd());
    if (this.btnSave) this.btnSave.addEventListener("click", () => this.save());
    if (this.btnCancel)
      this.btnCancel.addEventListener("click", () => this.closeModal());

    if (this.btnDeleteCancel) {
      this.btnDeleteCancel.addEventListener("click", () => {
        this.deleteId = null;
        this.deleteModal.classList.remove("show");
      });
    }

    if (this.btnDeleteConfirm) {
      this.btnDeleteConfirm.addEventListener("click", async () => {
        if (this.deleteId) {
          await c.api.delete(this.deleteId);
          this.deleteId = null;
          this.deleteModal.classList.remove("show");
          this.loadData();
        }
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => this.applySearch());
    }

    // Global edit/delete handlers
    window[c.editHandlerName] = (id) => this.openEdit(id);
    window[c.deleteHandlerName] = (id) => this.openDelete(id);
  },

  // -------------------------------------------------------
  // DATA LOADING
  // -------------------------------------------------------
  async loadDropdowns() {
    if (this.config.loadDropdowns) {
      await this.config.loadDropdowns();
    }
  },

  async loadData() {
    this.allItems = await this.config.api.getAll();
    this.applySearch();
  },

  // -------------------------------------------------------
  // SEARCH + RENDER
  // -------------------------------------------------------
  applySearch() {
    let filtered = [...this.allItems];

    if (this.searchInput) {
      const q = this.searchInput.value.toLowerCase();
      filtered = filtered.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(q),
      );
    }

    this.config.renderTable(filtered);
  },

  // -------------------------------------------------------
  // MODAL CONTROL
  // -------------------------------------------------------
  openAdd() {
    this.editingId = null;
    this.modalTitle.textContent = this.config.addTitle;
    this.config.clearForm();
    this.modal.classList.add("show");
  },

  async openEdit(id) {
    this.editingId = id;
    this.modalTitle.textContent = this.config.editTitle;

    const item = await this.config.api.getById(id);
    this.config.populateForm(item);

    this.modal.classList.add("show");
  },

  openDelete(id) {
    this.deleteId = id;
    this.deleteModal.classList.add("show");
  },

  closeModal() {
    this.modal.classList.remove("show");
    this.config.clearForm();
    this.editingId = null;
  },

  // -------------------------------------------------------
  // SAVE
  // -------------------------------------------------------
  async save() {
    const payload = this.config.collectFormData();

    if (this.editingId) {
      await this.config.api.update(this.editingId, payload);
    } else {
      await this.config.api.create(payload);
    }

    this.closeModal();
    this.loadData();
  },
};
