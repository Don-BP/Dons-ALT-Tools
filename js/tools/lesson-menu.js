// js/tools/lesson-menu.js

import { saveLessonMenu, getAllLessonMenus, deleteLessonMenu, importLessonMenus } from '../db.js';

export function initLessonMenu() {
    // --- DOM Elements ---
    const toolCard = document.getElementById('lesson-menu-tool');
    const menuDisplayGrid = document.getElementById('lm-menu-display-grid');
    const menuDisplayFullscreen = document.getElementById('lm-menu-display-fullscreen');
    // ... (other DOM elements remain the same) ...
    const activityButtonsContainer = document.getElementById('lm-activity-buttons');
    const customActivityInput = document.getElementById('lm-custom-activity-input');
    const customTimeInput = document.getElementById('lm-custom-time-input');
    const addCustomBtn = document.getElementById('lm-add-custom-btn');
    const loadSelect = document.getElementById('lm-load-select');
    const menuNameInput = document.getElementById('lm-menu-name-input');
    const saveBtn = document.getElementById('lm-save-btn');
    const deleteBtn = document.getElementById('lm-delete-btn');
    const exportBtn = document.getElementById('lm-export-btn');
    const importInput = document.getElementById('lm-import-input');

    // --- State ---
    let currentMenuItems = [];
    let draggedItem = null;
    const PRESET_ACTIVITIES = ["Greeting", "Warm-up", "Demo", "Practice", "Activity", "Speaking", "Listening", "Game", "Quiz", "Review"];

    // --- Core Functions ---

    /**
     * Helper to convert activity text into a slug for CSS/image mapping.
     */
    function getActivitySlug(text) {
        const slug = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Check if the slug matches known presets, otherwise default to custom
        if (PRESET_ACTIVITIES.map(a => a.toLowerCase().replace('-', '')).includes(slug)) {
            return slug;
        }
        // Specific handling for warm-up vs warmup
        if (slug === 'warmup') return 'warmup'; 
        return 'custom';
    }

    /**
     * Toggles the 'cleared' state of a menu item and re-renders the menu.
     * @param {number} index - The index of the item in currentMenuItems.
     */
    function toggleClearedState(index) {
        if (currentMenuItems[index]) {
            currentMenuItems[index].cleared = !currentMenuItems[index].cleared;
            renderMenu();
        }
    }

    /**
     * Dynamically adjusts the font size of menu items to ensure they fit within the container without scrolling.
     */
    function adjustMenuFontSize() {
        // We ONLY want to dynamically resize the font in the fullscreen container.
        const container = menuDisplayFullscreen;
        
        // Don't do anything if the fullscreen container is hidden (e.g., in grid view).
        if (container.offsetParent === null) return; 

        // Reset font size to max before measuring
        let fontSize = 2.5; // Start at 2.5rem (or equivalent base size from CSS)
        container.style.setProperty('--menu-item-font-size', `${fontSize}rem`);

        // Iteratively reduce font size until it fits or hits minimum
        const minFontSize = 1.0; // Minimum readable size

        while (container.scrollHeight > container.clientHeight && fontSize > minFontSize) {
            fontSize -= 0.1;
            container.style.setProperty('--menu-item-font-size', `${fontSize}rem`);
        }
    }

    /**
     * Renders the menu in both grid and fullscreen displays.
     */
    function renderMenu() {
        // Clear both displays
        menuDisplayGrid.innerHTML = '';
        menuDisplayFullscreen.innerHTML = '';

        if (currentMenuItems.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'lm-placeholder';
            placeholder.textContent = toolCard.classList.contains('fullscreen-mode')
                ? 'Add an activity from the panel to start building your menu!'
                : 'Go fullscreen to build your lesson menu!';
            menuDisplayGrid.appendChild(placeholder.cloneNode(true));
            menuDisplayFullscreen.appendChild(placeholder);
            return;
        }

        const fragmentGrid = document.createDocumentFragment();
        const fragmentFullscreen = document.createDocumentFragment();

        currentMenuItems.forEach((item, index) => {
            // Create the main item element
            const menuItemEl = document.createElement('div');
            menuItemEl.className = 'lm-menu-item';
            menuItemEl.dataset.index = index;
            menuItemEl.dataset.activity = getActivitySlug(item.text);

            // ** CHANGE: Add cleared class if applicable **
            if (item.cleared) {
                menuItemEl.classList.add('cleared');
            }

            // Drag handle (only in fullscreen)
            const dragHandle = document.createElement('span');
            dragHandle.className = 'lm-item-drag-handle';
            dragHandle.innerHTML = '☰'; // Trigram for heaven symbol
            dragHandle.draggable = true;
            menuItemEl.appendChild(dragHandle);

            // Item Text
            const itemText = document.createElement('span');
            itemText.className = 'lm-item-text';
            itemText.textContent = item.text;
            menuItemEl.appendChild(itemText);

            // Item Time (if it exists)
            if (item.time) {
                const itemTime = document.createElement('span');
                itemTime.className = 'lm-item-time';
                itemTime.textContent = item.time;
                menuItemEl.appendChild(itemTime);
            }

            // ** CHANGE: Create stamp image **
            const stampImg = document.createElement('img');
            stampImg.src = 'assets/lesson-menu/clear-stamp.png';
            stampImg.className = 'lm-item-stamp';
            stampImg.alt = 'Cleared Stamp';
            menuItemEl.appendChild(stampImg);

            // Delete button (only in fullscreen)
            const deleteItemBtn = document.createElement('button');
            deleteItemBtn.className = 'lm-item-delete';
            deleteItemBtn.innerHTML = '×';
            deleteItemBtn.title = 'Remove item';
            deleteItemBtn.addEventListener('click', () => {
                currentMenuItems.splice(index, 1);
                renderMenu();
            });
            menuItemEl.appendChild(deleteItemBtn);

            // Add animation class if it's a new item
            if (item.isNew) {
                menuItemEl.classList.add('animate-in');
                // Clean up animation class after it runs
                setTimeout(() => {
                    if (menuItemEl.parentNode) {
                       menuItemEl.classList.remove('animate-in');
                    }
                    delete item.isNew;
                }, 700);
            }
            
            // ** CHANGE: Add click listener to the whole item for toggling cleared state (fullscreen) **
            menuItemEl.addEventListener('click', (e) => {
                // Prevent toggling when clicking the delete button or dragging
                if (e.target.classList.contains('lm-item-delete') || e.target.classList.contains('lm-item-drag-handle')) {
                    return;
                }
                toggleClearedState(index);
            });

            // Add drag events (only needed for fullscreen element)
            menuItemEl.addEventListener('dragstart', handleDragStart);
            menuItemEl.addEventListener('dragover', handleDragOver);
            menuItemEl.addEventListener('dragleave', handleDragLeave);
            menuItemEl.addEventListener('drop', handleDrop);
            menuItemEl.addEventListener('dragend', handleDragEnd);

            fragmentFullscreen.appendChild(menuItemEl);

            // Create a simplified version for the grid view (no controls)
            const menuItemGridEl = menuItemEl.cloneNode(true);
            menuItemGridEl.querySelector('.lm-item-drag-handle').remove();
            menuItemGridEl.querySelector('.lm-item-delete').remove();
            
            // ** CHANGE: Add separate click listener for the grid item **
            // Note: cloneNode does not copy event listeners.
            menuItemGridEl.addEventListener('click', () => {
                toggleClearedState(index);
            });

            fragmentGrid.appendChild(menuItemGridEl);
        });

        menuDisplayFullscreen.appendChild(fragmentFullscreen);
        menuDisplayGrid.appendChild(fragmentGrid);

        adjustMenuFontSize();
    }
    
    // ... (renderControlButtons remains the same) ...

    function renderControlButtons() {
        activityButtonsContainer.innerHTML = '';
        PRESET_ACTIVITIES.forEach(activityName => {
            const wrapper = document.createElement('div');
            wrapper.className = 'lm-activity-item';

            const button = document.createElement('button');
            button.textContent = activityName;
            
            const timeInput = document.createElement('input');
            timeInput.type = 'text';
            timeInput.className = 'lm-time-input';
            timeInput.placeholder = 'Time?';
            
            button.addEventListener('click', () => {
                addActivity(activityName, timeInput.value);
                timeInput.value = ''; // Clear after adding
            });

            wrapper.appendChild(button);
            wrapper.appendChild(timeInput);
            activityButtonsContainer.appendChild(wrapper);
        });
    }

    function addActivity(text, time) {
        if (!text || !text.trim()) return;
        currentMenuItems.push({
            text: text.trim(),
            time: time.trim() || null,
            isNew: true, // Flag for animation
            cleared: false // ** CHANGE: Initialize cleared state **
        });
        renderMenu();
    }
    
    // ... (Drag and Drop Handlers remain the same) ...
    function handleDragStart(e) {
        draggedItem = e.target.closest('.lm-menu-item'); // Ensure we grab the parent item
        e.dataTransfer.effectAllowed = 'move';
        // Use the drag handle as the visual element being dragged if possible
        if (e.target.classList.contains('lm-item-drag-handle')) {
             e.dataTransfer.setDragImage(draggedItem, 0, 0);
        }
        setTimeout(() => draggedItem.classList.add('dragging'), 0);
    }

    function handleDragOver(e) {
        e.preventDefault();
        const targetItem = e.target.closest('.lm-menu-item');
        if (targetItem && targetItem !== draggedItem) {
            document.querySelectorAll('.lm-menu-item.drag-over').forEach(el => el.classList.remove('drag-over'));
            targetItem.classList.add('drag-over');
        }
    }
    
    function handleDragLeave(e) {
        const targetItem = e.target.closest('.lm-menu-item');
        if (targetItem) {
            targetItem.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const targetItem = e.target.closest('.lm-menu-item');
        if (draggedItem && targetItem && targetItem !== draggedItem) {
            const fromIndex = parseInt(draggedItem.dataset.index, 10);
            const toIndex = parseInt(targetItem.dataset.index, 10);
            
            // Reorder the array
            const [movedItem] = currentMenuItems.splice(fromIndex, 1);
            currentMenuItems.splice(toIndex, 0, movedItem);
            
            // Re-render the entire list
            renderMenu();
        }
    }

    function handleDragEnd(e) {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
        }
        document.querySelectorAll('.lm-menu-item.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedItem = null;
    }
    
    // ... (populateLoadSelect remains the same) ...
    async function populateLoadSelect() {
        const menus = await getAllLessonMenus();
        const currentVal = loadSelect.value;
        loadSelect.innerHTML = '<option value="">-- New Menu --</option>';
        for (const name in menus) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            loadSelect.appendChild(option);
        }
        // Restore selection if it still exists
        if (Object.keys(menus).includes(currentVal)) {
           loadSelect.value = currentVal;
        }
    }

    function loadMenu() {
        const menuName = loadSelect.value;
        if (!menuName) {
            currentMenuItems = [];
            menuNameInput.value = '';
            renderMenu();
            return;
        }
        getAllLessonMenus().then(menus => {
            if (menus[menuName]) {
                // ** CHANGE: Deep copy and ensure 'cleared' property exists for backwards compatibility **
                currentMenuItems = JSON.parse(JSON.stringify(menus[menuName])).map(item => ({
                    ...item,
                    cleared: item.cleared || false
                }));
                menuNameInput.value = menuName;
                renderMenu();
            }
        });
    }

    // ... (saveMenu and subsequent functions remain the same) ...
    async function saveMenu() {
        const menuName = menuNameInput.value.trim();
        if (!menuName) {
            alert('Please enter a name for the menu.');
            return;
        }
        if (currentMenuItems.length === 0) {
            alert('Please add at least one activity to the menu.');
            return;
        }
        
        try {
            // Save a clean copy without the 'isNew' flag. 'cleared' will be saved.
            const cleanMenu = currentMenuItems.map(({ isNew, ...item }) => item);
            await saveLessonMenu(menuName, cleanMenu);
            alert(`Menu "${menuName}" saved successfully!`);
            await populateLoadSelect();
            loadSelect.value = menuName;
        } catch(error) {
            alert(`Error saving menu: ${error.name}`);
        }
    }
    
    async function deleteMenu() {
        const menuName = loadSelect.value;
        if (!menuName) {
            alert('Select a saved menu to delete.');
            return;
        }
        if (confirm(`Are you sure you want to delete the menu "${menuName}"?`)) {
            await deleteLessonMenu(menuName);
            alert(`Menu "${menuName}" deleted.`);
            menuNameInput.value = '';
            currentMenuItems = [];
            await populateLoadSelect();
            // loadMenu() will handle the reset since loadSelect is now empty
            loadMenu(); 
        }
    }
    
    async function exportMenus() {
        const allMenus = await getAllLessonMenus();
        if (Object.keys(allMenus).length === 0) {
            alert('No saved menus to export.');
            return;
        }
        const blob = new Blob([JSON.stringify(allMenus, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brain-power-lesson-menus.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    function importFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                await importLessonMenus(importedData);
                alert('Menus imported successfully!');
                await populateLoadSelect();
            } catch (error) {
                alert('Import failed. The file is not valid JSON.');
                console.error('Lesson Menu import error:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input for re-imports
    }

    // --- Event Listeners ---
    addCustomBtn.addEventListener('click', () => {
        addActivity(customActivityInput.value, customTimeInput.value);
        customActivityInput.value = '';
        customTimeInput.value = '';
    });
    
    loadSelect.addEventListener('change', loadMenu);
    saveBtn.addEventListener('click', saveMenu);
    deleteBtn.addEventListener('click', deleteMenu);
    exportBtn.addEventListener('click', exportMenus);
    importInput.addEventListener('change', importFile);
    
    window.addEventListener('resize', adjustMenuFontSize);

    // Observer for fullscreen changes (as main.js triggers the class change)
    const observer = new MutationObserver((mutationsList) => {
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                adjustMenuFontSize();
            }
        }
    });
    observer.observe(toolCard, { attributes: true });


    // --- Initialization ---
    renderControlButtons();
    renderMenu();
    populateLoadSelect();
}