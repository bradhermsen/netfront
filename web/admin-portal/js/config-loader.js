// Loads /config.json and exposes apiBase globally before other scripts run

window.configReady = (async function loadConfig() {
  try {
    const res = await fetch("/config.json");
    const config = await res.json();

    let resolvedApiBase = config.apiBase;
    const currentHost = window.location.hostname;

    // When the portal is opened over LAN IP, rewrite localhost API host to the same host.
    if (currentHost && currentHost !== "localhost" && currentHost !== "127.0.0.1") {
      try {
        const parsedApiBase = new URL(config.apiBase);
        if (parsedApiBase.hostname === "localhost" || parsedApiBase.hostname === "127.0.0.1") {
          parsedApiBase.hostname = currentHost;
          resolvedApiBase = parsedApiBase.toString().replace(/\/$/, "");
        }
      } catch {
        // Keep original apiBase if parsing fails.
      }
    }

    window.apiBase = resolvedApiBase;
} catch (err) {
    console.error("Failed to load config.json", err);
  }
})();
