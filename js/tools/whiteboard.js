// js/tools/whiteboard.js

import { playSound } from '../utils.js';
import { getAvailableFlashcardDecks } from '../utils.js';

export function initWhiteboard() {
    const toolCard = document.getElementById('whiteboard-tool');
    const whiteboardControls = toolCard.querySelector('.whiteboard-controls');
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
    const wbPaintBtn = document.getElementById('wb-paint-btn');
    const wbEraserBtn = document.getElementById('wb-eraser-btn');
    const wbUndoBtn = document.getElementById('wb-undo-btn');
    const wbSaveBtn = document.getElementById('wb-save-btn');
    const wbAdvancedControls = document.getElementById('wb-advanced-controls');
    const wbShapeTool = document.getElementById('wb-shape-tool');
    const wbBrushTool = document.getElementById('wb-brush-tool');
    const wbStampControls = document.getElementById('wb-stamp-controls');
    const wbStampSetSelect = document.getElementById('wb-stamp-set-select');
    const wbStampCardContainer = document.getElementById('wb-stamp-card-container');
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
            if (!stroke.path || stroke.path.length === 0) return;
            rainbowCtx.beginPath();
            rainbowCtx.lineWidth = stroke.width;
            rainbowCtx.strokeStyle = `hsl(${(rainbowHue + stroke.hueOffset) % 360}, 100%, 50%)`;
            rainbowCtx.lineCap = 'round';
            rainbowCtx.lineJoin = 'round';
            let isPenDown = false;
            stroke.path.forEach(point => {
                if (point) {
                    if (isPenDown) {
                        rainbowCtx.lineTo(point.x, point.y);
                    } else {
                        rainbowCtx.moveTo(point.x, point.y);
                        isPenDown = true;
                    }
                } else {
                    isPenDown = false;
                }
            });
            rainbowCtx.stroke();
        });
        requestAnimationFrame(animateRainbow);
    }

    function getEventPosition(event) {
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches && event.touches[0];
        const clientX = touch ? touch.clientX : event.clientX;
        const clientY = touch ? touch.clientY : event.clientY;

        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        return { x, y };
    }

    function updateLayoutClasses() {
        const isPenLayout = !isErasing && currentShape !== 'stamp';
        whiteboardControls.classList.toggle('pen-layout-active', isPenLayout);
    }

    // --- Drawing Logic ---
    function startDrawing(e) {
        isDrawing = true;
        const pos = getEventPosition(e);
        startX = pos.x;
        startY = pos.y;
        
        if (currentBrush === 'rainbow' && currentShape === 'pen' && !isErasing) {
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
    
    function eraseRainbowAtPoint(pos) {
        const eraserRadius = wbWidthSlider.value;
        rainbowStrokes.forEach(stroke => {
            if (!stroke.path) return;
            stroke.path.forEach((point, index) => {
                if (!point) return;
                const dx = point.x - pos.x;
                const dy = point.y - pos.y;
                if (Math.sqrt(dx * dx + dy * dy) < eraserRadius) {
                    stroke.path[index] = null;
                }
            });
        });
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getEventPosition(e);
        if (isErasing) {
            eraseRainbowAtPoint(pos);
        }
        if (currentShape !== 'pen') {
            updateContextStyle(tempCtx);
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            drawShape(tempCtx, pos.x, pos.y);
            return;
        }
        if (currentBrush === 'rainbow' && !isErasing) {
            if (currentRainbowStroke) currentRainbowStroke.path.push({ x: pos.x, y: pos.y });
        } else if (currentBrush === 'spray' && !isErasing) {
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

    function densifyPath(path) {
        if (!path || path.length < 2) return path;
        const newPath = [path[0]];
        const maxSegmentLength = 2;
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i+1];
            if (!p1 || !p2) {
                newPath.push(p2);
                continue;
            }
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxSegmentLength) {
                const numSegments = Math.ceil(dist / maxSegmentLength);
                for (let j = 1; j < numSegments; j++) {
                    const t = j / numSegments;
                    newPath.push({ x: p1.x + dx * t, y: p1.y + dy * t });
                }
            }
            newPath.push(p2);
        }
        return newPath;
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        isDrawing = false;
        if (currentShape !== 'pen' && currentShape !== 'stamp') {
            const pos = getEventPosition(e);
            updateContextStyle(ctx);
            drawShape(ctx, pos.x, pos.y);
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        } else if (currentBrush === 'rainbow' && !isErasing) {
            if (currentRainbowStroke && currentRainbowStroke.path.length > 1) {
                 currentRainbowStroke.path = densifyPath(currentRainbowStroke.path);
            }
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
        // The ResizeObserver will automatically handle the visual change.
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
    
    function populateStampGrid(deckName) {
        wbStampCardContainer.innerHTML = '';
        currentStampImage = null;
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    
        if (!deckName || !flashcardDecks[deckName] || !Array.isArray(flashcardDecks[deckName])) {
            wbStampCardContainer.innerHTML = `<p class="wb-stamp-placeholder">Select a set to view stamps.</p>`;
            return;
        }
    
        const deck = flashcardDecks[deckName];
        const imageCards = deck.filter(card => card && card.image);
    
        if (imageCards.length === 0) {
            wbStampCardContainer.innerHTML = `<p class="wb-stamp-placeholder">No images in this set.</p>`;
            return;
        }
    
        imageCards.forEach(card => {
            const previewItem = document.createElement('div');
            previewItem.className = 'wb-stamp-preview-item';
            previewItem.title = card.text || 'Image stamp';
    
            const img = document.createElement('img');
            img.src = card.image;
            img.alt = previewItem.title;
            previewItem.appendChild(img);
    
            previewItem.addEventListener('click', () => {
                const currentActive = wbStampCardContainer.querySelector('.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                previewItem.classList.add('active');
    
                const stampImg = new Image();
                stampImg.crossOrigin = "anonymous";
                stampImg.onload = () => {
                    currentStampImage = stampImg;
                };
                stampImg.src = card.image;
            });
    
            wbStampCardContainer.appendChild(previewItem);
        });
    }

    function masterDownHandler(e) {
        if (e.button && e.button !== 0) return; 
        
        if (currentShape === 'stamp') {
            handleStamp(e);
        } else {
            startDrawing(e);
        }
    }

    // --- Event Listeners ---
    wbPaintBtn.addEventListener('click', () => {
        isErasing = false;
        wbEraserBtn.classList.remove('active');
        wbPaintBtn.classList.add('active');
        if (currentShape === 'stamp') {
             wbStampControls.classList.remove('hidden');
        }
        updateLayoutClasses();
        updateContextStyle();
    });

    wbEraserBtn.addEventListener('click', () => {
        isErasing = true;
        currentShape = 'pen'; 
        currentBrush = 'solid';
        wbShapeTool.value = 'pen';
        wbBrushTool.value = 'solid';
        wbEraserBtn.classList.add('active');
        wbPaintBtn.classList.remove('active');
        wbStampControls.classList.add('hidden');
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        updateLayoutClasses();
        updateContextStyle();
    });

    wbShapeTool.addEventListener('change', (e) => {
        currentShape = e.target.value;
        isErasing = false; 
        wbEraserBtn.classList.remove('active');
        wbPaintBtn.classList.add('active');
        if (currentShape === 'stamp') {
            wbStampControls.classList.remove('hidden');
        } else {
            wbStampControls.classList.add('hidden');
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        updateLayoutClasses();
        updateContextStyle();
    });

    wbBrushTool.addEventListener('change', (e) => {
        currentBrush = e.target.value;
        isErasing = false;
        wbEraserBtn.classList.remove('active');
        wbPaintBtn.classList.add('active');
        updateContextStyle();
    });

    wbStampSetSelect.addEventListener('change', (e) => populateStampGrid(e.target.value));
    
    wbColorPicker.addEventListener('input', () => {
        isErasing = false;
        wbEraserBtn.classList.remove('active');
        wbPaintBtn.classList.add('active');
        updateContextStyle();
    });
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
            
            if (rainbowStrokes.length === 0 && isRainbowAnimating) {
                isRainbowAnimating = false;
                rainbowCtx.clearRect(0, 0, rainbowCanvas.width, rainbowCanvas.height);
            } else if (rainbowStrokes.length > 0 && !isRainbowAnimating) {
                isRainbowAnimating = true;
                animateRainbow();
            }

            const img = new Image();
            img.src = lastState.static;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
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

    /**
     * The new robust ResizeObserver. It fits the canvas elements inside the
     * wrapper while maintaining their fixed aspect ratio, preventing stretching.
     */
    const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        const wrapperWidth = entry.contentRect.width;
        const wrapperHeight = entry.contentRect.height;
        
        const canvasRatio = canvas.width / canvas.height;
        const wrapperRatio = wrapperWidth / wrapperHeight;

        let styleWidth, styleHeight, styleTop, styleLeft;

        if (wrapperRatio > canvasRatio) { // Wrapper is wider than canvas -> pillarbox
            styleHeight = wrapperHeight;
            styleWidth = wrapperHeight * canvasRatio;
            styleTop = 0;
            styleLeft = (wrapperWidth - styleWidth) / 2;
        } else { // Wrapper is taller or same ratio -> letterbox
            styleWidth = wrapperWidth;
            styleHeight = wrapperWidth / canvasRatio;
            styleLeft = 0;
            styleTop = (wrapperHeight - styleHeight) / 2;
        }

        [canvas, rainbowCanvas, tempCanvas].forEach(c => {
            c.style.width = `${styleWidth}px`;
            c.style.height = `${styleHeight}px`;
            c.style.top = `${styleTop}px`;
            c.style.left = `${styleLeft}px`;
        });
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
        const initialWidth = window.innerWidth;
        const initialHeight = window.innerHeight;
        
        [canvas, rainbowCanvas, tempCanvas].forEach(c => {
            c.width = initialWidth;
            c.height = initialHeight;
        });
        
        const smallerDim = Math.min(initialWidth, initialHeight);
        const maxStampSize = Math.floor(smallerDim * 0.8);
        wbStampSizeSlider.max = Math.max(20, maxStampSize);
        wbStampSizeSlider.value = Math.min(parseInt(wbStampSizeSlider.value), maxStampSize);

        await populateStampSelectors();
        populateStampGrid(''); 
    })();

    createColorPalette();
    resizeObserver.observe(canvasWrapper);
    fullscreenObserver.observe(toolCard, { attributes: true });
    wbPaintBtn.classList.add('active'); 
    updateLayoutClasses();

    setTimeout(() => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateContextStyle();
        saveWbState();
    }, 100);
}