// js/tools/flashcard-manager.js

import { getAvailableFlashcardDecks, updateAllFlashcardCategorySelects, updateLiveFlashcardSet } from '../utils.js';
import { saveSet, deleteSet, getAllSets, importDecks } from '../db.js';

export function initFlashcardManager() {
    const setSelect = document.getElementById('fm-set-select');
    const deleteSetBtn = document.getElementById('fm-delete-set-btn');
    const setNameInput = document.getElementById('fm-set-name');
    const cardTextInput = document.getElementById('fm-card-text');
    const cardImgInput = document.getElementById('fm-card-img');
    const addCardBtn = document.getElementById('fm-add-card-btn');
    const currentCardsContainer = document.getElementById('fm-current-cards');
    const saveSetBtn = document.getElementById('fm-save-set-btn');
    const exportBtn = document.getElementById('fm-export-btn');
    const importInput = document.getElementById('fm-import-input');

    let currentCards = [];

    function updateCardListView() {
        currentCardsContainer.innerHTML = '';
        currentCards.forEach((card, index) => {
            const cardItem = document.createElement('div');
            cardItem.className = 'fm-card-item';
    
            // Wrapper for thumbnail and text
            const cardDetails = document.createElement('div');
            cardDetails.className = 'fm-card-details';
    
            if (card.image) {
                const thumbnail = document.createElement('img');
                thumbnail.src = card.image;
                thumbnail.className = 'fm-card-thumbnail';
                thumbnail.alt = 'Card thumbnail';
                cardDetails.appendChild(thumbnail);
            }
    
            const cardName = document.createElement('span');
            cardName.className = 'fm-card-name';
            cardName.textContent = card.text || '[Image Only]';
            cardDetails.appendChild(cardName);
    
            // Wrapper for buttons
            const cardActions = document.createElement('div');
            cardActions.className = 'fm-card-actions';
    
            const renameBtn = document.createElement('button');
            renameBtn.textContent = 'Rename';
            renameBtn.className = 'fm-rename-btn';
            renameBtn.title = `Rename ${card.text || 'this card'}`;
            renameBtn.addEventListener('click', () => {
                const newName = prompt('Enter new text for this card:', card.text || '');
                if (newName !== null) { // Handle clicking "Cancel"
                    card.text = newName.trim();
                    updateCardListView();
                }
            });
            
            const muteBtn = document.createElement('button');
            muteBtn.className = 'fm-mute-btn';
            
            if (card.muted) {
                cardItem.classList.add('fm-card-item--muted');
                muteBtn.textContent = 'Unmute';
                muteBtn.title = `Unmute ${card.text || 'this card'} to use in games`;
                muteBtn.classList.add('muted');
            } else {
                muteBtn.textContent = 'Mute';
                muteBtn.title = `Mute ${card.text || 'this card'} to hide from games`;
            }
            
            muteBtn.addEventListener('click', () => {
                card.muted = !card.muted; // Toggle the muted state
                updateCardListView(); // Redraw the list
            });
    
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.className = 'fm-remove-btn';
            removeBtn.title = `Remove ${card.text || 'this card'}`;
            removeBtn.addEventListener('click', () => {
                currentCards.splice(index, 1);
                updateCardListView();
            });
    
            cardActions.appendChild(renameBtn);
            cardActions.appendChild(muteBtn);
            cardActions.appendChild(removeBtn);
    
            cardItem.appendChild(cardDetails);
            cardItem.appendChild(cardActions);
            currentCardsContainer.appendChild(cardItem);
        });
        
        // ** THE FIX IS HERE **: Report the live state to the central utility.
        updateLiveFlashcardSet(setNameInput.value.trim(), currentCards);
    }

    function clearCardInputs() {
        cardTextInput.value = '';
        cardImgInput.value = '';
    }
    
    async function loadSet() {
        const setName = setSelect.value;
        if (!setName) {
            setNameInput.value = '';
            currentCards = [];
            deleteSetBtn.disabled = true;
            updateCardListView();
            return;
        }

        const allDecks = await getAvailableFlashcardDecks();

        if (allDecks[setName]) {
            setNameInput.value = setName;
            // Deep copy the array to prevent mutation issues
            currentCards = JSON.parse(JSON.stringify(allDecks[setName]));
            deleteSetBtn.disabled = false;
        } else {
            setNameInput.value = '';
            currentCards = [];
            deleteSetBtn.disabled = true;
        }
        updateCardListView();
    }

    setSelect.addEventListener('change', loadSet);

    addCardBtn.addEventListener('click', () => {
    const text = cardTextInput.value.trim();
    const imgFiles = cardImgInput.files;

    if (!text && imgFiles.length === 0) {
        alert('Please provide text or select at least one image file.');
        return;
    }

    if (imgFiles.length > 0) {
        // Create a promise for each file reading operation.
        const readPromises = Array.from(imgFiles).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    // If only one image is selected, use the text from the input field.
                    // If multiple images are selected, each gets its own card with no text.
                    const cardText = (imgFiles.length === 1) ? text : '';
                    resolve({ text: cardText, image: e.target.result, muted: false });
                };
                reader.onerror = err => reject(err);
                reader.readAsDataURL(file);
            });
        });

        // Once all files have been read successfully...
        Promise.all(readPromises).then(newCards => {
            currentCards.push(...newCards); // Add all new cards to the list
            updateCardListView(); // Update the UI once
            clearCardInputs(); // Clear inputs once
        }).catch(error => {
            console.error('Error reading image files:', error);
            alert('There was an error processing one or more of the images.');
        });

    } else {
        // This block handles the case of a text-only card.
        currentCards.push({ text: text, muted: false });
        updateCardListView();
        clearCardInputs();
    }
});
    
    saveSetBtn.addEventListener('click', async () => {
        const setName = setNameInput.value.trim();
        if (!setName) {
            alert('Please enter a name for the set.');
            return;
        }
        if (currentCards.length === 0) {
            alert('Please add at least one card to the set.');
            return;
        }

        try {
            await saveSet(setName, currentCards);
            alert(`Set "${setName}" saved successfully!`);
            await updateAllFlashcardCategorySelects();
            setSelect.value = setName;
            deleteSetBtn.disabled = false;
        } catch (error) {
            alert(`Failed to save set. Your browser's storage may be full. Error: ${error.name}`);
        }
    });

    deleteSetBtn.addEventListener('click', async () => {
        const setName = setSelect.value;
        if (!setName) return;

        if (confirm(`Are you sure you want to delete the set "${setName}"? This cannot be undone.`)) {
            await deleteSet(setName);
            alert(`Set "${setName}" has been deleted.`);
            await updateAllFlashcardCategorySelects();
            setSelect.value = ''; // Reset selection
            loadSet();
        }
    });
    
    exportBtn.addEventListener('click', async () => {
        const customDecks = await getAllSets();
        const deckCount = Object.keys(customDecks).length;

        if (deckCount === 0) {
            alert('No custom sets to export.');
            return;
        }

        const blob = new Blob([JSON.stringify(customDecks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brain-power-flashcards.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`${deckCount} custom set(s) have been exported!`);
    });
    
    importInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (typeof importedData !== 'object' || importedData === null) {
                    throw new Error("Invalid format: JSON is not an object.");
                }

                await importDecks(importedData);
                alert('Sets imported successfully! New and updated sets are now available.');
                await updateAllFlashcardCategorySelects();
                loadSet();

            } catch (error) {
                alert('Import failed. The file is either not valid JSON or is corrupted.');
                console.error("Flashcard import error:", error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });
}