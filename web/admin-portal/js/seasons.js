const seasonsState = {
  items: [],
  editingId: null,
  setupSeasonId: null,
  organizations: [],
  importTargetSeasonId: null,
  importSourceSeasonId: null,
  importCandidates: [],
  selectedTeamIds: new Set(),
  organizationImportTargetSeasonId: null,
  organizationImportSourceSeasonId: null,
  organizationImportCandidates: [],
  organizationImportTargetOrganizations: [],
  selectedOrganizationIds: new Set(),
};

function escapeSeasonHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]);
}

function toDateInputValue(value) {
  return String(value || "").slice(0, 10);
}

function formatSeasonDate(value) {
  const parts = toDateInputValue(value).split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return "Not set";
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function notifySeason(message, type = "info") {
  if (typeof window.showMessage === "function") {
    window.showMessage(message, type);
    return;
  }
  console[type === "error" ? "error" : "log"](message);
}

function renderSeasons() {
  const container = document.getElementById("seasonsList");
  if (!container) return;

  const search = (document.getElementById("seasons-search")?.value || "").trim().toLowerCase();
  const items = seasonsState.items
    .filter((season) => !search || JSON.stringify(season).toLowerCase().includes(search))
    .sort((left, right) => String(right.startDate).localeCompare(String(left.startDate)));

  if (!items.length) {
    container.innerHTML = '<div class="nf-empty-state">No seasons match your search.</div>';
    return;
  }

  container.innerHTML = items.map((season) => `
    <article class="nf-item-card season-item-card ${season.isActive ? "season-item-active" : ""}">
      <div class="nf-item-card-top">
        <h4>${escapeSeasonHtml(season.seasonName || "Unnamed Season")}</h4>
        <span class="status-badge ${season.isActive ? "active" : "inactive"}">${season.isActive ? "Active" : "Inactive"}</span>
      </div>
      <div class="nf-item-card-meta">
        <span><i class="fa fa-calendar-day"></i> ${formatSeasonDate(season.startDate)}</span>
        <span><i class="fa fa-calendar-check"></i> ${formatSeasonDate(season.endDate)}</span>
      </div>
      <div class="nf-item-card-actions">
        <button class="nf-btn nf-btn-secondary season-setup-btn" data-id="${season.seasonId}" type="button">Manage Participation</button>
        ${season.isActive ? `<button class="nf-btn nf-btn-secondary season-org-import-btn" data-id="${season.seasonId}" type="button">Import Organizations</button>` : ""}
        ${season.isActive ? `<button class="nf-btn nf-btn-primary season-import-btn" data-id="${season.seasonId}" type="button">Import Teams</button>` : ""}
        <button class="nf-btn-icon edit season-edit-btn" data-id="${season.seasonId}" title="Edit season"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="nf-btn-icon delete season-delete-btn" data-id="${season.seasonId}" title="Delete season"><i class="fa-solid fa-trash"></i></button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll(".season-edit-btn").forEach((button) => {
    button.onclick = () => openSeasonModal(button.dataset.id);
  });
  container.querySelectorAll(".season-setup-btn").forEach((button) => {
    button.onclick = () => openSeasonOrganizations(button.dataset.id);
  });
  container.querySelectorAll(".season-import-btn").forEach((button) => {
    button.onclick = () => openTeamImport(button.dataset.id);
  });
  container.querySelectorAll(".season-org-import-btn").forEach((button) => {
    button.onclick = () => openOrganizationImport(button.dataset.id);
  });
  container.querySelectorAll(".season-delete-btn").forEach((button) => {
    button.onclick = () => deleteSeason(button.dataset.id);
  });
}

async function loadSeasons() {
  try {
    seasonsState.items = await SeasonsApi.getAll();
    renderSeasons();
  } catch (error) {
    notifySeason(error.message || "Failed to load seasons", "error");
  }
}

function openSeasonModal(id = null) {
  const season = id ? seasonsState.items.find((item) => item.seasonId === id) : null;
  seasonsState.editingId = season?.seasonId || null;

  document.getElementById("seasonModalTitle").textContent = season ? "Edit Season" : "Add Season";
  document.getElementById("season-name").value = season?.seasonName || "";
  document.getElementById("season-start-date").value = toDateInputValue(season?.startDate);
  document.getElementById("season-end-date").value = toDateInputValue(season?.endDate);
  document.getElementById("season-active").checked = !!season?.isActive;
  document.getElementById("season-activation-warning").classList.toggle("hidden", !season?.isActive);

  const overlay = document.getElementById("seasonModalOverlay");
  overlay.classList.remove("hidden");
  overlay.classList.add("active");
  document.getElementById("season-name").focus();
}

function closeSeasonModal() {
  seasonsState.editingId = null;
  const overlay = document.getElementById("seasonModalOverlay");
  overlay.classList.remove("active");
  overlay.classList.add("hidden");
}

async function saveSeason() {
  const seasonName = document.getElementById("season-name").value.trim();
  const startDate = document.getElementById("season-start-date").value;
  const endDate = document.getElementById("season-end-date").value;
  const isActive = document.getElementById("season-active").checked;

  if (!seasonName || !startDate || !endDate) {
    notifySeason("Season name, start date, and end date are required", "error");
    return;
  }
  if (startDate >= endDate) {
    notifySeason("Season end date must be after the start date", "error");
    return;
  }

  const currentActive = seasonsState.items.find((season) => season.isActive);
  if (isActive && currentActive && currentActive.seasonId !== seasonsState.editingId) {
    const confirmed = window.confirm(
      `Activate ${seasonName}? ${currentActive.seasonName} will be deactivated.`,
    );
    if (!confirmed) return;
  }

  const saveButton = document.getElementById("seasonSave");
  const wasEditing = !!seasonsState.editingId;
  saveButton.disabled = true;
  try {
    const payload = {
      seasonName,
      startDate: `${startDate}T00:00:00`,
      endDate: `${endDate}T23:59:59`,
      isActive,
    };

    if (seasonsState.editingId) {
      await SeasonsApi.update(seasonsState.editingId, payload);
    } else {
      await SeasonsApi.create(payload);
    }

    closeSeasonModal();
    await loadSeasons();
    notifySeason(`Season ${wasEditing ? "updated" : "created"}`, "success");
  } catch (error) {
    notifySeason(error.message || "Failed to save season", "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function deleteSeason(id) {
  const season = seasonsState.items.find((item) => item.seasonId === id);
  if (!season) return;
  if (season.isActive) {
    notifySeason("Deactivate the season before deleting it", "error");
    return;
  }
  if (!window.confirm(`Delete ${season.seasonName}? This cannot be undone.`)) return;

  try {
    await SeasonsApi.delete(id);
    await loadSeasons();
    notifySeason("Season deleted", "success");
  } catch (error) {
    notifySeason(error.message || "Season cannot be deleted while it is in use", "error");
  }
}

function renderSeasonOrganizations() {
  const container = document.getElementById("seasonOrganizationsList");
  const search = (document.getElementById("season-organizations-search")?.value || "").trim().toLowerCase();
  seasonsState.organizations.forEach((organization) => {
    const isExternalDirectory = ["external", "external team"].includes(
      String(organization.organizationName || "").trim().toLowerCase(),
    );
    if (isExternalDirectory) organization.participationType = "External";
  });
  const organizations = seasonsState.organizations.filter((organization) =>
    !search || JSON.stringify(organization).toLowerCase().includes(search),
  );

  document.getElementById("seasonOrganizationsCount").textContent =
    `${seasonsState.organizations.filter((item) => item.participationType === "Managed").length} managed · ` +
    `${seasonsState.organizations.filter((item) => item.participationType === "External").length} external · ` +
    `${seasonsState.organizations.filter((item) => item.participationType === "NotParticipating").length} not participating`;

  container.innerHTML = organizations.length
    ? organizations.map((organization) => {
      const isExternalDirectory = ["external", "external team"].includes(
        String(organization.organizationName || "").trim().toLowerCase(),
      );
      return `
      <div class="season-organization-row">
        <div class="season-organization-meta">
          <strong>${escapeSeasonHtml(organization.organizationName)}</strong>
          <span>${escapeSeasonHtml(organization.abbreviation || "No abbreviation")} · ${organization.teamCount || 0} destination-season teams${organization.directoryIsActive ? "" : " · Directory inactive"}</span>
        </div>
        <select class="nf-select season-organization-participation" data-id="${organization.organizationId}" ${isExternalDirectory ? "disabled" : ""}>
          <option value="Managed" ${organization.participationType === "Managed" ? "selected" : ""}>Managed</option>
          <option value="External" ${organization.participationType === "External" ? "selected" : ""}>External</option>
          <option value="NotParticipating" ${organization.participationType === "NotParticipating" ? "selected" : ""}>Not Participating</option>
        </select>
      </div>
    `;
    }).join("")
    : '<div class="nf-empty-state">No organizations match your search.</div>';

  container.querySelectorAll(".season-organization-participation").forEach((select) => {
    select.onchange = () => {
      const organization = seasonsState.organizations.find((item) => item.organizationId === select.dataset.id);
      if (organization) organization.participationType = select.value;
      renderSeasonOrganizations();
    };
  });
}

async function openSeasonOrganizations(seasonId) {
  const season = seasonsState.items.find((item) => item.seasonId === seasonId);
  if (!season) return;

  seasonsState.setupSeasonId = seasonId;
  document.getElementById("seasonOrganizationsTitle").textContent = `${season.seasonName} Organization Setup`;
  document.getElementById("season-organizations-search").value = "";
  document.getElementById("seasonOrganizationsList").innerHTML = '<div class="nf-empty-state">Loading organizations...</div>';

  const overlay = document.getElementById("seasonOrganizationsOverlay");
  overlay.classList.remove("hidden");
  overlay.classList.add("active");

  try {
    seasonsState.organizations = await SeasonsApi.getOrganizations(seasonId);
    renderSeasonOrganizations();
  } catch (error) {
    notifySeason(error.message || "Failed to load season organizations", "error");
    closeSeasonOrganizations();
  }
}

function closeSeasonOrganizations() {
  seasonsState.setupSeasonId = null;
  seasonsState.organizations = [];
  const overlay = document.getElementById("seasonOrganizationsOverlay");
  overlay.classList.remove("active");
  overlay.classList.add("hidden");
}

function setAllSeasonOrganizations(participationType) {
  seasonsState.organizations.forEach((organization) => {
    const isExternalDirectory = ["external", "external team"].includes(
      String(organization.organizationName || "").trim().toLowerCase(),
    );
    organization.participationType = isExternalDirectory ? "External" : participationType;
  });
  renderSeasonOrganizations();
}

async function saveSeasonOrganizations() {
  if (!seasonsState.setupSeasonId) return;
  const saveButton = document.getElementById("seasonOrganizationsSave");
  saveButton.disabled = true;
  try {
    await SeasonsApi.saveOrganizations(
      seasonsState.setupSeasonId,
      seasonsState.organizations.map((organization) => ({
        organizationId: organization.organizationId,
        participationType: organization.participationType,
      })),
    );
    closeSeasonOrganizations();
    notifySeason("Season organization setup saved", "success");
  } catch (error) {
    notifySeason(error.message || "Failed to save season organizations", "error");
  } finally {
    saveButton.disabled = false;
  }
}

function getFilteredTeamImportCandidates() {
  const search = (document.getElementById("season-team-import-search")?.value || "").trim().toLowerCase();
  const level = document.getElementById("season-team-import-level")?.value || "";
  const type = document.getElementById("season-team-import-type")?.value || "";

  return seasonsState.importCandidates.filter((team) => {
    const matchesSearch = !search || [team.teamName, team.organizationName, team.levelName, team.teamType]
      .join(" ")
      .toLowerCase()
      .includes(search);
    const matchesLevel = !level || team.levelName === level;
    const matchesType = !type || team.teamType === type;
    return matchesSearch && matchesLevel && matchesType;
  });
}

function populateTeamImportFilters() {
  const levelSelect = document.getElementById("season-team-import-level");
  const typeSelect = document.getElementById("season-team-import-type");
  const selectedLevel = levelSelect.value;
  const selectedType = typeSelect.value;
  const levels = [...new Set(seasonsState.importCandidates.map((team) => team.levelName).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  const types = [...new Set(seasonsState.importCandidates.map((team) => team.teamType).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));

  levelSelect.innerHTML = '<option value="">Level: All</option>' +
    levels.map((level) => `<option value="${escapeSeasonHtml(level)}">${escapeSeasonHtml(level)}</option>`).join("");
  typeSelect.innerHTML = '<option value="">Type: All</option>' +
    types.map((type) => `<option value="${escapeSeasonHtml(type)}">${escapeSeasonHtml(type)}</option>`).join("");
  if (levels.includes(selectedLevel)) levelSelect.value = selectedLevel;
  if (types.includes(selectedType)) typeSelect.value = selectedType;
}

function renderTeamImportCandidates() {
  const container = document.getElementById("seasonTeamImportList");
  const candidates = getFilteredTeamImportCandidates();
  const eligibleCount = seasonsState.importCandidates.filter((team) => team.isEligible).length;
  document.getElementById("seasonTeamImportCount").textContent =
    `${seasonsState.selectedTeamIds.size} selected · ${eligibleCount} eligible · ${seasonsState.importCandidates.length} total`;

  container.innerHTML = candidates.length
    ? candidates.map((team) => {
      const disabled = !team.isEligible;
      const checked = seasonsState.selectedTeamIds.has(team.sourceTeamId);
      return `
        <label class="season-team-import-row ${disabled ? "season-team-import-disabled" : ""}">
          <input
            class="season-team-import-checkbox"
            type="checkbox"
            value="${team.sourceTeamId}"
            ${checked ? "checked" : ""}
            ${disabled ? "disabled" : ""}
          />
          <span class="season-team-import-name">${escapeSeasonHtml(team.teamName)}</span>
          <span>${escapeSeasonHtml(team.levelName || "No level")}</span>
          <span>${escapeSeasonHtml(team.teamType || "No type")}</span>
          <span>${escapeSeasonHtml(team.organizationName || "External Team")}</span>
          <small>${disabled ? escapeSeasonHtml(team.ineligibleReason || "Unavailable") : "Ready to import"}</small>
        </label>
      `;
    }).join("")
    : '<div class="nf-empty-state">No teams match the current filters.</div>';

  container.querySelectorAll(".season-team-import-checkbox").forEach((checkbox) => {
    checkbox.onchange = () => {
      if (checkbox.checked) seasonsState.selectedTeamIds.add(checkbox.value);
      else seasonsState.selectedTeamIds.delete(checkbox.value);
      renderTeamImportCandidates();
    };
  });
}

async function loadTeamImportCandidates() {
  const sourceSeasonId = document.getElementById("season-team-import-source").value;
  seasonsState.importSourceSeasonId = sourceSeasonId || null;
  seasonsState.importCandidates = [];
  seasonsState.selectedTeamIds.clear();
  document.getElementById("seasonTeamImportList").innerHTML = '<div class="nf-empty-state">Loading teams...</div>';
  if (!seasonsState.importTargetSeasonId || !sourceSeasonId) {
    renderTeamImportCandidates();
    return;
  }

  try {
    seasonsState.importCandidates = await SeasonsApi.getTeamImportCandidates(
      seasonsState.importTargetSeasonId,
      sourceSeasonId,
    );
    populateTeamImportFilters();
    renderTeamImportCandidates();
  } catch (error) {
    notifySeason(error.message || "Failed to load import teams", "error");
    seasonsState.importCandidates = [];
    renderTeamImportCandidates();
  }
}

async function openTeamImport(targetSeasonId) {
  const targetSeason = seasonsState.items.find((season) => season.seasonId === targetSeasonId);
  if (!targetSeason?.isActive) {
    notifySeason("Teams can only be imported into the active season", "error");
    return;
  }

  const sourceSeasons = seasonsState.items
    .filter((season) => season.seasonId !== targetSeasonId)
    .sort((left, right) => String(right.startDate).localeCompare(String(left.startDate)));
  if (!sourceSeasons.length) {
    notifySeason("No prior season is available to import from", "error");
    return;
  }

  seasonsState.importTargetSeasonId = targetSeasonId;
  seasonsState.importSourceSeasonId = sourceSeasons[0].seasonId;
  seasonsState.importCandidates = [];
  seasonsState.selectedTeamIds.clear();

  document.getElementById("seasonTeamImportTitle").textContent = `Import Teams into ${targetSeason.seasonName}`;
  document.getElementById("season-team-import-source").innerHTML = sourceSeasons
    .map((season) => `<option value="${season.seasonId}">${escapeSeasonHtml(season.seasonName)}</option>`)
    .join("");
  document.getElementById("season-team-import-search").value = "";
  document.getElementById("season-team-import-level").innerHTML = '<option value="">Level: All</option>';
  document.getElementById("season-team-import-type").innerHTML = '<option value="">Type: All</option>';

  const overlay = document.getElementById("seasonTeamImportOverlay");
  overlay.classList.remove("hidden");
  overlay.classList.add("active");
  await loadTeamImportCandidates();
}

function closeTeamImport() {
  seasonsState.importTargetSeasonId = null;
  seasonsState.importSourceSeasonId = null;
  seasonsState.importCandidates = [];
  seasonsState.selectedTeamIds.clear();
  const overlay = document.getElementById("seasonTeamImportOverlay");
  overlay.classList.remove("active");
  overlay.classList.add("hidden");
}

function selectVisibleImportTeams(selected) {
  getFilteredTeamImportCandidates()
    .filter((team) => team.isEligible)
    .forEach((team) => {
      if (selected) seasonsState.selectedTeamIds.add(team.sourceTeamId);
      else seasonsState.selectedTeamIds.delete(team.sourceTeamId);
    });
  renderTeamImportCandidates();
}

async function importSelectedTeams() {
  if (!seasonsState.importTargetSeasonId || !seasonsState.importSourceSeasonId) return;
  if (!seasonsState.selectedTeamIds.size) {
    notifySeason("Select at least one eligible team", "error");
    return;
  }

  const importButton = document.getElementById("seasonTeamImportSave");
  importButton.disabled = true;
  try {
    const result = await SeasonsApi.importTeams(
      seasonsState.importTargetSeasonId,
      seasonsState.importSourceSeasonId,
      [...seasonsState.selectedTeamIds],
    );
    closeTeamImport();
    await loadSeasons();
    if (window.SeasonContext) window.SeasonContext.clear();
    notifySeason(`${result.importedCount} team${result.importedCount === 1 ? "" : "s"} imported`, "success");
  } catch (error) {
    notifySeason(error.message || "Failed to import teams", "error");
  } finally {
    importButton.disabled = false;
  }
}

function initializeSeasonsPage() {
  if (!document.getElementById("seasonsList") || window.seasonsPageInitialized) return;
  window.seasonsPageInitialized = true;

  document.getElementById("btnAddSeason").onclick = () => openSeasonModal();
  document.getElementById("seasonCancel").onclick = closeSeasonModal;
  document.getElementById("seasonSave").onclick = saveSeason;
  document.getElementById("season-active").onchange = (event) => {
    document.getElementById("season-activation-warning").classList.toggle("hidden", !event.target.checked);
  };
  document.getElementById("seasons-search").oninput = renderSeasons;
  document.querySelector("#seasonModalOverlay .modal-close").onclick = closeSeasonModal;
  document.getElementById("seasonOrganizationsCancel").onclick = closeSeasonOrganizations;
  document.getElementById("seasonOrganizationsSave").onclick = saveSeasonOrganizations;
  document.getElementById("season-organizations-search").oninput = renderSeasonOrganizations;
  document.getElementById("seasonOrganizationsAllManaged").onclick = () => setAllSeasonOrganizations("Managed");
  document.getElementById("seasonOrganizationsAllNone").onclick = () => setAllSeasonOrganizations("NotParticipating");
  document.querySelector("#seasonOrganizationsOverlay .modal-close").onclick = closeSeasonOrganizations;
  document.getElementById("seasonTeamImportCancel").onclick = closeTeamImport;
  document.getElementById("seasonTeamImportSave").onclick = importSelectedTeams;
  document.getElementById("season-team-import-source").onchange = loadTeamImportCandidates;
  document.getElementById("season-team-import-search").oninput = renderTeamImportCandidates;
  document.getElementById("season-team-import-level").onchange = renderTeamImportCandidates;
  document.getElementById("season-team-import-type").onchange = renderTeamImportCandidates;
  document.getElementById("seasonTeamImportSelectVisible").onclick = () => selectVisibleImportTeams(true);
  document.getElementById("seasonTeamImportClearVisible").onclick = () => selectVisibleImportTeams(false);
  document.querySelector("#seasonTeamImportOverlay .modal-close").onclick = closeTeamImport;

  void loadSeasons();
}

document.addEventListener("layoutLoaded", initializeSeasonsPage);
if (window.__layoutAlreadyLoaded) initializeSeasonsPage();
