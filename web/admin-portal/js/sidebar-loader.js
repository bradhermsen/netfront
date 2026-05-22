// sidebar-loader.js
async function loadSidebar(activePage) {
    const container = document.getElementById("sidebarContainer");

    const res = await fetch("../components/sidebar.html");
    const html = await res.text();
    container.innerHTML = html;

    // Highlight active link
    const links = container.querySelectorAll("a");
    links.forEach(link => {
        if (link.getAttribute("href") === activePage) {
            link.classList.add("active");
        }
    });

    // Logout behavior (future-proof)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("nf_admin_token");
            localStorage.removeItem("nf_admin_role");
            window.location.href = "login.html";
        });
    }
}
