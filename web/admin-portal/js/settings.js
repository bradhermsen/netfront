console.log("settings.js loaded");

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
  const saveBtn = document.getElementById("settings-save");
  const testBtn = document.getElementById("settings-test-send");

  if (saveBtn) {
    saveBtn.onclick = async () => {
      await saveEmailSettings();
    };
  }

  if (testBtn) {
    testBtn.onclick = async () => {
      await sendTestEmail();
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

async function saveEmailSettings() {
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
    await EmailSettingsApi.saveSettings(payload);
    notifySettings("Email settings saved", "success");
    await loadEmailSettings();
  } catch (error) {
    console.error("Failed to save email settings", error);
    notifySettings("Failed to save email settings", "error");
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
