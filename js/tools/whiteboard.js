// js/tools/whiteboard.js

import { playSound } from '../utils.js';
import { getAvailableFlashcardDecks } from '../utils.js';

export function initWhiteboard() {
    const toolCard = document.getElementById('whiteboard-tool');
    const canvasWrapper = document.getElementById('wb-canvas-wrapper');
    const canvas = document.getElementById('whiteboard-canvas');
    const rainbowCanvas = document.getElementById('whiteboard-rainbow-canvas');
    const tempCanvas = document.getElementById('whiteboard-temp-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rainbowCtx = rainbowCanvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');

    // --- Controls ---
    const wbColorPicker = document.getElementById('wb-color');
    const wbColorPalette = document.getElementById('wb-color-palette');
    const wbWidthSlider = document.getElementById('wb-width');
    const wbClearBtn = document.getElementById('wb-clear-btn');
    const wbEraserBtn = document.getElementById('wb-eraser-btn');
    const wbUndoBtn = document.getElementById('wb-undo-btn');
    const wbSaveBtn = document.getElementById('wb-save-btn');
    const wbAdvancedControls = document.getElementById('wb-advanced-controls');
    const wbShapeTool = document.getElementById('wb-shape-tool');
    const wbBrushTool = document.getElementById('wb-brush-tool');
    const wbStampControls = document.getElementById('wb-stamp-controls');
    const wbStampSetSelect = document.getElementById('wb-stamp-set-select');
    const wbStampCardSelect = document.getElementById('wb-stamp-card-select');
    const wbStampSizeSlider = document.getElementById('wb-stamp-size');

    // --- State ---
    let isDrawing = false;
    let isErasing = false;
    let currentShape = 'pen';
    let currentBrush = 'solid';
    let startX, startY;
    let wbHistory = [];
    let flashcardDecks = {};
    let currentStampImage = null;
    let rainbowHue = 0;
    let isRainbowAnimating = false;
    let rainbowStrokes = [];
    let currentRainbowStroke = null;
    const HISTORY_LIMIT = 20;
    const PALETTE_COLORS = [
        '#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00',
        '#4CD964', '#34C759', '#5AC8FA', '#007AFF', '#AF52DE'
    ];
    
    function animateRainbow() {
        if (!isRainbowAnimating) return;
        rainbowHue = (rainbowHue + 1) % 360;
        rainbowCtx.clearRect(0, 0, rainbowCanvas.width, rainbowCanvas.height);
        rainbowStrokes.forEach(stroke => {
            rainbowCtx.beginPath();
            if (stroke.path.length > 0) {
                rainbowCtx.moveTo(stroke.path[0].x, stroke.path[0].y);
                stroke.path.forEach(point => {
                    rainbowCtx.lineTo(point.x, point.y);
                });
                rainbowCtx.strokeStyle = `hsl(${(rainbowHue + stroke.hueOffset) % 360}, 100%, 50%)`;
                rainbowCtx.lineWidth = stroke.width;
                rainbowCtx.lineCap = 'round';
                rainbowCtx.lineJoin = 'round';
                rainbowCtx.stroke();
            }
        });
        requestAnimationFrame(animateRainbow);
    }

    function getEventPosition(event) {
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches && event.touches[0];
        return { x: (touch ? touch.clientX : event.clientX) - rect.left, y: (touch ? touch.clientY : event.clientY) - rect.top };
    }

    function setGridAspectRatio() {
        if (toolCard.classList.contains('fullscreen-mode')) {
            canvasWrapper.style.aspectRatio = '';
            return;
        }
        canvasWrapper.style.aspectRatio = `${window.innerWidth} / ${window.innerHeight}`;
    }

    // --- Drawing Logic ---
    function startDrawing(e) {
        isDrawing = true;
        const pos = getEventPosition(e);
        startX = pos.x;
        startY = pos.y;
        
        if (currentBrush === 'rainbow' && currentShape === 'pen') {
            currentRainbowStroke = {
                path: [{ x: startX, y: startY }],
                width: wbWidthSlider.value,
                hueOffset: Math.random() * 360
            };
            rainbowStrokes.push(currentRainbowStroke);
            if (!isRainbowAnimating) {
                isRainbowAnimating = true;
                animateRainbow();
            }
        } else {
            ctx.beginPath();
            if (currentShape === 'pen') {
                ctx.moveTo(startX, startY);
            }
        }
    }
    
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getEventPosition(e);
        if (currentShape !== 'pen') {
            updateContextStyle(tempCtx);
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            drawShape(tempCtx, pos.x, pos.y);
            return;
        }
        if (currentBrush === 'rainbow') {
            currentRainbowStroke.path.push({ x: pos.x, y: pos.y });
        } else if (currentBrush === 'spray') {
            const sprayRadius = wbWidthSlider.value / 2;
            const sprayDensity = 50;
            ctx.fillStyle = isErasing ? 'white' : wbColorPicker.value;
            for (let i = 0; i < sprayDensity; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const radius = Math.random() * sprayRadius;
                const offsetX = Math.cos(angle) * radius;
                const offsetY = Math.sin(angle) * radius;
                ctx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
            }
        } else {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        isDrawing = false;
        if (currentShape !== 'pen' && currentShape !== 'stamp') {
            const pos = getEventPosition(e);
            updateContextStyle(ctx);
            drawShape(ctx, pos.x, pos.y);
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        } else if (currentBrush === 'rainbow' && currentShape === 'pen') {
            currentRainbowStroke = null;
        } else {
            ctx.closePath();
        }
        saveWbState();
    }
    
    function drawShape(context, currentX, currentY) {
        context.beginPath();
        switch (currentShape) {
            case 'line':
                context.moveTo(startX, startY);
                context.lineTo(currentX, currentY);
                break;
            case 'rectangle':
                context.rect(startX, startY, currentX - startX, currentY - startY);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
                context.arc(startX, startY, radius, 0, 2 * Math.PI);
                break;
            case 'triangle':
                context.moveTo(startX + (currentX - startX) / 2, startY);
                context.lineTo(currentX, currentY);
                context.lineTo(startX, currentY);
                context.closePath();
                break;
        }
        context.stroke();
    }

    function calculateStampDimensions(image, maxSize) {
        const { naturalWidth: originalWidth, naturalHeight: originalHeight } = image;
        if (originalWidth === 0 || originalHeight === 0) return { width: maxSize, height: maxSize };
        const ratio = originalWidth / originalHeight;
        return ratio > 1 ? { width: maxSize, height: maxSize / ratio } : { height: maxSize, width: maxSize * ratio };
    }

    function handleStamp(e) {
        if (isErasing || !currentStampImage) return;
        const pos = getEventPosition(e);
        const stampSize = parseInt(wbStampSizeSlider.value, 10);
        const dims = calculateStampDimensions(currentStampImage, stampSize);
        ctx.drawImage(currentStampImage, pos.x - dims.width / 2, pos.y - dims.height / 2, dims.width, dims.height);
        saveWbState();
    }
    
    function drawStampPreview(e) {
        if (currentShape !== 'stamp' || isErasing || !currentStampImage) return;
        const pos = getEventPosition(e);
        const stampSize = parseInt(wbStampSizeSlider.value, 10);
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.globalAlpha = 0.7;
        const dims = calculateStampDimensions(currentStampImage, stampSize);
        tempCtx.drawImage(currentStampImage, pos.x - dims.width / 2, pos.y - dims.height / 2, dims.width, dims.height);
        tempCtx.globalAlpha = 1.0;
    }
    
    function updateContextStyle(specificCtx) {
        const style = isErasing ? 'white' : wbColorPicker.value;
        const width = wbWidthSlider.value;
        const contexts = specificCtx ? [specificCtx] : [ctx, tempCtx];
        contexts.forEach(c => {
            c.strokeStyle = style;
            c.fillStyle = style;
            c.lineWidth = width;
            c.lineCap = 'round';
            c.lineJoin = 'round';
            c.setLineDash([]);
            c.globalAlpha = 1.0;
            if (!isErasing) {
                switch (currentBrush) {
                    case 'dashed': c.setLineDash([width * 2, width * 1.5]); break;
                    case 'dotted': c.setLineDash([1, width * 1.5]); break;
                }
            }
        });
    }
    
    function saveWbState() {
        if (wbHistory.length > HISTORY_LIMIT) wbHistory.shift();
        wbHistory.push({
            static: canvas.toDataURL(),
            dynamic: JSON.parse(JSON.stringify(rainbowStrokes))
        });
        wbUndoBtn.disabled = wbHistory.length <= 1;
    }

    function createColorPalette() {
        PALETTE_COLORS.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'wb-color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                wbColorPicker.value = color;
                wbColorPicker.dispatchEvent(new Event('input')); 
            });
            wbColorPalette.appendChild(swatch);
        });
    }

    function handleFullscreenChange(isFullscreen) {
        wbColorPalette.style.display = isFullscreen ? 'grid' : 'none';
        wbAdvancedControls.style.display = isFullscreen ? 'flex' : 'none';
        setGridAspectRatio();
    }

    async function populateStampSelectors() {
        flashcardDecks = await getAvailableFlashcardDecks();
        wbStampSetSelect.innerHTML = '<option value="">-- Select Set --</option>';
        for (const deckName in flashcardDecks) {
            const option = document.createElement('option');
            option.value = deckName;
            option.textContent = deckName;
            wbStampSetSelect.appendChild(option);
        }
    }
    
    function updateStampCardSelector(deckName) {
        wbStampCardSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a card...';
        wbStampCardSelect.appendChild(placeholder);
        currentStampImage = null;
        if (!deckName || !flashcardDecks[deckName] || !Array.isArray(flashcardDecks[deckName])) return;
        const deck = flashcardDecks[deckName];
        let cardsAdded = 0;
        deck.forEach(card => {
            if (card && card.image) {
                const option = document.createElement('option');
                option.value = card.image;
                option.textContent = card.text || 'Untitled Card';
                wbStampCardSelect.appendChild(option);
                cardsAdded++;
            }
        });
        if (cardsAdded === 0) placeholder.textContent = 'No images in this set';
    }

    // --- NEW: Master handler for mouse/touch down events ---
    function masterDownHandler(e) {
        if (e.button && e.button !== 0) return; // Ignore right-clicks
        
        if (currentShape === 'stamp') {
            handleStamp(e);
        } else {
            startDrawing(e);
        }
    }

    // --- Event Listeners ---
    wbEraserBtn.addEventListener('click', () => {
        isErasing = true;
        currentShape = '';
        currentBrush = 'solid';
        wbShapeTool.value = 'pen';
        wbBrushTool.value = 'solid';
        wbEraserBtn.classList.add('active');
        wbStampControls.classList.add('hidden');
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        updateContextStyle();
    });

    wbShapeTool.addEventListener('change', (e) => {
        currentShape = e.target.value;
        isErasing = false;
        wbEraserBtn.classList.remove('active');
        if (currentShape === 'stamp') {
            wbStampControls.classList.remove('hidden');
        } else {
            wbStampControls.classList.add('hidden');
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        updateContextStyle();
    });

    wbBrushTool.addEventListener('change', (e) => {
        currentBrush = e.target.value;
        updateContextStyle();
    });

    wbStampSetSelect.addEventListener('change', (e) => updateStampCardSelector(e.target.value));
    
    wbStampCardSelect.addEventListener('change', (e) => {
        const imageUrl = e.target.value;
        if (imageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => { currentStampImage = img; };
            img.src = imageUrl;
        } else {
            currentStampImage = null;
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
    });
    
    wbColorPicker.addEventListener('input', () => updateContextStyle());
    wbWidthSlider.addEventListener('input', () => updateContextStyle());

    wbClearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rainbowCtx.clearRect(0, 0, rainbowCanvas.width, rainbowCanvas.height);
        rainbowStrokes = [];
        isRainbowAnimating = false;
        saveWbState();
    });

    wbUndoBtn.addEventListener('click', () => {
        if (wbHistory.length > 1) {
            wbHistory.pop();
            const lastState = wbHistory[wbHistory.length - 1];
            rainbowStrokes = JSON.parse(JSON.stringify(lastState.dynamic));
            if (rainbowStrokes.length === 0) {
                isRainbowAnimating = false;
                rainbowCtx.clearRect(0, 0, rainbowCanvas.width, rainbowCanvas.height);
            }
            const img = new Image();
            img.src = lastState.static;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
            };
            wbUndoBtn.disabled = wbHistory.length <= 1;
        }
    });

    wbSaveBtn.addEventListener('click', () => {
        const dlCanvas = document.createElement('canvas');
        dlCanvas.width = canvas.width;
        dlCanvas.height = canvas.height;
        const dlCtx = dlCanvas.getContext('2d');
        dlCtx.fillStyle = 'white';
        dlCtx.fillRect(0, 0, dlCanvas.width, dlCanvas.height);
        dlCtx.drawImage(canvas, 0, 0);
        dlCtx.drawImage(rainbowCanvas, 0, 0);
        const link = document.createElement('a');
        link.download = 'whiteboard-drawing.png';
        link.href = dlCanvas.toDataURL('image/png');
        link.click();
        playSound('sounds/reveal.mp3');
    });

    // --- MODIFIED: Event listeners now use the master handler for down events ---
    ['mousedown', 'touchstart'].forEach(evt => {
        canvas.addEventListener(evt, masterDownHandler, { passive: false });
    });
    ['mousemove', 'touchmove'].forEach(evt => {
        canvas.addEventListener(evt, draw, { passive: false });
        canvas.addEventListener(evt, drawStampPreview, { passive: false });
    });
    ['mouseup', 'touchend'].forEach(evt => {
        canvas.addEventListener(evt, stopDrawing);
    });
    canvas.addEventListener('mouseleave', e => {
        if (isDrawing) stopDrawing(e);
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    });

    window.addEventListener('resize', setGridAspectRatio);

    const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        const lastState = wbHistory.length > 0 ? wbHistory[wbHistory.length - 1] : null;
        [canvas, rainbowCanvas, tempCanvas].forEach(c => {
            c.width = width * dpr;
            c.height = height * dpr;
            c.getContext('2d').scale(dpr, dpr);
        });
        const smallerDim = Math.min(width, height);
        const maxStampSize = Math.floor(smallerDim * 1);
        wbStampSizeSlider.max = Math.max(20, maxStampSize);
        if (parseInt(wbStampSizeSlider.value) > wbStampSizeSlider.max) {
            wbStampSizeSlider.value = wbStampSizeSlider.max;
        }
        updateContextStyle();
        if (lastState) {
            rainbowStrokes = JSON.parse(JSON.stringify(lastState.dynamic));
            if (rainbowStrokes.length > 0 && !isRainbowAnimating) {
                isRainbowAnimating = true;
                animateRainbow();
            }
            const img = new Image();
            img.src = lastState.static;
            img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
            };
        }
    });
    
    const fullscreenObserver = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.attributeName === 'class') {
                const isFullscreen = toolCard.classList.contains('fullscreen-mode');
                handleFullscreenChange(isFullscreen);
            }
        }
    });

    // --- Initialization ---
    (async () => {
        await populateStampSelectors();
    })();
    createColorPalette();
    resizeObserver.observe(canvasWrapper);
    fullscreenObserver.observe(toolCard, { attributes: true });
    setGridAspectRatio();
    setTimeout(() => {
        updateContextStyle();
        saveWbState();
    }, 100);
}