// js/tools/mystery-word.js

import { playSound } from '../utils.js';

export function initMysteryWord() {
    // --- DOM Elements ---
    const toolCard = document.getElementById('mystery-word-tool');
    const setupControls = document.getElementById('mw-setup-controls');
    const gameContainer = document.getElementById('mw-game-container');

    const wordInput = document.getElementById('mw-word-input');
    const toggleWordBtn = document.getElementById('mw-toggle-word-btn');
    const themeSelect = document.getElementById('mw-theme-select');
    const triesSelect = document.getElementById('mw-tries-select');
    const startGameBtn = document.getElementById('mw-start-game-btn');

    const visualArea = document.getElementById('mw-visual-area');
    const visualImage = document.getElementById('mw-visual-image');
    const triesDisplay = document.getElementById('mw-tries-display');
    const wordDisplay = document.getElementById('mw-word-display');
    const keyboard = document.getElementById('mw-keyboard');
    const endGameOverlay = document.getElementById('mw-end-game-overlay');
    const endGameMessage = document.getElementById('mw-end-game-message');
    const revealedWord = document.getElementById('mw-revealed-word');
    const playAgainBtn = document.getElementById('mw-play-again-btn');

    const revealWordBtn = document.getElementById('mw-reveal-word-btn');
    const newGameBtn = document.getElementById('mw-new-game-btn');
    const confettiCanvas = document.getElementById('mw-confetti-canvas');


    // --- State ---
    let gameState = 'setup'; // 'setup', 'playing', 'win', 'lose'
    let secretWord = '';
    let guessedLetters = new Set();
    let misses = 0;
    let maxMisses = 7;
    let currentTheme = 'rocket';

    // --- Core Functions ---

    /**
     * **NEW DYNAMIC STATE CALCULATION FUNCTION**
     * Maps the current number of misses to the appropriate visual state number (0-10)
     * to ensure a smooth progression regardless of the maxMisses setting.
     * @param {number} currentMisses - The number of incorrect guesses made so far.
     * @param {number} maxAllowedMisses - The total number of misses allowed.
     * @returns {number} The visual state number to display (e.g., for state-5.png, returns 5).
     */
    function getDynamicStateNumber(currentMisses, maxAllowedMisses) {
        // State 0 is for the initial view before any misses.
        if (currentMisses === 0) {
            return 0;
        }
        // If the player has used all their misses, show the final losing state.
        if (currentMisses >= maxAllowedMisses) {
            return 10;
        }

        // Calculate the proportion of "progress" towards losing.
        // We use (currentMisses - 1) because the first miss is a distinct step.
        // We map the remaining (maxAllowedMisses - 1) misses across the 9 available image states (1-9).
        const progress = (currentMisses - 1) / (maxAllowedMisses - 1);

        // Scale the progress across the intermediate visual states (1 to 9).
        // `1 + progress * 8` maps the progress proportionally between state 1 and state 9.
        const calculatedState = 1 + Math.round(progress * 8);
        
        return calculatedState;
    }

    /**
     * Resets the game to its initial setup state.
     */
    function resetToSetup() {
        gameState = 'setup';
        secretWord = '';
        guessedLetters.clear();
        misses = 0;

        setupControls.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        endGameOverlay.classList.add('hidden');
        
        keyboard.innerHTML = '';
        wordDisplay.innerHTML = '';
        triesDisplay.textContent = '';
        visualImage.src = '';
        
        wordInput.value = '';
        wordInput.type = 'password';
        toggleWordBtn.textContent = 'Show';
    }

    /**
     * Starts a new game with the current settings.
     */
    function startGame() {
        secretWord = wordInput.value.trim(); 
        if (!secretWord) {
            alert('Please enter a word or phrase to start the game.');
            return;
        }

        maxMisses = parseInt(triesSelect.value, 10);
        currentTheme = themeSelect.value;
        gameState = 'playing';
        guessedLetters.clear();
        misses = 0;

        setupControls.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        endGameOverlay.classList.add('hidden');
        
        generateKeyboard();
        renderWord();
        renderVisuals();
    }

    /**
     * Generates the on-screen keyboard buttons.
     */
    function generateKeyboard() {
        keyboard.innerHTML = '';
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const letter of alphabet) {
            const btn = document.createElement('button');
            btn.className = 'mw-key';
            btn.textContent = letter;
            btn.dataset.letter = letter;
            btn.addEventListener('click', () => handleGuess(letter));
            keyboard.appendChild(btn);
        }
    }

    /**
     * Renders the secret word display with blanks and guessed letters.
     */
    function renderWord() {
        wordDisplay.innerHTML = '';
        let allLettersGuessed = true;
        const words = secretWord.split(' ');

        words.forEach(word => {
            const wordWrapper = document.createElement('div');
            wordWrapper.className = 'mw-word-wrapper';

            for (const char of word) {
                const charContainer = document.createElement('div');
                if (guessedLetters.has(char.toUpperCase())) {
                    charContainer.className = 'mw-letter';
                    charContainer.textContent = char;
                } else {
                    charContainer.className = 'mw-blank';
                    allLettersGuessed = false;
                }
                wordWrapper.appendChild(charContainer);
            }
            wordDisplay.appendChild(wordWrapper);
        });

        if (allLettersGuessed && secretWord.length > 0 && gameState === 'playing') {
            handleEndGame(true);
        }
    }
    
    /**
     * Updates the visual theme and tries count based on the number of misses.
     */
    function renderVisuals() {
        triesDisplay.textContent = `Tries Left: ${maxMisses - misses}`;
        
        // --- THIS IS THE FIX ---
        // Call the new function to get the correct image state number.
        const stateNumber = getDynamicStateNumber(misses, maxMisses);
        visualImage.src = `assets/mystery-word/${currentTheme}/state-${stateNumber}.png`;
        visualImage.alt = `${currentTheme} state ${stateNumber} of 10`;
    }

    /**
     * Processes a player's guess from the on-screen keyboard.
     * @param {string} letter - The letter that was guessed (always uppercase).
     */
    function handleGuess(letter) {
        if (gameState !== 'playing' || guessedLetters.has(letter)) {
            return;
        }

        guessedLetters.add(letter);
        const keyButton = keyboard.querySelector(`[data-letter="${letter}"]`);
        
        if (secretWord.toUpperCase().includes(letter)) {
            playSound('assets/sounds/point-up.mp3');
            if (keyButton) keyButton.classList.add('correct');
            renderWord();
        } else {
            playSound('assets/sounds/point-down.mp3');
            if (keyButton) keyButton.classList.add('incorrect');
            misses++;
            renderVisuals();
            if (misses >= maxMisses) {
                handleEndGame(false);
            }
        }
    }
    
    /**
     * Handles the win or lose state of the game.
     * @param {boolean} didWin - True if the player won, false if they lost.
     */
    function handleEndGame(didWin) {
        gameState = didWin ? 'win' : 'lose';
        
        if (didWin) {
            playSound('assets/sounds/winner_reveal.mp3');
            endGameMessage.textContent = '🎉 You Win! 🎉';
            revealedWord.textContent = secretWord;
            triggerConfetti();
        } else {
            playSound('assets/sounds/time-end.mp3');
            endGameMessage.textContent = '😭 Game Over 😭';
            revealedWord.textContent = `The word was: ${secretWord}`;
        }

        endGameOverlay.classList.remove('hidden');
    }

    /**
     * Instantly reveals the full word and ends the game with a win.
     */
    function revealFullWord() {
        if (gameState !== 'playing') return;
        for (const char of secretWord) {
            if (char !== ' ') {
                guessedLetters.add(char.toUpperCase());
            }
        }
        renderWord();
    }
    
    /**
     * Triggers a confetti animation on the dedicated canvas.
     */
    function triggerConfetti() {
        if (typeof confetti !== 'function') return;
        
        const rect = confettiCanvas.getBoundingClientRect();
        const origin = {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight
        };

        confetti({
            particleCount: 150,
            spread: 90,
            origin: origin,
            zIndex: 3000
        });
    }

    // --- Event Listeners ---
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', resetToSetup);
    newGameBtn.addEventListener('click', resetToSetup);
    revealWordBtn.addEventListener('click', revealFullWord);

    toggleWordBtn.addEventListener('click', () => {
        if (wordInput.type === 'password') {
            wordInput.type = 'text';
            toggleWordBtn.textContent = 'Hide';
        } else {
            wordInput.type = 'password';
            toggleWordBtn.textContent = 'Show';
        }
    });

    // --- Init ---
    resetToSetup();
}