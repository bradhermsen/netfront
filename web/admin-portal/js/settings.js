const modal = document.getElementById("settings-modal");
const modalTitle = document.getElementById("modal-title");
const formContainer = document.getElementById("settings-form");

let currentSection = null;

// Load settings
async function loadSettings() {
    const res = await fetch("http://localhost:7071/api/settings");
    const s = await res.json();

    document.getElementById("brand-name").textContent = s.brandName;
    document.getElementById("brand-logo").textContent = s.brandLogo;
    document.getElementById("brand-color").textContent = s.brandColor;

    document.getElementById("current-season").textContent = s.currentSeason;
    document.getElementById("default-season").textContent = s.defaultSeason;

    document.getElementById("toggle-live").textContent = s.enableLive ? "Enabled" : "Disabled";
    document.getElementById("toggle-tournament").textContent = s.enableTournament ? "Enabled" : "Disabled";

    document.getElementById("email-support").textContent = s.supportEmail;
    document.getElementById("email-reply").textContent = s.replyEmail;

    document.getElementById("maintenance-status").textContent = s.maintenanceMode ? "ON" : "OFF";
}

// Build modal form dynamically
function buildForm(section) {
    formContainer.innerHTML = "";
    currentSection = section;

    if (section === "branding") {
        modalTitle.textContent = "Edit Branding";

        formContainer.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Platform Name</label>
                    <input id="brand-name-input" class="form-field">
                </div>
                <div class="form-group">
                    <label class="form-label">Primary Color</label>
                    <input id="brand-color-input" class="form-field">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label class="form-label">Logo URL</label>
                    <input id="brand-logo-input" class="form-field">
                </div>
            </div>
        `;
    }

    if (section === "season") {
        modalTitle.textContent = "Edit Season Settings";

        formContainer.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Current Season</label>
                    <input id="current-season-input" class="form-field">
                </div>
                <div class="form-group">
                    <label class="form-label">Default Season</label>
                    <input id="default-season-input" class="form-field">
                </div>
            </div>
        `;
    }

    if (section === "features") {
        modalTitle.textContent = "Edit Feature Toggles";

        formContainer.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Enable Live Game View</label>
                    <select id="toggle-live-input" class="form-field">
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Enable Tournament Mode</label>
                    <select id="toggle-tournament-input" class="form-field">
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                    </select>
                </div>
            </div>
        `;
    }

    if (section === "email") {
        modalTitle.textContent = "Edit System Email";

        formContainer.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Support Email</label>
                    <input id="email-support-input" class="form-field">
                </div>

                <div class="form-group">
                    <label class="form-label">Reply-To Email</label>
                    <input id="email-reply-input" class="form-field">
                </div>
            </div>
        `;
    }

    if (section === "maintenance") {
        modalTitle.textContent = "Edit Maintenance Mode";

        formContainer.innerHTML = `
            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label class="form-label">Maintenance Mode</label>
                    <select id="maintenance-input" class="form-field">
                        <option value="true">ON</option>
                        <option value="false">OFF</option>
                    </select>
                </div>
            </div>
        `;
    }

    modal.classList.remove("hidden");
}

// Save settings
async function saveSettings() {
    const payload = {};

    if (currentSection === "branding") {
        payload.brandName = document.getElementById("brand-name-input").value;
        payload.brandColor = document.getElementById("brand-color-input").value;
        payload.brandLogo = document.getElementById("brand-logo-input").value;
    }

    if (currentSection === "season") {
        payload.currentSeason = document.getElementById("current-season-input").value;
        payload.defaultSeason = document.getElementById("default-season-input").value;
    }

    if (currentSection === "features") {
        payload