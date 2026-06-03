import { AdminPage } from "./admin-page.js";

AdminPage.init({
  tableBodyId: "levelsBody",
  searchInputId: "levels-search-bar",

  modalId: "levelModal",
  modalTitleId: "levelModalTitle",
  addButtonId: "btnAddLevel",
  saveButtonId: "btnSaveLevel",
  cancelButtonId: "btnCancelLevel",

  deleteModalId: "levelDeleteModal",
  deleteConfirmId: "btnConfirmLevelDelete",
  deleteCancelId: "btnCancelLevelDelete",

  editHandlerName: "openEditLevel",
  deleteHandlerName: "openDeleteLevel",

  addTitle: "Add Level",
  editTitle: "Edit Level",

  api: LevelApi,

  renderTable: (levels) => {
    const body = document.getElementById("levelsBody");
    body.innerHTML = "";

    levels.forEach((lvl) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${lvl.levelName}</td>
        <td>${lvl.sortOrder}</td>

        <td class="actions-col">
          <button onclick="openEditLevel('${lvl.levelId}')" class="action-btn edit-btn">Edit</button>
          <button onclick="openDeleteLevel('${lvl.levelId}')" class="action-btn delete-btn">Delete</button>
        </td>
      `;

      body.appendChild(row);
    });
  },

  clearForm: () => {
    document.getElementById("level-name").value = "";
    document.getElementById("level-sort").value = "";
  },

  populateForm: (lvl) => {
    document.getElementById("level-name").value = lvl.levelName;
    document.getElementById("level-sort").value = lvl.sortOrder;
  },

  collectFormData: () => ({
    levelName: document.getElementById("level-name").value,
    sortOrder: parseInt(document.getElementById("level-sort").value),
  }),
});

1;
