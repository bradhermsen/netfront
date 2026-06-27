// =========================================================
// ADMIN PAGE ENGINE (GLOBAL, MODERNIZED VERSION)
// =========================================================

window.AdminPage = {
  config: {},

  // -------------------------------------------------------
  // INITIALIZER — now supports BOTH event systems
  // -------------------------------------------------------
  init(config) {
    this.config = config;

    const startAdminPage = () => {
      this.resolveDom();
      this.bindEvents();
      this.loadDropdowns();
      this.loadData();
    };

    // Support legacy + new event systems
    document.addEventListener("nf-page-ready", startAdminPage);
    document.addEventListener("layoutLoaded", startAdminPage);
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
  // WAIT FOR MODAL TO BE READY (required by UsersPage)
  // -------------------------------------------------------
  waitForModal() {
    return new Promise((resolve) => {
      // Wait for next animation frame so DOM updates apply
      requestAnimationFrame(() => {
        resolve();
      });
    });
  },

  // -------------------------------------------------------
  // EVENT BINDING (supports custom handlers)
  // -------------------------------------------------------
  bindEvents() {
    const c = this.config;

    // ADD
    if (this.btnAdd) {
      this.btnAdd.onclick = () => {
        if (c.addHandler) c.addHandler();
        else this.openAdd();
      };
    }

    // SAVE
    if (this.btnSave) {
      this.btnSave.onclick = () => this.save();
    }

    // CANCEL
    if (this.btnCancel) {
      this.btnCancel.onclick = () => this.closeModal();
    }

    // DELETE CANCEL
    if (this.btnDeleteCancel) {
      this.btnDeleteCancel.onclick = () => {
        this.deleteId = null;
        this.deleteModal.classList.remove("active");
      };
    }

    // DELETE CONFIRM
    if (this.btnDeleteConfirm) {
      this.btnDeleteConfirm.onclick = async () => {
        if (this.deleteId) {
          await c.api.delete(this.deleteId);
          this.deleteId = null;
          this.deleteModal.classList.remove("active");
          this.loadData();
        }
      };
    }

    // SEARCH
    if (this.searchInput) {
      this.searchInput.oninput = () => this.applySearch();
    }

    // EDIT HANDLER
    if (c.editHandlerName) {
      window[c.editHandlerName] = (id) => {
        if (c.editHandler) c.editHandler(id);
        else this.openEdit(id);
      };
    }

    // DELETE HANDLER
    if (c.deleteHandlerName) {
      window[c.deleteHandlerName] = (id) => {
        if (c.deleteHandler) c.deleteHandler(id);
        else this.openDelete(id);
      };
    }
  },

  // -------------------------------------------------------
  // LOAD DROPDOWNS
  // -------------------------------------------------------
  async loadDropdowns() {
    if (this.config.loadDropdowns) {
      await this.config.loadDropdowns();
    }
  },

  // -------------------------------------------------------
  // LOAD DATA
  // -------------------------------------------------------
  async loadData() {
    this.allItems = await this.config.api.getAll();

    if (this.searchInput) {
      this.searchInput.value = "";
    }

    this.config.renderTable(this.allItems);
  },

  // -------------------------------------------------------
  // SEARCH
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
  // MODAL CONTROL — ADD
  // -------------------------------------------------------
  openAdd() {
    this.editingId = null;

    if (this.modalTitle) {
      this.modalTitle.textContent = this.config.addTitle;
    }

    this.config.clearForm();

    this.modal.classList.add("active");

    const panel = this.modal.querySelector(".nf-modal");
    if (panel) panel.classList.add("active");
  },

  // -------------------------------------------------------
  // MODAL CONTROL — EDIT
  // -------------------------------------------------------
  async openEdit(id) {
    this.editingId = id;

    this.config.clearForm();

    if (this.modalTitle) {
      this.modalTitle.textContent = this.config.editTitle;
    }

    const item = await this.config.api.getById(id);
    await this.config.populateForm(item);

    this.modal.classList.add("active");

    const panel = this.modal.querySelector(".nf-modal");
    if (panel) panel.classList.add("active");
  },

  // -------------------------------------------------------
  // OPEN DELETE
  // -------------------------------------------------------
  openDelete(id) {
    this.deleteId = id;
    this.deleteModal.classList.add("active");
  },

  // -------------------------------------------------------
  // CLOSE MODAL
  // -------------------------------------------------------
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
    // Custom save handler (Teams uses this)
    if (this.config.saveHandler) {
      return await this.config.saveHandler();
    }

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
