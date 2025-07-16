// js/utils.js
import { getAllSets } from './db.js';

// --- Shared State & Constants ---
let isMuted = false;
// DEPRECATED: localStorage key is no longer the primary source of truth.
export const CUSTOM_FLASHCARDS_KEY = 'brainPowerCustomFlashcards_DEPRECATED';
export const builtInFlashcardData = {};

// ** THE FIX IS HERE **: A central place to hold the live, in-memory state from the manager.
let liveFlashcardSet = { name: null, cards: [] };

/**
 * Allows the flashcard manager to update the live, in-memory version of a deck.
 * @param {string | null} setName - The name of the set being edited.
 * @param {Array} cards - The current array of card objects.
 */
export function updateLiveFlashcardSet(setName, cards) {
    liveFlashcardSet = {
        name: setName,
        cards: cards || []
    };
}

/**
 * Toggles the global mute state.
 * @returns {boolean} The new mute state.
 */
export function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

/**
 * Plays a sound file if the application is not muted.
 * @param {string} soundFile - The path to the audio file.
 */
export function playSound(soundFile) {
    if (!isMuted) {
        new Audio(soundFile).play().catch(e => console.error("Could not play sound:", e));
    }
}

/**
 * Retrieves all flashcard decks, combining built-in, custom from DB, and the live edited one.
 * This is now an ASYNCHRONOUS function.
 * @returns {Promise<object>} A promise that resolves to an object containing all available flashcard decks.
 */
export async function getAvailableFlashcardDecks() {
    // 1. Get all decks from permanent storage (built-in and DB)
    const customDecks = await getAllSets();
    const allDecks = { ...builtInFlashcardData, ...customDecks };

    // 2. ** THE FIX IS HERE **: If a deck is being edited live, overwrite the version from storage.
    if (liveFlashcardSet.name) {
        // Use JSON stringify/parse for a deep copy to prevent other modules
        // from accidentally mutating the manager's live state.
        allDecks[liveFlashcardSet.name] = JSON.parse(JSON.stringify(liveFlashcardSet.cards));
    }

    return allDecks;
}

/**
 * Populates all relevant <select> elements with flashcard categories.
 * This is now an ASYNCHRONOUS function.
 */
export async function updateAllFlashcardCategorySelects() {
    // Await the decks since retrieval is now async
    const allDecks = await getAvailableFlashcardDecks();
    const selects = [
        document.getElementById('flashcard-category'),
        document.getElementById('whats-missing-category'),
        document.getElementById('fm-set-select'),
        document.getElementById('bingo-list-select'),
        document.getElementById('spinner-flashcard-select'),
        document.getElementById('spinner-flashcard-select_fs')
    ];

    selects.forEach(selectElement => {
        if (!selectElement) return;

        const currentVal = selectElement.value;
        const isManager = selectElement.id === 'fm-set-select';
        const isBingo = selectElement.id === 'bingo-list-select';
        const isSpinner = selectElement.id === 'spinner-flashcard-select' || selectElement.id === 'spinner-flashcard-select_fs';
        
        let firstOptionText = isManager ? '-- Create New Set --' : 'Select a category';
        if (isBingo) firstOptionText = '-- Custom List Below --';
        if (isSpinner) firstOptionText = '-- Manual List --';

        let firstOptionValue = '';
        if (isBingo) firstOptionValue = 'custom';
        
        selectElement.innerHTML = `<option value="${firstOptionValue}">${firstOptionText}</option>`;

        // Add built-in sets first
        for (const category in builtInFlashcardData) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        }

        // Add custom sets from IndexedDB
        const customDecks = Object.keys(allDecks).filter(k => !builtInFlashcardData.hasOwnProperty(k));
        if (customDecks.length > 0) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = 'My Custom Sets';
            for (const category of customDecks) {
                 const option = document.createElement('option');
                 option.value = category;
                 option.textContent = category;
                 optGroup.appendChild(option);
            }
            selectElement.appendChild(optGroup);
        }

        // Try to restore previous selection
        selectElement.value = currentVal;
        if (!selectElement.value && selectElement.options.length > 0) {
            selectElement.selectedIndex = 0;
        }
    });
}