// js/tools/spinner.js

import { getAvailableFlashcardDecks } from '../utils.js';

export function initSpinner() {
    // --- DOM Elements ---
    const spinnerTool = document.getElementById('spinner-tool');
    const spinnerContainer = document.getElementById('spinner-container');
    const wheel = document.getElementById('spinner-wheel');
    const spinButton = document.getElementById('spinner-spin-button');
    const resultDisplay = document.getElementById('spinner-result-display');

    // --- Grid View Elements ---
    const wordInput = document.getElementById('spinner-word-input');
    const segmentImageInput = document.getElementById('spinner-segment-image-input');
    const segmentImagePreview = document.getElementById('spinner-segment-image-preview');
    const addWordButton = document.getElementById('spinner-add-word-button');
    const wordListElement = document.getElementById('spinner-word-list');
    const flashcardSelect = document.getElementById('spinner-flashcard-select');

    // --- Fullscreen View Elements ---
    const wordInput_fs = document.getElementById('spinner-word-input_fs');
    const segmentImageInput_fs = document.getElementById('spinner-segment-image-input_fs');
    const segmentImagePreview_fs = document.getElementById('spinner-segment-image-preview_fs');
    const addWordButton_fs = document.getElementById('spinner-add-word-button_fs');
    const wordListElement_fs = document.getElementById('spinner-word-list_fs');
    const flashcardSelect_fs = document.getElementById('spinner-flashcard-select_fs');

    // --- Shared Elements ---
    const capImageUpload = document.getElementById('spinner-cap-image-upload');
    const removeCapImageButton = document.getElementById('spinner-remove-cap-image');
    const fontSizeSlider = document.getElementById('spinner-font-size-slider');
    const fontSizeValue = document.getElementById('spinner-font-size-value');

    // --- Sound Effects ---
    const sounds = { spinStart: new Audio('assets/sounds/spin_start.mp3'), winnerReveal: new Audio('assets/sounds/winner_reveal.mp3'), itemAdd: new Audio('assets/sounds/item_add.mp3'), itemRemove: new Audio('assets/sounds/item_remove.mp3'), configSave: new Audio('assets/sounds/config_save.mp3'), configLoad: new Audio('assets/sounds/config_load.mp3') };
    function playSound(soundKey) { if (sounds[soundKey]) { sounds[soundKey].currentTime = 0; sounds[soundKey].play().catch(error => console.warn(`Audio play failed for ${soundKey}.`, error)); } }

    // --- State ---
    const defaultSegments = [ { text: "Yes!", image: null }, { text: "No!", image: null }, { text: "Maybe", image: null }, { text: "Ask Again", image: null }, { text: "Let's Try!", image: null }, { text: "Good Idea!", image: null }, { text: "Hmm...", image: null }, { text: "Definitely!", image: null }];
    let segments = [];
    const segmentColors = ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#E76F51', '#F4A261', '#E9C46A', '#2A9D8F', '#264653', '#F7A072', '#ED6A5A', '#F8E16C', '#08A045', '#1E96FC', '#AF2BBF'];
    let segmentCount = 0, segmentAngle = 0, currentRotation = 0, isSpinning = false, winnerIndex = -1, cylinderRadius = 0, wheelHeight = 170;
    let currentSegmentImage = null, currentSegmentImage_fs = null;

    // --- Constants ---
    const INITIAL_TILT_X = -25;
    const CAP_IMAGE_STORAGE_KEY = 'spinnerCapImageData';
    const SEGMENTS_STORAGE_KEY = 'brainPowerSegments_v2';
    const FONT_SIZE_STORAGE_KEY = 'spinnerFontSize';

    function deepCopy(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (e) { console.error("Deep copy failed:", e); return obj; } }
    function saveSegmentsToStorage() { try { localStorage.setItem(SEGMENTS_STORAGE_KEY, JSON.stringify(segments)); } catch (e) { console.error("Error saving segments to localStorage:", e); } }
    function loadSegmentsFromStorage() {
        const saved = localStorage.getItem(SEGMENTS_STORAGE_KEY);
        if (saved) {
            try { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length > 0) { segments = parsed.map(item => ({ text: item.text || '', image: item.image || null })); } else { segments = deepCopy(defaultSegments); } }
            catch (e) { console.error("Error loading segments from storage:", e); segments = deepCopy(defaultSegments); }
        } else { segments = deepCopy(defaultSegments); }
    }

    function renderWordList(targetListElement, onRemove) {
        targetListElement.innerHTML = '';
        if (segments.length === 0) { targetListElement.innerHTML = '<li>Add items or load a list!</li>'; return; }
        const fragment = document.createDocumentFragment();
        segments.forEach((item, index) => {
            const li = document.createElement('li'); const contentDiv = document.createElement('div'); contentDiv.className = 'item-content';
            if (item.image) { const imgPreview = document.createElement('img'); imgPreview.src = item.image; imgPreview.alt = "Preview"; contentDiv.appendChild(imgPreview); }
            const textSpan = document.createElement('span'); textSpan.textContent = item.text || "[Image Only]"; contentDiv.appendChild(textSpan); li.appendChild(contentDiv);
            const controlsDiv = document.createElement('div'); controlsDiv.className = 'item-controls';
            const removeItemButton = document.createElement('button'); removeItemButton.textContent = '✖'; removeItemButton.title = `Remove item "${item.text}"`; removeItemButton.className = 'remove-word';
            removeItemButton.addEventListener('click', () => onRemove(index));
            controlsDiv.appendChild(removeItemButton); li.appendChild(controlsDiv);
            fragment.appendChild(li);
        });
        targetListElement.appendChild(fragment);
    }
    
    function handleItemRemove(indexToRemove) {
        if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < segments.length) {
            segments.splice(indexToRemove, 1);
            saveSegmentsToStorage();
            updateSpinner();
            playSound('itemRemove');
        }
    }

    function handleAddWord(text, image) {
        if (!text && !image) { alert("Please enter text or add an image for the spinner item."); return; }
        segments.push({ text, image });
        saveSegmentsToStorage();
        updateSpinner();
        playSound('itemAdd');
        // Clear inputs for both views
        wordInput.value = ''; segmentImageInput.value = null; segmentImagePreview.innerHTML = ''; currentSegmentImage = null;
        wordInput_fs.value = ''; segmentImageInput_fs.value = null; segmentImagePreview_fs.innerHTML = ''; currentSegmentImage_fs = null;
        wordInput.focus();
    }
    
    // FIX: Made function async and added await
    async function loadDeckByName(deckName) {
        if (!deckName) { 
            segments = deepCopy(defaultSegments); 
        } else { 
            const allDecks = await getAvailableFlashcardDecks(); 
            const deckToLoad = allDecks[deckName]; 
            if (deckToLoad) { 
                segments = deepCopy(deckToLoad); 
            } 
        }
        saveSegmentsToStorage();
        updateSpinner();
        playSound('configLoad');
    }

    function saveCapImage(dataUrl) { try { localStorage.setItem(CAP_IMAGE_STORAGE_KEY, dataUrl); } catch (e) { console.error("Error saving cap image:", e); alert("Could not save cap image due to storage limits.");} }
    function loadCapImage() { const saved = localStorage.getItem(CAP_IMAGE_STORAGE_KEY); if (saved) { applyCapImage(saved); removeCapImageButton.style.display = 'inline-block'; } else { resetCapImage(); } }
    function applyCapImage(dataUrl) { spinnerTool.style.setProperty('--cap-image', `url("${dataUrl}")`); }
    function resetCapImage() { spinnerTool.style.removeProperty('--cap-image'); removeCapImageButton.style.display = 'none'; }
    function handleCapImageUpload(event) { const file = event.target.files?.[0]; if (!file || !file.type.startsWith('image/')) return; const reader = new FileReader(); reader.onload = (e) => { const url = e.target.result; applyCapImage(url); saveCapImage(url); removeCapImageButton.style.display = 'inline-block'; }; reader.readAsDataURL(file); }
    
    function handleSegmentImagePreview(event, isFullscreen) {
        const file = event.target.files?.[0];
        const previewEl = isFullscreen ? segmentImagePreview_fs : segmentImagePreview;
        previewEl.innerHTML = '';
        if (isFullscreen) { currentSegmentImage_fs = null; } else { currentSegmentImage = null; }
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (isFullscreen) { currentSegmentImage_fs = e.target.result; } else { currentSegmentImage = e.target.result; }
            const img = document.createElement('img'); img.src = e.target.result; img.alt = "Preview";
            previewEl.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
    
    function loadFontSize() { const size = localStorage.getItem(FONT_SIZE_STORAGE_KEY) || 18; applyFontSize(size); fontSizeSlider.value = size; }
    function saveFontSize(size) { try {localStorage.setItem(FONT_SIZE_STORAGE_KEY, size.toString()); } catch(e) { console.warn("Could not save font size."); }}
    function applyFontSize(size) { spinnerTool.style.setProperty('--segment-font-size', `${size}px`); if(fontSizeValue) { fontSizeValue.textContent = `${size}px`; } }
    
    function updateSpinner() {
        renderWordList(wordListElement, handleItemRemove);
        renderWordList(wordListElement_fs, handleItemRemove);
        // Sync dropdowns
        flashcardSelect.value = segments === defaultSegments ? '' : (flashcardSelect.value || '');
        flashcardSelect_fs.value = flashcardSelect.value;
        resetSpinnerVisuals();
        setTimeout(createSegments, 50);
    }

    function resetSpinnerVisuals() {
        isSpinning = false; // Ensure isSpinning is false on reset
        currentRotation = 0; winnerIndex = -1;
        if (wheel) {
            const highlighted = wheel.querySelector('.segment.winner');
            if(highlighted) highlighted.classList.remove('winner');
            wheelHeight = wheel.offsetHeight; spinnerTool.style.setProperty('--wheel-height', `${wheelHeight}px`);
            wheel.style.transition = 'none'; wheel.style.transform = `rotateX(${INITIAL_TILT_X}deg) rotateY(0deg)`;
            setTimeout(() => { if (wheel) wheel.style.transition = `transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)`; }, 20);
        }
        if (resultDisplay) { resultDisplay.textContent = ''; resultDisplay.classList.remove('visible'); }
        if (spinButton) spinButton.disabled = segments.length < 2;
    }

    function createSegments() {
        if (!wheel) return;
        const fragment = document.createDocumentFragment(); segmentCount = segments.length;
        const currentWheelWidth = parseFloat(getComputedStyle(wheel).width);
        if (segmentCount < 2 || currentWheelWidth <= 0) {
            wheel.innerHTML = '<div class="placeholder-segment">Add 2+ items to spin!</div>'; return;
        }
        segmentAngle = 360 / segmentCount; cylinderRadius = currentWheelWidth / 2;
        const segmentWidth = 2 * cylinderRadius * Math.tan((segmentAngle / 2) * (Math.PI / 180)) * 1.01;
        spinnerTool.style.setProperty('--cap-diameter', `${currentWheelWidth}px`);
        segments.forEach((item, index) => {
            const seg = document.createElement('div'); seg.className = 'segment';
            seg.style.width = `${segmentWidth}px`; seg.style.backgroundColor = segmentColors[index % segmentColors.length];
            seg.style.transform = `translateX(-50%) rotateY(${segmentAngle * index}deg) translateZ(${cylinderRadius}px)`;
            if (item.image) { const img = document.createElement('img'); img.src = item.image; seg.appendChild(img); }
            const span = document.createElement('span'); span.textContent = item.text; seg.appendChild(span);
            fragment.appendChild(seg);
        });
        wheel.innerHTML = ''; wheel.appendChild(fragment);
    }
    
    function spinWheel() {
        if (isSpinning || segmentCount < 2) return;
        isSpinning = true;
        spinButton.disabled = true;
        resultDisplay.classList.remove('visible');
        const winner = wheel.querySelector('.segment.winner');
        if(winner) winner.classList.remove('winner');
        
        playSound('spinStart');
        
        wheel.style.transition = `transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        
        const extraSpins = Math.floor(Math.random() * 5) + 8; // 8-12 full rotations
        const randomAngle = Math.random() * 360;
        const targetRotationY = currentRotation - (extraSpins * 360 + randomAngle);
        
        wheel.style.transform = `rotateX(${INITIAL_TILT_X}deg) rotateY(${targetRotationY}deg)`;
        currentRotation = targetRotationY;
    }
    
    wheel.addEventListener('transitionend', () => {
        if (!isSpinning) return;
        isSpinning = false;
        spinButton.disabled = segments.length < 2;
        
        const finalAngle = (360 - (currentRotation % 360) + (segmentAngle / 2)) % 360;
        winnerIndex = Math.floor(finalAngle / segmentAngle);

        if (segments[winnerIndex]) {
            resultDisplay.textContent = `${segments[winnerIndex].text || '[Image]'}`;
            const winnerSegment = wheel.querySelector(`.segment:nth-of-type(${winnerIndex + 1})`);
            if (winnerSegment) winnerSegment.classList.add('winner');
            
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 200,
                    spread: 120,
                    origin: { y: 0.6 },
                    zIndex: 1001
                });
            }
            playSound('winnerReveal');
        } else {
            resultDisplay.textContent = 'Spin Error!';
        }
        resultDisplay.classList.add('visible');
    });

    // --- Event Listeners ---
    spinButton.addEventListener('click', spinWheel);
    addWordButton.addEventListener('click', () => handleAddWord(wordInput.value.trim(), currentSegmentImage));
    addWordButton_fs.addEventListener('click', () => handleAddWord(wordInput_fs.value.trim(), currentSegmentImage_fs));
    flashcardSelect.addEventListener('change', (e) => loadDeckByName(e.target.value));
    flashcardSelect_fs.addEventListener('change', (e) => {
        loadDeckByName(e.target.value);
        flashcardSelect.value = e.target.value;
    });
    capImageUpload.addEventListener('change', handleCapImageUpload);
    removeCapImageButton.addEventListener('click', () => { localStorage.removeItem(CAP_IMAGE_STORAGE_KEY); resetCapImage(); });
    segmentImageInput.addEventListener('change', (e) => handleSegmentImagePreview(e, false));
    segmentImageInput_fs.addEventListener('change', (e) => handleSegmentImagePreview(e, true));
    fontSizeSlider.addEventListener('input', (e) => { applyFontSize(e.target.value); saveFontSize(e.target.value); });
    let resizeTimeout; window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(updateSpinner, 250); });

    // --- Init ---
    loadSegmentsFromStorage();
    loadCapImage();
    loadFontSize();
    updateSpinner();
}