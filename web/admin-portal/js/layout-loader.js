console.log("🔥 layout-loader.js loaded");

// =========================================================
// SHARED LAYOUT LOADER
// =========================================================

window.loadLayout = async function (pageKey) {
  try {
    // =====================================================
    // 🔐 AUTH CHECK — BLOCK ALL PAGES EXCEPT LOGIN
    // =====================================================
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage !== "login.html") {
      if (!window.Auth || !window.Auth.isAuthenticated()) {
        console.warn("⛔ Not authenticated — redirecting to login");
        window.location.href = "login.html";
        return;
      }
    }

    // =====================================================
    // 1) Load layout shell
    // =====================================================
    const layoutHtml = await fetch("../components/layout.html").then((r) =>
      r.text(),
    );
    document.getElementById("layoutContainer").innerHTML = layoutHtml;

    // 2) Load sidebar + footer
    const [sidebarHtml, footerHtml] = await Promise.all([
      fetch("../components/sidebar.html").then((r) => r.text()),
      fetch("../components/footer.html").then((r) => r.text()),
    ]);

    document.getElementById("sidebarContainer").innerHTML = sidebarHtml;
    document.getElementById("footerContainer").innerHTML = footerHtml;

    // Highlight active link
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      if (link.getAttribute("href").includes(currentPage)) {
        link.classList.add("active");
      }
    });

    // 3) Inject page content
    if (window.PageContentRegistry && window.PageContentRegistry[pageKey]) {
      const pageContent = document.getElementById("pageContent");
      pageContent.innerHTML = window.PageContentRegistry[pageKey]();
      window.AdminPage = window.AdminPage || {};
      window.AdminPage.currentPage = pageKey;
    }

    // 3b) Inject page-specific modals
    if (
      window.PageContentRegistry &&
      window.PageContentRegistry[pageKey + "Modals"]
    ) {
      ["playerModalOverlay", "playerDeleteModalOverlay"].forEach((id) => {
        const old = document.getElementById(id);
        if (old) old.remove();
      });

      const modalsHtml = window.PageContentRegistry[pageKey + "Modals"]();
      const temp = document.createElement("div");
      temp.innerHTML = modalsHtml;

      const overlays = temp.querySelectorAll(".nf-modal-overlay");
      overlays.forEach((overlay) => {
        overlay.setAttribute("data-page", pageKey);
        document.body.appendChild(overlay);
      });
    }

    // 4) Fire page-ready events
    document.dispatchEvent(new Event("layoutLoaded"));
    document.dispatchEvent(new Event("nf-page-ready"));
  } catch (err) {
    console.error("Layout loader failed:", err);
  }
};
// =====================================================
// LOGOUT HANDLER (works even with dynamic sidebar load)
// =====================================================
document.addEventListener("click", (e) => {
  const logoutLink = e.target.closest("#sidebar-logout");
  if (logoutLink) {
    e.preventDefault();
    console.log("🔓 Logout clicked");
    logout();
  }
});
