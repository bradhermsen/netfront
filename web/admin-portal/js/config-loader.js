// Loads /config.json and exposes apiBase globally before other scripts run

window.configReady = (async function loadConfig() {
    try {
        const res = await fetch("/config.json");
        const config = await res.json();
        window.apiBase = config.apiBase;
        console.log("apiBase loaded:", window.apiBase);
    } catch (err) {
        console.error("Failed to load config.json", err);
    }
})();
