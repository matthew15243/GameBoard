let selectedGameElement = null;
const activeGames = document.getElementById("activeGames");
const gameCounts = {};
const maxPlayers = 6;
let currentGame = "";

const socket = io.connect(`${BASE_URL}`);

// Listen for game updates
socket.on('game_update', (data) => {
    console.log("Game updated:", data);
    // updateGameList(data);
});
        
function loadGames(game) {
    currentGame = game.replace(/\s+/g, "").toLowerCase();
    const games = [
        { name: "Game 1", players: Math.floor(Math.random() * 5) + 1 },
        { name: "Game 2", players: Math.floor(Math.random() * 5) + 1 },
        { name: "Game 3", players: Math.floor(Math.random() * 5) + 1 }
    ];
    gameCounts[game] = games.length;
    document.getElementById(`${currentGame}-count`).textContent = games.length;
    
    activeGames.innerHTML = `<h3>${game} - Available Games</h3>`;
    games.forEach(g => addGameElement(g.name, g.players));
}

function addGameElement(name, players) {
    const div = document.createElement("div");
    div.classList.add("game-item");
    div.innerHTML = `<span>${name} <span class='player-count'>(${players} players)</span></span> <span class='delete' onclick='deleteGame(this, "${currentGame}")'>🗑️</span>`;
    div.onclick = function() {
        if (selectedGameElement) selectedGameElement.classList.remove("selected");
        selectedGameElement = div;
        div.classList.add("selected");
    };
    activeGames.appendChild(div);
}

function createGame() {
    if (!currentGame) return;
    addGameElement(`Game ${gameCounts[currentGame] + 1}`, 1);
    gameCounts[currentGame]++;
    document.getElementById(`${currentGame}-count`).textContent = gameCounts[currentGame];
}

function joinGame() {
    if (!selectedGameElement) return;
    const playerCountSpan = selectedGameElement.querySelector(".player-count");
    let currentPlayers = parseInt(playerCountSpan.textContent.match(/\d+/)[0], 10);
    if (currentPlayers < maxPlayers) {
        currentPlayers++;
        playerCountSpan.textContent = `(${currentPlayers} players)`;
    }
}

function viewRules() { alert("View Rules Clicked"); }

function deleteGame(el, game) { 
    el.parentElement.remove();
    gameCounts[game] = Math.max(0, gameCounts[game] - 1);
    document.getElementById(`${game}-count`).textContent = gameCounts[game];
}

function fetchGamesFromBackend() {
    fetch(`${BASE_URL}/lobby/get_games`)  // Change to your backend URL
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error fetching games:", data.error);
                return;
            }
            localStorage.setItem("playableGames", JSON.stringify(data));
            resetGameList(data);
        })
        .catch(error => console.error("Failed to fetch games:", error));
}

function resetGameList(games) {
    const gameList = document.getElementById("gamesList");
    gameList.innerHTML = "";  // Clear existing list

    games.forEach(game => {
        const li = document.createElement("li");
        li.textContent = game.game;
        const gameId = game.game.replace(/\s+/g, "").toLowerCase()
        li.textContent = game.game

        // Add the game count to the li-element
        let span = document.createElement("span"); 
        span.className = "game-count"; 
        span.id = `${gameId}-count`; 
        span.textContent = "0"; 
        li.appendChild(span); // Adds the span inside li

        li.id = gameId
        li.onclick = () => loadGames(game.game);
        gameList.appendChild(li);
    });
}

fetchGamesFromBackend()