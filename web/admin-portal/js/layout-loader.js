// =========================================================
// SHARED LAYOUT LOADER
// =========================================================

window.loadLayout = async function (pageKey) {
  try {
    // 1) Load layout shell
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
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      if (link.getAttribute("href").includes(currentPage)) {
        link.classList.add("active");
      }
    });

    // 3) Inject page content from registry
    if (window.PageContentRegistry && window.PageContentRegistry[pageKey]) {
      const pageContent = document.getElementById("pageContent");
      pageContent.innerHTML = window.PageContentRegistry[pageKey]();
    }

    // 4) Fire page-ready event
    document.dispatchEvent(new Event("nf-page-ready"));
  } catch (err) {
    console.error("Layout loader failed:", err);
  }
};
