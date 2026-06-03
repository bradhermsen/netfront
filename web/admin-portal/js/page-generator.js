// =========================================================
// ADMIN PAGE GENERATOR
// Creates page content blocks automatically
// =========================================================

window.generateAdminPage = function ({
  key,
  title,
  subtitle,
  addButtonId,
  searchInputId,
  tableBodyId,
  tableHeaders,
}) {
  if (!window.PageContentRegistry) window.PageContentRegistry = {};

  window.PageContentRegistry[key] = () => `
    <div class="page-header-block">
      <div class="page-header-row">
        <div class="page-header-text">
          <h1 class="page-header">${title}</h1>
          <p class="page-subtext">${subtitle}</p>
        </div>
        <button id="${addButtonId}" class="btn-primary nf-btn">+Add</button>
      </div>
    </div>

    <div class="org-toolbar">
      <input 
        type="text" 
        id="${searchInputId}" 
        class="org-search-input"
        placeholder="🔍 Search..."
      />
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            ${tableHeaders.map((h) => `<th>${h}</th>`).join("")}
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody id="${tableBodyId}"></tbody>
      </table>
    </div>
  `;
};
