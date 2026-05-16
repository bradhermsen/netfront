const form = document.querySelector(".login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorEl = document.querySelector(".login-error");
const forgotBtn = document.querySelector(".forgot-link");

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
}

function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const payload = {
        email: emailInput.value.trim(),
        password: passwordInput.value
    };

    try {
        const res = await fetch("http://localhost:7071/api/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            showError("Invalid email or password.");
            return;
        }

        const data = await res.json();

        // Example: store token + role (adjust to your backend contract)
        if (data.token) {
            localStorage.setItem("nf_admin_token", data.token);
        }
        if (data.role) {
            localStorage.setItem("nf_admin_role", data.role);
        }

        window.location.href = "./dashboard.html";
    } catch (err) {
        console.error(err);
        showError("Unable to reach server. Please try again.");
    }
});

forgotBtn.addEventListener("click", () => {
    // Placeholder – wire to your password reset flow later
    alert("Password reset flow coming soon.");
});
