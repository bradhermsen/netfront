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
  const select = facilityById("facilityOrganization");
  select.innerHTML = facilityState.organizations.map((org) => `<option value="${facilityEscape(org.organizationId)}">${facilityEscape(org.name)}</option>`).join("");
  select.disabled = !context.isSuperAdmin;
  const requestedOrganizationId = new URLSearchParams(window.location.search).get("organizationId") || "";
  if (requestedOrganizationId && facilityState.organizations.some((org) => org.organizationId === requestedOrganizationId)) select.value = requestedOrganizationId;
  facilityState.organizationId = select.value;
  bindFacilityEvents();
  await loadFacilities();
}

async function loadFacilities() {
  if (!facilityState.organizationId) return;
  facilityById("facilityStatus").textContent = "Loading facilities...";
  try {
    facilityState.arenas = await FacilityApi.getForOrganization(facilityState.organizationId);
    renderFacilities();
    facilityById("facilityStatus").textContent = `${facilityState.arenas.length} arena${facilityState.arenas.length === 1 ? "" : "s"}`;
  } catch (error) {
    facilityById("facilityStatus").textContent = error.message;
  }
}

function renderFacilities() {
  const list = facilityById("facilityList");
  if (!facilityState.arenas.length) {
    list.innerHTML = '<div class="facility-empty">No managed or shared arenas are associated with this organization.</div>';
    return;
  }
  list.innerHTML = facilityState.arenas.map((arena) => {
    const canManage = arena.accessLevel === "Manage";
    const rinks = arena.rinks || [];
    return `<section class="facility-arena ${canManage ? "" : "facility-readonly"}" data-arena-id="${arena.arenaId}">
      <div class="facility-arena-header">
        <div><h2>${facilityEscape(arena.name)}</h2><div class="facility-meta">${facilityEscape(facilityAddress(arena) || "No address set")} · <span class="facility-access">${facilityEscape(arena.accessLevel)}</span>${arena.isPrimary ? " · Primary" : ""}${arena.isActive ? "" : " · Inactive"}</div></div>
        <div class="facility-actions">${canManage ? `<button class="nf-btn nf-btn-secondary" data-action="edit-arena">Edit Arena</button><button class="nf-btn nf-btn-primary" data-action="add-rink">Add Rink</button>` : ""}</div>
      </div>
      ${rinks.length ? `<table class="facility-rinks"><thead><tr><th>Rink</th><th>Scoreboard mode</th><th>Gateway address</th><th>Actions</th></tr></thead><tbody>${rinks.map((rink) => renderRink(rink, canManage)).join("")}</tbody></table>` : '<div class="facility-empty">No rinks configured. Games at this arena can still use an external rink name.</div>'}
    </section>`;
  }).join("");
}

function renderRink(rink, canManage) {
  const gateway = (rink.gateways || []).find((item) => item.isPrimary && item.isActive) || (rink.gateways || [])[0];
  return `<tr data-rink-id="${rink.rinkId}" data-gateway-id="${gateway?.gatewayId || ""}">
    <td><strong>${facilityEscape(rink.name)}</strong>${rink.isActive ? "" : '<div class="facility-meta">Inactive</div>'}</td>
    <td><span class="facility-mode ${gateway ? "gateway" : "manual"}">${gateway ? "NetFront Gateway" : "Manual scoreboard"}</span></td>
    <td>${gateway ? `${facilityEscape(gateway.host)}:${gateway.port}` : "Not configured"}</td>
    <td>${canManage ? `<button class="nf-btn nf-btn-secondary" data-action="edit-rink">Edit Rink</button> <button class="nf-btn nf-btn-primary" data-action="edit-gateway">${gateway ? "Configure Gateway" : "Add Gateway"}</button>` : "Read only"}</td>
  </tr>`;
}

function bindFacilityEvents() {
  facilityById("facilityOrganization").addEventListener("change", async (event) => { facilityState.organizationId = event.target.value; await loadFacilities(); });
  facilityById("btnAddArena").addEventListener("click", () => openArenaModal());
  facilityById("btnAssociateArena").addEventListener("click", openAssociateModal);
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
  facilityById("arenaPrimary").checked = arena?.isPrimary || false;
  facilityById("arenaActive").checked = arena?.isActive ?? true;
  facilityOpen("arenaModalOverlay");
}

async function saveArena() {
  const dto = { name: facilityById("arenaName").value.trim(), streetAddress: facilityById("arenaStreet").value.trim() || null, city: facilityById("arenaCity").value.trim() || null, state: facilityById("arenaState").value.trim() || null, postalCode: facilityById("arenaPostalCode").value.trim() || null, isPrimary: facilityById("arenaPrimary").checked, isActive: facilityById("arenaActive").checked };
  if (!dto.name) return alert("Arena name is required.");
  if (facilityState.arena) {
    await FacilityApi.updateArena(facilityState.arena.arenaId, dto);
    await FacilityApi.associateArena(facilityState.organizationId, facilityState.arena.arenaId, { accessLevel: facilityState.arena.accessLevel, isPrimary: dto.isPrimary });
  } else {
    await FacilityApi.createArena(facilityState.organizationId, dto);
  }
  facilityClose("arenaModalOverlay"); await loadFacilities();
}

async function openAssociateModal() {
  const catalog = await FacilityApi.getCatalog();
  const associated = new Set(facilityState.arenas.map((arena) => arena.arenaId));
  const available = catalog.filter((arena) => !associated.has(arena.arenaId));
  facilityById("associateArenaId").innerHTML = available.map((arena) => `<option value="${arena.arenaId}">${facilityEscape(arena.name)}${arena.city ? ` · ${facilityEscape(arena.city)}` : ""}</option>`).join("");
  if (!available.length) return alert("No unassociated active arenas are available.");
  facilityById("associateAccessLevel").value = "Use";
  facilityById("associateAccessLevel").disabled = !facilityState.isSuperAdmin;
  facilityOpen("associateArenaModalOverlay");
}

async function saveArenaAssociation() {
  await FacilityApi.associateArena(facilityState.organizationId, facilityById("associateArenaId").value, { accessLevel: facilityById("associateAccessLevel").value, isPrimary: facilityById("associatePrimary").checked });
  facilityClose("associateArenaModalOverlay"); await loadFacilities();
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