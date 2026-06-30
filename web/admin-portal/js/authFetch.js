// /admin-portal/js/authFetch.js
// Ultimate authenticated fetch wrapper for NetFront Admin Portal

// Centralized configuration
const CONFIG = {
  API_BASE: "/api", // Auto-prefix all API calls
  MAX_RETRIES: 2, // Retry count for transient failures
  RETRY_DELAY: 300, // Delay between retries (ms)
  REFRESH_ENDPOINT: "/auth/refresh", // Refresh token endpoint
};

// Utility: sleep for retry delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Refresh token flow
async function refreshToken() {
  const refresh = localStorage.getItem("nf_refresh");
  if (!refresh) return null;

  const res = await fetch(CONFIG.API_BASE + CONFIG.REFRESH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  localStorage.setItem("nf_token", data.token);
  return data.token;
}

// Main authenticated fetch wrapper
async function authFetch(url, options = {}) {
  if (!options) options = {};
  if (!options.headers) options.headers = {};

  // Read access token
  let token = localStorage.getItem("nf_token");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  // Auto-set JSON content type for write operations
  if (
    options.method &&
    ["POST", "PUT", "PATCH"].includes(options.method.toUpperCase()) &&
    !options.headers["Content-Type"]
  ) {
    options.headers["Content-Type"] = "application/json";
  }

  // Auto-prefix API base unless URL is absolute
  const fullUrl = url.startsWith("http") ? url : `${CONFIG.API_BASE}${url}`;

  let attempt = 0;

  while (attempt <= CONFIG.MAX_RETRIES) {
    try {
      let res = await fetch(fullUrl, options);

      // If token expired, attempt refresh
      if (res.status === 401) {
        const newToken = await refreshToken();
        if (!newToken) return res;

        options.headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(fullUrl, options);
      }

      // If still not OK and retries remain, retry
      if (!res.ok && attempt < CONFIG.MAX_RETRIES) {
        await delay(CONFIG.RETRY_DELAY);
        attempt++;
        continue;
      }

      return res;
    } catch (err) {
      if (attempt === CONFIG.MAX_RETRIES) throw err;
      await delay(CONFIG.RETRY_DELAY);
      attempt++;
    }
  }
}
