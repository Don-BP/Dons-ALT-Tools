// js/tools/flashcards.js

import { getAvailableFlashcardDecks } from '../utils.js';

export function initFlashcards() {
    const flashcardTool = document.querySelector('.tool-card:has(#flashcard-category)');
    const categorySelect = document.getElementById('flashcard-category');
    const displayContainer = document.getElementById('flashcard-display-container');
    const gridViewContainer = document.getElementById('flashcard-grid-view');
    const flashcardFront = document.querySelector('.flashcard-front');
    const flashcardBack = document.querySelector('.flashcard-back');
    const prevBtn = document.getElementById('flashcard-prev');
    const randomBtn = document.getElementById('flashcard-random');
    const nextBtn = document.getElementById('flashcard-next');
    const toggleBtn = document.getElementById('flashcard-show-all-toggle');


    let currentDeck = [];
    let currentIndex = 0;
    let activeFace = 'front';
    let isGridView = false;
    let resizeObserver;

    function renderGridView() {
        gridViewContainer.innerHTML = '';
        if (currentDeck.length === 0) {
            gridViewContainer.textContent = 'No active cards to display.';
            return;
        }
        
        // --- CHANGE START ---
        // Check the fullscreen state at the time of rendering.
        const isFullscreen = flashcardTool.classList.contains('fullscreen-mode');
        // --- CHANGE END ---


        // Function to calculate best grid layout
        const calculateAndApplyOptimalGrid = () => {
            if (!isGridView || !gridViewContainer.isConnected) return;
            const containerWidth = gridViewContainer.clientWidth;
            const containerHeight = gridViewContainer.clientHeight;
            if (containerWidth === 0 || containerHeight === 0) return;

            let bestLayout = { cols: 1, rows: currentDeck.length, cardSize: 0 };
            const cardAspectRatio = 4 / 3; // Assume a standard 4:3 aspect ratio for calculation

            for (let cols = 1; cols <= currentDeck.length; cols++) {
                const rows = Math.ceil(currentDeck.length / cols);
                const cardWidth = (containerWidth / cols) - 10; // Account for gap
                const cardHeight = (containerHeight / rows) - 10; // Account for gap
                
                let potentialCardWidth;
                if (cardWidth / cardAspectRatio > cardHeight) {
                    potentialCardWidth = cardHeight * cardAspectRatio;
                } else {
                    potentialCardWidth = cardWidth;
                }

                if (potentialCardWidth > bestLayout.cardSize) {
                    bestLayout = { cols, rows, cardSize: potentialCardWidth };
                }
            }

            gridViewContainer.style.gridTemplateColumns = `repeat(${bestLayout.cols}, 1fr)`;
            gridViewContainer.style.gridTemplateRows = `repeat(${bestLayout.rows}, 1fr)`;
        };

        // Create and append all cards to the grid with flip structure
        currentDeck.forEach(cardData => {
            const cardEl = document.createElement('div');
            cardEl.className = 'flashcard-grid-item';
            
            const innerEl = document.createElement('div');
            innerEl.className = 'fgi-inner';
            
            const frontEl = document.createElement('div');
            frontEl.className = 'fgi-front';

            const backEl = document.createElement('div');
            backEl.className = 'fgi-back';
            const randomBack = Math.ceil(Math.random() * 2);
            backEl.style.backgroundImage = `url('assets/flashcards/card-back${randomBack}.png')`;
            
            // --- CHANGE START ---
            // Apply different rendering logic based on the fullscreen state.
            if (isFullscreen) {
                // In fullscreen, always show both image and text if they exist.
                if (cardData.image) {
                    const img = document.createElement('img');
                    img.src = cardData.image;
                    img.alt = cardData.text || 'Flashcard Image';
                    frontEl.appendChild(img);
                }
                if (cardData.text) {
                    const text = document.createElement('div');
                    text.textContent = cardData.text;
                    frontEl.appendChild(text);
                }
            } else {
                // Not in fullscreen, apply the "image-only" rule.
                if (cardData.image) {
                    const img = document.createElement('img');
                    img.src = cardData.image;
                    img.alt = cardData.text || 'Flashcard Image';
                    frontEl.appendChild(img);
                } else if (cardData.text) {
                    // This 'else if' ensures text only shows if there is NO image.
                    const text = document.createElement('div');
                    text.textContent = cardData.text;
                    frontEl.appendChild(text);
                }
            }
            // --- CHANGE END ---

            innerEl.appendChild(frontEl);
            innerEl.appendChild(backEl);
            cardEl.appendChild(innerEl);
            gridViewContainer.appendChild(cardEl);

            // Add click listener to the card for flipping
            cardEl.addEventListener('click', () => {
                cardEl.classList.toggle('is-flipped');
            });
        });

        // Initial calculation and set up observer to auto-resize
        calculateAndApplyOptimalGrid();
        if (resizeObserver) resizeObserver.disconnect();
        resizeObserver = new ResizeObserver(calculateAndApplyOptimalGrid);
        resizeObserver.observe(gridViewContainer);
    }

    function toggleView() {
        isGridView = !isGridView;
        flashcardTool.classList.toggle('grid-view-active', isGridView);

        if (isGridView) {
            toggleBtn.textContent = 'Show One';
            renderGridView();
        } else {
            toggleBtn.textContent = 'Show All';
            if (resizeObserver) resizeObserver.disconnect();
            showCard(true); // Re-render the single card view
        }
    }


    async function loadCategory(category) {
        const allDecks = await getAvailableFlashcardDecks();
        const rawDeck = allDecks[category] ? JSON.parse(JSON.stringify(allDecks[category])) : [];
        currentDeck = rawDeck.filter(card => !card.muted); // THE FIX IS HERE
        currentIndex = 0;
        
        if (isGridView) {
            renderGridView();
        } else {
            showCard(true);
        }
    }

    function updateCardFace(faceElement, cardData) {
        faceElement.innerHTML = '';
        if (!cardData) {
            faceElement.textContent = currentDeck.length > 0 ? 'No more cards' : 'Select a category';
            return;
        }

        if (cardData.image) {
            const img = document.createElement('img');
            img.src = cardData.image;
            img.alt = cardData.text || 'Flashcard Image';
            faceElement.appendChild(img);
        }
        
        if (cardData.text) {
            const text = document.createElement('div');
            text.textContent = cardData.text;
            faceElement.appendChild(text);
        }
    }

    function showCard(isInitial = false) {
        if (currentDeck.length === 0) {
            updateCardFace(flashcardFront, null);
            flashcardFront.classList.add('active');
            flashcardBack.classList.remove('active');
            activeFace = 'front';
            return;
        }
        
        const cardData = currentDeck[currentIndex];

        if (isInitial) {
            updateCardFace(flashcardFront, cardData);
            flashcardFront.classList.add('active');
            flashcardBack.classList.remove('active');
            activeFace = 'front';
        } else {
            const targetFace = activeFace === 'front' ? flashcardBack : flashcardFront;
            const sourceFace = activeFace === 'front' ? flashcardFront : flashcardBack;
            
            updateCardFace(targetFace, cardData);
            sourceFace.classList.remove('active');
            targetFace.classList.add('active');
            activeFace = activeFace === 'front' ? 'back' : 'front';
        }
    }

    // --- CHANGE START ---
    // This observer will automatically re-render the grid when entering/exiting fullscreen
    const fullscreenObserver = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.attributeName === 'class') {
                // If we are in grid view when the fullscreen class changes, re-render the grid
                if (isGridView) {
                    renderGridView();
                }
            }
        }
    });
    fullscreenObserver.observe(flashcardTool, { attributes: true });
    // --- CHANGE END ---


    toggleBtn.addEventListener('click', toggleView);
    categorySelect.addEventListener('change', (e) => loadCategory(e.target.value));
    nextBtn.addEventListener('click', () => {
        if (currentDeck.length === 0) return;
        currentIndex = (currentIndex + 1) % currentDeck.length;
        showCard();
    });
    prevBtn.addEventListener('click', () => {
        if (currentDeck.length === 0) return;
        currentIndex = (currentIndex - 1 + currentDeck.length) % currentDeck.length;
        showCard();
    });
    randomBtn.addEventListener('click', () => {
        if (currentDeck.length <= 1) return;
        let newIndex;
        do { newIndex = Math.floor(Math.random() * currentDeck.length); } while (newIndex === currentIndex);
        currentIndex = newIndex;
        showCard();
    });
    
    if (categorySelect.value) {
        loadCategory(categorySelect.value);
    }
}