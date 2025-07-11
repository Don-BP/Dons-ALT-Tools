// js/tools/flashcard-manager.js

import { getAvailableFlashcardDecks, updateAllFlashcardCategorySelects } from '../utils.js';
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

            const cardInfo = document.createElement('span');
            let displayText = card.text || '[Image Only]';
            if (card.image && card.text) {
                displayText += ' (image)';
            } else if (card.image && !card.text) {
                displayText = '[Image Only]';
            }
            cardInfo.textContent = displayText;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.title = `Remove ${card.text || 'this card'}`;
            removeBtn.addEventListener('click', () => {
                currentCards.splice(index, 1);
                updateCardListView();
            });

            cardItem.appendChild(cardInfo);
            cardItem.appendChild(removeBtn);
            currentCardsContainer.appendChild(cardItem);
        });
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
        const imgFile = cardImgInput.files[0];

        if (!text && !imgFile) {
            alert('Please provide text or an image for the card.');
            return;
        }

        const newCard = { text: text };

        if (imgFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newCard.image = e.target.result;
                currentCards.push(newCard);
                updateCardListView();
                clearCardInputs();
            };
            reader.readAsDataURL(imgFile);
        } else {
            currentCards.push(newCard);
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