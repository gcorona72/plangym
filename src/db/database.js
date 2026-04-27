const DEFAULT_DB_NAME = 'plan-comida-db';
const DEFAULT_STORE_NAME = 'kv';
const DEFAULT_DB_VERSION = 1;
const memoryDatabases = new Map();

function hasIndexedDB() {
  return typeof indexedDB !== 'undefined' && indexedDB;
}

function getMemoryStore(dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME) {
  const dbKey = `${dbName}::${storeName}`;
  if (!memoryDatabases.has(dbKey)) {
    memoryDatabases.set(dbKey, new Map());
  }
  return memoryDatabases.get(dbKey);
}

function openDatabase({ dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME, version = DEFAULT_DB_VERSION } = {}) {
  if (!hasIndexedDB()) {
    return Promise.resolve({
      type: 'memory',
      dbName,
      storeName,
      getItem: async (key) => getMemoryStore(dbName, storeName).get(key),
      setItem: async (key, value) => {
        getMemoryStore(dbName, storeName).set(key, value);
      },
      deleteItem: async (key) => {
        getMemoryStore(dbName, storeName).delete(key);
      },
      clear: async () => {
        getMemoryStore(dbName, storeName).clear();
      },
      keys: async () => Array.from(getMemoryStore(dbName, storeName).keys()),
    });
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onerror = () => reject(request.error || new Error('IndexedDB open error'));
    request.onsuccess = () => {
      const db = request.result;
      resolve({
        type: 'indexeddb',
        dbName,
        storeName,
        getItem(key) {
          return new Promise((resolveGet, rejectGet) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolveGet(req.result);
            req.onerror = () => rejectGet(req.error || new Error('IndexedDB get error'));
          });
        },
        setItem(key, value) {
          return new Promise((resolveSet, rejectSet) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(value, key);
            req.onsuccess = () => resolveSet(value);
            req.onerror = () => rejectSet(req.error || new Error('IndexedDB set error'));
          });
        },
        deleteItem(key) {
          return new Promise((resolveDelete, rejectDelete) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolveDelete();
            req.onerror = () => rejectDelete(req.error || new Error('IndexedDB delete error'));
          });
        },
        clear() {
          return new Promise((resolveClear, rejectClear) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => resolveClear();
            req.onerror = () => rejectClear(req.error || new Error('IndexedDB clear error'));
          });
        },
        keys() {
          return new Promise((resolveKeys, rejectKeys) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const keys = [];
            const req = store.openKeyCursor();
            req.onsuccess = () => {
              const cursor = req.result;
              if (!cursor) {
                resolveKeys(keys);
                return;
              }
              keys.push(cursor.key);
              cursor.continue();
            };
            req.onerror = () => rejectKeys(req.error || new Error('IndexedDB keys error'));
          });
        },
      });
    };
  });
}

async function readValue(key, options = {}) {
  const db = await openDatabase(options);
  return db.getItem(key);
}

async function writeValue(key, value, options = {}) {
  const db = await openDatabase(options);
  return db.setItem(key, value);
}

async function removeValue(key, options = {}) {
  const db = await openDatabase(options);
  return db.deleteItem(key);
}

async function clearValues(options = {}) {
  const db = await openDatabase(options);
  return db.clear();
}

module.exports = {
  DEFAULT_DB_NAME,
  DEFAULT_STORE_NAME,
  DEFAULT_DB_VERSION,
  openDatabase,
  readValue,
  writeValue,
  removeValue,
  clearValues,
};

