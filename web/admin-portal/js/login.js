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
      // Better error messages based on status code
      if (res.status === 401) {
        errorDiv.textContent = "Invalid email or password.";
      } else if (res.status === 400) {
        errorDiv.textContent = "Missing email or password.";
      } else if (res.status === 500) {
        errorDiv.textContent = "Server error. Please try again later.";
      } else {
        errorDiv.textContent = `Error: HTTP ${res.status}`;
      }
      return;
    }

    const data = await res.json();
    console.log("Login success:", data);

    // Validate response contains required token and role
    if (!data.token || !data.role) {
      errorDiv.textContent = "Invalid server response. Missing token or role.";
      console.error("Invalid login response:", data);
      return;
    }

    localStorage.setItem("nf_token", data.token);
    localStorage.setItem("nf_role", data.role);
    
    // Store user ID if provided (needed for Team Manager dashboard)
    if (data.userId) {
      localStorage.setItem("nf_user_id", data.userId);
    }

    window.location.href = "./dashboard.html";
  } catch (err) {
    console.error("Login error:", err);
    errorDiv.textContent = "Unable to connect to server. Please check your connection.";
  }
});
