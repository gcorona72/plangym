const { readValue, writeValue } = require('./database');

function createAppRepository({ storageKey, dbName, storeName, version } = {}) {
  const key = String(storageKey || 'plan-comida-state-v1');
  const options = { dbName, storeName, version };

  return {
    async loadState() {
      try {
        const fromDb = await readValue(key, options);
        if (fromDb) return fromDb;
      } catch (error) {
        if (typeof console !== 'undefined') console.warn('No se pudo leer IndexedDB.', error);
      }

      try {
        if (typeof localStorage !== 'undefined') {
          const fromStorage = localStorage.getItem(key);
          if (fromStorage) return JSON.parse(fromStorage);
        }
      } catch (error) {
        if (typeof console !== 'undefined') console.warn('No se pudo leer localStorage.', error);
      }

      return null;
    },

    async saveState(state) {
      const snapshot = JSON.parse(JSON.stringify(state || {}));
      await writeValue(key, snapshot, options);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(snapshot));
        }
      } catch (error) {
        if (typeof console !== 'undefined') console.warn('No se pudo guardar en localStorage.', error);
      }
      return snapshot;
    },
  };
}

const appRepository = createAppRepository();

module.exports = {
  createAppRepository,
  appRepository,
};

