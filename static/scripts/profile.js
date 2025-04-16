let selectedGameElement = null;
const activeGames = document.getElementById("activeGames");
const gameCounts = {};
const maxPlayers = 6;
let currentGame = "";
const user = JSON.parse(localStorage.getItem('user')).username

const socket = io.connect(`${BASE_URL}`);

// Listen for game updates
socket.on('game_update', (data) => {
    console.log("Game updated:", data);
    // updateGameList(data);
});


function getSidebar() {
    fetch(`${BASE_URL}/profile/get_profile_sidebar`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error compiling sidebar:", data.error);
                return;
            }
            console.log(data);
            data.sort((a,b)=>a.sort_order-b.sort_order)
            localStorage.setItem("sidebarOptions", JSON.stringify(data));

            createSidebar(data)
        })
        .catch(error => console.error("Failed to compile sidebar:", error));
}

function createSidebar(options){
    const sidebar=document.querySelector("#sidebar")
    sidebar.innerHTML=""

    for (let listItem of options){
        const li = document.createElement("li")
        li.textContent=listItem.option_name
        li.onclick=() =>{
            window.location.href=listItem.url
        }
        sidebar.appendChild(li)
    }
}

getSidebar()
