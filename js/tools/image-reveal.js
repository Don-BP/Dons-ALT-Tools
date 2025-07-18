// js/tools/image-reveal.js

import { playSound, setScoreboardReturnState } from '../utils.js';

export function initImageReveal() {
    // --- DOM Elements ---
    const irTool = document.getElementById('image-reveal-tool');
    const irImageInput = document.getElementById('ir-image-input');
    const irGridSizeSelect = document.getElementById('ir-grid-size');
    const irCustomGridInputs = document.querySelector('.ir-custom-grid-inputs');
    const irCustomColsInput = document.getElementById('ir-custom-cols');
    const irCustomRowsInput = document.getElementById('ir-custom-rows');
    const irRevealModeSelect = document.getElementById('ir-reveal-mode');
    const irCustomSpeedInputContainer = document.querySelector('.ir-custom-speed-input');
    const irCustomSpeedInput = document.getElementById('ir-custom-speed');

    const irStartPauseBtn = document.getElementById('ir-start-pause-btn');
    const irManualRevealBtn = document.getElementById('ir-manual-reveal-btn');
    const irRevealAllBtn = document.getElementById('ir-reveal-all-btn');
    const irResetGridBtn = document.getElementById('ir-reset-grid-btn');
    const irNextImageBtn = document.getElementById('ir-next-image-btn');
    const irNewGameBtn = document.getElementById('ir-new-game-btn');
    const goToScoreboardBtn = document.getElementById('ir-goto-scoreboard-btn'); // Reference to the moved button

    const irImageContainer = document.getElementById('ir-image-container');
    const irImage = document.getElementById('ir-image');
    const irGridOverlay = document.getElementById('ir-grid-overlay');
    const irGameStatus = document.getElementById('ir-game-status');
    const irSequenceStatus = document.getElementById('ir-sequence-status');

    let irImageSequence = [];
    let irCurrentImageIndex = 0;
    let irRemainingTiles = [];
    let irRevealInterval = null;
    let irGameState = 'idle';

    function resetImageRevealTool() {
        clearInterval(irRevealInterval);
        irImageSequence = [];
        irCurrentImageIndex = 0;
        irImage.src = '';
        irImage.style.visibility = 'hidden';
        irGridOverlay.innerHTML = '';
        irImageContainer.style.aspectRatio = 'auto';

        irGameStatus.textContent = 'Upload an image to begin!';
        irSequenceStatus.textContent = '';

        // This line now correctly hides the scoreboard button along with all other game controls.
        irTool.querySelectorAll('.ir-game-controls button').forEach(btn => btn.classList.add('hidden'));
        irTool.querySelector('.ir-setup-controls').classList.remove('hidden');

        irImageInput.value = '';
        irGameState = 'idle';
    }

    function setupImageForReveal(imageIndex) {
        clearInterval(irRevealInterval);
        irCurrentImageIndex = imageIndex;
        irGameState = 'ready';

        const tempImg = new Image();
        tempImg.onload = () => {
            irImageContainer.style.aspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
            
            irImage.src = irImageSequence[irCurrentImageIndex];
            updateUIForReadyState();
        };
        tempImg.onerror = () => {
            irGameStatus.textContent = 'Error loading image.';
        };
        tempImg.src = irImageSequence[imageIndex];

        irImage.style.visibility = 'hidden';
        irGridOverlay.innerHTML = '';
    }

    function updateUIForReadyState() {
        if (irImageSequence.length > 1) {
            irSequenceStatus.textContent = `Image ${irCurrentImageIndex + 1} of ${irImageSequence.length}`;
        } else {
            irSequenceStatus.textContent = '';
        }
        irGameStatus.textContent = 'Ready to play!';

        irTool.querySelector('.ir-game-controls').classList.remove('hidden');
        irStartPauseBtn.textContent = 'Start';
        irStartPauseBtn.classList.remove('hidden');
        irNewGameBtn.classList.remove('hidden');
        goToScoreboardBtn.classList.remove('hidden'); // <<< THIS IS THE KEY CHANGE
        irResetGridBtn.classList.add('hidden');
        irManualRevealBtn.classList.add('hidden');
        irRevealAllBtn.classList.add('hidden');
        irNextImageBtn.classList.add('hidden');
    }

    irImageInput.addEventListener('change', e => {
        const files = e.target.files;
        if (files.length === 0) return;

        irGameStatus.textContent = `Loading ${files.length} image(s)...`;
        const readers = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then(results => {
            irImageSequence = results;
            setupImageForReveal(0);
        }).catch(error => {
            console.error("Error reading files:", error);
            irGameStatus.textContent = 'Error loading images.';
        });
    });

    function createAndStartGrid() {
        irTool.querySelector('.ir-setup-controls').classList.add('hidden');
        irImage.style.visibility = 'visible';

        let cols, rows;
        if (irGridSizeSelect.value === 'custom') {
            cols = parseInt(irCustomColsInput.value, 10) || 5;
            rows = parseInt(irCustomRowsInput.value, 10) || 4;
        } else {
            [cols, rows] = irGridSizeSelect.value.split('x').map(Number);
        }
        const totalTiles = cols * rows;

        const tileIndices = Array.from({ length: totalTiles }, (_, i) => i);
        for (let i = tileIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tileIndices[i], tileIndices[j]] = [tileIndices[j], tileIndices[i]];
        }
        irRemainingTiles = tileIndices;

        irGridOverlay.innerHTML = '';
        irGridOverlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        irGridOverlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'ir-grid-tile';
            irGridOverlay.appendChild(tile);
        }

        irResetGridBtn.classList.remove('hidden');
        irRevealAllBtn.classList.remove('hidden');
        irGameState = 'playing';

        if (irRevealModeSelect.value === 'manual') {
            irManualRevealBtn.classList.remove('hidden');
            irStartPauseBtn.classList.add('hidden');
            irGameStatus.textContent = 'Click "Reveal Tile" to start!';
        } else {
            irStartPauseBtn.textContent = 'Pause';
            irStartPauseBtn.classList.remove('hidden');
            irManualRevealBtn.classList.add('hidden');
            let speed = irRevealModeSelect.value === 'auto' ? 2000 : (parseFloat(irCustomSpeedInput.value) || 2) * 1000;
            irRevealInterval = setInterval(revealOneTile, speed);
            irGameStatus.textContent = 'Revealing automatically...';
        }
    }

    function revealOneTile() {
        if (irRemainingTiles.length === 0) {
            finishImageReveal();
            return;
        }
        const tileIndex = irRemainingTiles.pop();
        const tile = irGridOverlay.children[tileIndex];
        if (tile) {
            tile.classList.add('revealed');
            playSound('assets/sounds/select.mp3');
        }
        const remaining = irRemainingTiles.length;
        irGameStatus.textContent = remaining > 0 ? `${remaining} tiles left.` : "Image Revealed!";
        if (remaining === 0) {
            finishImageReveal();
        }
    }

    function finishImageReveal() {
        irGameState = 'finished';
        clearInterval(irRevealInterval);
        playSound('assets/sounds/reveal.mp3');
        irGameStatus.textContent = "Image Revealed! Well done!";
        irStartPauseBtn.classList.add('hidden');
        irManualRevealBtn.classList.add('hidden');
        irRevealAllBtn.classList.add('hidden');
        if (irCurrentImageIndex < irImageSequence.length - 1) {
            irNextImageBtn.classList.remove('hidden');
        } else {
            irGameStatus.textContent = "All images revealed! Great job!";
        }
    }

    irGridOverlay.addEventListener('click', (e) => {
        const isClickable = (irGameState === 'playing' || irGameState === 'paused') &&
                            e.target.classList.contains('ir-grid-tile') &&
                            !e.target.classList.contains('revealed');

        if (!isClickable) {
            return;
        }

        const clickedTile = e.target;
        const allTiles = Array.from(irGridOverlay.children);
        const tileIndex = allTiles.indexOf(clickedTile);

        const remainingIndex = irRemainingTiles.indexOf(tileIndex);
        if (remainingIndex === -1) {
            return;
        }

        clickedTile.classList.add('revealed');
        playSound('assets/sounds/select.mp3');

        irRemainingTiles.splice(remainingIndex, 1);

        const remainingCount = irRemainingTiles.length;
        irGameStatus.textContent = remainingCount > 0 ? `${remainingCount} tiles left.` : "Image Revealed!";

        if (remainingCount === 0) {
            finishImageReveal();
        }
    });

    irStartPauseBtn.addEventListener('click', () => {
        if (irGameState === 'ready') {
            createAndStartGrid();
        } else if (irGameState === 'playing') {
            irGameState = 'paused';
            clearInterval(irRevealInterval);
            irStartPauseBtn.textContent = 'Resume';
            irGameStatus.textContent = 'Paused.';
        } else if (irGameState === 'paused') {
            irGameState = 'playing';
            irStartPauseBtn.textContent = 'Pause';
            irGameStatus.textContent = 'Revealing automatically...';
            let speed = irRevealModeSelect.value === 'auto' ? 2000 : (parseFloat(irCustomSpeedInput.value) || 2) * 1000;
            irRevealInterval = setInterval(revealOneTile, speed);
        }
    });

    irManualRevealBtn.addEventListener('click', revealOneTile);

    irRevealAllBtn.addEventListener('click', () => {
        irGridOverlay.querySelectorAll('.ir-grid-tile:not(.revealed)').forEach(tile => tile.classList.add('revealed'));
        irRemainingTiles = [];
        finishImageReveal();
    });
    
    irResetGridBtn.addEventListener('click', () => {
        clearInterval(irRevealInterval);
        irGridOverlay.innerHTML = '';
        irImage.style.visibility = 'hidden';

        irGameState = 'ready';

        irTool.querySelector('.ir-setup-controls').classList.remove('hidden');
        
        updateUIForReadyState();
    });

    irNextImageBtn.addEventListener('click', () => {
        if (irCurrentImageIndex < irImageSequence.length - 1) {
            setupImageForReveal(irCurrentImageIndex + 1);
        }
    });

    irNewGameBtn.addEventListener('click', resetImageRevealTool);

    irGridSizeSelect.addEventListener('change', () => {
        irCustomGridInputs.classList.toggle('hidden', irGridSizeSelect.value !== 'custom');
    });

    irRevealModeSelect.addEventListener('change', () => {
        irCustomSpeedInputContainer.classList.toggle('hidden', irRevealModeSelect.value !== 'custom');
    });

    goToScoreboardBtn.addEventListener('click', () => {
        setScoreboardReturnState('image-reveal-tool');

        const scoreboardCard = document.getElementById('scoreboard-tool');
        const scoreboardFullscreenBtn = scoreboardCard?.querySelector('.fullscreen-btn');

        if (irTool.classList.contains('fullscreen-mode')) {
            const irFullscreenBtn = irTool.querySelector('.fullscreen-btn');
            irFullscreenBtn?.click();
            
            setTimeout(() => {
                scoreboardFullscreenBtn?.click();
            }, 50);
        } else {
            scoreboardFullscreenBtn?.click();
        }
    });

    resetImageRevealTool();
}