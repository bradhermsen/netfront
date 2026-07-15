window.EmailSettingsApi = {
  async getSettings() {
    const res = await authFetch("/email/settings");
    if (!res || !res.ok) {
      const message = await readErrorMessage(
        res,
        `Failed to load email settings (${res?.status ?? "no response"}).`,
      );
      throw new Error(message);
    }
    return await res.json();
  },

  async saveSettings(payload) {
    const res = await authFetch("/email/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res || !res.ok) {
      const message = await readErrorMessage(
        res,
        `Failed to save settings (${res?.status ?? "no response"}).`,
      );
      throw new Error(message);
    }

    return await res.json();
  },

  async sendTestEmail(payload) {
    const res = await authFetch("/email/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res || !res.ok) {
      const message = await readErrorMessage(
        res,
        `Failed to send test email (${res?.status ?? "no response"}).`,
      );
      throw new Error(message);
    }

    return await res.json();
  },
};

async function readErrorMessage(res, fallback) {
  if (!res) return fallback;

  try {
    const payload = await res.clone().json();
    if (payload && typeof payload.error === "string" && payload.error.trim()) {
      return payload.error.trim();
    }
  } catch {
    // Ignore JSON parse errors and fall back to text.
  }

  try {
    const text = await res.text();
    if (text && text.trim()) return text.trim();
  } catch {
    // Ignore text read errors.
  }

  return fallback;
}
