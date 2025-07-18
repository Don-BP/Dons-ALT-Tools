// js/tools/bingo-picker.js

import { getAvailableFlashcardDecks, playSound, setScoreboardReturnState } from '../utils.js';

export function initBingoPicker() {
    // --- DOM Elements ---
    const toolCard = document.getElementById('bingo-tool');
    const bingoListSelect = document.getElementById('bingo-list-select');
    const bingoListInput = document.getElementById('bingo-list-input');
    const bingoPickBtn = document.getElementById('bingo-pick-btn');
    const bingoResetBtn = document.getElementById('bingo-reset-btn');
    const goToScoreboardBtn = document.getElementById('bingo-goto-scoreboard-btn'); // New Button
    const bingoPickedItemDisplay = document.getElementById('bingo-picked-item-display');
    const bingoPickedContainer = document.getElementById('bingo-picked-container');
    const bingoPickedList = document.getElementById('bingo-picked-list');

    // --- State ---
    let bingoPool = [];
    let bingoPickedItems = [];

    // --- Core Functions ---
    function renderBingoPickedList() {
        bingoPickedList.innerHTML = '';
        bingoPickedItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'bingo-picked-card';
            if (item.image) {
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.text;
                card.appendChild(img);
            }
            const textSpan = document.createElement('span');
            textSpan.textContent = item.text;
            card.appendChild(textSpan);
            bingoPickedList.appendChild(card);
        });
        bingoPickedContainer.classList.toggle('hidden', bingoPickedItems.length === 0);
    }

    function updateBingoDisplay(item) {
        bingoPickedItemDisplay.innerHTML = '';
        if (item && item.image) {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'bingo-image-wrapper';
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.text;
            imgWrapper.appendChild(img);
            bingoPickedItemDisplay.appendChild(imgWrapper);
        }
        const textDiv = document.createElement('div');
        textDiv.textContent = item ? item.text : 'BINGO!';
        bingoPickedItemDisplay.appendChild(textDiv);
    }

    async function resetBingo() {
        bingoPool = [];
        bingoPickedItems = [];
        
        const selectedSource = bingoListSelect.value;
        bingoListInput.classList.toggle('hidden', selectedSource !== 'custom');

        if (selectedSource === 'custom') {
            const customItems = bingoListInput.value.split('\n').map(item => item.trim()).filter(item => item !== '');
            bingoPool = customItems.map(item => ({ text: item }));
        } else if (selectedSource) {
            const allDecks = await getAvailableFlashcardDecks();
            const deck = allDecks[selectedSource] || [];
            bingoPool = [...deck].filter(card => !card.muted && ((card.text && card.text.trim() !== '') || card.image));
        }
        
        for (let i = bingoPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bingoPool[i], bingoPool[j]] = [bingoPool[j], bingoPool[i]];
        }
        
        updateBingoDisplay(null);
        renderBingoPickedList();
    }

    async function pickBingoItem() {
        if (bingoPool.length === 0 && bingoPickedItems.length === 0) {
            await resetBingo();
        }
        
        if (bingoPool.length === 0) {
            updateBingoDisplay({ text: bingoPickedItems.length > 0 ? 'All Done!' : 'Add Items!' });
            return;
        }

        const pickedItem = bingoPool.pop();
        bingoPickedItems.push(pickedItem);
        
        updateBingoDisplay(pickedItem);
        renderBingoPickedList();
        playSound('assets/sounds/select.mp3');
    }

    // --- Event Listeners ---
    bingoPickBtn.addEventListener('click', pickBingoItem);
    bingoResetBtn.addEventListener('click', resetBingo);
    bingoListSelect.addEventListener('change', resetBingo);
    bingoListInput.addEventListener('input', () => {
        if (bingoListSelect.value === 'custom') {
            resetBingo();
        }
    });

    // New listener for the scoreboard button
    goToScoreboardBtn.addEventListener('click', () => {
        // 1. Set the state so the scoreboard knows where to return.
        setScoreboardReturnState('bingo-tool');

        const scoreboardCard = document.getElementById('scoreboard-tool');
        const scoreboardFullscreenBtn = scoreboardCard?.querySelector('.fullscreen-btn');

        // Check if Bingo Picker is currently in fullscreen mode.
        if (toolCard.classList.contains('fullscreen-mode')) {
            // If so, exit our own fullscreen first, then enter the scoreboard's.
            const bingoFullscreenBtn = toolCard.querySelector('.fullscreen-btn');
            bingoFullscreenBtn?.click();
            
            setTimeout(() => {
                scoreboardFullscreenBtn?.click();
            }, 50);
        } else {
            // If we are in grid view, we can go straight to the scoreboard's fullscreen.
            scoreboardFullscreenBtn?.click();
        }
    });


    // --- Initial setup ---
    resetBingo();
}