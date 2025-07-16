// js/tools/phonics.js

import { phonicsData } from './phonics-data.js';

// --- START: New Sorting Logic ---

/**
 * Extracts the focus grapheme from a card's word HTML.
 * @param {object} card - The phonics card object.
 * @returns {string|null} The grapheme inside the <strong> tag, or null.
 */
function getFocusGrapheme(card) {
    if (!card || !card.word) return null;
    const match = card.word.match(/<strong>(.*?)<\/strong>/);
    return match ? match[1] : null;
}

/**
 * Creates a map to define the sorting order of all graphemes
 * based on their sequence in the phonicsData.
 */
const masterGraphemeOrderMap = new Map();
let orderIndex = 0;
Object.values(phonicsData).forEach(phase => {
    Object.values(phase.subgroups).forEach(subgroup => {
        // Use the 'focus' string to establish the teaching order
        subgroup.focus.split(',').forEach(grapheme => {
            const trimmed = grapheme.trim();
            if (!masterGraphemeOrderMap.has(trimmed)) {
                masterGraphemeOrderMap.set(trimmed, orderIndex++);
            }
        });
    });
});
// --- END: New Sorting Logic ---


export function initPhonics() {
    // --- DOM Elements ---
    const toolCard = document.getElementById('phonics-tool');
    const controlsPanel = document.getElementById('phonics-controls-panel');
    const loadBtn = document.getElementById('phonics-load-btn');
    const cumulativeCheck = document.getElementById('phonics-cumulative-check');

    // Fullscreen View Elements
    const displayPanel_fs = document.getElementById('phonics-display-panel');
    const cardWord_fs = document.getElementById('phonics-card-word');
    const cardImage_fs = document.getElementById('phonics-card-image');
    const cardSentence_fs = document.getElementById('phonics-card-sentence');
    const cardCounter_fs = document.getElementById('phonics-card-counter');
    const prevBtn_fs = document.querySelector('.phonics-top-nav #phonics-prev-btn');
    const nextBtn_fs = document.querySelector('.phonics-top-nav #phonics-next-btn');
    const soundBtn_fs = document.querySelector('.phonics-top-nav #phonics-sound-btn');

    // Grid View Elements
    const cardWord_grid = document.getElementById('phonics-card-word_grid');
    const cardImage_grid = document.getElementById('phonics-card-image_grid');
    const cardCounter_grid = document.getElementById('phonics-card-counter_grid');
    const prevBtn_grid = document.getElementById('phonics-prev-btn_grid');
    const nextBtn_grid = document.getElementById('phonics-next-btn_grid');
    const soundBtn_grid = document.getElementById('phonics-sound-btn_grid');
    
    // --- State ---
    let currentDeck = [];
    let currentIndex = 0;
    const PHONICS_STORAGE_KEY = 'brainPowerPhonicsLastSet';

    // --- Core Functions ---

    function renderControlPanel() {
        controlsPanel.innerHTML = '';
        const fragment = document.createDocumentFragment();

        for (const categoryKey in phonicsData) {
            const category = phonicsData[categoryKey];
            const details = document.createElement('details');
            details.className = 'phonics-category-group';
            const summary = document.createElement('summary');
            summary.textContent = category.name;
            details.appendChild(summary);
            const subgroupContainer = document.createElement('div');
            subgroupContainer.className = 'phonics-subgroup-list';

            for (const subKey in category.subgroups) {
                const subgroup = category.subgroups[subKey];
                const checkboxId = `phonics-check-${categoryKey}-${subKey}`;
                const item = document.createElement('div');
                item.className = 'phonics-checkbox-item';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = checkboxId;
                input.dataset.categoryKey = categoryKey;
                input.dataset.subgroupKey = subKey;
                const label = document.createElement('label');
                label.htmlFor = checkboxId;
                label.textContent = subgroup.name;
                item.appendChild(input);
                item.appendChild(label);
                subgroupContainer.appendChild(item);
            }
            details.appendChild(subgroupContainer);
            fragment.appendChild(details);
        }
        controlsPanel.appendChild(fragment);
    }
    
    function loadSelectedSounds() {
        const isCumulative = cumulativeCheck.checked;
        const selectedCheckboxes = controlsPanel.querySelectorAll('input[type="checkbox"]:checked');
        const checkedKeys = Array.from(selectedCheckboxes).map(cb => `${cb.dataset.categoryKey}|${cb.dataset.subgroupKey}`);
        
        saveLastSet(checkedKeys, isCumulative);
        
        const newDeck = generateDeck(checkedKeys, isCumulative);

        if (newDeck.length === 0) {
            alert('Please select at least one phonics set to practice.');
            return;
        }

        currentDeck = newDeck;
        currentIndex = 0;
        
        displayPanel_fs.classList.remove('hidden');
        showCard(currentIndex);
    }

    function generateDeck(checkedKeys, isCumulative) {
        let newDeck = [];
        const cardSetsToLoad = new Set();
    
        if (isCumulative) {
            const allCategoryKeys = Object.keys(phonicsData);
            allCategoryKeys.forEach(categoryKey => {
                const category = phonicsData[categoryKey];
                const subgroupKeys = Object.keys(category.subgroups);
                let highestCheckedIndex = -1;
    
                subgroupKeys.forEach((subKey, index) => {
                    if (checkedKeys.includes(`${categoryKey}|${subKey}`)) {
                        highestCheckedIndex = index;
                    }
                });
    
                if (highestCheckedIndex !== -1) {
                    for (let i = 0; i <= highestCheckedIndex; i++) {
                        const subKey = subgroupKeys[i];
                        cardSetsToLoad.add(category.subgroups[subKey].cards);
                    }
                }
            });
        } else {
            checkedKeys.forEach(key => {
                const [categoryKey, subgroupKey] = key.split('|');
                const cardSet = phonicsData[categoryKey]?.subgroups[subgroupKey]?.cards;
                if (cardSet) {
                    cardSetsToLoad.add(cardSet);
                }
            });
        }
    
        cardSetsToLoad.forEach(cardArray => {
            newDeck.push(...cardArray);
        });
    
        // ** THE FIX IS HERE: Always sort the deck logically instead of shuffling. **
        newDeck.sort((a, b) => {
            const graphemeA = getFocusGrapheme(a);
            const graphemeB = getFocusGrapheme(b);
            
            // Use ?? Infinity to place unknown/untagged graphemes at the end
            const orderA = masterGraphemeOrderMap.get(graphemeA) ?? Infinity;
            const orderB = masterGraphemeOrderMap.get(graphemeB) ?? Infinity;
            
            // Primary sort: by the grapheme's teaching order
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            
            // Secondary sort: alphabetically by word, to keep groups consistent
            const cleanWordA = a.word.replace(/<[^>]*>/g, '');
            const cleanWordB = b.word.replace(/<[^>]*>/g, '');
            return cleanWordA.localeCompare(cleanWordB);
        });
    
        return newDeck;
    }

    function showCard(index) {
        if (currentDeck.length === 0 || index < 0 || index >= currentDeck.length) return;

        const card = currentDeck[index];
        const cleanWord = card.word.replace(/<[^>]*>/g, '');
        const counterText = `Card ${index + 1} of ${currentDeck.length}`;
        const imageSrc = card.image || 'assets/phonics/placeholder.png';

        // Update Fullscreen View
        cardWord_fs.innerHTML = card.word;
        cardImage_fs.src = imageSrc;
        cardImage_fs.alt = cleanWord;
        cardSentence_fs.textContent = card.sentence || '';
        cardCounter_fs.textContent = counterText;
        
        // Update Grid View
        cardWord_grid.innerHTML = card.word;
        cardImage_grid.src = imageSrc;
        cardImage_grid.alt = cleanWord;
        cardCounter_grid.textContent = counterText;
    }

    function speakWord(wordHtml) {
        if (!wordHtml || !('speechSynthesis' in window)) return;
        
        const cleanWord = wordHtml.replace(/<[^>]*>/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanWord);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
    
    function handleNext() {
        if (currentDeck.length === 0) return;
        currentIndex = (currentIndex + 1) % currentDeck.length;
        showCard(currentIndex);
        speakWord(currentDeck[currentIndex].word); // Speak new word
    }

    function handlePrev() {
        if (currentDeck.length === 0) return;
        currentIndex = (currentIndex - 1 + currentDeck.length) % currentDeck.length;
        showCard(currentIndex);
        speakWord(currentDeck[currentIndex].word); // Speak new word
    }
    
    function handleSound() {
        if (currentDeck[currentIndex]) {
            speakWord(currentDeck[currentIndex].word);
        }
    }

    function saveLastSet(checkedKeys, isCumulative) {
        try {
            localStorage.setItem(PHONICS_STORAGE_KEY, JSON.stringify({ checkedKeys, isCumulative }));
        } catch (e) {
            console.warn("Could not save phonics set to localStorage.");
        }
    }

    function loadInitialSet() {
        let savedState;
        try {
            savedState = JSON.parse(localStorage.getItem(PHONICS_STORAGE_KEY));
        } catch (e) {
            savedState = null;
        }

        let checkedKeys = savedState?.checkedKeys || ['phase2_cvc|set1_satpin'];
        let isCumulative = savedState?.isCumulative ?? true;

        // Restore checkbox states in fullscreen panel
        controlsPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = checkedKeys.includes(`${cb.dataset.categoryKey}|${cb.dataset.subgroupKey}`);
        });
        cumulativeCheck.checked = isCumulative;

        // Generate and load the initial deck
        currentDeck = generateDeck(checkedKeys, isCumulative);
        currentIndex = 0;
        showCard(currentIndex);
    }

    // --- Event Listeners ---
    loadBtn.addEventListener('click', loadSelectedSounds);

    // Fullscreen Listeners
    nextBtn_fs.addEventListener('click', handleNext);
    prevBtn_fs.addEventListener('click', handlePrev);
    soundBtn_fs.addEventListener('click', handleSound);

    // Grid Listeners
    nextBtn_grid.addEventListener('click', handleNext);
    prevBtn_grid.addEventListener('click', handlePrev);
    soundBtn_grid.addEventListener('click', handleSound);

    // --- Init ---
    renderControlPanel(); 
    loadInitialSet();
}