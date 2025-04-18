const activeGames = document.getElementById("activeGames");
const gameCounts = {};
const user = JSON.parse(localStorage.getItem('user')).username
const computerDifficulties = ['Easy', 'Normal', 'Hard']

const socket = io.connect(`${BASE_URL}`);

// Listen for game updates
socket.on('game_update', (data) => {
    console.log("Game updated:", data);
    // updateGameList(data);
});

function loadGames(game) {
    // Close the menu
    const body = document.body;
    body.classList.remove('sidebar-open');

    document.getElementById('buttons').style.display = 'flex'

    const currentGame = game.replace(/\s+/g, "").toLowerCase();
    const games = JSON.parse(localStorage.getItem('activeGames')).filter(item => item.game.replace(/\s+/g, "").toLowerCase() == currentGame && (item.status === 'Joinable' || item.players.some(p => p.Name === user)))

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

    const creating = document.createElement('div')
    creatingText = document.createElement('h4')
    creatingText.className = 'gameState'
    creatingText.textContent = 'Create Game'
    creating.id = 'creating'
    creating.style.display = "none"
    creating.appendChild(creatingText)

    activeGames.appendChild(active)
    activeGames.appendChild(paused)
    activeGames.appendChild(joinable)
    activeGames.appendChild(creating)

    const sortedGames = games
        .sort((a, b) => {
            const aUserIn = a.players.some(p => p.Name === user);
            const bUserIn = b.players.some(p => p.Name === user);

            // Prioritize games where user is a player
            if (aUserIn !== bUserIn) {
                return aUserIn ? -1 : 1;
            }

            // Then sort by available spots (ascending)
            const aSpotsLeft = a.maxPlayers - a.players.length;
            const bSpotsLeft = b.maxPlayers - b.players.length;

            return aSpotsLeft - bSpotsLeft;
        });

    sortedGames.forEach(g => addGameElement(g.id));
}

function formatDuration(seconds, useFullUnits = true) {
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
            if (useFullUnits) { parts.push(`${unitAmount} ${label}${unitAmount > 1 ? 's' : ''}`) }
            else { parts.push(`${unitAmount} ${label[0]}`) }
            seconds %= value;
        }
    }

    if (parts.length === 0) return '0 seconds';
    if (parts.length === 1) return parts[0];

    // Join with commas and 'and' before the last part
    if (useFullUnits) { return parts.slice(0, -1).join(', ') + ' ' + parts.slice(-1) }
    else { return parts.slice(0, -1).join(', ') + ' ' + parts.slice(-1) }
}

function swapDifficulty(element) {
    const difficulty = element.textContent
    const index = computerDifficulties.indexOf(difficulty)
    const newDifficulty = (index < computerDifficulties.length - 1) ? computerDifficulties[index + 1] : computerDifficulties[0];

    element.textContent = newDifficulty
}

function addComputer(element, gameStatus, host) {
    const botNames = [
        "AlphaBot", "BotimusPrime", "DataStorm", "RoboRex", "CircuitSurge", "QuantumBot", "Botzilla", "RAMbo", "BitBandit", "ByteSize", "AutoMate"
    ];

    const container = element.closest('.playersContainer')
    const playerCount = container.children.length - 2
    const totalCount = parseInt(element.closest('.game-details').querySelector(`select[name="Players"]`).value)

    if (totalCount >= (playerCount + 1)) {
        // Get the current players
        let names = []
        for (const child of container.children) {
            const span = child.querySelectorAll('span')[1];
            if (span) {
                let name = span.textContent.replace(' Hard', '').replace(' Easy', '').replace(' Normal', '').replace(' (Host)', '')
                names.push(name)
            }
        }

        let randomName;

        do {
            randomName = botNames[Math.floor(Math.random() * botNames.length)];
        } while (names.includes(randomName));

        const div = createplayersElement({ "Name": randomName, "Type": "Computer", "Difficulty": "Normal" }, { randomName: "true" }, gameStatus, host)
        container.insertBefore(div, container.lastChild)
    }
    else {
        alert(`Please increase the player count or remove a player from the game before adding a computer`)
    }

    adjustPlayerCount(element)
}

function createplayersElement(playerObject, playerReadyStatuses, gameStatus, host) {
    const name = playerObject.Name
    const div = document.createElement('label');
    div.className = (user === host && gameStatus === "Joinable") ? 'playerRow' : 'playerRowStatic'

    // Add the first span, sort symbol if the user is the same as the host
    const reorder = document.createElement('span')
    if (host === user && gameStatus === "Joinable") { reorder.textContent = '≡' }
    else { reorder.textContent = ' ' }
    div.appendChild(reorder)

    // Add the name to the player div element
    playerName = document.createElement('span')
    playerName.innerHTML = `${name}${name === host ? ' (Host)' : ''}${playerObject?.Type === 'Computer' ? ' <button style = "margin-left: 2em; padding: 0.25em 1em;"' + ((gameStatus === "Joinable" && host === user) ? ' onclick="swapDifficulty(this)">' : ' disabled>') + playerObject?.Difficulty + '</button>' : ''}`;
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
        const bootPlayer = document.createElement('span')
        if (name !== host) { bootPlayer.innerHTML = `<span class='removePlayer' onclick="removePlayer(this, event)">✖️</span>` }
        div.appendChild(bootPlayer)
    }

    return div
}

function createplayersElements(players, playerReadyStatuses, gameStatus, host, id) {
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

    // Add the 'Add Computer' button
    if (gameStatus === "Joinable" && user === host) {
        const div = document.createElement('label');
        div.className = 'computerRowStatic'
        playersContainer.appendChild(div);

        // Add the first span, sort symbol if the user is the same as the host
        const addComputerElement = document.createElement('button')
        addComputerElement.textContent = 'Add Computer'
        addComputerElement.onclick = function () {
            addComputer(this, gameStatus, host)
        }
        div.appendChild(addComputerElement)
    }

    players.forEach((playerObject) => {
        const div = createplayersElement(playerObject, playerReadyStatuses, gameStatus, host)
        if (gameStatus === "Joinable" && host === user) {
            playersContainer.insertBefore(div, playersContainer.lastChild)
        }
        else {
            playersContainer.appendChild(div);
        }
    });


    return playersContainer
}

function closeGames(idIgnoreList = []) {
    const activeGames = Array.from(document.querySelectorAll('.game-details')).filter(el => !idIgnoreList.includes(el.parentElement.id))

    activeGames.forEach((gameEl) => {
        gameEl.style.display = 'none';
    });
}

/**
 * This will add all information for an Active, Paused, or Joinable game directly to the DOM
 *
 * @param {number} id - The id (as it comes from supabase) for the given game
 * @returns {void} - This builds all necessary elements and adds them directly to the DOM
 */
function addGameElement(id) {
    // Pull the configurations from the local storage
    const data = JSON.parse(localStorage.getItem('activeGames')).filter(item => item['id'] == id)[0]
    const activeConfigs = data['configurations']

    const game = data['game'].replace(/\s+/g, "").toLowerCase()
    const gameName = activeConfigs['Game']['Name']['value']
    const gameStatus = data['status']
    const players = data['players']
    const host = data['host']
    const playerReadyStatuses = data['player_is_ready_statuses']
    const maxPlayers = data['max_players']
    const isLocked = data['password']

    let previousValues = new WeakMap()

    // Bring in the general configurations for descriptions
    const gameBaseConfigs = JSON.parse(localStorage.getItem('playableGames')).filter(item => item['game'].replace(/\s+/g, "").toLowerCase() === game)[0]['configurations']

    // ============================================================ //
    // Create the top container for the game (The actual active game) //
    // ============================================================ //
    const container = document.createElement('div');
    container.classList.add('game-item');
    if (players.some(p => p.Name === user)) { container.classList.add('included'); }
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
    // const lockText = (gameStatus === "Joinable" && isLocked) ? ((!players.some(p => p.Name === user)) ? `<span>🔒</span>` : `<span>🔓✅</span>`) : `<span></span>`
    const lockText = (gameStatus === "Joinable" && isLocked) ? ((!players.some(p => p.Name === user)) ? `<img src="https://assets.dryicons.com/uploads/icon/svg/3534/lock.svg" style="height: 1.25em"></img>` : `<img src="https://assets.dryicons.com/uploads/icon/svg/3769/unlock.svg" style = "height: 1.25em"></img>`) : `<span></span>`
    let buttonText = null
    if (gameStatus === 'Active') { buttonText = '<button>Resume</button>' }
    else if (gameStatus === 'Paused') { buttonText = (user === host) ? '<button>Resume</button>' : '' }
    else if (gameStatus === 'Joinable') { buttonText = (user === host) ? '<button>Start</button>' : ((players.some(p => p.Name === user)) ? '<button onclick = "leaveGame(this)">Leave</button>' : '<button onclick = "joinGame(this)">Join</button>') }
    header.innerHTML = `
        ${lockText}
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
        const playersContainer = createplayersElements(players, playerReadyStatuses, gameStatus, host, user, id)
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
            details.appendChild(settingContainer);


            // The principal settings (everything in the configurations object from supabase)
            const mainSettings = document.createElement('div')
            mainSettings.classList.add('setting-row');
            settingContainer.appendChild(mainSettings)

            // =================================== //
            // Add the people involved in the game
            // =================================== //
            if (section === 'Game') {
                const playersContainer = createplayersElements(players, playerReadyStatuses, gameStatus, host, id)
                settingContainer.appendChild(playersContainer)
            }


            // for items in a section (second level of the json object)
            for (const [optionName, optionData] of orderObject(options, 'order')) {
                if (optionName !== "Name" || !optionData.value.includes("s Game")) {
                    const [label, select, info] = createSetting(game, gameBaseConfigs, section, optionName, optionData, mainSettings, 'value')

                    //     // Keep track of the initial / old values + add event listener to watch for changes
                    if (optionName.toLowerCase() === 'players') {
                        previousValues.set(select, select.value)

                        select.addEventListener('change', event => {
                            const newValue = event.target.value;
                            const oldValue = previousValues.get(select);
                            const minimumPlayers = gameBaseConfigs?.Game?.Players?.min
                            const maximumPlayers = gameBaseConfigs?.Game?.Players?.max

                            const totalCount = parseInt(select.parentElement.querySelector(`select[name="Players"]`).value)
                            // const gameHeader = select.closest('.game-item').querySelector(`span.player-count`)
                            const playerCount = select.closest('.game-item').querySelector('.playersContainer').children.length - 2

                            // Example validation logic
                            if (totalCount > maximumPlayers || totalCount < minimumPlayers) {
                                alert(`Sorry, You can't have that many players: ${minimumPlayers} <= Players + Computers <= ${maximumPlayers}`);
                                select.value = oldValue;
                            } else if (totalCount < playerCount) {
                                alert(`Sorry, You can't have more players in the game than the game settings allow. Please remove a player before lowering the ${optionName.toLowerCase()} count`)
                                select.value = oldValue;
                            } else {
                                previousValues.set(select, newValue);
                                // gameHeader.textContent = `${playerCount} / ${totalCount} playe${(totalCount > 1) ? 'rs' : 'r'}`
                                adjustPlayerCount(select)
                            }
                        });
                    }

                    if (label && select && info) {
                        mainSettings.appendChild(label)
                        mainSettings.appendChild(select)
                        mainSettings.appendChild(info)
                    }
                }
            }
        }
    }

}

function adjustPlayerCount(element) {
    const host = JSON.parse(localStorage.getItem('activeGames')).filter(item => item['id'] == element.closest('.game-item').id)[0]['host']
    const gameHeader = element.closest('.game-item').querySelector(`span.player-count`)

    let playerCount = undefined
    let totalCount = undefined

    if (user !== host) { playerCount = element.closest('.game-item').querySelector('.playersContainer').children.length - 1 }
    else { playerCount = element.closest('.game-item').querySelector('.playersContainer').querySelectorAll('.playerRow').length }

    if (user !== host) { totalCount = parseInt(Array.from(element.closest('.game-item').querySelectorAll('p')).find(el => el.textContent.trim() === 'Players').nextElementSibling.textContent) }
    else { totalCount = parseInt(element.closest('.game-item').querySelector(`select[name="Players"]`).value) }

    gameHeader.textContent = `${playerCount} / ${totalCount} playe${(totalCount > 1) ? 'rs' : 'r'}`

}

function castValue(value) {
    if (typeof value !== "string") return value;

    const trimmed = value.trim();

    // Try JSON parse (handles numbers, booleans, null, arrays, objects)
    try {
        return JSON.parse(trimmed);
    } catch { }

    // Handle non-JSON booleans like "True", "FALSE", etc.
    const lowered = trimmed.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
    if (lowered === "null") return null;
    if (lowered === "undefined") return undefined;

    // Fallback: original string
    return value;
}

async function createGame() {
    const header = document.getElementById('activeGames').querySelector('h2')
    const game = header.textContent

    const settings = document.getElementById('creating').querySelector('.game-details')
    const sections = settings.querySelectorAll('h4')
    const sectionsData = settings.querySelectorAll('.setting-row')

    let data = {}
    let configurations = {}
    for (let i = 0; i < sections.length; i++) {
        let datum = {}
        Array.from(sectionsData[i].querySelectorAll('input, select')).forEach(child => {
            if (child.name === 'Name') {
                datum[child.name] = { "value": (child.value !== "") ? child.value.replace("'s Game", "").replace("'s", "") + "'s Game" : `${user}'s Game` }
            }
            else if (child.name === 'Password') { data['password'] = (child.value === "") ? null : castValue(child.value) }
            else {
                datum[child.name] = { "value": (child.value === "") ? null : castValue(child.value) }

                if (child.name === 'Players') { data['max_players'] = parseInt(child.value) }
            }
            configurations[sections[i].textContent.replace(/\s+/g, "_")] = datum
        })
    }
    data['game'] = game
    data['status'] = "Joinable"
    data['host'] = user
    data['configurations'] = configurations
    data['players'] = [{ "Name": user, "Type": "Human" }]
    data['player_is_ready_statuses'] = { [user]: false }

    response = await fetch(`${BASE_URL}/lobby/create_game`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (response.status == 201) {
        // Reset the page
        header.textContent = `${game} - Available Games`
        document.getElementById('createButton').onclick = () => { createGameTemplate() }
        loadGames(game)
    }
    else {
        const error = await response.json()
        alert(`Failed to create the game: ${error}`)
    }
}

async function joinGame(element) {
    // Make sure there is room to add another player
    const playerCount = element.closest('.game-item').querySelector('.playersContainer').children.length - 1
    const totalCount = parseInt(Array.from(element.closest('.game-item').querySelectorAll('p')).find(el => el.textContent.trim() === 'Players').nextElementSibling.textContent)
    if (playerCount >= totalCount) {
        alert(`Too many players, please select a different game to join`)
        return
    }

    // Grab the Host
    const host = JSON.parse(localStorage.getItem('activeGames')).filter(item => item['id'] == element.closest('.game-item').id)[0]['host']

    // Check the passcode
    const id = element.closest('.game-item').id
    const passwordRequired = JSON.parse(localStorage.getItem('activeGames')).filter(item => item['id'] == id)[0]['password']
    let password = undefined
    if (passwordRequired) {
        password = prompt("Please enter the passcode")
        response = await fetch(`${BASE_URL}/lobby/check_password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"password" : password, 'id' : id})
        });

        // Verify the password was correct
        if (response.status == 201) {
            const data = await response.json()
            if (!data.data) { alert(`Incorrect Password`); return;}
        }
        else {
            const error = await response.json()
            alert(`Failed to check the password; error: ${error}`)
            return
        }
    }


    // Add the player
    const container = element.closest('.game-item').querySelector('.playersContainer')
    const div = createplayersElement({ "Name": user, "Type": "Human" }, { user: "false" }, "Joinable", host)
    container.appendChild(div)

    // Adjust the player count
    adjustPlayerCount(div)
    
    // Change the 'Join' button to a 'Leave' button
    element.textContent = 'Leave'
    element.onclick = function () { leaveGame(this) }

    // Change the 'lock' image to the 'unlock' image
    const lock = element.closest('.game-item').querySelector('img')
    lock.src = "https://assets.dryicons.com/uploads/icon/svg/3769/unlock.svg"
}

function leaveGame(element) {
    const el = Array.from(element.closest('.game-item').querySelectorAll('span')).find(el => el.textContent.trim() === user)
    removePlayer(el)
    adjustPlayerCount(element)
    element.textContent = 'Join'
    element.onclick = function () { joinGame(this) }
}

function viewRules() { alert("View Rules Clicked"); }

async function deleteGame(el, game) {
    const confirmation = confirm(`You are about to delete "${el.closest('.game-header').querySelector('span').textContent}". This action CANNOT be undone.`)
    if (!confirmation) { return }

    const id = el.closest('.game-item').id

    response = await fetch(`${BASE_URL}/lobby/delete_game`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(id)
    });

    if (response.status == 201) { console.log('Game Deleted')}
    else {
        const error = await response.json()
        alert(`Failed to Remove game: ${error}`)
        return
    }

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

async function getActiveGames() {
    try {
        const response = await fetch(`${BASE_URL}/lobby/get_active_games`);
        const data = await response.json();

        if (data.error) {
            console.error("Error fetching games:", data.error);
            return;
        }

        localStorage.setItem("activeGames", JSON.stringify(data));
    } catch (error) {
        console.error("Failed to fetch games:", error);
    }
}

function resetGameList(games) {
    const sidebar = document.getElementById('sidebar')
    const gameList = document.createElement('ul')
    gameList.id = "gamesList"
    gameList.className = "game-list"

    gameList.innerHTML = "";  // Clear existing list
    sidebar.appendChild(gameList)

    games.forEach(game => {
        const li = document.createElement("li");
        const gameId = game.game.replace(/\s+/g, "").toLowerCase()
        li.innerHTML = `<span>${game.game}</span>`
        const currentCount = JSON.parse(localStorage.getItem('activeGames')).filter(item => item.game.replace(/\s+/g, "").toLowerCase() == gameId && (item.status === 'Joinable' || item.players.some(p => p.Name === user))).length

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

    // Start with the sidebar open
    const body = document.body;
    body.classList.add('sidebar-open');

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

    closeGames(['creating'])
    if (details) { details.style.display = state ? 'block' : 'none'; }


})

function removePlayer(element, event = undefined) {
    if (event) { event.stopPropagation() }

    let tempElement = element.closest('.playerRow')
    if (tempElement === null) { tempElement = element.closest('.playerRowStatic') }
    tempElement = tempElement.parentElement

    let row = element.closest('.playerRow')
    if (row !== null) { row.remove() }
    else { element.closest('.playerRowStatic').remove() }

    adjustPlayerCount(tempElement)
}

function range(start, end, step = 1) {
    const result = [];
    for (let i = start; (step > 0 ? i < end : i > end); i += step) {
        result.push(i);
    }
    return result;
}

function getAcceptableValues(game, section, option) {
    const configs = JSON.parse(localStorage.getItem('playableGames')).filter(item => item.game.replace(/\s+/g, "").toLowerCase() == game.replace(/\s+/g, "").toLowerCase())[0].configurations

    let optionConfigs = configs?.[section.replace(/\s+/g, "_")]?.[option]
    let values = []

    if (optionConfigs?.min !== undefined && optionConfigs?.max !== undefined) {
        values.push(...range(optionConfigs.min, optionConfigs.max + 1, (optionConfigs?.step !== undefined) ? optionConfigs.step : 1))
    }
    else if (optionConfigs?.options) {
        values.push(...optionConfigs.options)
    }
    else {
        console.log("Houston... we have a problem")
        console.log(`For the game of ${game}, there seems to be a new config or something wrong with the current configurations`)
        console.log(`Min: ${optionConfigs?.min}, Max: ${optionConfigs?.max}, Options: ${optionConfigs?.options}, Added Options: ${optionConfigs?.addedOptions}`)
    }

    // Add the added options
    if (optionConfigs?.addedOptions) {
        values.push(...optionConfigs.addedOptions)
    }

    return values
}

/**
 * This will add all information for an Active, Paused, or Joinable game directly to the DOM
 *
 * @param {number} id - The id (as it comes from supabase) for the given game
 * @returns {void} - This builds all necessary elements and adds them directly to the DOM
 */
function createGameTemplate() {

    document.getElementById('createButton').onclick = () => { createGame() }

    // Bring in the general configurations for descriptions
    const header = document.getElementById('activeGames').querySelector('h2')
    const game = header.textContent.split(' - ')[0]
    header.textContent = game
    const gameBaseConfigs = JSON.parse(localStorage.getItem('playableGames')).filter(item => item['game'].replace(/\s+/g, "").toLowerCase() === game.replace(/\s+/g, "").toLowerCase())[0]['configurations']

    // ============================================================ //
    // Create the top container for the game (The actual active game) //
    // ============================================================ //

    // Add the container to the Game Status container
    const container = document.getElementById('creating')
    container.style.display = "block"

    // =============================== //
    // Add the game details to the DOM //
    // =============================== //
    const details = document.createElement('div');
    details.classList.add('game-details');
    details.classList.add('included');
    container.appendChild(details);

    // Display the creating container
    const element = document.getElementById('creating')
    element.style.display = "block"
    element.querySelector('.game-details').style.display = "block"
    document.getElementById('joinable').style.display = "none"
    document.getElementById('active').style.display = "none"
    document.getElementById('paused').style.display = "none"

    // for each configuration setting category (first level of the json object) (Game, Game Rules, Timing Settings, etc.)
    for (const [section, options] of orderObject(gameBaseConfigs, 'order')) {
        // Create the configuration setting header
        const sectionHeader = document.createElement('h4');
        sectionHeader.className = 'configSectionName'
        sectionHeader.textContent = section.replace(/_/g, ' ');
        details.appendChild(sectionHeader);

        // The container to hold all settings
        const settingContainer = document.createElement('div');
        details.appendChild(settingContainer);

        // The principal settings (everything in the configurations object from supabase)
        const mainSettings = document.createElement('div')
        mainSettings.classList.add('setting-row');
        settingContainer.appendChild(mainSettings)

        // for items in a section (second level of the json object)
        for (const [optionName, optionData] of orderObject(options, 'order')) {
            const [label, select, info] = createSetting(game, gameBaseConfigs, section, optionName, optionData, mainSettings)

            if (label && select && info) {
                mainSettings.appendChild(label)
                mainSettings.appendChild(select)
                mainSettings.appendChild(info)
            }
        }
    }

}

function createSetting(game, gameBaseConfigs, section, optionName, optionData, mainSettings, valueKey = 'default') {
    // Get / set the Host
    let host = undefined
    try { host = JSON.parse(localStorage.getItem('activeGames')).filter(item => item['id'] == mainSettings.closest('.game-item').id)[0]['host'] }
    catch { host = user }

    const label = document.createElement('p')
    label.dataset.name = optionName;
    label.textContent = optionName.replace(/_/g, ' ');

    const baseData = gameBaseConfigs?.[section]?.[optionName]

    // ======================== //
    //  Check for Dependencies  //
    // ======================== //
    let dependencyMet = true
    if (baseData?.dependentOn) {
        Object.entries(baseData.dependentOn).forEach(([key, value]) => {
            // Get the current value in the DOM
            let DOMValue = Array.from(mainSettings.querySelectorAll('p')).find(
                el => el.textContent.trim() === key.replace(/_/g, ' ')
            );
            DOMValue = DOMValue?.nextElementSibling;
            DOMValue = (DOMValue.tagName === 'P') ? DOMValue.textContent.trim() : DOMValue.value

            if (DOMValue !== value) {
                dependencyMet = false
                return
            }
        })
    }
    if (!dependencyMet) { return [undefined, undefined, undefined] }

    const isOptions = baseData !== undefined && Array.isArray(baseData.options) && baseData.options.length > 0;
    const isRange = baseData !== undefined && baseData?.min !== undefined && baseData?.max !== undefined
    const isAlterable = isOptions || isRange

    // Create the select element
    const select = (user !== host) ? document.createElement('p') : ((isAlterable) ? document.createElement('select') : document.createElement('input'))

    if (isAlterable && user === host) {
        select.name = optionName;
        const acceptableOptions = getAcceptableValues(game, section, optionName)
        acceptableOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = baseData?.units !== undefined ? formatDuration(opt) : opt
            if (opt === optionData[valueKey]) { option.selected = true }
            select.appendChild(option);
        })
    }
    else {
        select.name = optionName
        if (optionName === "Name") { select.placeholder = "required" }
        else if (optionName === "Password") { select.placeholder = "optional" }
        else {
            select.textContent = optionData[valueKey]
        }
    }

    // Add the description information
    const info = document.createElement('p')
    if (section in gameBaseConfigs && optionName in gameBaseConfigs[section] && 'description' in gameBaseConfigs[section][optionName]) {
        info.innerHTML = `<p title = "${gameBaseConfigs[section][optionName]['description']}" style = "cursor: help; margin-left: 0.25em;">ℹ️</p>`
    }

    if (baseData?.dependentFor) {
        select.addEventListener('change', (event) => {
            const targetValue = event.target.value
            const dependentForKeys = baseData?.dependentFor
            dependentForKeys.forEach((dependentFor) => {
                if (gameBaseConfigs[section][dependentFor].dependentOn[event.target.name] === targetValue) {
                    const [l, s, i] = createSetting(game, gameBaseConfigs, section, dependentFor, gameBaseConfigs[section][dependentFor], mainSettings, valueKey = 'default')
                    mainSettings.insertBefore(i, event.target.nextElementSibling.nextElementSibling)
                    mainSettings.insertBefore(s, event.target.nextElementSibling.nextElementSibling)
                    mainSettings.insertBefore(l, event.target.nextElementSibling.nextElementSibling)
                }
                else {
                    const dependentElement = Array.from(event.target.closest('.setting-row').querySelectorAll('p')).find(el => el.textContent.replace(/\s+/g, "_").trim() === dependentFor)
                    dependentElement.nextElementSibling.remove()
                    dependentElement.nextElementSibling.remove()
                    dependentElement.remove()
                }
            })
        })
    }


    return [label, select, info]
}

// Start Up
createHeader(true)
getActiveGames()
getPlayableGames()