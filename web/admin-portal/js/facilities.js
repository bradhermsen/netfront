const facilityState = { organizations: [], organizationId: "", arenas: [], arena: null, rink: null, gateway: null, isSuperAdmin: false };

const facilityEscape = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const facilityById = (id) => document.getElementById(id);
const facilityOpen = (id) => facilityById(id)?.classList.add("active");
const facilityClose = (id) => facilityById(id)?.classList.remove("active");
const facilityAddress = (arena) => [arena.streetAddress, arena.city, arena.state, arena.postalCode].filter(Boolean).join(", ");

async function initializeFacilities() {
  if (!Auth.canManageFacilities()) {
    window.location.href = "./not-authorized.html";
    return;
  }
  const context = await FacilityApi.getContext();
  facilityState.isSuperAdmin = Boolean(context.isSuperAdmin);
  facilityState.organizations = context.organizations || [];
  const requestedOrganizationId = new URLSearchParams(window.location.search).get("organizationId") || "";
  bindFacilityEvents();
  await loadFacilities(requestedOrganizationId);

  const requestedAction = new URLSearchParams(window.location.search).get("action");
  if (requestedAction === "addArena") openArenaModal();
  if (requestedAction === "addRink") {
    const requestedArenaId = new URLSearchParams(window.location.search).get("arenaId");
    facilityState.arena = facilityState.arenas.find((arena) => arena.arenaId === requestedArenaId && getFacilityManagementAssociation(arena)) || null;
    if (facilityState.arena) openRinkModal();
  }
}

async function loadFacilities(selectedOrganizationId = facilityState.organizationId) {
  facilityById("facilityStatus").textContent = "Loading facilities...";
  try {
    facilityState.arenas = (await FacilityApi.getCatalog()).map((arena) => ({
      ...arena,
      organizations: Array.isArray(arena.organizations) ? arena.organizations : [],
      rinks: Array.isArray(arena.rinks) ? arena.rinks : [],
    }));
    if (!facilityState.isSuperAdmin && facilityState.organizations[0]?.organizationId) {
      const managedArenas = await FacilityApi.getForOrganization(facilityState.organizations[0].organizationId);
      const managedById = new Map(managedArenas.map((arena) => [arena.arenaId, arena]));
      facilityState.arenas = facilityState.arenas.map((arena) => {
        const managedArena = managedById.get(arena.arenaId);
        return managedArena ? { ...arena, rinks: managedArena.rinks } : arena;
      });
    }
    const knownOrganizations = new Map(facilityState.organizations.map((org) => [org.organizationId, org.name]));
    facilityState.arenas.forEach((arena) => (arena.organizations || []).forEach((org) => knownOrganizations.set(org.organizationId, org.name)));
    const select = facilityById("facilityOrganization");
    select.innerHTML = `<option value="">All Organizations</option>${[...knownOrganizations.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => `<option value="${facilityEscape(id)}">${facilityEscape(name)}</option>`).join("")}<option value="external">External Team Venues</option>`;
    select.value = [...select.options].some((option) => option.value === selectedOrganizationId) ? selectedOrganizationId : "";
    facilityState.organizationId = select.value;
    renderFacilities();
  } catch (error) {
    facilityById("facilityStatus").textContent = error.message;
  }
}

function getFacilityManagementAssociation(arena) {
  const manageableIds = new Set(facilityState.organizations.map((org) => org.organizationId));
  const associations = arena.organizations || [];
  if (facilityState.isSuperAdmin) {
    return associations.find((org) => org.organizationId === facilityState.organizationId)
      || associations.find((org) => org.accessLevel === "Manage")
      || null;
  }
  return associations.find((org) => manageableIds.has(org.organizationId) && org.accessLevel === "Manage") || null;
}

function getFacilityActionOrganizationId() {
  if (!facilityState.organizationId || facilityState.organizationId === "external") return "";
  return facilityState.organizations.some((org) => org.organizationId === facilityState.organizationId)
    ? facilityState.organizationId
    : "";
}

function populateFacilityOrganizationSelect(selectId, selectedOrganizationId = "") {
  const select = facilityById(selectId);
  select.innerHTML = facilityState.organizations
    .map((org) => `<option value="${facilityEscape(org.organizationId)}">${facilityEscape(org.name)}</option>`)
    .join("");
  const fallbackId = getFacilityActionOrganizationId() || facilityState.organizations[0]?.organizationId || "";
  select.value = facilityState.organizations.some((org) => org.organizationId === selectedOrganizationId)
    ? selectedOrganizationId
    : fallbackId;
}

function renderFacilities() {
  const list = facilityById("facilityList");
  const nameFilter = facilityById("facilityNameFilter").value.trim().toLowerCase();
  const filteredArenas = facilityState.arenas.filter((arena) => {
    const associations = arena.organizations || [];
    const matchesOrganization = !facilityState.organizationId
      || (facilityState.organizationId === "external" ? associations.length === 0 : associations.some((org) => org.organizationId === facilityState.organizationId));
    return matchesOrganization && (!nameFilter || arena.name.toLowerCase().includes(nameFilter));
  });
  facilityById("facilityStatus").textContent = `${filteredArenas.length} of ${facilityState.arenas.length} arena${facilityState.arenas.length === 1 ? "" : "s"}`;
  facilityById("btnAddArena").disabled = facilityState.organizations.length === 0;
  facilityById("btnAssociateArena").disabled = facilityState.organizations.length === 0;

  if (!filteredArenas.length) {
    list.innerHTML = '<div class="facility-empty">No Arenas match the selected filters.</div>';
    return;
  }
  list.innerHTML = filteredArenas.map((arena) => {
    const managementAssociation = getFacilityManagementAssociation(arena);
    const canManage = facilityState.isSuperAdmin || Boolean(managementAssociation);
    const selectedAssociation = (arena.organizations || []).find((org) => org.organizationId === facilityState.organizationId);
    const rinks = arena.rinks || [];
    const associationMarkup = (arena.organizations || []).length
      ? arena.organizations.map((org) => `<span class="facility-association">${facilityEscape(org.name)} · ${facilityEscape(org.accessLevel)}${org.isPrimary ? " · Primary" : ""}</span>`).join("")
      : '<span class="facility-association external">External Team Venue</span>';
    const removeLabel = (arena.organizations || []).length === 1 ? "Mark as External Team Venue" : "Remove Association";
    return `<article class="facility-arena-card ${canManage ? "" : "facility-readonly"}" data-arena-id="${arena.arenaId}">
      <div class="facility-arena-header">
        <div><h2>${facilityEscape(arena.name)}</h2><div class="facility-meta">${facilityEscape(facilityAddress(arena) || "No address set")}</div></div>
      </div>
      <div class="facility-associations">${associationMarkup}</div>
      <div class="facility-rink-list">${rinks.length ? rinks.map((rink) => renderRink(rink, canManage)).join("") : '<div class="facility-empty">No Rinks configured</div>'}</div>
      <div class="facility-actions">${canManage ? `<button class="nf-btn nf-btn-secondary" data-action="edit-arena">Edit</button><button class="nf-btn nf-btn-primary" data-action="add-rink">Add Rink</button>` : ""}${selectedAssociation && getFacilityActionOrganizationId() ? `<button class="nf-btn nf-btn-secondary" data-action="remove-association">${removeLabel}</button>` : ""}</div>
    </article>`;
  }).join("");
}

function renderRink(rink, canManage) {
  const gateway = (rink.gateways || []).find((item) => item.isPrimary && item.isActive) || (rink.gateways || [])[0];
  const hasGateway = Boolean(gateway || rink.gatewayAvailable);
  return `<div class="facility-rink-row" data-rink-id="${rink.rinkId}" data-gateway-id="${gateway?.gatewayId || ""}">
    <div><strong>${facilityEscape(rink.name)}</strong><span class="facility-mode ${hasGateway ? "gateway" : "manual"}">${hasGateway ? "Gateway" : "Manual"}</span></div>
    ${canManage ? `<div class="facility-rink-actions"><button class="nf-btn nf-btn-secondary" data-action="edit-rink">Edit</button>${gateway || !hasGateway ? `<button class="nf-btn nf-btn-primary" data-action="edit-gateway">${gateway ? "Gateway" : "Add Gateway"}</button>` : ""}</div>` : ""}
  </div>`;
}

function bindFacilityEvents() {
  facilityById("facilityOrganization").addEventListener("change", (event) => { facilityState.organizationId = event.target.value; renderFacilities(); });
  facilityById("facilityNameFilter").addEventListener("input", renderFacilities);
  facilityById("btnAddArena").addEventListener("click", () => openArenaModal());
  facilityById("btnAssociateArena").addEventListener("click", openAssociateModal);
  facilityById("associateOrganizationId").addEventListener("change", populateAssociateArenaOptions);
  facilityById("saveArena").addEventListener("click", saveArena);
  facilityById("saveArenaAssociation").addEventListener("click", saveArenaAssociation);
  facilityById("saveRink").addEventListener("click", saveRink);
  facilityById("saveGateway").addEventListener("click", saveGateway);
  document.addEventListener("click", async (event) => {
    const close = event.target.closest("[data-close-modal]");
    if (close) facilityClose(close.dataset.closeModal);
    const action = event.target.closest("[data-action]");
    if (!action) return;
    const arenaElement = action.closest("[data-arena-id]");
    const rinkElement = action.closest("[data-rink-id]");
    facilityState.arena = facilityState.arenas.find((item) => item.arenaId === arenaElement?.dataset.arenaId) || null;
    facilityState.rink = facilityState.arena?.rinks.find((item) => item.rinkId === rinkElement?.dataset.rinkId) || null;
    facilityState.gateway = facilityState.rink?.gateways.find((item) => item.gatewayId === rinkElement?.dataset.gatewayId) || null;
    if (action.dataset.action === "edit-arena") openArenaModal(facilityState.arena);
    if (action.dataset.action === "add-rink") openRinkModal();
    if (action.dataset.action === "edit-rink") openRinkModal(facilityState.rink);
    if (action.dataset.action === "edit-gateway") openGatewayModal(facilityState.gateway);
    if (action.dataset.action === "remove-association") await removeArenaAssociation();
  });
}

function openArenaModal(arena = null) {
  facilityState.arena = arena;
  facilityById("arenaModalTitle").textContent = arena ? "Edit Arena" : "Add Arena";
  facilityById("arenaName").value = arena?.name || "";
  facilityById("arenaStreet").value = arena?.streetAddress || "";
  facilityById("arenaCity").value = arena?.city || "";
  facilityById("arenaState").value = arena?.state || "";
  facilityById("arenaPostalCode").value = arena?.postalCode || "";
  const managementAssociation = getFacilityManagementAssociation(arena || {});
  populateFacilityOrganizationSelect("arenaOrganization", managementAssociation?.organizationId);
  facilityById("arenaOrganization").disabled = Boolean(arena);
  facilityById("arenaPrimary").checked = managementAssociation?.isPrimary || false;
  facilityById("arenaActive").checked = arena?.isActive ?? true;
  facilityOpen("arenaModalOverlay");
}

async function saveArena() {
  const dto = { name: facilityById("arenaName").value.trim(), streetAddress: facilityById("arenaStreet").value.trim() || null, city: facilityById("arenaCity").value.trim() || null, state: facilityById("arenaState").value.trim() || null, postalCode: facilityById("arenaPostalCode").value.trim() || null, isPrimary: facilityById("arenaPrimary").checked, isActive: facilityById("arenaActive").checked };
  if (!dto.name) return alert("Arena name is required.");
  if (facilityState.arena) {
    await FacilityApi.updateArena(facilityState.arena.arenaId, dto);
    const association = getFacilityManagementAssociation(facilityState.arena);
    if (association) await FacilityApi.associateArena(association.organizationId, facilityState.arena.arenaId, { accessLevel: association.accessLevel, isPrimary: dto.isPrimary });
  } else {
    const organizationId = facilityById("arenaOrganization").value;
    if (!organizationId) return alert("Select an Organization before adding an Arena.");
    await FacilityApi.createArena(organizationId, dto);
  }
  facilityClose("arenaModalOverlay"); await loadFacilities();
}

async function openAssociateModal() {
  populateFacilityOrganizationSelect("associateOrganizationId");
  const available = populateAssociateArenaOptions();
  if (!available.length) return alert("No unassociated active arenas are available for this Organization.");
  facilityById("associateAccessLevel").value = "Use";
  facilityById("associateAccessLevel").disabled = !facilityState.isSuperAdmin;
  facilityOpen("associateArenaModalOverlay");
}

function populateAssociateArenaOptions() {
  const organizationId = facilityById("associateOrganizationId").value;
  const available = facilityState.arenas.filter((arena) => !(arena.organizations || []).some((org) => org.organizationId === organizationId));
  facilityById("associateArenaId").innerHTML = available
    .map((arena) => `<option value="${arena.arenaId}">${facilityEscape(arena.name)}${arena.city ? ` · ${facilityEscape(arena.city)}` : ""}</option>`)
    .join("");
  return available;
}

async function saveArenaAssociation() {
  await FacilityApi.associateArena(facilityById("associateOrganizationId").value, facilityById("associateArenaId").value, { accessLevel: facilityById("associateAccessLevel").value, isPrimary: facilityById("associatePrimary").checked });
  facilityClose("associateArenaModalOverlay"); await loadFacilities();
}

async function removeArenaAssociation() {
  const organizationId = getFacilityActionOrganizationId();
  if (!organizationId || !facilityState.arena) return;
  if (!window.confirm("Remove this Arena from the selected Organization? The Arena and its Rinks will remain available system-wide.")) return;
  await FacilityApi.removeArenaAssociation(organizationId, facilityState.arena.arenaId);
  await loadFacilities(organizationId);
}

function openRinkModal(rink = null) {
  facilityState.rink = rink;
  facilityById("rinkModalTitle").textContent = rink ? "Edit Rink" : "Add Rink";
  facilityById("rinkName").value = rink?.name || "";
  facilityById("rinkDisplayOrder").value = rink?.displayOrder ?? facilityState.arena?.rinks.length ?? 0;
  facilityById("rinkActive").checked = rink?.isActive ?? true;
  facilityOpen("rinkModalOverlay");
}

async function saveRink() {
  const dto = { name: facilityById("rinkName").value.trim(), displayOrder: Number(facilityById("rinkDisplayOrder").value) || 0, isActive: facilityById("rinkActive").checked };
  if (!dto.name) return alert("Rink name is required.");
  if (facilityState.rink) await FacilityApi.updateRink(facilityState.rink.rinkId, dto); else await FacilityApi.createRink(facilityState.arena.arenaId, dto);
  facilityClose("rinkModalOverlay"); await loadFacilities();
}

function openGatewayModal(gateway = null) {
  facilityState.gateway = gateway;
  facilityById("gatewayModalTitle").textContent = gateway ? "Configure Gateway" : "Add Gateway";
  facilityById("gatewayName").value = gateway?.name || "";
  facilityById("gatewayMac").value = gateway?.deviceMacAddress || "";
  facilityById("gatewayHost").value = gateway?.host || "";
  facilityById("gatewayPort").value = gateway?.port || 80;
  facilityById("gatewaySecret").value = "";
  facilityById("gatewaySecretHint").textContent = gateway?.hasSecret ? "Leave blank to keep the current secret." : "Required for a new gateway.";
  facilityById("gatewayPrimary").checked = gateway?.isPrimary ?? true;
  facilityById("gatewayActive").checked = gateway?.isActive ?? true;
  facilityOpen("gatewayModalOverlay");
}

async function saveGateway() {
  const dto = { name: facilityById("gatewayName").value.trim(), deviceMacAddress: facilityById("gatewayMac").value.trim(), host: facilityById("gatewayHost").value.trim(), port: Number(facilityById("gatewayPort").value), webSocketSecret: facilityById("gatewaySecret").value || null, isPrimary: facilityById("gatewayPrimary").checked, isActive: facilityById("gatewayActive").checked };
  if (!dto.name || !dto.deviceMacAddress || !dto.host || (!facilityState.gateway && !dto.webSocketSecret)) return alert("Name, MAC address, host, and authentication secret are required.");
  if (facilityState.gateway) await FacilityApi.updateGateway(facilityState.gateway.gatewayId, dto); else await FacilityApi.createGateway(facilityState.rink.rinkId, dto);
  facilityClose("gatewayModalOverlay"); await loadFacilities();
}

document.addEventListener("nf-page-ready", () => { initializeFacilities().catch((error) => { console.error(error); alert(error.message); }); }, { once: true });