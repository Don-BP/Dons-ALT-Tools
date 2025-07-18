// js/tools/name-picker.js

import { playSound } from '../utils.js';

export function initNamePicker() {
    const nameListInput = document.getElementById('name-list');
    const pickedNameDisplay = document.getElementById('picked-name');
    const pickNameBtn = document.getElementById('pick-name-btn');
    const classListSelect = document.getElementById('class-list-select');
    const saveClassBtn = document.getElementById('save-class-btn');
    const deleteClassBtn = document.getElementById('delete-class-btn');
    const dontPickAgainCheck = document.getElementById('dont-pick-again-check');
    const pickedNamesContainer = document.getElementById('picked-names-container');
    const pickedNamesList = document.getElementById('picked-names-list');

    let currentNamePool = [];
    let pickedNames = [];
    const LOCAL_STORAGE_KEY = 'brainPowerClassLists';

    function getSavedLists() {
        const listsJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        return listsJSON ? JSON.parse(listsJSON) : {};
    }

    function saveLists(lists) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lists));
    }

    function populateClassSelect() {
        const lists = getSavedLists();
        while (classListSelect.options.length > 1) {
            classListSelect.remove(1);
        }
        for (const className in lists) {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classListSelect.appendChild(option);
        }
    }

    function renderPickedNamesList() {
        pickedNamesList.innerHTML = '';
        pickedNames.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            pickedNamesList.appendChild(li);
        });
        pickedNamesContainer.classList.toggle('hidden', !(pickedNames.length > 0 && dontPickAgainCheck.checked));
    }

    function triggerFireworks() {
        const container = document.getElementById('name-picker-fireworks');
        if (!container) return;
        const fireworksCount = 5 + Math.floor(Math.random() * 3);
        const colors = ['#FFC700', '#FF4B4B', '#5DFF4B', '#4B8DFF', '#FF4BFF'];
        for (let i = 0; i < fireworksCount; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = `${20 + Math.random() * 60}%`;
            firework.style.top = `${20 + Math.random() * 60}%`;
            firework.style.animationDelay = `${Math.random() * 0.4}s`;
            const particleCount = 12 + Math.floor(Math.random() * 8);
            for (let j = 0; j < particleCount; j++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                const angle = Math.random() * 360;
                const distance = Math.random() * 120 + 80;
                const endX = Math.cos(angle * Math.PI / 180) * distance;
                const endY = Math.sin(angle * Math.PI / 180) * distance;
                particle.style.setProperty('--transform-end', `translate(${endX}px, ${endY}px)`);
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                firework.appendChild(particle);
            }
            container.appendChild(firework);
        }
        setTimeout(() => { container.innerHTML = ''; }, 3000);
    }

    saveClassBtn.addEventListener('click', () => {
        const className = prompt("Enter a name for this class list (e.g., 6-1):");
        if (className && className.trim() !== '') {
            const lists = getSavedLists();
            lists[className.trim()] = nameListInput.value;
            saveLists(lists);
            populateClassSelect();
            classListSelect.value = className.trim();
        }
    });

    classListSelect.addEventListener('change', () => {
        const selectedClass = classListSelect.value;
        const lists = getSavedLists();
        nameListInput.value = lists[selectedClass] || '';
        currentNamePool = [];
        pickedNames = [];
        renderPickedNamesList();
        pickedNameDisplay.textContent = '';
    });

    dontPickAgainCheck.addEventListener('change', renderPickedNamesList);

    nameListInput.addEventListener('input', () => {
        currentNamePool = [];
        pickedNames = [];
        renderPickedNamesList();
        pickedNameDisplay.textContent = '';
    });

    pickNameBtn.addEventListener('click', () => {
        if (dontPickAgainCheck.checked && currentNamePool.length === 0 && pickedNames.length > 0) {
            currentNamePool = nameListInput.value.split('\n').map(name => name.trim()).filter(name => name !== '');
            pickedNames = [];
            renderPickedNamesList();
            if (currentNamePool.length > 0) pickedNameDisplay.textContent = 'List Reset!';
        } else if (currentNamePool.length === 0) {
            currentNamePool = nameListInput.value.split('\n').map(name => name.trim()).filter(name => name !== '');
        }

        if (currentNamePool.length > 0) {
            const randomIndex = Math.floor(Math.random() * currentNamePool.length);
            const pickedName = currentNamePool[randomIndex];
            pickedNameDisplay.textContent = pickedName;
            if (dontPickAgainCheck.checked) {
                currentNamePool.splice(randomIndex, 1);
                pickedNames.push(pickedName);
                renderPickedNamesList();
            }
            playSound('sounds/select.mp3');
            triggerFireworks();
        } else {
            pickedNameDisplay.textContent = 'Add names!';
        }
    });

    deleteClassBtn.addEventListener('click', () => {
        const selectedClass = classListSelect.value;
        if (selectedClass && confirm(`Are you sure you want to delete the list "${selectedClass}"?`)) {
            const lists = getSavedLists();
            delete lists[selectedClass];
            saveLists(lists);
            nameListInput.value = '';
            pickedNameDisplay.textContent = '';
            currentNamePool = [];
            pickedNames = [];
            renderPickedNamesList();
            populateClassSelect();
        }
    });

    // Initial setup for this tool
    populateClassSelect();
}