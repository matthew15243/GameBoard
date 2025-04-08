function showTab(tab) {
    if (tab === 'signup') {
        document.getElementById('signup-form').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-tab').classList.add('active');
        document.getElementById('login-tab').classList.remove('active');
    } else {
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('signup-tab').classList.remove('active');
        document.getElementById('login-tab').classList.add('active');
    }
}

// Signup Function
async function signup() {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const username = document.getElementById("signup-username").value;

    const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username})
    });

    const data = await response.json();
    if (response.ok) {
        alert("Signup successful! Please log in.");
    } else {
        alert("Signup failed: " + data.error);
    }
}

async function forgotPassword() {
    const email = prompt("Enter your email to reset your password:");
    if (!email) return;

    const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    alert(data.message);
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
        // alert("Login successful!");
        localStorage.setItem("user", JSON.stringify(data.profile));  // Store user info
        window.location.href = "/lobby";  // Redirect to login page
        // showUser(data.profile);
    } else {
        alert("Login failed: " + data.error);
    }

}

// Auto-login if user is stored in localStorage
document.addEventListener("DOMContentLoaded", () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
        showUser(storedUser);
    }
});