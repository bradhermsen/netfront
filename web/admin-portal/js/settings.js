console.log("settings.js loaded");

let mediaOutletsState = [];

(function checkPermission() {
  if (!Auth.hasRole(window.ROLES.SuperAdmin, window.ROLES.OrgAdmin)) {
    window.location.href = "./not-authorized.html";
  }
})();

function notifySettings(message, type = "info") {
  if (typeof window.showMessage === "function") {
    window.showMessage(message, type);
    return;
  }
  console.log(`[${type}] ${message}`);
}

async function initSettingsPage() {
  if (!document.getElementById("smtp-host")) return;

  wireSettingsEvents();
  await loadEmailSettings();
}

function wireSettingsEvents() {
  const saveEmailBtn = document.getElementById("settings-save-email");
  const saveMediaBtn = document.getElementById("settings-save-media");
  const testBtn = document.getElementById("settings-test-send");
  const addMediaBtn = document.getElementById("media-outlet-add");

  if (saveEmailBtn) {
    saveEmailBtn.onclick = async () => {
      await saveEmailServerSettings();
    };
  }

  if (saveMediaBtn) {
    saveMediaBtn.onclick = async () => {
      await saveMediaOutletsSettings();
    };
  }

  if (testBtn) {
    testBtn.onclick = async () => {
      await sendTestEmail();
    };
  }

  if (addMediaBtn) {
    addMediaBtn.onclick = () => {
      addMediaOutlet();
    };
  }
}

function getInputValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? "";
}

function setCheckboxValue(id, checked) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = Boolean(checked);
}

function getCheckboxValue(id) {
  return Boolean(document.getElementById(id)?.checked);
}

function setSectionSaveStatus(section, message = "", state = "idle") {
  const id =
    section === "email"
      ? "settings-email-save-status"
      : "settings-media-save-status";

  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = message;
  el.classList.remove("is-success", "is-error", "is-working");

  if (state === "success") el.classList.add("is-success");
  if (state === "error") el.classList.add("is-error");
  if (state === "working") el.classList.add("is-working");
}

function setMediaDebugBanner(message) {
  const el = document.getElementById("settings-media-debug");
  if (!el) return;

  const text = String(message || "").trim();
  el.textContent = text;
  el.classList.toggle("is-empty", !text);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

function normalizeMediaOutlets(outlets) {
  if (!Array.isArray(outlets)) return [];

  const seen = new Set();
  const normalized = [];

  for (const item of outlets) {
    const name = String(item?.name ?? item?.Name ?? "").trim();
    const email = String(item?.email ?? item?.Email ?? "").trim();
    if (!email || !isValidEmail(email)) continue;

    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      name: name || "Media Outlet",
      email,
    });
  }

  return normalized;
}

function renderMediaOutlets() {
  const container = document.getElementById("media-outlet-list");
  if (!container) return;

  if (!mediaOutletsState.length) {
    container.innerHTML =
      '<div class="settings-helper-text">No media outlet recipients configured.</div>';
    return;
  }

  const rows = mediaOutletsState
    .map(
      (item, index) => `
      <div class="settings-media-row">
        <div class="settings-media-meta">
          <div class="settings-media-line">
            <span class="settings-media-label">Name:</span>
            <span class="settings-media-name">${escapeHtml(item.name)}</span>
          </div>
          <div class="settings-media-line">
            <span class="settings-media-label">Email:</span>
            <span class="settings-media-email">${escapeHtml(item.email)}</span>
          </div>
        </div>
        <button class="nf-btn nf-btn-danger" data-remove-media-index="${index}" type="button">Remove</button>
      </div>
    `,
    )
    .join("");

  container.innerHTML = rows;

  container.querySelectorAll("[data-remove-media-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-remove-media-index") || "-1");
      if (index < 0 || index >= mediaOutletsState.length) return;
      mediaOutletsState.splice(index, 1);
      renderMediaOutlets();
    });
  });
}

function addMediaOutlet() {
  const nameInput = document.getElementById("media-outlet-name");
  const emailInput = document.getElementById("media-outlet-email");
  const name = String(nameInput?.value || "").trim();
  const email = String(emailInput?.value || "").trim();

  if (!email) {
    notifySettings("Media outlet email is required", "error");
    return;
  }

  if (!isValidEmail(email)) {
    notifySettings("Enter a valid media outlet email", "error");
    return;
  }

  const normalizedEmail = email.toLowerCase();
  const exists = mediaOutletsState.some(
    (item) => String(item.email || "").toLowerCase() === normalizedEmail,
  );

  if (exists) {
    notifySettings("That media outlet email is already listed", "error");
    return;
  }

  mediaOutletsState.push({
    name: name || "Media Outlet",
    email,
  });

  if (nameInput) nameInput.value = "";
  if (emailInput) emailInput.value = "";

  renderMediaOutlets();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadEmailSettings() {
  try {
    const settings = await EmailSettingsApi.getSettings();

    setInputValue("smtp-host", settings.smtpHost || "");
    setInputValue("smtp-port", String(settings.smtpPort || 1025));
    setInputValue("smtp-username", settings.username || "");
    setInputValue("smtp-password", "");
    setInputValue("smtp-from-address", settings.fromAddress || "");
    setInputValue("smtp-from-name", settings.fromName || "");

    setCheckboxValue("smtp-enabled", settings.enabled);
    setCheckboxValue("smtp-use-ssl", settings.useSsl);

    mediaOutletsState = normalizeMediaOutlets(
      settings.mediaOutlets ?? settings.MediaOutlets,
    );
    if (!mediaOutletsState.length) {
      try {
        mediaOutletsState = normalizeMediaOutlets(
          await EmailSettingsApi.getMediaOutlets(),
        );
      } catch (mediaError) {
        console.warn("Failed to load media outlets endpoint", mediaError);
      }
    }
    renderMediaOutlets();
    setMediaDebugBanner(
      `Loaded from /email/settings: ${JSON.stringify(mediaOutletsState, null, 2)}`,
    );

    const passwordStatus = document.getElementById("smtp-password-status");
    if (passwordStatus) {
      passwordStatus.textContent = settings.hasPassword
        ? "Password is saved"
        : "No password saved";
    }

  } catch (error) {
    console.error("Failed to load email settings", error);
    notifySettings("Failed to load email settings", "error");
  }
}

async function saveEmailServerSettings() {
  const smtpHost = getInputValue("smtp-host");
  const smtpPort = Number(getInputValue("smtp-port") || "0");
  const fromAddress = getInputValue("smtp-from-address");
  const fromName = getInputValue("smtp-from-name");

  if (!smtpHost) {
    notifySettings("SMTP host is required", "error");
    return;
  }

  if (!Number.isFinite(smtpPort) || smtpPort <= 0) {
    notifySettings("SMTP port must be a positive number", "error");
    return;
  }

  if (!fromAddress) {
    notifySettings("From address is required", "error");
    return;
  }

  const payload = {
    enabled: getCheckboxValue("smtp-enabled"),
    smtpHost,
    smtpPort,
    useSsl: getCheckboxValue("smtp-use-ssl"),
    username: getInputValue("smtp-username") || null,
    password: getInputValue("smtp-password") || null,
    fromAddress,
    fromName: fromName || "NetFront",
  };

  try {
    setSectionSaveStatus("email", "Saving email server settings...", "working");
    await EmailSettingsApi.saveSettings(payload);
    notifySettings("Email server settings saved", "success");
    setSectionSaveStatus("email", "Email server settings saved.", "success");

    try {
      await loadEmailSettings();
    } catch (reloadError) {
      console.warn("Reload after email save failed", reloadError);
    }
  } catch (error) {
    console.error("Failed to save email settings", error);
    notifySettings("Failed to save email server settings", "error");
    setSectionSaveStatus("email", "Failed to save email server settings.", "error");
  }
}

async function saveMediaOutletsSettings() {
  const outlets = mediaOutletsState.map((item) => ({
    name: item.name,
    email: item.email,
    Name: item.name,
    Email: item.email,
  }));

  const payload = {
    mediaOutlets: outlets,
    MediaOutlets: outlets,
  };

  try {
    setSectionSaveStatus("media", "Saving media recipients...", "working");
    const saved = await EmailSettingsApi.saveMediaOutlets(payload);
    mediaOutletsState = normalizeMediaOutlets(saved);
    renderMediaOutlets();
    notifySettings("Media outlet recipients saved", "success");
    setSectionSaveStatus("media", "Media outlet recipients saved.", "success");
    setMediaDebugBanner(
      `Save response from media endpoint:\n${JSON.stringify(saved, null, 2)}`,
    );

    try {
      await loadEmailSettings();
    } catch (reloadError) {
      console.warn("Reload after media save failed", reloadError);
    }
  } catch (error) {
    console.error("Failed to save media outlets", error);
    notifySettings("Failed to save media outlet recipients", "error");
    setSectionSaveStatus("media", "Failed to save media recipients.", "error");
  }
}

async function sendTestEmail() {
  const to = getInputValue("email-test-to");
  if (!to) {
    notifySettings("Enter a recipient email for test send", "error");
    return;
  }

  const subject = getInputValue("email-test-subject") || "NetFront Email Test";
  const body =
    getInputValue("email-test-body") ||
    "This is a test email from NetFront Admin Settings.";

  try {
    await EmailSettingsApi.sendTestEmail({ to, subject, body });
    notifySettings("Test email sent", "success");
  } catch (error) {
    console.error("Failed to send test email", error);
    notifySettings("Failed to send test email", "error");
  }
}

document.addEventListener("layoutLoaded", initSettingsPage);
if (window.__layoutAlreadyLoaded) initSettingsPage();
