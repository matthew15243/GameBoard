// const BASE_URL = "http://127.0.0.1:5000";  // Flask server
const BASE_URL = "http://192.168.216.103:8080";  // Flask server

// Signup Function
async function signup() {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const username = document.getElementById("signup-username").value;
    const display_name = document.getElementById("signup-displayname").value;

    const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, display_name })
    });

    const data = await response.json();
    if (response.ok) {
        alert("Signup successful! Please log in.");
    } else {
        alert("Signup failed: " + data.error);
    }
}

// Login Function
async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        alert("Login successful!");
        localStorage.setItem("user", JSON.stringify(data.profile));  // Store user info
        showUser(data.profile);
    } else {
        alert("Login failed: " + data.error);
    }
}

// Show User Info
function showUser(profile) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("user-section").style.display = "block";
    document.getElementById("display-name").textContent = profile.display_name || "User";
    document.getElementById("username").textContent = profile.username;
}

// Logout Function
async function logout() {
    await fetch(`${BASE_URL}/auth/logout`, { method: "POST" });
    localStorage.removeItem("user");  // Remove user info
    alert("Logged out successfully.");
    window.location.reload();
}

// Auto-login if user is stored in localStorage
document.addEventListener("DOMContentLoaded", () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
        showUser(storedUser);
    }
});