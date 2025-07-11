// js/db.js

const DB_NAME = 'BrainPowerDB';
const STORE_NAME = 'flashcardSets';
const DB_VERSION = 1;
let db;

/**
 * Initializes the IndexedDB database.
 * This function must be called and awaited before any other DB operations.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error:", event.target.error);
            reject("Database error");
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME); // Key is the set name
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
    });
}

/**
 * Saves or updates a flashcard set in the database.
 * @param {string} setName - The name of the set to save.
 * @param {Array} cards - The array of card objects.
 * @returns {Promise<void>}
 */
export function saveSet(setName, cards) {
    return new Promise(async (resolve, reject) => {
        await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(cards, setName);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error("Error saving set:", event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Retrieves all custom flashcard sets from the database.
 * @returns {Promise<Object>} A promise that resolves with an object containing all sets.
 */
export function getAllSets() {
    return new Promise(async (resolve, reject) => {
        await initDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const keyRequest = store.getAllKeys();
        const valueRequest = store.getAll();

        let keys, values;

        keyRequest.onsuccess = () => {
            keys = keyRequest.result;
            if (values) complete();
        };

        valueRequest.onsuccess = () => {
            values = valueRequest.result;
            if (keys) complete();
        };

        keyRequest.onerror = valueRequest.onerror = (event) => {
            console.error("Error getting all sets:", event.target.error);
            reject(event.target.error);
        };
        
        function complete() {
            const allDecks = {};
            keys.forEach((key, index) => {
                allDecks[key] = values[index];
            });
            resolve(allDecks);
        }
    });
}

/**
 * Deletes a flashcard set from the database.
 * @param {string} setName - The name of the set to delete.
 * @returns {Promise<void>}
 */
export function deleteSet(setName) {
    return new Promise(async (resolve, reject) => {
        await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(setName);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error("Error deleting set:", event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Imports multiple decks, overwriting existing ones with the same name.
 * @param {Object} decks - An object where keys are set names and values are card arrays.
 * @returns {Promise<void>}
 */
export function importDecks(decks) {
    return new Promise(async (resolve, reject) => {
        await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const promises = Object.entries(decks).map(([setName, cards]) => {
            return new Promise((resolvePut, rejectPut) => {
                const request = store.put(cards, setName);
                request.onsuccess = () => resolvePut();
                request.onerror = () => rejectPut(request.error);
            });
        });

        Promise.all(promises)
            .then(() => resolve())
            .catch(error => {
                console.error("Error during bulk import:", error);
                transaction.abort();
                reject(error);
            });
    });
}