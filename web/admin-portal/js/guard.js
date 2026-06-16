// guard.js — Protect all admin pages

(function () {
  const currentPage = window.location.pathname.split("/").pop();

  // Do NOT guard the login page
  if (currentPage === "login.html") {
    console.log("Guard bypassed on login page");
    return;
  }

  // If not authenticated, redirect to login
  if (!window.Auth || !Auth.isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  // Optional: role-based protection (future use)
  const role = Auth.getRole();
  // Example:
  // if (role !== "Admin") window.location.href = "no-access.html";
})();
