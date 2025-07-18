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
    let eraseStrokes = [];
    let currentStroke = null;
    const HISTORY_LIMIT = 20;
    const PALETTE_COLORS = [
        '#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00',
        '#4CD964', '#34C759', '#5AC8FA', '#007AFF', '#AF52DE'
    ];
    
    function animateRainbow() {
        if (!isRainbowAnimating) return;
        rainbowHue = (rainbowHue + 1) % 360;
        rainbowCtx.clearRect(0, 0, rainbowCanvas.width, rainbowCanvas.height);

        rainbowCtx.globalCompositeOperation = 'source-over';
        rainbowStrokes.forEach(stroke => {
            rainbowCtx.beginPath();
            if (stroke.path.length > 0) {
                rainbowCtx.moveTo(stroke.path[0].x, stroke.path[0].y);
                stroke.path.forEach(point => rainbowCtx.lineTo(point.x, point.y));
                rainbowCtx.strokeStyle = `hsl(${(rainbowHue + stroke.hueOffset) % 360}, 100%, 50%)`;
                rainbowCtx.lineWidth = stroke.width;
                rainbowCtx.lineCap = 'round';
                rainbowCtx.lineJoin = 'round';
                rainbowCtx.stroke();
            }
        });

        if (eraseStrokes.length > 0) {
            rainbowCtx.globalCompositeOperation = 'destination-out';
            eraseStrokes.forEach(stroke => {
                rainbowCtx.beginPath();
                if (stroke.path.length > 0) {
                    rainbowCtx.moveTo(stroke.path[0].x, stroke.path[0].y);
                    stroke.path.forEach(point => rainbowCtx.lineTo(point.x, point.y));
                    rainbowCtx.strokeStyle = 'rgba(0,0,0,1)';
                    rainbowCtx.lineWidth = stroke.width;
                    rainbowCtx.lineCap = 'round';
                    rainbowCtx.lineJoin = 'round';
                    rainbowCtx.stroke();
                }
            });
            rainbowCtx.globalCompositeOperation = 'source-over';
        }

        requestAnimationFrame(animateRainbow);
    }

    function getEventPosition(event) {
        const rect = canvas.getBoundingClientRect();
        const touch = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
        return { x: (touch ? touch.clientX : event.clientX) - rect.left, y: (touch ? touch.clientY : event.clientY) - rect.top };
    }

    function setGridAspectRatio() {
        if (toolCard.classList.contains('fullscreen-mode')) {
            canvasWrapper.style.aspectRatio = '';
            return;
        }
        canvasWrapper.style.aspectRatio = `${window.innerWidth} / ${window.innerHeight}`;
    }

    function updateLayoutClasses() {
        const isPenLayout = !isErasing && currentShape !== 'stamp';
        whiteboardControls.classList.toggle('pen-layout-active', isPenLayout);
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getEventPosition(e);
        startX = pos.x;
        startY = pos.y;
        
        // --- Dynamic Layer Logic (Rainbow and Erase) ---
        if (isErasing) {
            currentStroke = { path: [{ x: startX, y: startY }], width: wbWidthSlider.value };
            eraseStrokes.push(currentStroke);
            const shouldAnimate = rainbowStrokes.length > 0 || eraseStrokes.length > 0;
            if (shouldAnimate && !isRainbowAnimating) {
                 isRainbowAnimating = true;
                 animateRainbow();
            }
        } else if (currentBrush === 'rainbow' && currentShape === 'pen') {
            currentStroke = { path: [{ x: startX, y: startY }], width: wbWidthSlider.value, hueOffset: Math.random() * 360 };
            rainbowStrokes.push(currentStroke);
            if (!isRainbowAnimating) {
                isRainbowAnimating = true;
                animateRainbow();
            }
        }
        
        // --- Static Layer Logic ---
        // This runs for ALL tools that draw on the main canvas (including eraser's white marks)
        ctx.beginPath();
        if (currentShape === 'pen') {
            ctx.moveTo(startX, startY);
        }
    }
    
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getEventPosition(e);
        
        // --- Dynamic Layer Drawing ---
        if (isErasing || (currentBrush === 'rainbow' && currentShape === 'pen' && !isErasing)) {
            if (currentStroke) currentStroke.path.push({ x: pos.x, y: pos.y });
        }
        
        // --- Static Layer Drawing ---
        if (currentShape !== 'pen' && !isErasing) {
            updateContextStyle(tempCtx);
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            drawShape(tempCtx, pos.x, pos.y);
            return;
        } else if (currentBrush !== 'rainbow' || isErasing) {
            updateContextStyle(ctx);
            if (currentBrush === 'spray' && !isErasing) {
                const sprayRadius = wbWidthSlider.value / 2;
                const sprayDensity = 50;
                ctx.fillStyle = wbColorPicker.value;
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
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        isDrawing = false;
        
        if (currentShape !== 'pen' && currentShape !== 'stamp' && !isErasing) {
            const pos = getEventPosition(e);
            updateContextStyle(ctx);
            drawShape(ctx, pos.x, pos.y);
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        } else if (currentBrush !== 'rainbow' || isErasing) {
             ctx.closePath();
        }

        currentStroke = null;
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

    function handleStamp(e) {
        if (isErasing || !currentStampImage) return;
        const pos = getEventPosition(e);
        const stampSize = parseInt(wbStampSizeSlider.value, 10);
        const dims = calculateStampDimensions(currentStampImage, stampSize);
        ctx.drawImage(currentStampImage, pos.x - dims.width / 2, pos.y - dims.height / 2, dims.width, dims.height);
        saveWbState();
    }
    
    function saveWbState() {
        if (wbHistory.length > HISTORY_LIMIT) wbHistory.shift();
        wbHistory.push({
            static: canvas.toDataURL(),
            rainbow: JSON.parse(JSON.stringify(rainbowStrokes)),
            erase: JSON.parse(JSON.stringify(eraseStrokes)),
            width: canvas.clientWidth,
            height: canvas.clientHeight
        });
        wbUndoBtn.disabled = wbHistory.length <= 1;
    }

    // --- Other functions (unchanged) ---
    function calculateStampDimensions(image, maxSize) {
        const { naturalWidth: originalWidth, naturalHeight: originalHeight } = image;
        if (originalWidth === 0 || originalHeight === 0) return { width: maxSize, height: maxSize };
        const ratio = originalWidth / originalHeight;
        return ratio > 1 ? { width: maxSize, height: maxSize / ratio } : { height: maxSize, width: maxSize * ratio };
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
                if (currentActive) { currentActive.classList.remove('active'); }
                previewItem.classList.add('active');
                const stampImg = new Image();
                stampImg.crossOrigin = "anonymous";
                stampImg.onload = () => { currentStampImage = stampImg; };
                stampImg.src = card.image;
            });
            wbStampCardContainer.appendChild(previewItem);
        });
    }
    function masterDownHandler(e) {
        if (e.button && e.button !== 0) return; 
        if (currentShape === 'stamp' && !isErasing) {
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
        eraseStrokes = [];
        isRainbowAnimating = false;
        saveWbState();
    });
    wbUndoBtn.addEventListener('click', () => {
        if (wbHistory.length > 1) {
            wbHistory.pop();
            const lastState = wbHistory[wbHistory.length - 1];
            rainbowStrokes = JSON.parse(JSON.stringify(lastState.rainbow));
            eraseStrokes = JSON.parse(JSON.stringify(lastState.erase));
            const shouldAnimate = rainbowStrokes.length > 0 || eraseStrokes.length > 0;
            if (shouldAnimate) {
                if (!isRainbowAnimating) {
                    isRainbowAnimating = true;
                    animateRainbow();
                }
            } else if (isRainbowAnimating) {
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
    ['mousedown', 'touchstart'].forEach(evt => canvas.addEventListener(evt, masterDownHandler, { passive: false }));
    ['mousemove', 'touchmove'].forEach(evt => {
        canvas.addEventListener(evt, draw, { passive: false });
        canvas.addEventListener(evt, drawStampPreview, { passive: false });
    });
    ['mouseup', 'touchend'].forEach(evt => canvas.addEventListener(evt, stopDrawing));
    canvas.addEventListener('mouseleave', e => {
        if (isDrawing) stopDrawing(e);
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    });
    window.addEventListener('resize', setGridAspectRatio);
    const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width: newCssWidth, height: newCssHeight } = entry.contentRect;
        
        const lastState = wbHistory.length > 0 ? wbHistory[wbHistory.length - 1] : null;
        
        const dpr = window.devicePixelRatio || 1;
        [canvas, rainbowCanvas, tempCanvas].forEach(c => {
            c.width = newCssWidth * dpr;
            c.height = newCssHeight * dpr;
            c.getContext('2d').scale(dpr, dpr);
        });
        const smallerDim = Math.min(newCssWidth, newCssHeight);
        const maxStampSize = Math.floor(smallerDim * 1);
        wbStampSizeSlider.max = Math.max(20, maxStampSize);
        if (parseInt(wbStampSizeSlider.value) > wbStampSizeSlider.max) {
            wbStampSizeSlider.value = wbStampSizeSlider.max;
        }
        updateContextStyle();

        if (lastState) {
            const oldWidth = lastState.width;
            const oldHeight = lastState.height;

            const scaleX = (oldWidth > 0) ? newCssWidth / oldWidth : 1;
            const scaleY = (oldHeight > 0) ? newCssHeight / oldHeight : 1;
            
            // Re-create a pristine copy from the history before scaling
            let tempRainbow = JSON.parse(JSON.stringify(lastState.rainbow));
            let tempErase = JSON.parse(JSON.stringify(lastState.erase));

            const scaleStroke = (stroke) => {
                stroke.width *= (scaleX + scaleY) / 2; // Scale width
                stroke.path.forEach(point => {
                    point.x *= scaleX;
                    point.y *= scaleY;
                });
                return stroke;
            };

            rainbowStrokes = tempRainbow.map(scaleStroke);
            eraseStrokes = tempErase.map(scaleStroke);
            
            const shouldAnimate = rainbowStrokes.length > 0 || eraseStrokes.length > 0;
            if (shouldAnimate) {
                if (!isRainbowAnimating) {
                    isRainbowAnimating = true;
                }
                // Always call animateRainbow to redraw with new scaled coords
                animateRainbow();
            } else {
                 isRainbowAnimating = false;
                 rainbowCtx.clearRect(0, 0, rainbowCanvas.width, rainbowCanvas.height);
            }

            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, newCssWidth, newCssHeight);
                const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                const canvasAspectRatio = newCssWidth / newCssHeight;
                let drawWidth = newCssWidth, drawHeight = newCssHeight, x = 0, y = 0;
                if (imgAspectRatio > canvasAspectRatio) {
                    drawHeight = newCssWidth / imgAspectRatio;
                    y = (newCssHeight - drawHeight) / 2;
                } else {
                    drawWidth = newCssHeight * imgAspectRatio;
                    x = (newCssWidth - drawWidth) / 2;
                }
                ctx.drawImage(img, x, y, drawWidth, drawHeight);
            };
            img.src = lastState.static;
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
    (async () => {
        await populateStampSelectors();
        populateStampGrid('');
    })();
    createColorPalette();
    resizeObserver.observe(canvasWrapper);
    fullscreenObserver.observe(toolCard, { attributes: true });
    setGridAspectRatio();
    wbPaintBtn.classList.add('active');
    updateLayoutClasses();
    setTimeout(() => {
        updateContextStyle();
        saveWbState();
    }, 100);
}