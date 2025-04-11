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

// function addGameElementOld(game, gameName) {
//     // Create the top element for the game
//     const container = document.createElement('div');
//     container.classList.add('game-item');

//     // Create the first sub-div : game name
//     const header = document.createElement('div');
//     header.classList.add('game-header');
//     header.innerHTML = `
//         <span>${gameName}</span>
//         <span class="player-count">1 player(s)</span>
//     `;

//     const details = document.createElement('div');
//     details.classList.add('game-details');

//     const playableGames = JSON.parse(localStorage.getItem('playableGames'));
//     const config = playableGames.filter(item => item.game.replace(/\s+/g, "").toLowerCase() === game.replace(/\s+/g, "").toLowerCase())[0].configurations;

//     if (config) {
//         // for each section (first level of the json object)
//         for (const [section, options] of orderObject(config, 'order')) {
//             const sectionHeader = document.createElement('h4');
//             sectionHeader.textContent = section.replace(/_/g, ' ');
//             sectionHeader.style.borderBottom = '1px solid #ccc';
//             sectionHeader.style.marginTop = '1em';
//             details.appendChild(sectionHeader);

//             // for items in a section (second level of the json object)
//             for (const [optionName, optionData] of orderObject(options, 'order')) {
//                 const label = document.createElement('label');
//                 label.textContent = optionName.replace(/_/g, ' ');
//                 label.style.display = 'block';
//                 label.style.margin = '0.5em 0 0.2em';

//                 const isOptions = Array.isArray(optionData.options) && optionData.options.length > 0;
//                 const isRange = optionData.min !== undefined && optionData.max !== undefined;

//                 const select = (isOptions || isRange) ? document.createElement('select') : document.createElement('input');
//                 select.name = optionName;

//                 let defaultValue = optionData.default;

//                 if (optionData.options) {
//                     let optionsList = optionData.options;

//                     optionsList.forEach(opt => {
//                         const option = document.createElement('option');
//                         option.value = opt;
//                         option.textContent = String(opt);
//                         if (opt === defaultValue) option.selected = true;
//                         select.appendChild(option);
//                     });
//                 } else if (optionData.min !== undefined && optionData.max !== undefined) {
//                     const step = optionData.step ?? 1;
//                     for (let val = optionData.min; val <= optionData.max; val += step) {
//                         const option = document.createElement('option');
//                         option.value = val;
//                         option.textContent = val;
//                         if (val === defaultValue) option.selected = true;
//                         select.appendChild(option);
//                     }
//                 } else {
//                     select.type = 'text';
//                     select.value = optionData.default ?? '';
//                 }

//                 const settingContainer = document.createElement('div');
//                 settingContainer.classList.add('setting-row');

//                 settingContainer.appendChild(label);
//                 settingContainer.appendChild(select);
//                 details.appendChild(settingContainer);
//             }
//         }
//     }

//     container.appendChild(header);
//     container.appendChild(details);

//     // Add the onclick event to open and close a game's details
//     container.addEventListener('click', (event) => {
//         // If the click originated inside the details element, do nothing
//         if (details.contains(event.target)) return;

//         details.style.display = details.style.display === 'none' || !details.style.display ? 'block' : 'none';
//     });

//     document.getElementById('activeGames').appendChild(container);
// }

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

    const gameBaseConfigs = JSON.parse(localStorage.getItem('playableGames')).filter(item => item['game'].replace(/\s+/g, "").toLowerCase() === game)[0]['configurations']
    console.log(gameBaseConfigs)

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
    if (gameStatus === 'Active') { buttonText = '<button>Resume</button>'}
    else if (gameStatus === 'Paused') {buttonText = (user === host) ? '<button>Resume</button>' : ''}
    else if (gameStatus === 'Joinable') {buttonText = (user === host) ? '<button>Start</button>' : ((players.includes(user)) ? '' : '<button>Join</button>')}
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

            // For each set of configurations, split it into two parts (label and select)
            const left = document.createElement('div')
            left.classList.add('left')
            const right = document.createElement('div')
            right.classList.add('right')
            const farRight = document.createElement('div')
            farRight.classList.add('farRight')
            mainSettings.appendChild(left)
            mainSettings.appendChild(right)
            mainSettings.appendChild(farRight)

            // =================================== //
            // Add the people involved in the game
            // =================================== //
            if (section === 'Game') {
                const playersContainer = document.createElement('div')
                playersContainer.id = 'playersContainer'
                settingContainer.appendChild(playersContainer)

                // create the headers
                {
                    const div = document.createElement('label');
                    div.className = 'playerRow'
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
                        div.className = 'playerRow'
                        playersContainer.appendChild(div);

                        // Add the first span, sort symbol if the user is the same as the host
                        const reorder = document.createElement('span')
                        host === user ? reorder.textContent = '≡' : reorder.textContent = ' '
                        div.appendChild(reorder)

                        // Add the name to the player div element
                        playerName = document.createElement('span')
                        playerName.textContent = `${name}${name === host ? ' (host)' : ''}`;
                        div.appendChild(playerName)

                        // Make the players draggable - must be in a joinable state and the user must also be the host
                        if (host === user) {
                            div.classList.add('draggable');
                            div.setAttribute('draggable', 'true');
                        }

                        // Add the player status check box
                        const playerStatus = document.createElement('input')
                        playerStatus.type = 'checkbox'
                        playerStatus.id = name
                        playerStatus.checked = playerReadyStatuses[name]
                        playerStatus.disabled = !(name === user)
                        div.appendChild(playerStatus)

                        // Add the ✖️ for removing / booting a player
                        if (host === user) {
                            const removePlayer = document.createElement('span')
                            if (name !== host) {removePlayer.innerHTML = `<span onclick="removePlayer('${name}')">✖️</span>`}
                            div.appendChild(removePlayer)
                        }
                    });

                // Add the draggable functionality
                if (host === user) {

                    let dragged = null;
                    let placeholder = document.createElement('div');
                    placeholder.className = 'drag-placeholder';

                    playersContainer.addEventListener('dragstart', (e) => {
                        if (e.target.classList.contains('draggable')) {
                            dragged = e.target;
                            e.dataTransfer.effectAllowed = 'move';

                            setTimeout(() => {
                                dragged.style.display = 'none';
                            }, 0);
                        }
                    });

                    playersContainer.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        const target = e.target;

                        if (!target.classList.contains('draggable')) return;

                        const bounding = target.getBoundingClientRect();
                        const offset = e.clientY - bounding.top;

                        if (offset < bounding.height / 2) {
                            playersContainer.insertBefore(placeholder, target);
                        } else {
                            playersContainer.insertBefore(placeholder, target.nextSibling);
                        }
                    });

                    playersContainer.addEventListener('drop', (e) => {
                        e.preventDefault();
                        if (placeholder.parentNode) {
                            playersContainer.insertBefore(dragged, placeholder);
                            placeholder.remove();
                        }
                    });

                    playersContainer.addEventListener('dragend', () => {
                        dragged.style.display = ''
                        placeholder.remove();
                    });
                }
            }

            // for items in a section (second level of the json object)
            for (const [optionName, optionData] of orderObject(options, 'order')) {
                if (optionName !== "Name" || !optionData.value.includes("s Game")) {
                    const label = document.createElement('p');
                    label.textContent = optionName.replace(/_/g, ' ');

                    const select = document.createElement('p');
                    select.textContent = optionData.value

                    // Add the description information
                    if (section in gameBaseConfigs && optionName in gameBaseConfigs[section] && 'description' in gameBaseConfigs[section][optionName]) {
                            const info = document.createElement('p')
                            info.innerHTML = `<p title = "${gameBaseConfigs[section][optionName]['description']}" style = "cursor: help; margin-left: 0.25em;">ℹ️</p>`
                            farRight.appendChild(info)
                    }

                    left.appendChild(label)
                    right.appendChild(select)
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
    if (   event.target.closest('.game-details')
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