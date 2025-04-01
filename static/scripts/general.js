const BASE_URL = "http://192.168.216.103:8080";  // Flask server

async function getSelfProfile() {
    const data = await fetch(`${BASE_URL}/general/user`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    const profile = await data.json()

    return profile.profile
}