// =========================================================
// ADMIN PAGE ENGINE (GLOBAL, MODERNIZED VERSION)
// =========================================================

window.AdminPage = {
  config: {},

  // -------------------------------------------------------
  // INITIALIZER
  // -------------------------------------------------------
  init(config) {
    this.config = config;

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
  // EVENT BINDING (NOW SUPPORTS CUSTOM HANDLERS)
  // -------------------------------------------------------
  bindEvents() {
    const c = this.config;

    // ⭐ FIXED: Add button now supports custom handler
    if (this.btnAdd) {
      this.btnAdd.addEventListener("click", () => {
        if (c.addHandler) {
          c.addHandler();
        } else {
          this.openAdd();
        }
      });
    }

    if (this.btnSave) this.btnSave.addEventListener("click", () => this.save());

    if (this.btnCancel)
      this.btnCancel.addEventListener("click", () => this.closeModal());

    if (this.btnDeleteCancel) {
      this.btnDeleteCancel.addEventListener("click", () => {
        this.deleteId = null;
        this.deleteModal.classList.remove("active");
      });
    }

    if (this.btnDeleteConfirm) {
      this.btnDeleteConfirm.addEventListener("click", async () => {
        if (this.deleteId) {
          await c.api.delete(this.deleteId);
          this.deleteId = null;
          this.deleteModal.classList.remove("active");
          this.loadData();
        }
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => this.applySearch());
    }

    // ⭐ FIXED: Edit/Delete now support custom handlers
    if (c.editHandler) window[c.editHandlerName] = (id) => c.editHandler(id);
    else window[c.editHandlerName] = (id) => this.openEdit(id);

    if (c.deleteHandler)
      window[c.deleteHandlerName] = (id) => c.deleteHandler(id);
    else window[c.deleteHandlerName] = (id) => this.openDelete(id);
  },

  // -------------------------------------------------------
  // WAIT FOR MODAL (ASYNC SAFE)
  // -------------------------------------------------------
  waitForModal() {
    return new Promise((resolve) => {
      // If modal is already active, resolve immediately
      if (this.modal && this.modal.classList.contains("active")) {
        resolve();
        return;
      }

      // Otherwise wait one frame
      requestAnimationFrame(() => resolve());
    });
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

    if (this.searchInput) {
      this.searchInput.value = "";
    }

    this.config.renderTable(this.allItems);
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

    this.modal.classList.add("active");

    const panel = this.modal.querySelector(".nf-modal");
    if (panel) panel.classList.add("active");
  },

  async openEdit(id) {
    this.editingId = id;

    this.config.clearForm();
    this.modalTitle.textContent = this.config.editTitle;

    const item = await this.config.api.getById(id);
    this.config.populateForm(item);

    this.modal.classList.add("active");

    const panel = this.modal.querySelector(".nf-modal");
    if (panel) panel.classList.add("active");
  },

  openDelete(id) {
    this.deleteId = id;
    this.deleteModal.classList.add("active");
  },

  closeModal() {
    this.modal.classList.remove("active");

    const panel = this.modal.querySelector(".nf-modal");
    if (panel) panel.classList.remove("active");

    this.config.clearForm();
    this.editingId = null;
  },

  // -------------------------------------------------------
  // SAVE
  // -------------------------------------------------------
  async save() {
    // ✅ If a custom save handler is provided, use it and EXIT.
    // This is what Teams will use (saveTeam).
    if (this.config.saveHandler) {
      return await this.config.saveHandler();
    }

    // ✅ Everyone else keeps the old behavior.
    const payload = this.config.collectFormData();

    console.log("🔥 Payload being sent to API:", payload);

    if (this.editingId) {
      await this.config.api.update(this.editingId, payload);
    } else {
      await this.config.api.create(payload);
    }

    this.closeModal();
    this.loadData();
  },
};
