// modules/storage.js
export const StorageManager = {
    _prefix: 'nerdtab_',

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this._prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this._prefix + key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },

    remove(key) {
        localStorage.removeItem(this._prefix + key);
    }
};
