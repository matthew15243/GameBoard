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

function loadGames(game) {
    currentGame = game.replace(/\s+/g, "").toLowerCase();
    const games = JSON.parse(localStorage.getItem('activeGames')).filter(item => item.game.replace(/\s+/g, "").toLowerCase() == currentGame && (item.status === 'Joinable' || item.players.includes(user)))
    gameCounts[currentGame] = games.length;
    document.getElementById(`${currentGame}-count`).textContent = games.length;

    activeGames.innerHTML = `<h2>${game} - Available Games</h2>`;

    // Break the Active Games space into 3 categories: active, paused, and joinable
    const active = document.createElement('div')
    activeText = document.createElement('h4')
    activeText.className = 'gameState'
    activeText.innerHTML = 'Active Games'
    active.id = 'active'
    active.style.display = "none"
    active.appendChild(activeText)

    const paused = document.createElement('div')
    pausedText = document.createElement('h4')
    pausedText.className = 'gameState'
    pausedText.innerHTML = 'Paused Games'
    paused.id = 'paused'
    paused.style.display = "none"
    paused.appendChild(pausedText)

    const joinable = document.createElement('div')
    joinableText = document.createElement('h4')
    joinableText.className = 'gameState'
    joinableText.innerHTML = 'Joinable Games'
    joinable.id = 'joinable'
    joinable.style.display = "none"
    joinable.appendChild(joinableText)

    activeGames.appendChild(active)
    activeGames.appendChild(paused)
    activeGames.appendChild(joinable)

    games.forEach(g => addGameElement(g.id));
}

function formatDuration(seconds) {
    const units = [
        { label: 'day', value: 86400 },
        { label: 'hour', value: 3600 },
        { label: 'minute', value: 60 },
        { label: 'second', value: 1 },
    ];

    const parts = [];

    for (const { label, value } of units) {
        const unitAmount = Math.floor(seconds / value);
        if (unitAmount > 0) {
            parts.push(`${unitAmount} ${label}${unitAmount > 1 ? 's' : ''}`);
            seconds %= value;
        }
    }

    if (parts.length === 0) return '0 seconds';
    if (parts.length === 1) return parts[0];

    // Join with commas and 'and' before the last part
    return parts.slice(0, -1).join(', ') + ' and ' + parts.slice(-1);
}

function createplayersElement(players, playerReadyStatuses, gameStatus, host, user, id) {
    const playersContainer = document.createElement('div')
    playersContainer.id = `playersContainer${id}`
    playersContainer.classList.add('playersContainer')

    // Add the draggable functionality
    if (user === host && gameStatus === "Joinable") {
        Sortable.create(playersContainer, {
            animation: 150,         // smooth dragging animation
            draggable: '.playerRow', // define what is draggable
        });
    }

    // create the headers
    {
        const div = document.createElement('label');
        div.className = 'playerRowStatic'
        div.id = 'playerHeaders'
        playersContainer.appendChild(div);

        // Add the first span, sort symbol if the user is the same as the host
        const reorder = document.createElement('span')
        reorder.textContent = ' '
        div.appendChild(reorder)

        // Add the name to the player div element
        playerName = document.createElement('span')
        playerName.textContent = 'Player Name'
        div.appendChild(playerName)

        // Add the player status check box
        const playerStatus = document.createElement('p')
        playerStatus.textContent = 'Ready'
        div.appendChild(playerStatus)
    }

    players.forEach((name) => {
        const div = document.createElement('label');
        div.className = (user === host && gameStatus === "Joinable") ? 'playerRow' : 'playerRowStatic'
        playersContainer.appendChild(div);

        // Add the first span, sort symbol if the user is the same as the host
        const reorder = document.createElement('span')
        // (host === user) ? reorder.textContent = '≡' : reorder.textContent = ' '
        if (host === user && gameStatus === "Joinable") { reorder.textContent = '≡'}
        else { reorder.textContent = ' '}
        div.appendChild(reorder)

        // Add the name to the player div element
        playerName = document.createElement('span')
        playerName.textContent = `${name}${name === host ? ' (host)' : ''}`;
        div.appendChild(playerName)

        // Add the player status check box
        const playerStatus = document.createElement('input')
        playerStatus.type = 'checkbox'
        playerStatus.id = name
        playerStatus.checked = playerReadyStatuses[name]
        playerStatus.disabled = !(name === user && gameStatus !== 'Active')
        div.appendChild(playerStatus)

        // Add the ✖️ for removing / booting a player
        if (host === user && gameStatus === "Joinable") {
            const removePlayer = document.createElement('span')
            if (name !== host) { removePlayer.innerHTML = `<span onclick="removePlayer('${name}')">✖️</span>` }
            div.appendChild(removePlayer)
        }
    });

    return playersContainer
}

function closeGames() {
    const activeGames = document.querySelectorAll('.game-details');

    activeGames.forEach((gameEl) => {
        gameEl.style.display = 'none';
    });
}

function addGameElement(id) {
    // Pull the configurations from the local storage
    const data = JSON.parse(localStorage.getItem('activeGames')).filter(item => item['id'] == id)[0]
    const activeConfigs = data['configurations']

    const game = data['game'].replace(/\s+/g, "").toLowerCase()
    const gameName = activeConfigs['Game']['Name']['value']
    const gameStatus = data['status']
    const players = data['players']
    const host = data['host']
    const createTime = data['created_at']
    const playerReadyStatuses = data['playerIsReadyStatuses']
    const maxPlayers = data['maxPlayers']

    // Bring in the general configurations for descriptions
    const gameBaseConfigs = JSON.parse(localStorage.getItem('playableGames')).filter(item => item['game'].replace(/\s+/g, "").toLowerCase() === game)[0]['configurations']

    // ============================================================ //
    // Create the top container for the game (The actual active game) //
    // ============================================================ //
    const container = document.createElement('div');
    container.classList.add('game-item');
    if (players.includes(user)) { container.classList.add('included'); }
    container.id = id

    // Add the container to the Game Status container
    if (gameStatus === 'Joinable') {
        const element = document.getElementById('joinable')
        element.style.display = "block"
        element.appendChild(container);
    } else if (gameStatus === 'Active') {
        const element = document.getElementById('active')
        element.style.display = "block"
        element.appendChild(container);
    } else if (gameStatus === 'Paused') {
        const element = document.getElementById('paused')
        element.style.display = "block"
        element.appendChild(container);
    }

    // =========================================== //
    // Create the Header (Hearts - 5 player(s) 🗑) //
    // =========================================== //
    const header = document.createElement('div');
    header.classList.add('game-header');
    const deleteGameText = (host === user) ? `<span><span class='delete' onclick='deleteGame(this, "${game}")'>🗑️</span></span>` : `<span>️</span>`
    let buttonText = null
    if (gameStatus === 'Active') { buttonText = '<button>Resume</button>' }
    else if (gameStatus === 'Paused') { buttonText = (user === host) ? '<button>Resume</button>' : '' }
    else if (gameStatus === 'Joinable') { buttonText = (user === host) ? '<button>Start</button>' : ((players.includes(user)) ? '' : '<button>Join</button>') }
    header.innerHTML = `
        <span>${gameName}</span>
        <span class="player-count">${players.length} / ${maxPlayers} playe${(maxPlayers > 1) ? 'rs' : 'r'}</span>
        ${deleteGameText}
        ${buttonText}
    `;
    container.appendChild(header);

    // =============================== //
    // Add the game details to the DOM //
    // =============================== //
    const details = document.createElement('div');
    details.classList.add('game-details');
    container.appendChild(details);

    // ============================================= //
    // Don't add the game details for an active game //
    // ============================================= //
    if (gameStatus === 'Active' || gameStatus === 'Paused') {
        const playersContainer = createplayersElement(players, playerReadyStatuses, gameStatus, host, user, id)
        details.appendChild(playersContainer)
        return
    }

    if (activeConfigs) {
        // for each configuration setting category (first level of the json object) (Game, Game Rules, Timing Settings, etc.)
        for (const [section, options] of orderObject(activeConfigs, 'order')) {
            // Create the configuration setting header
            const sectionHeader = document.createElement('h4');
            sectionHeader.className = 'configSectionName'
            sectionHeader.textContent = section.replace(/_/g, ' ');
            details.appendChild(sectionHeader);

            // The container to hold all settings
            const settingContainer = document.createElement('div');

            // The principal settings (everything in the configurations object from supabase)
            const mainSettings = document.createElement('div')
            mainSettings.id = 'mainSettings'
            mainSettings.classList.add('setting-row');

            // =================================== //
            // Add the people involved in the game
            // =================================== //
            if (section === 'Game') {
                const playersContainer = createplayersElement(players, playerReadyStatuses, gameStatus, host, user, id)
                settingContainer.appendChild(playersContainer)
            }


            // for items in a section (second level of the json object)
            for (const [optionName, optionData] of orderObject(options, 'order')) {
                if (optionName !== "Name" || !optionData.value.includes("s Game")) {
                    const label = (user === host) ? document.createElement('p') : document.createElement('label')
                    // const label = document.createElement('p')
                    label.textContent = optionName.replace(/_/g, ' ');

                    const isOptions = section in gameBaseConfigs && optionName in gameBaseConfigs[section] && Array.isArray(gameBaseConfigs[section][optionName].options) && gameBaseConfigs[section][optionName].options.length > 0;
                    const isRange = section in gameBaseConfigs && optionName in gameBaseConfigs[section] && gameBaseConfigs[section][optionName]?.min !== undefined && gameBaseConfigs[section][optionName]?.max !== undefined

                    const isAlterable = (user === host && (isOptions || isRange))
                    const select = (isAlterable) ? document.createElement('select') : document.createElement('p');
                    if (isAlterable) {
                        const baseData = gameBaseConfigs[section][optionName]
                        select.name = optionName;
                        let defaultValue = baseData.default;

                        if (baseData.options) {
                            let optionsList = baseData.options;

                            optionsList.forEach(opt => {
                                const option = document.createElement('option');
                                option.value = opt;
                                option.textContent = String(opt);
                                if (opt === optionData.value) option.selected = true;
                                select.appendChild(option);
                            });
                        } else if (baseData.min !== undefined && baseData.max !== undefined) {
                            const step = baseData.step ?? 1;
                            for (let val = baseData.min; val <= baseData.max; val += step) {
                                const option = document.createElement('option');
                                option.value = val;
                                option.textContent = baseData?.units !== undefined ? formatDuration(val) : val;
                                if (val === defaultValue) option.selected = true;
                                select.appendChild(option);
                            }
                        }
                    }
                    else {
                        select.textContent = optionData.value
                    }


                    // Add the description information
                    const info = document.createElement('p')
                    if (section in gameBaseConfigs && optionName in gameBaseConfigs[section] && 'description' in gameBaseConfigs[section][optionName]) {
                        info.innerHTML = `<p title = "${gameBaseConfigs[section][optionName]['description']}" style = "cursor: help; margin-left: 0.25em;">ℹ️</p>`
                    }

                    mainSettings.appendChild(label)
                    mainSettings.appendChild(select)
                    mainSettings.appendChild(info)
                }

                // settingContainer.appendChild(left)
                // settingContainer.appendChild(right)
                settingContainer.appendChild(mainSettings)
                details.appendChild(settingContainer);

            }
        }
    }

}

function createGame() {
    if (!currentGame) return;
    // addGameElement(`Game ${gameCounts[currentGame] + 1}`, 1);
    addGameElement(currentGame, 'dummy');
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
    const confirmation = confirm(`You are about to delete "${el.parentElement.parentElement.querySelector('span').textContent}". This action CANNOT be undone.`)
    if (!confirmation) { return }

    // Identify the corresponding game state div
    gameStateElement = el.parentElement.parentElement.parentElement.parentElement

    // Remove the game
    el.parentElement.parentElement.parentElement.remove();

    // Adjust the playable game's count
    gameCounts[game] = Math.max(0, gameCounts[game] - 1);
    document.getElementById(`${game}-count`).textContent = gameCounts[game];

    // Hide the corresponding game state if there are no longer any games
    if (gameStateElement.children.length === 1) {
        gameStateElement.style.display = "none"
    }
}

function getPlayableGames() {
    fetch(`${BASE_URL}/lobby/get_playable_games`)  // Change to your backend URL
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

function getActiveGames() {
    fetch(`${BASE_URL}/lobby/get_active_games`)  // Change to your backend URL
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error fetching games:", data.error);
                return;
            }
            localStorage.setItem("activeGames", JSON.stringify(data));
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
        const currentCount = JSON.parse(localStorage.getItem('activeGames')).filter(item => item.game.replace(/\s+/g, "").toLowerCase() == gameId && (item.status === 'Joinable' || item.players.includes(user))).length

        // Add the game count to the li-element
        let span = document.createElement("span");
        span.className = "game-count";
        span.id = `${gameId}-count`;
        span.textContent = currentCount;
        li.appendChild(span); // Adds the span inside li

        li.id = gameId
        li.onclick = () => loadGames(game.game);
        gameList.appendChild(li);
    });
}

// Helper Functions
function orderObject(obj, key) {
    return Object.entries(obj)
        .sort((a, b) => {
            const aHasKey = a[1][key] !== undefined;
            const bHasKey = b[1][key] !== undefined;

            if (!aHasKey && !bHasKey) return 0;
            if (!aHasKey) return 1;
            if (!bHasKey) return -1;

            return a[1][key] - b[1][key];
        })
        .map(([k, v]) => {
            const { [key]: _, ...rest } = v; // Remove the key
            return [k, rest];
        });
}

document.addEventListener('click', (event) => {
    // If you clicked inside of the game-details, do nothing
    if (event.target.closest('.game-details')
        || event.target.closest('.delete')
        || event.target.closest('button')) { return; }

    let details = null
    let state = null

    // Open the game
    if (event.target.closest('.game-item') && event.target.closest('.game-item').querySelector('.game-details') !== null) {
        details = event.target.closest('.game-item').querySelector('.game-details');
        state = details.style.display === 'none' || !details.style.display
    }

    closeGames()
    if (details) { details.style.display = state ? 'block' : 'none'; }


})

function removePlayer(name) {
    alert(`Trying to remove ${name}`)
}

// Start Up
getPlayableGames()
getActiveGames()