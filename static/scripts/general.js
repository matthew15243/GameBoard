const BASE_URL = "http://192.168.216.103:8080";  // Flask server

async function getProfile() {
    const data = await fetch(`${BASE_URL}/general/user`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    const profile = await data.json()

	// Redirect if not authenticated
	if (!data.ok) {
		if (data.status === 401) {
			// Redirect to login page if unauthorized
			window.location.href = '/login'; 
			return;
		}
		throw new Error(`HTTP error! Status: ${response.status}`);
	}

    return profile.profile
}


// Logout Function
async function logout() {
    await fetch(`${BASE_URL}/auth/logout`, { method: "POST" });
    localStorage.clear() // Remove local storage entirely
    // localStorage.removeItem("user");  // Remove user info
    // localStorage.removeItem("playableGames");  // Remove user info
	window.location.href = '/login'; 
}
