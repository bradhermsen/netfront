// =========================================================
// COMPONENT SANDBOX LOGIC
// Injects all UI components + wires up interactions
// =========================================================

document.addEventListener("nf-page-ready", () => {
  const container = document.getElementById("sandboxContent");
  if (!container) return;

  // Inject ALL sandbox UI
  container.innerHTML = `
    <!-- =========================================================
         BUTTONS
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Buttons</h2>

      <div class="flex gap-3">
        <button class="nf-btn nf-btn-primary">Primary Button</button>
        <button class="nf-btn nf-btn-secondary">Secondary Button</button>
        <button class="nf-btn nf-btn-danger">Danger Button</button>
      </div>

      <div class="flex gap-3 mt-3">
        <button class="nf-btn-icon view" title="View"><i class="fa-solid fa-users"></i></button>
        <button class="nf-btn-icon edit" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="nf-btn-icon delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>

    <!-- =========================================================
         INPUTS + FORMS
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Inputs & Form Elements</h2>

      <div class="flex flex-col gap-3" style="max-width: 400px">
        <div>
          <label class="nf-label">Text Input</label>
          <input type="text" class="nf-input" placeholder="Enter text..." />
        </div>

        <div>
          <label class="nf-label">Select Dropdown</label>
          <select class="nf-select">
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>

        <div>
          <label class="nf-label">Textarea</label>
          <textarea class="nf-textarea" rows="3"></textarea>
        </div>

        <div>
          <label class="nf-label">Date Picker</label>
          <input type="date" class="nf-input" />
        </div>
      </div>
    </div>

    <!-- =========================================================
         MODAL
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Modal</h2>

      <button id="openModalBtn" class="nf-btn nf-btn-primary">Open Modal</button>

      <div id="sandboxModalOverlay" class="modal-overlay hidden">
        <div class="nf-modal">
          <div class="nf-modal-header">Example Modal</div>

          <div class="flex flex-col gap-3">
            <div>
              <label class="nf-label">Field</label>
              <input type="text" class="nf-input" />
            </div>
          </div>

          <div class="nf-modal-actions">
            <button class="nf-btn nf-btn-secondary" id="closeModalBtn">Cancel</button>
            <button class="nf-btn nf-btn-primary">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- =========================================================
         TABS
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Tabs with Content Switching</h2>

      <div class="nf-tabs" id="demoTabs">
        <button class="tab active" data-tab="tab1">Overview</button>
        <button class="tab" data-tab="tab2">Settings</button>
        <button class="tab" data-tab="tab3">History</button>
      </div>

      <div class="tab-content mt-3">
        <div class="tab-pane active" id="tab1">Overview content goes here.</div>
        <div class="tab-pane" id="tab2">Settings content goes here.</div>
        <div class="tab-pane" id="tab3">History content goes here.</div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- FILTER BAR COMPONENT                                      -->
    <!-- ========================================================= -->
    <div class="nf-card">
      <div class="nf-filter-bar" id="org-filter-bar-component">

        <!-- Search -->
        <input
          id="org-search-bar"
          class="nf-search"
          type="text"
          placeholder="Search organizations…"
        />
        <!-- League Filter -->
        <select id="filter-league" class="nf-select">
          <option value="">League: All</option>
        </select>

        <!-- Conference Filter -->
        <select id="filter-conference" class="nf-select">
          <option value="">Conference: All</option>
        </select>

        <!-- Status Filter -->
        <select id="filter-status" class="nf-select">
          <option value="">Status: All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

      </div>
    </div>  

    <!-- =========================================================
         TOASTS
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Toast Notifications</h2>

      <button class="nf-btn nf-btn-primary" onclick="queueToast('Saved successfully!')">
        Show Toast
      </button>

      <div id="toastContainer"></div>
    </div>

    <!-- =========================================================
         STEPPER
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Stepper / Wizard</h2>

      <div class="nf-stepper" id="demoStepper">
        <div class="step active" data-step="1">1</div>
        <div class="step" data-step="2">2</div>
        <div class="step" data-step="3">3</div>
      </div>

      <div class="step-content mt-3">
        <div class="step-pane active" id="step1">Step 1 content</div>
        <div class="step-pane" id="step2">Step 2 content</div>
        <div class="step-pane" id="step3">Step 3 content</div>
      </div>

      <div class="flex gap-3 mt-3">
        <button class="nf-btn nf-btn-secondary" id="prevStep">Back</button>
        <button class="nf-btn nf-btn-primary" id="nextStep">Next</button>
      </div>
    </div>

    <!-- =========================================================
         COLLAPSIBLE PANELS
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Collapsible Panels</h2>

      <div class="collapse">
        <div class="collapse-header">Panel Title</div>
        <div class="collapse-body">
          <p>This is the collapsible content.</p>
        </div>
      </div>
    </div>

    <!-- =========================================================
         PAGINATION + FILTERING
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Table Pagination + Filtering</h2>

      <div class="flex gap-3 mb-3">
        <input type="text" id="filterInput" class="nf-input" placeholder="Filter rows..." />
      </div>

      <table class="nf-table" id="paginatedTable">
        <thead>
          <tr><th>Name</th><th>Role</th></tr>
        </thead>
        <tbody id="paginatedBody"></tbody>
      </table>

      <div class="pagination mt-3" id="paginationControls"></div>
    </div>

    <!-- =========================================================
         TOGGLE SWITCH
    ========================================================== -->
    <div class="nf-card">
      <h2 class="text-lg mb-3">Toggle Switch</h2>

      <label class="nf-toggle">
        <input type="checkbox" />
        <span class="slider"></span>
      </label>
    </div>
  `;

  // =========================================================
  // SANDBOX INTERACTIONS
  // =========================================================

  // Modal
  const overlay = document.getElementById("sandboxModalOverlay");
  document.getElementById("openModalBtn").onclick = () =>
    overlay.classList.remove("hidden");
  document.getElementById("closeModalBtn").onclick = () =>
    overlay.classList.add("hidden");

  // Tabs
  document.querySelectorAll("#demoTabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      document
        .querySelectorAll("#demoTabs .tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".tab-pane").forEach((pane) => {
        pane.classList.toggle("active", pane.id === target);
      });
    });
  });

  // Toasts
  window.toastQueue = [];
  window.toastActive = false;

  window.queueToast = function (message) {
    toastQueue.push(message);
    if (!toastActive) showNextToast();
  };

  function showNextToast() {
    if (toastQueue.length === 0) {
      toastActive = false;
      return;
    }

    toastActive = true;
    const message = toastQueue.shift();
    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
      showNextToast();
    }, 3000);
  }

  // Stepper
  let currentStep = 1;

  function updateStepper() {
    document.querySelectorAll(".step").forEach((step) => {
      step.classList.toggle(
        "active",
        Number(step.dataset.step) === currentStep,
      );
    });

    document.querySelectorAll(".step-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.id === "step" + currentStep);
    });
  }

  document.getElementById("nextStep").onclick = () => {
    if (currentStep < 3) currentStep++;
    updateStepper();
  };

  document.getElementById("prevStep").onclick = () => {
    if (currentStep > 1) currentStep--;
    updateStepper();
  };

  // Collapsible
  document.querySelectorAll(".collapse-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.parentElement.classList.toggle("open");
    });
  });

  // Pagination + filtering
  const tableData = [
    { name: "Alice", role: "Coach" },
    { name: "Bob", role: "Admin" },
    { name: "Charlie", role: "Player" },
    { name: "David", role: "Coach" },
    { name: "Evan", role: "Player" },
    { name: "Frank", role: "Admin" },
  ];

  let currentPage = 1;
  const rowsPerPage = 3;

  function renderTable() {
    const body = document.getElementById("paginatedBody");
    const controls = document.getElementById("paginationControls");
    const filter = document.getElementById("filterInput").value.toLowerCase();

    const filtered = tableData.filter(
      (row) =>
        row.name.toLowerCase().includes(filter) ||
        row.role.toLowerCase().includes(filter),
    );

    const start = (currentPage - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);

    body.innerHTML = pageRows
      .map((r) => `<tr><td>${r.name}</td><td>${r.role}</td></tr>`)
      .join("");

    const totalPages = Math.ceil(filtered.length / rowsPerPage);

    controls.innerHTML = Array.from(
      { length: totalPages },
      (_, i) => `
      <button class="nf-btn nf-btn-secondary pagination-btn ${i + 1 === currentPage ? "active" : ""}"
              data-page="${i + 1}">
        ${i + 1}
      </button>
    `,
    ).join("");

    document.querySelectorAll(".pagination-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        renderTable();
      });
    });
  }

  document.getElementById("filterInput").addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  });

  renderTable();
});
