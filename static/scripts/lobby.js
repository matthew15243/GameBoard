

let selectedGameElement = null;
const activeGames = document.getElementById("activeGames");
const gameCounts = {};
const maxPlayers = 6;
let currentGame = "";
        
function loadGames(game) {
    currentGame = game;
    const games = [
        { name: "Game 1", players: Math.floor(Math.random() * 5) + 1 },
        { name: "Game 2", players: Math.floor(Math.random() * 5) + 1 },
        { name: "Game 3", players: Math.floor(Math.random() * 5) + 1 }
    ];
    gameCounts[game] = games.length;
    document.getElementById(`${game}-count`).textContent = games.length;
    
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