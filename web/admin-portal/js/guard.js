// guard.js — Protect all admin pages with role-based access

(function () {
  const currentPage = window.location.pathname.split("/").pop();

  // Do NOT guard the login and not-authorized pages
  if (currentPage === "login.html" || currentPage === "not-authorized.html") {
return;
  }

  // If not authenticated, redirect to login
  if (!window.Auth || !Auth.isAuthenticated()) {
    window.location.href = "./login.html";
    return;
  }

  // Role-based page access control
  const role = Auth.getRole();
// Define which roles can access which pages
  const pageAccessMatrix = {
    "permissions.html": [window.ROLES.SuperAdmin],
    "users.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin],
    "organizations.html": [window.ROLES.SuperAdmin],
    "seasons.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin],
    "teams.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin, window.ROLES.TeamManager],
    "schedules.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin, window.ROLES.TeamManager, window.ROLES.Coach],
    "rosters.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin, window.ROLES.Coach, window.ROLES.TeamManager],
    "players.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin, window.ROLES.Coach, window.ROLES.TeamManager],
    "stats.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin, window.ROLES.Coach, window.ROLES.TeamManager, window.ROLES.Viewer],
    "settings.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin],
    "access-codes.html": [window.ROLES.SuperAdmin, window.ROLES.OrgAdmin, window.ROLES.TeamManager]
  };

  // Check if current page has access restrictions
  if (pageAccessMatrix[currentPage]) {
    if (!pageAccessMatrix[currentPage].includes(role)) {
      console.error("Access denied for role:", role, "on page:", currentPage);
      // Redirect to not-authorized page
      window.location.href = "./not-authorized.html";
      return;
    }
  }
})();
