// js/tools/whats-missing.js

import { getAvailableFlashcardDecks, playSound } from '../utils.js';

export function initWhatsMissing() {
    const wmCategorySelect = document.getElementById('whats-missing-category');
    const wmGrid = document.getElementById('whats-missing-grid');
    const wmStatus = document.getElementById('whats-missing-status');
    const wmStartBtn = document.getElementById('whats-missing-start-btn');
    const wmDifficultySelect = document.getElementById('whats-missing-difficulty');
    const wmCardCountSelect = document.getElementById('wm-card-count');
    const wmCustomCardCountInput = document.getElementById('wm-custom-card-count');
    const wmMissingCountSelect = document.getElementById('wm-missing-count');

    let wmMissingItems = [];
    let wmGameState = 'idle'; // idle, showing, hiding, revealed

    function wmRevealAnswer() {
        if (wmGameState !== 'hiding') return;

        wmGameState = 'revealed';
        const hiddenCards = wmGrid.querySelectorAll('.whats-missing-card.wm-invisible');
        
        hiddenCards.forEach(card => {
            card.classList.remove('wm-invisible');
            card.classList.add('revealed');
        });

        playSound('sounds/reveal.mp3');
        
        const missingNames = wmMissingItems.map(item => item.text || '[Image Only]').join(', ');
        if (wmMissingItems.length > 1) {
            wmStatus.textContent = `They were... ${missingNames}!`;
        } else {
            wmStatus.textContent = `It was... ${missingNames}!`;
        }
        
        wmStartBtn.textContent = 'Play Again';
        wmStartBtn.disabled = false;
    }

    async function wmStartGame() {
        // Determine the number of cards, checking for custom input
        let cardCount;
        if (wmCardCountSelect.value === 'custom') {
            cardCount = parseInt(wmCustomCardCountInput.value, 10);
            if (isNaN(cardCount) || cardCount < 2 || cardCount > 50) {
                wmStatus.textContent = 'Please enter a valid custom card count (2-50).';
                return;
            }
        } else {
            cardCount = parseInt(wmCardCountSelect.value, 10);
        }

        const missingCount = parseInt(wmMissingCountSelect.value, 10);
        const difficultySettings = { easy: 6000, normal: 4000, hard: 2500 };
        const category = wmCategorySelect.value;
        const allDecks = await getAvailableFlashcardDecks();
        const rawDeck = allDecks[category] ? [...allDecks[category]] : [];
        const deck = rawDeck.filter(card => !card.muted); // THE FIX IS HERE

        if (!category) {
            wmStatus.textContent = 'Please select a category first!';
            return;
        }

        if (!deck || deck.length < cardCount) {
            wmStatus.textContent = `This category needs at least ${cardCount} active (unmuted) items.`;
            wmGrid.innerHTML = '';
            return;
        }
        
        if (missingCount >= cardCount) {
            wmStatus.textContent = 'Missing cards must be less than total cards.';
            return;
        }

        wmGameState = 'showing';
        wmMissingItems = [];
        wmStatus.textContent = "Look carefully...";
        wmStartBtn.textContent = 'Start Game';
        wmStartBtn.disabled = true;
        wmGrid.innerHTML = '';

        // Dynamically set grid layout instead of using fixed CSS classes
        wmGrid.className = 'whats-missing-grid';
        const cols = Math.ceil(Math.sqrt(cardCount));
        wmGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        const gameItems = deck.slice(0, cardCount);

        gameItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'whats-missing-card';
            
            if (item.image) {
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.text;
                card.appendChild(img);
            }
            const text = document.createElement('span');
            text.textContent = item.text;
            card.appendChild(text);

            wmGrid.appendChild(card);
        });

        setTimeout(() => {
            wmGameState = 'hiding';
            const cards = Array.from(wmGrid.children);
            
            const allIndices = Array.from({ length: cards.length }, (_, i) => i);
            for (let i = allIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
            }
            const indicesToHide = allIndices.slice(0, missingCount);

            indicesToHide.forEach(index => {
                const cardToHide = cards[index];
                wmMissingItems.push(gameItems[index]); 
                cardToHide.classList.add('wm-invisible');
            });

            wmStatus.textContent = "What's missing? (Click grid to reveal)";
        }, difficultySettings[wmDifficultySelect.value] || 4000);
    }

    wmStartBtn.addEventListener('click', wmStartGame);
    wmGrid.addEventListener('click', wmRevealAnswer);

    // Event listener to show/hide the custom input field
    wmCardCountSelect.addEventListener('change', () => {
        const isCustom = wmCardCountSelect.value === 'custom';
        wmCustomCardCountInput.classList.toggle('hidden', !isCustom);
    });
}