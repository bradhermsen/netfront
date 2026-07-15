// auth.js

// =====================================================
// ROLE CONSTANTS
// =====================================================
window.ROLES = {
  SuperAdmin: "SuperAdmin",
  OrgAdmin: "OrgAdmin",
  TeamManager: "TeamManager",
  Coach: "Coach",
  Viewer: "Viewer",
};

// Global notification fallback so pages can safely call showMessage.
if (typeof window.showMessage !== "function") {
  window.showMessage = function (message, type = "info") {
    const level = type === "error" ? "error" : "log";
    console[level](`[${type}] ${message}`);
  };
}

// Helper for authenticated API calls with error handling
window.authFetch = async function (url, options = {}) {
  if (window.configReady) {
    await window.configReady;
  }

  const fullUrl = `${window.apiBase || ""}${url}`;

  const headers = options.headers || {};
  headers["Content-Type"] = "application/json";

  const token = localStorage.getItem("nf_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const buildErrorResponse = (status, message) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const redirectForAuthFailure = (status) => {
    if (status === 401) {
      console.warn("401 Unauthorized - redirecting to login");
      localStorage.removeItem("nf_token");
      localStorage.removeItem("nf_role");
      window.location.href = "./login.html";
      return;
    }

    if (status === 403) {
      console.warn("403 Forbidden - redirecting to not-authorized");
      window.location.href = "./not-authorized.html";
    }
  };

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    redirectForAuthFailure(401);
    return buildErrorResponse(401, "Unauthorized");
  }

  // Handle 403 Forbidden - redirect to not-authorized page
  if (response.status === 403) {
    redirectForAuthFailure(403);
    return buildErrorResponse(403, "Forbidden");
  }

  // Defensive: some endpoints/proxies can return auth errors with HTTP 200.
  // Detect that shape and treat it as an auth failure.
  try {
    const contentType = response.headers.get("Content-Type") || "";
    if (response.ok && contentType.includes("application/json")) {
      const probe = await response.clone().json();
      const normalizedError = (probe?.error || "").toString().toLowerCase();
      if (
        normalizedError.includes("invalid or expired token") ||
        normalizedError.includes("no authorization token") ||
        normalizedError.includes("unauthorized")
      ) {
        redirectForAuthFailure(401);
        return buildErrorResponse(401, probe.error || "Unauthorized");
      }
    }
  } catch {
    // Ignore parse/probe failures and return original response.
  }

  // Return the raw Response so callers can use .ok, .status, and .json().
  return response;
};

// Redirect to login if not authenticated
window.requireAuth = function () {
  const token = localStorage.getItem("nf_token");
  if (!token) {
    window.location.href = "login.html";
  }
};

// Auth object used by guard.js
window.Auth = {
  isAuthenticated() {
    return !!localStorage.getItem("nf_token");
  },

  getRole() {
    return localStorage.getItem("nf_role");
  },

  // Check if current user has one of the allowed roles
  hasRole(...allowedRoles) {
    const userRole = this.getRole();
    return allowedRoles.includes(userRole);
  },

  // Check if user can manage teams (SuperAdmin, OrgAdmin, or assigned TeamManager)
  canManageTeams() {
    return this.hasRole(
      window.ROLES.SuperAdmin,
      window.ROLES.OrgAdmin,
      window.ROLES.TeamManager,
    );
  },

  // Check if user can manage rosters (Coach, TeamManager, SuperAdmin, OrgAdmin)
  canManageRosters() {
    return this.hasRole(
      window.ROLES.Coach,
      window.ROLES.TeamManager,
      window.ROLES.SuperAdmin,
      window.ROLES.OrgAdmin,
    );
  },

  // Check if user can manage players (Coach, TeamManager, SuperAdmin, OrgAdmin)
  canManagePlayers() {
    return this.hasRole(
      window.ROLES.Coach,
      window.ROLES.TeamManager,
      window.ROLES.SuperAdmin,
      window.ROLES.OrgAdmin,
    );
  },

  // Check if user can manage schedules (TeamManager, SuperAdmin, OrgAdmin)
  canManageSchedules() {
    return this.hasRole(
      window.ROLES.TeamManager,
      window.ROLES.SuperAdmin,
      window.ROLES.OrgAdmin,
    );
  },

  // Check if user can generate access codes (TeamManager, SuperAdmin, OrgAdmin)
  canGenerateAccessCodes() {
    return this.hasRole(
      window.ROLES.TeamManager,
      window.ROLES.SuperAdmin,
      window.ROLES.OrgAdmin,
    );
  },

  // Check if user can manage users (SuperAdmin, OrgAdmin)
  canManageUsers() {
    return this.hasRole(window.ROLES.SuperAdmin, window.ROLES.OrgAdmin);
  },

  // Check if user can manage permissions (SuperAdmin only)
  canManagePermissions() {
    return this.hasRole(window.ROLES.SuperAdmin);
  },

  // Check if user is an admin (SuperAdmin or OrgAdmin)
  isAdmin() {
    return this.hasRole(window.ROLES.SuperAdmin, window.ROLES.OrgAdmin);
  },
};
// GLOBAL logout function
window.logout = function () {
  console.log("🔥 logout() called");
  localStorage.removeItem("nf_token");
  localStorage.removeItem("nf_role");

  // Show toast if available
  const toast = document.getElementById("nf-toast");
  if (toast) {
    toast.textContent = "You’ve been logged out";
    toast.classList.remove("hidden");
    toast.classList.add("show");

    // Delay redirect so the toast is visible
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  } else {
    // Fallback redirect
    window.location.href = "login.html";
  }
};
