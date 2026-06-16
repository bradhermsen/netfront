console.log("login.js loaded");

const btn = document.getElementById("btnLogin");
console.log("btnLogin =", btn);

btn.addEventListener("click", async () => {
  console.log("Login button clicked");

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const errorDiv = document.getElementById("login-error");

  errorDiv.textContent = "";

  if (!email || !password) {
    errorDiv.textContent = "Please enter both email and password.";
    return;
  }

  try {
    const res = await fetch("http://localhost:7071/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("Response status:", res.status);

    if (!res.ok) {
      errorDiv.textContent = "Invalid email or password.";
      return;
    }

    const data = await res.json();
    console.log("Login success:", data);

    localStorage.setItem("nf_token", data.token);
    localStorage.setItem("nf_role", data.role);

    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Login error:", err);
    errorDiv.textContent = "Unable to connect to server.";
  }
});
