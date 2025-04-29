const game_id = window.gameId;
createHeader()

function sortHeartsCards(cardPaths) {
    const rankOrder = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
        '7': 7, '8': 8, '9': 9, '10': 10,
        'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
    };

    const suitOrder = {
        'clubs': 0,
        'diamonds': 1,
        'spades': 2,
        'hearts': 3
    };

    function extractCardInfo(path) {
        // Remove path and decode URI parts
        const filename = decodeURIComponent(path.split('/').pop().replace('.svg', ''));
        const [rank, , suit] = filename.split(' '); // split into [rank, "of", suit]
        return { rank, suit };
    }

    return cardPaths.slice().sort((a, b) => {
        const cardA = extractCardInfo(a);
        const cardB = extractCardInfo(b);

        if (suitOrder[cardA.suit] !== suitOrder[cardB.suit]) {
            return suitOrder[cardA.suit] - suitOrder[cardB.suit];
        } else {
            return rankOrder[cardA.rank] - rankOrder[cardB.rank];
        }
    });
}

function orderHand() {
    const container = document.querySelector('#hand');
    const cards = container.querySelectorAll('.card');

    // Get the correct ordering
    const order = sortHeartsCards(Array.from(cards).map(el => el.src))

    // Order the HTML elements (cards)
    Array.from(cards).forEach((card, index) => {
        card.src = order[index]
    })
}

function fanCards() {
    orderHand()
    const angleStep = 0.75 // degrees
    const container = document.querySelector('#hand');
    const cards = container.querySelectorAll('.card');
    const numCards = cards.length;
    const translateStep = 0.4 - ((numCards >= 30 ? 30 : (numCards <= 5 ? 5 : numCards)) / 30) * 0.3
    const middle = (numCards - 1) / 2;

    const maxWidth = window.innerWidth * 0.95; // 90vw

    // Compute dynamic margin to fit all cards within maxWidth
    const cardWidth = cards[0].offsetWidth;
    let spacing = (maxWidth - cardWidth) / (numCards - 1);
    const minSpacing = 0.75 * parseFloat(getComputedStyle(document.documentElement).fontSize); // ~2vh (roughly)
    const maxSpacing = cardWidth / 2

    // Clamp spacing so cards still overlap at some point
    spacing = Math.min(spacing, maxSpacing)
    spacing = Math.max(spacing, minSpacing);

    cards.forEach((card, i) => {
        const offset = Math.pow(i - middle, 2);
        const angle = (i - middle) * angleStep;
        const translateY = offset * translateStep;

        // Set transition (only needs to be set once, harmless to set every time)
        card.style.transition = 'transform 0.2s ease, margin-left 0.2s ease';

        // Set the properties that the CSS will leverage
        card.style.setProperty('--card-rotate', `${angle}deg`);
        card.style.setProperty('--card-translateY', `${translateY}px`);

        // card.style.transform = `rotate(${angle}deg) translateY(${translateY}px)`;
        // card.style.transformOrigin = 'bottom center';

        card.style.marginLeft = `${-cardWidth + spacing}px`;


        // When ready, add an event listener for mobile touch
        // card.addEventListener('touchstart', () => {
        // card.style.setProperty('--card-translateY', card.getPropertyValue('--card-translateY') )
        // });

        // card.addEventListener('touchend', () => {
        //     card.style.transform = `rotate(${card.style.getPropertyValue('--card-rotate')}) translateY(${card.style.getPropertyValue('--card-translateY')})`;
        // });
    });

    // Reset first card margin
    if (cards[0]) cards[0].style.marginLeft = '0';
}

function positionPlayCards() {
    const container = document.querySelector('#play-area');
    const playerCards = container.querySelectorAll('.player-card');
    const players = document.querySelectorAll('.player')
    const numPlayers = playerCards.length;

    const radius = container.offsetWidth / 3;

    // Note, the wrapper is the div containing the img for the card
    playerCards.forEach((wrapper, i) => {
        const angleDeg = (360 / numPlayers) * i + 90;
        const angleRad = angleDeg * (Math.PI / 180);

        const x = radius * Math.cos(angleRad);
        const y = radius * Math.sin(angleRad);

        // Position the wrapper at the correct spot AND rotate it
        // wrapper.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        wrapper.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angleDeg + 270}deg)`;

        // Rotate the card to face the center of the circle
        // const card = wrapper.querySelector('.play-card');
        // card.style.transform = `rotate(${angleDeg + 270}deg)`; // faces center
    });

    // The wrapper is the main div for the player profile
    const angleOffsets = [0, 0, 0, 54, 59, 52, 59]
    const radii = [1, 1, 1, 1.55, 1.55, 1.45, 1.65]
    players.forEach((wrapper, i) => {
        const angleDeg = (360 / numPlayers) * i + angleOffsets[numPlayers];
        const angleRad = angleDeg * (Math.PI / 180);

        const x = radii[numPlayers] * radius * Math.cos(angleRad);
        const y = radii[numPlayers] * radius * Math.sin(angleRad);

        // Position the wrapper at the correct spot AND rotate it
        wrapper.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        // wrapper.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angleDeg + 270}deg)`;
        wrapper.style.zIndex = 10;

        // Rotate the card to face the center of the circle
        // const card = wrapper.querySelector('.play-card');
        // card.style.transform = `rotate(${angleDeg + 270}deg)`; // faces center
    });
}

function animateCardMove(cardElement, targetContainer) {
    const rectStart = cardElement.getBoundingClientRect();
    
    // Create a clone
    const clone = cardElement.cloneNode(true);
    document.body.appendChild(clone);

    // Hide the original element
    cardElement.style.display = "none"
    if (targetContainer.closest('#hand')) { targetContainer.closest('#hand').appendChild(cardElement); }
    else { targetContainer.appendChild(cardElement); }
    
    // Style it to overlay exactly on top of the original
    clone.style.position = 'absolute';
    clone.style.left = rectStart.left + 'px';
    clone.style.top = rectStart.top + 'px';
    clone.style.width = rectStart.width + 'px';
    clone.style.height = rectStart.height + 'px';
    clone.style.transition = 'all 0.5s ease';
  
    // Calculate target position
    const rectEnd = targetContainer.getBoundingClientRect();
    
    // Force reflow so the browser acknowledges initial position
    void clone.offsetWidth;
  
    // Animate it to the new location
    clone.style.left = rectEnd.left + 'px';
    clone.style.top = rectEnd.top + 'px';
    clone.style.width = rectStart.width + 'px';
    clone.style.height = rectStart.height + 'px';
  
    // Reset the hand
    setTimeout(() => {
        clone.remove(); // Remove the flying clone
        cardElement.style.display = ""
        fanCards()
    }, 375)

  }

function shiftCardsInPassModal() {
    const passModal = document.getElementById('pass-modal')
    const cardSlots = passModal.querySelectorAll('.card-slot')
    const cards = Array.from(cardSlots).map(el => el.querySelector('img'))

    // Shift the cards, if necessary
    if (!cards[0]) {
        if (cards[1]) {
            animateCardMove(cards[1], cardSlots[0])
            if (cards[2]) {animateCardMove(cards[2], cardSlots[1])}
        }
        else if (cards[2]) {animateCardMove(cards[2], cardSlots[0])}
    }
    else if (!cards[1] && cards[2]) {
        animateCardMove(cards[2], cardSlots[1])
    }
}

fanCards()
positionPlayCards()

/*
    Event Listeners
*/
// Fan the cards and setup the play area
window.addEventListener('resize', () => {
    fanCards();
    positionPlayCards();
});

// Move to and from the hand / pass-modal
document.getElementById('hand').addEventListener('click', (event) => {
    // Do nothing if the client selected the entire hand
    if (event.target.id === 'hand') { return; }

    const passModal = document.getElementById('pass-modal')
    const isDisplayed = getComputedStyle(passModal).display === 'none' ? false : true
    if (!isDisplayed) { return }

    // Find the next empty slot
    let cardSlots = passModal.querySelectorAll('.card-slot')
    cardSlots = Array.from(cardSlots).filter(el => el.children.length == 0)

    // Move the card
    if (cardSlots.length > 0) {
        event.target.style.setProperty('--card-rotate', `0deg`);
        event.target.style.setProperty('--card-translateY', `0px`);
        event.target.style.marginLeft = '0px'
        animateCardMove(event.target, cardSlots[0])

        // Change the target container to find the next card in line
        event.target.addEventListener('click', (e) => {
            if (e.target.closest('#hand')) { return; } // Do nothing if the card is already in the hand

            // Identify where the card should go in the hand
            const hand = document.querySelector('#hand');
            let cards = Array.from(hand.querySelectorAll('.card')).map(el => el.src)
            cards.push(e.target.src)
            const order = sortHeartsCards(cards)
            const location = order.indexOf(e.target.src)
            
            // Move the card back into the hand
            animateCardMove(e.target, hand.children[location < hand.childElementCount ? location : location - 4])
            shiftCardsInPassModal()
        })
    }
})