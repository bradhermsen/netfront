// auth.js

// Helper for authenticated API calls
window.authFetch = async function (url, options = {}) {
  const fullUrl = `${window.apiBase}${url}`;

  const headers = options.headers || {};
  headers["Content-Type"] = "application/json";

  const token = localStorage.getItem("nf_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(fullUrl, {
    ...options,
    headers,
  });
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
