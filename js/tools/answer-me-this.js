// js/tools/answer-me-this.js

import { playSound } from '../utils.js';
// UPDATED: Import the new, specific DB functions
import { saveJeopardyGame, getAllJeopardyGames, deleteJeopardyGame, importJeopardyGames } from '../db.js';

export function initAnswerMeThis() {
    // --- DOM Elements ---
    const playModeContainer = document.getElementById('jeopardy-play-mode');
    const editModeContainer = document.getElementById('jeopardy-edit-mode');
    const boardContainer = document.getElementById('jeopardy-board-container');
    const editGameBtn = document.getElementById('jeopardy-edit-game-btn');
    const newGameBtn = document.getElementById('jeopardy-new-game-btn');
    const loadGameSelect = document.getElementById('jeopardy-load-select');
    const gameTitleInput = document.getElementById('jeopardy-game-title-input');
    const saveGameBtn = document.getElementById('jeopardy-save-game-btn');
    const deleteGameBtn = document.getElementById('jeopardy-delete-game-btn');
    const exportGameBtn = document.getElementById('jeopardy-export-game-btn');
    const importGameInput = document.getElementById('jeopardy-import-game-input');
    const playGameBtn = document.getElementById('jeopardy-play-game-btn');
    const editArea = document.getElementById('jeopardy-edit-area');
    const addCategoryBtn = document.getElementById('jeopardy-add-category-btn');
    const clueModal = document.getElementById('jeopardy-clue-modal');
    const clueModalCloseX = document.getElementById('jeopardy-modal-close-x');
    const clueCategory = document.getElementById('jeopardy-clue-category');
    const cluePoints = document.getElementById('jeopardy-clue-points');
    const clueAnswerText = document.getElementById('jeopardy-clue-answer-text');
    const clueImageContainer = document.getElementById('jeopardy-clue-image-container');
    const clueImage = document.getElementById('jeopardy-clue-image');
    const clueQuestion = document.getElementById('jeopardy-clue-question');
    const revealQuestionBtn = document.getElementById('jeopardy-reveal-question-btn');
    
    // --- State ---
    let gameState = {};
    let activeClue = null;
    let headerResizeObserver = null; 
    let pointsResizeObserver = null; 

    // --- Font Sizing Functions ---
    function adjustHeaderTextSize(tile) {
        const span = tile.querySelector('span');
        if (!span) return;
        span.style.whiteSpace = 'normal';
        let currentSize = 80;
        span.style.fontSize = `${currentSize}px`;
        const tileWidth = tile.clientWidth - 20;
        const tileHeight = tile.clientHeight - 20;
        while ((span.scrollWidth > tileWidth || span.scrollHeight > tileHeight) && currentSize > 10) {
            currentSize--;
            span.style.fontSize = `${currentSize}px`;
        }
    }

    // *** START: THIS IS THE FIX (Part 1/2) ***
    // This function now correctly targets the span inside the point tile.
    function adjustPointsTextSize(tileFront) {
        const span = tileFront.querySelector('span');
        if (!span) return;

        span.style.whiteSpace = 'nowrap';
        let currentSize = 80;
        span.style.fontSize = `${currentSize}px`;

        const tileWidth = tileFront.clientWidth - 10;
        const tileHeight = tileFront.clientHeight - 10;

        while ((span.scrollWidth > tileWidth || span.scrollHeight > tileHeight) && currentSize > 10) {
            currentSize--;
            span.style.fontSize = `${currentSize}px`;
        }
    }
    // *** END: THIS IS THE FIX (Part 1/2) ***

    // --- Core Functions ---
    function getNewGameState() {
        return { title: '', categories: [] };
    }

    function switchMode(mode) {
        if (mode === 'edit') {
            if (headerResizeObserver) headerResizeObserver.disconnect();
            if (pointsResizeObserver) pointsResizeObserver.disconnect();
            playModeContainer.classList.add('hidden');
            editModeContainer.classList.remove('hidden');
            renderEditMode();
        } else {
            editModeContainer.classList.add('hidden');
            playModeContainer.classList.remove('hidden');
            renderPlayBoard();
        }
    }

    // --- Persistence (UPDATED for IndexedDB) ---
    async function populateLoadGameSelect() {
        try {
            const games = await getAllJeopardyGames();
            loadGameSelect.innerHTML = '<option value="">-- Select Game --</option>';
            for (const title in games) {
                const option = document.createElement('option');
                option.value = title;
                option.textContent = title;
                loadGameSelect.appendChild(option);
            }
        } catch (error) {
            console.error("Could not populate game list:", error);
        }
    }

    async function handleSaveGame() {
        const title = gameTitleInput.value.trim();
        if (!title) {
            alert("Please enter a name for the game before saving.");
            return;
        }
        gameState.title = title;
        try {
            await saveJeopardyGame(title, gameState);
            alert(`Game "${title}" saved successfully!`);
            await populateLoadGameSelect();
            loadGameSelect.value = title;
        } catch (error) {
            alert(`Error saving game. Storage might be full.\nDetails: ${error.message}`);
            console.error("Error saving game:", error);
        }
    }

    async function handleDeleteGame() {
        const title = loadGameSelect.value;
        if (!title || !confirm(`Are you sure you want to delete the game "${title}"?`)) {
            return;
        }
        try {
            await deleteJeopardyGame(title);
            alert(`Game "${title}" deleted.`);
            await populateLoadGameSelect();
            if (gameState.title === title) {
                handleNewGame();
            }
        } catch(error) {
            alert("Failed to delete game.");
            console.error("Error deleting game:", error);
        }
    }
    
    async function handleLoadGame() {
        const title = loadGameSelect.value;
        if (!title) return;
        try {
            const games = await getAllJeopardyGames();
            if (games[title]) {
                gameState = JSON.parse(JSON.stringify(games[title]));
                switchMode('edit');
            }
        } catch (error) {
            alert("Failed to load game.");
            console.error("Error loading game:", error);
        }
    }

    function handleNewGame() {
        gameState = getNewGameState();
        switchMode('edit');
    }

    async function handleExport() {
        try {
            const games = await getAllJeopardyGames();
            if (Object.keys(games).length === 0) {
                alert("No saved games to export.");
                return;
            }
            const dataStr = JSON.stringify(games, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "answer-me-this-games.json";
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert("Could not export games.");
            console.error("Export failed:", error);
        }
    }
    
    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedGames = JSON.parse(e.target.result);
                await importJeopardyGames(importedGames);
                alert("Games imported successfully!");
                await populateLoadGameSelect();
            } catch (err) {
                alert("Import failed. The file is not a valid game export.");
                console.error(err);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function renderEditMode() {
        gameTitleInput.value = gameState.title || '';
        editArea.innerHTML = '';
        if (gameState.categories) {
            gameState.categories.forEach((cat, catIndex) => {
                editArea.appendChild(createEditCategory(cat, catIndex));
            });
        }
    }

    function createEditCategory(category, catIndex) {
        const catDiv = document.createElement('div');
        catDiv.className = 'jeopardy-edit-category';
        catDiv.innerHTML = `
            <div class="jeopardy-edit-category-header">
                <input type="text" class="category-title-input" placeholder="Category Title" value="${category.title || ''}">
                <button class="jeopardy-remove-btn" title="Remove Category">✖</button>
            </div>
            <div class="jeopardy-edit-clues"></div>
            <button class="jeopardy-add-clue-btn">+ Add Clue</button>
        `;

        const cluesContainer = catDiv.querySelector('.jeopardy-edit-clues');
        if (category.clues) {
            category.clues.forEach((clue, clueIndex) => {
                cluesContainer.appendChild(createEditClue(clue, catIndex, clueIndex));
            });
        }

        catDiv.querySelector('.category-title-input').addEventListener('input', e => {
            gameState.categories[catIndex].title = e.target.value;
        });
        catDiv.querySelector('.jeopardy-remove-btn').addEventListener('click', () => {
            gameState.categories.splice(catIndex, 1);
            renderEditMode();
        });
        catDiv.querySelector('.jeopardy-add-clue-btn').addEventListener('click', () => {
            const newPoints = (category.clues.length + 1) * 100;
            gameState.categories[catIndex].clues.push({ points: newPoints, answer: '', question: '', image: null, revealed: false });
            renderEditMode();
        });

        return catDiv;
    }
    
    function createEditClue(clue, catIndex, clueIndex) {
        const clueDiv = document.createElement('div');
        clueDiv.className = 'jeopardy-edit-clue';
        clueDiv.innerHTML = `
            <div class="jeopardy-edit-clue-top">
                <input type="number" class="clue-points-input" placeholder="Points" value="${clue.points || ''}" step="100" min="100">
                <button class="jeopardy-remove-btn" title="Remove Clue">✖</button>
            </div>
            <textarea class="clue-answer-input" placeholder="Answer (Clue Text)">${clue.answer || ''}</textarea>
            <textarea class="clue-question-input" placeholder="Question (e.g., What is...?)">${clue.question || ''}</textarea>
            <div class="clue-image-controls">
                <input type="file" class="clue-image-input hidden" accept="image/*">
                <label class="button-like-label" style="padding: 3px 8px; font-size: 0.8em; margin: 0;">🖼️ Image</label>
                <img src="${clue.image || ''}" class="${clue.image ? '' : 'hidden'}" alt="Thumbnail">
            </div>
        `;

        clueDiv.querySelector('.clue-points-input').addEventListener('input', e => clue.points = parseInt(e.target.value, 10) || 0);
        clueDiv.querySelector('.clue-answer-input').addEventListener('input', e => clue.answer = e.target.value);
        clueDiv.querySelector('.clue-question-input').addEventListener('input', e => clue.question = e.target.value);
        clueDiv.querySelector('.jeopardy-remove-btn').addEventListener('click', () => {
            gameState.categories[catIndex].clues.splice(clueIndex, 1);
            renderEditMode();
        });
        
        const imageInput = clueDiv.querySelector('.clue-image-input');
        const imageLabel = clueDiv.querySelector('label');
        const imageThumb = clueDiv.querySelector('img');
        imageLabel.setAttribute('for', `clue-img-${catIndex}-${clueIndex}`);
        imageInput.id = `clue-img-${catIndex}-${clueIndex}`;

        imageInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    clue.image = re.target.result;
                    imageThumb.src = re.target.result;
                    imageThumb.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        return clueDiv;
    }

    function renderPlayBoard() {
        if (headerResizeObserver) headerResizeObserver.disconnect();
        if (pointsResizeObserver) pointsResizeObserver.disconnect();

        if (!gameState || !gameState.categories || gameState.categories.length === 0) {
            boardContainer.innerHTML = `
                <div class="jeopardy-board-placeholder">
                    <h3>No Game Loaded</h3>
                    <p>Load a saved game or click "Edit Game" to create one.</p>
                </div>`;
            return;
        }

        const board = document.createElement('div');
        board.className = 'jeopardy-board';
        const numCategories = gameState.categories.length;
        const numClues = gameState.categories.reduce((max, cat) => Math.max(max, cat.clues.length), 0);
        
        board.style.gridTemplateColumns = `repeat(${numCategories}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${numClues + 1}, 1fr)`;

        gameState.categories.forEach(cat => {
            const header = document.createElement('div');
            header.className = 'jeopardy-tile header';
            header.innerHTML = `<span>${cat.title}</span>`; 
            board.appendChild(header);
        });

        for (let clueIdx = 0; clueIdx < numClues; clueIdx++) {
            for (let catIdx = 0; catIdx < numCategories; catIdx++) {
                const category = gameState.categories[catIdx];
                const clue = category && category.clues ? category.clues[clueIdx] : undefined;
                const tile = document.createElement('div');
                tile.className = 'jeopardy-tile';
                if (!clue) {
                    tile.innerHTML = '<div class="jeopardy-tile-inner"><div class="jeopardy-tile-back"></div></div>';
                } else {
                    // *** START: THIS IS THE FIX (Part 2/2) ***
                    // The point value is now wrapped in a span.
                    tile.innerHTML = `
                        <div class="jeopardy-tile-inner">
                            <div class="jeopardy-tile-front"><span>$${clue.points}</span></div>
                            <div class="jeopardy-tile-back"></div>
                        </div>
                    `;
                    // *** END: THIS IS THE FIX (Part 2/2) ***
                    tile.dataset.catIndex = catIdx;
                    tile.dataset.clueIndex = clueIdx;
                    if (clue.revealed) {
                        tile.classList.add('revealed');
                    }
                }
                board.appendChild(tile);
            }
        }
        boardContainer.innerHTML = '';
        boardContainer.appendChild(board);

        // Observer for Category Headers
        headerResizeObserver = new ResizeObserver(entries => {
            window.requestAnimationFrame(() => {
                if (!Array.isArray(entries) || !entries.length) return;
                for (let entry of entries) adjustHeaderTextSize(entry.target);
            });
        });
        const headers = board.querySelectorAll('.jeopardy-tile.header');
        headers.forEach(header => headerResizeObserver.observe(header));

        // Observer for Point Value Tiles
        pointsResizeObserver = new ResizeObserver(entries => {
            window.requestAnimationFrame(() => {
                if (!Array.isArray(entries) || !entries.length) return;
                for (let entry of entries) adjustPointsTextSize(entry.target);
            });
        });
        const pointTiles = board.querySelectorAll('.jeopardy-tile-front');
        pointTiles.forEach(tile => pointsResizeObserver.observe(tile));
    }
    
    function handleTileClick(e) {
        const tile = e.target.closest('.jeopardy-tile:not(.header)');
        if (!tile || tile.classList.contains('revealed')) return;
        
        const catIndex = parseInt(tile.dataset.catIndex, 10);
        const clueIndex = parseInt(tile.dataset.clueIndex, 10);
        const clueData = gameState.categories[catIndex].clues[clueIndex];
        activeClue = JSON.parse(JSON.stringify(clueData));
        activeClue.catIndex = catIndex;
        activeClue.clueIndex = clueIndex;

        showClue();
    }
    
    function showClue() {
        if (!activeClue) return;
        playSound('assets/sounds/select.mp3');
        clueCategory.textContent = gameState.categories[activeClue.catIndex].title;
        cluePoints.textContent = `$${activeClue.points}`;
        clueAnswerText.textContent = activeClue.answer;
        clueImage.src = "";
        clueImageContainer.classList.add('hidden');
        clueQuestion.classList.add('hidden');
        revealQuestionBtn.classList.remove('hidden');
        clueModal.classList.remove('hidden');
    }

    function handleCloseClue() {
        clueModal.classList.add('hidden');
        if (activeClue) {
            gameState.categories[activeClue.catIndex].clues[activeClue.clueIndex].revealed = true;
        }
        activeClue = null;
        renderPlayBoard();
    }

    // --- Event Listeners ---
    editGameBtn.addEventListener('click', () => switchMode('edit'));
    newGameBtn.addEventListener('click', handleNewGame);
    playGameBtn.addEventListener('click', () => switchMode('play'));
    saveGameBtn.addEventListener('click', handleSaveGame);
    loadGameSelect.addEventListener('change', handleLoadGame);
    deleteGameBtn.addEventListener('click', handleDeleteGame);
    exportGameBtn.addEventListener('click', handleExport);
    importGameInput.addEventListener('change', handleImport);
    addCategoryBtn.addEventListener('click', () => {
        if (!gameState.categories) {
            gameState.categories = [];
        }
        gameState.categories.push({ title: '', clues: [] });
        renderEditMode();
    });
    boardContainer.addEventListener('click', handleTileClick);
    clueModalCloseX.addEventListener('click', handleCloseClue);
    revealQuestionBtn.addEventListener('click', () => {
        if (!activeClue) return;
        clueQuestion.textContent = activeClue.question;
        clueQuestion.classList.remove('hidden');
        if (activeClue.image) {
            clueImage.src = activeClue.image;
            clueImageContainer.classList.remove('hidden');
        }
        revealQuestionBtn.classList.add('hidden');
    });

    // --- Init ---
    gameState = getNewGameState();
    populateLoadGameSelect();
    renderPlayBoard();
}