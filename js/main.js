// js/main.js

import { toggleMute, updateAllFlashcardCategorySelects } from './utils.js';
import { initDateWeather } from './tools/date-weather.js';
// The initNamePicker function is now included directly in this file.
import { initTimer } from './tools/timer.js';
import { initFlashcards } from './tools/flashcards.js';
import ThemedScoreboard from './tools/scoreboard.js';
import { initWhatsMissing } from './tools/whats-missing.js';
import { initImageReveal } from './tools/image-reveal.js';
import { initFlashcardManager } from './tools/flashcard-manager.js';
import { initBingoPicker } from './tools/bingo-picker.js';
import { initWhiteboard } from './tools/whiteboard.js';
import { initSpinner } from './tools/spinner.js';
import { DiceRoller } from './tools/dice-roller.js';
import { initNoiseMeter } from './tools/noise-meter.js';
import { initAnswerMeThis } from './tools/answer-me-this.js';
import { initPhonics } from './tools/phonics.js';
import { initMysteryWord } from './tools/mystery-word.js';
import { initLessonMenu } from './tools/lesson-menu.js';
import { initSoundBoard } from './tools/sound-board.js';
import { initDB } from './db.js';

// --- Global App Logic ---

function initializeAudio() {
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
        const isNowMuted = toggleMute();
        muteBtn.innerHTML = isNowMuted ? '🔇' : '🔊';
        muteBtn.title = isNowMuted ? 'Unmute' : 'Mute';
    });
}

/**
 * Initializes the Random Name Picker tool with single, group, and undo functionality.
 */
function initNamePicker() {
    // --- DOM Elements ---
    const namePickerCard = document.getElementById('name-picker-fireworks').closest('.tool-card');
    const nameList = document.getElementById('name-list');
    const pickNameBtn = document.getElementById('pick-name-btn');
    const pickedNameDisplay = document.getElementById('picked-name');
    const dontPickAgainCheck = document.getElementById('dont-pick-again-check');
    const pickedNamesContainer = document.getElementById('picked-names-container');
    const pickedNamesList = document.getElementById('picked-names-list');
    const nameListCollapser = document.querySelector('.name-list-collapsible');
    const fireworksContainer = document.getElementById('name-picker-fireworks');
    
    // Reset and Undo
    const resetBtn = document.getElementById('name-picker-reset-btn');
    const undoBtn = document.getElementById('undo-btn');

    // Group Picker
    const groupPickerControls = document.getElementById('group-picker-fullscreen-controls');
    const groupSizeInput = document.getElementById('group-size-input');
    const pickOneGroupBtn = document.getElementById('pick-one-group-btn');
    const groupAllBtn = document.getElementById('group-all-btn');
    
    // Reset Confirmation Popup
    const confirmPopup = document.getElementById('np-confirm-popup');
    const confirmResetBtn = document.getElementById('np-confirm-reset-btn');
    const cancelResetBtn = document.getElementById('np-cancel-reset-btn');

    // --- State ---
    let availableNames = [];
    let pickedNames = [];
    let history = [];
    let currentDisplayState = null; // { type: 'single'/'group'/'all', data: [...] }

    // --- Functions ---
    
    function triggerFireworks(count = 1) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = `${Math.random() * 100}%`;
                firework.style.top = `${Math.random() * 100}%`;
                const particleCount = 30 + Math.floor(Math.random() * 20);
                const hue = Math.floor(Math.random() * 360);

                for (let j = 0; j < particleCount; j++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    const angle = Math.random() * 360;
                    const distance = 50 + Math.random() * 100;
                    particle.style.setProperty('--transform-end', `translate(${Math.cos(angle * Math.PI / 180) * distance}px, ${Math.sin(angle * Math.PI / 180) * distance}px)`);
                    particle.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
                    firework.appendChild(particle);
                }
                fireworksContainer.appendChild(firework);
                setTimeout(() => firework.remove(), 2500);
            }, i * 200);
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function renderDisplay() {
        pickedNameDisplay.innerHTML = '';
        if (!currentDisplayState) return;

        if (!namePickerCard.classList.contains('fullscreen-mode') && currentDisplayState.type !== 'single') {
            return;
        }

        const { type, data } = currentDisplayState;

        if (type === 'single') {
            const nameEl = document.createElement('div');
            nameEl.className = 'picked-name-single';
            nameEl.textContent = data[0];
            pickedNameDisplay.appendChild(nameEl);

            requestAnimationFrame(() => {
                const container = pickedNameDisplay;
                if (!container || !nameEl) return;
                let currentFontSize = parseFloat(window.getComputedStyle(nameEl).fontSize);
                nameEl.style.fontSize = `${currentFontSize}px`;
                while ((nameEl.scrollWidth > container.clientWidth || nameEl.scrollHeight > container.clientHeight) && currentFontSize > 10) {
                    currentFontSize -= 1;
                    nameEl.style.fontSize = `${currentFontSize}px`;
                }
            });

        } else if (type === 'group') {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'single-group-container';
            data.forEach(name => {
                const memberEl = document.createElement('div');
                memberEl.className = 'single-group-member';
                memberEl.textContent = name;
                groupContainer.appendChild(memberEl);
            });
            pickedNameDisplay.appendChild(groupContainer);

        } else if (type === 'all') {
            const container = document.createElement('div');
            container.className = 'group-all-container';
            data.forEach((group) => {
                const groupBox = document.createElement('div');
                groupBox.className = 'group-box';
                const memberList = document.createElement('ul');
                group.forEach(name => {
                    const memberItem = document.createElement('li');
                    memberItem.textContent = name;
                    memberList.appendChild(memberItem);
                });
                groupBox.appendChild(memberList);
                container.appendChild(groupBox);
            });
            pickedNameDisplay.appendChild(container);

            requestAnimationFrame(() => {
                if (!container) return;

                let currentFontSize = 40; 
                container.style.fontSize = `${currentFontSize}px`;

                while ((container.scrollHeight > container.clientHeight || container.scrollWidth > container.clientWidth) && currentFontSize > 7) {
                    currentFontSize -= 1; 
                    container.style.fontSize = `${currentFontSize}px`;
                }
            });
        }
    }

    function resetPickerState() {
        const allNames = nameList.value.split('\n').map(name => name.trim()).filter(name => name !== '');
        availableNames = [...new Set(allNames)];
        pickedNames = [];
        history = [];
        currentDisplayState = null;
        renderDisplay();
        updateUI();
    }

    function updateNameListsFromTextarea() {
        resetPickerState();
    }

    function autoCloseCollapserOnMobile() {
        if (window.innerWidth <= 768 && nameListCollapser.open) {
            nameListCollapser.open = false;
        }
    }

    function updateUI() {
        pickedNamesList.innerHTML = '';
        if (pickedNames.length > 0) {
            pickedNames.sort().forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                pickedNamesList.appendChild(li);
            });
            pickedNamesContainer.classList.remove('hidden');
        } else {
            pickedNamesContainer.classList.add('hidden');
        }

        const canPick = availableNames.length > 0;
        pickNameBtn.disabled = !canPick;
        pickOneGroupBtn.disabled = !canPick;
        groupAllBtn.disabled = !canPick;
        resetBtn.disabled = pickedNames.length === 0 && history.length === 0 && !currentDisplayState;
        undoBtn.disabled = history.length === 0;
    }

    function saveToHistory(type, names) {
        history.push({ type, names: [...names], display: currentDisplayState });
    }

    function pickSingleName() {
        if (availableNames.length === 0) {
            currentDisplayState = { type: 'single', data: ['All picked!'] };
            renderDisplay();
            return;
        }
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        const selectedName = availableNames[randomIndex];
        saveToHistory('single', [selectedName]);
        if (dontPickAgainCheck.checked) {
            availableNames.splice(randomIndex, 1);
            pickedNames.push(selectedName);
        }
        currentDisplayState = { type: 'single', data: [selectedName] };
        renderDisplay();
        triggerFireworks(3);
        autoCloseCollapserOnMobile();
        updateUI();
    }

    function pickOneGroup() {
        const groupSize = parseInt(groupSizeInput.value, 10);
        if (isNaN(groupSize) || groupSize < 2 || availableNames.length < groupSize) return;

        const selectedGroup = [];
        const tempAvailable = [...availableNames];
        shuffleArray(tempAvailable);
        for(let i = 0; i < groupSize; i++){ selectedGroup.push(tempAvailable.pop()); }
        saveToHistory('group', selectedGroup);

        if (dontPickAgainCheck.checked) {
            availableNames = availableNames.filter(name => !selectedGroup.includes(name));
            pickedNames.push(...selectedGroup);
        }
        currentDisplayState = { type: 'group', data: selectedGroup };
        renderDisplay();
        triggerFireworks(4);
        autoCloseCollapserOnMobile();
        updateUI();
    }

    function groupAll() {
        const groupSize = parseInt(groupSizeInput.value, 10);
        if (isNaN(groupSize) || groupSize < 2 || availableNames.length === 0) return;
        saveToHistory('all', [...availableNames]);

        const shuffled = [...availableNames];
        shuffleArray(shuffled);
        const allGroups = [];
        while(shuffled.length > 0){ allGroups.push(shuffled.splice(0, groupSize)); }

        if(dontPickAgainCheck.checked){
            pickedNames.push(...availableNames);
            availableNames = [];
        }
        currentDisplayState = { type: 'all', data: allGroups };
        renderDisplay();
        triggerFireworks(10);
        autoCloseCollapserOnMobile();
        updateUI();
    }

    function undoLastPick() {
        if (history.length === 0) return;
        const lastAction = history.pop();
        const namesToRestore = lastAction.names;
        if (dontPickAgainCheck.checked) {
            pickedNames = pickedNames.filter(name => !namesToRestore.includes(name));
            availableNames.push(...namesToRestore);
            availableNames = [...new Set(availableNames)];
        }
        currentDisplayState = lastAction.display;
        renderDisplay();
        updateUI();
    }

    function handleFullscreenChange() {
        const isFullscreen = namePickerCard.classList.contains('fullscreen-mode');
        groupPickerControls.classList.toggle('hidden', !isFullscreen);
        renderDisplay();
    }

    // --- Event Listeners ---
    nameList.addEventListener('input', updateNameListsFromTextarea);
    pickNameBtn.addEventListener('click', pickSingleName);
    dontPickAgainCheck.addEventListener('change', resetPickerState);
    
    // Reset
    resetBtn.addEventListener('click', () => confirmPopup.classList.remove('hidden'));
    confirmResetBtn.addEventListener('click', () => {
        resetPickerState();
        confirmPopup.classList.add('hidden');
    });
    cancelResetBtn.addEventListener('click', () => confirmPopup.classList.add('hidden'));

    // Grouping & Undo
    pickOneGroupBtn.addEventListener('click', pickOneGroup);
    groupAllBtn.addEventListener('click', groupAll);
    undoBtn.addEventListener('click', undoLastPick);
    
    // Observer for fullscreen changes
    const observer = new MutationObserver((mutationsList) => {
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                handleFullscreenChange();
            }
        }
    });
    observer.observe(namePickerCard, { attributes: true });

    // --- Initialization ---
    updateNameListsFromTextarea();
}

function initializeFullscreen() {
    document.querySelectorAll('.tool-card').forEach(card => {
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.title = 'Toggle Fullscreen';
        fullscreenBtn.innerHTML = '↗️'; 
        
        const h2 = card.querySelector('h2');
        if (h2) {
            h2.after(fullscreenBtn);
        }

        fullscreenBtn.addEventListener('click', () => {
            toggleFullscreen(card);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const fullscreenElement = document.querySelector('.tool-card.fullscreen-mode');
            if (fullscreenElement) {
                toggleFullscreen(fullscreenElement);
            }
        }
    });
}

function toggleFullscreen(card) {
    const isFullscreen = card.classList.toggle('fullscreen-mode');
    document.body.classList.toggle('has-fullscreen-tool', isFullscreen);
    
    const btn = card.querySelector('.fullscreen-btn');
    btn.innerHTML = isFullscreen ? '↙️' : '↗️';
    btn.title = isFullscreen ? 'Exit Fullscreen (Esc key)' : 'Toggle Fullscreen';
    
    // --- Module-specific fullscreen logic ---

    if (card.id === 'scoreboard-tool') {
        if (isFullscreen) ThemedScoreboard.activate();
        else ThemedScoreboard.deactivate();
    }

    if (card.id === 'image-reveal-tool') {
        const statusElement = document.getElementById('ir-sequence-status');
        if (isFullscreen) {
            btn.before(statusElement);
        } else {
            const originalContainer = document.getElementById('ir-status-bar');
            originalContainer.prepend(statusElement);
        }
    }
    
    if (card.id === 'spinner-tool') {
        const gridView = card.querySelector('#spinner-grid-view');
        const fullscreenView = card.querySelector('#spinner-fullscreen-view');
        if (gridView && fullscreenView) {
            gridView.classList.toggle('hidden', isFullscreen);
            fullscreenView.classList.toggle('hidden', !isFullscreen);
        }
        // Fire resize on BOTH enter and exit to force spinner to recalculate its size.
        window.dispatchEvent(new Event('resize'));
    }

    if (card.id === 'phonics-tool') {
        const gridView = card.querySelector('.phonics-grid-view');
        const fullscreenView = card.querySelector('.phonics-fullscreen-view');
        
        if (gridView && fullscreenView) {
            gridView.classList.toggle('hidden', isFullscreen);
            fullscreenView.classList.toggle('hidden', !isFullscreen);
        }
    }

    if (card.id === 'dice-roller-tool') {
        if (isFullscreen) {
            DiceRoller.enterFullscreen();
        } else {
            DiceRoller.exitFullscreen();
        }
    }

    if (card.id === 'lesson-menu-tool') {
        const gridView = card.querySelector('#lm-menu-display-grid');
        const fullscreenView = card.querySelector('#lm-fullscreen-view');
        
        if (gridView && fullscreenView) {
            gridView.classList.toggle('hidden', isFullscreen);
            fullscreenView.classList.toggle('hidden', !isFullscreen);
        }
    }
    
    // *** THIS IS THE FIX ***
    if (!isFullscreen) {
        // When exiting fullscreen, smoothly scroll the card back into view.
        // A small timeout ensures the browser has re-rendered the layout
        // (and shown the scrollbar) before we try to scroll.
        setTimeout(() => {
            card.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 10);
    }
}

// --- App Initialization ---
async function initializeApp() {
    // Initialize global features first
    initializeAudio();
    initializeFullscreen();
    
    // Initialize the database first, as other components depend on it.
    await initDB();
    
    // Populate dropdowns that depend on DB data
    await updateAllFlashcardCategorySelects();

    // Initialize each tool module
    initDateWeather();
    initNamePicker();
    initTimer();
    initFlashcards();
    ThemedScoreboard.init();
    initWhatsMissing();
    initImageReveal();
    initFlashcardManager();
    initBingoPicker();
    initWhiteboard();
    initSpinner();
    DiceRoller.init();
    initNoiseMeter(); 
    initPhonics();
    initAnswerMeThis();
    initMysteryWord();
    initLessonMenu();
    initSoundBoard();

    console.log("Brain Power Classroom Tools Initialized with IndexedDB!");
}

// Wait for the DOM to be fully loaded before running the app
document.addEventListener('DOMContentLoaded', initializeApp);