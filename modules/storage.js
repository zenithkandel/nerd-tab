const PREFIX = 'nerdtab_';

const DEFAULTS = {
    progress: {},
    collapse: {},
    tasks: [],
    notes: [],
    flashcards: [],
    sessions: [],
    stats: {},
    bookmarks: [
        { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com', muted: true },
        { id: 'gmail', label: 'Gmail', url: 'https://mail.google.com', muted: true },
        { id: 'chatgpt', label: 'ChatGPT', url: 'https://chat.openai.com', muted: true },
        { id: 'docs', label: 'Docs', url: 'https://docs.google.com', muted: true }
    ],
    settings: {
        theme: 'paper',
        examDate: '',
        pomodoroMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        sound: false,
        focusMode: false
    },
    shortcuts: [],
    analytics: { history: [] },
    timer_state: {
        mode: 'pomodoro',
        running: false,
        remaining: 25 * 60,
        startedAt: null,
        sessionTitle: 'Focus',
        stopwatch: 0
    }
};

function readRaw(key) {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

function writeRaw(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const Storage = {
    get(key, fallback = DEFAULTS[key]) {
        const value = readRaw(key);
        return value === undefined ? fallback : value;
    },

    set(key, value) {
        writeRaw(key, value);
        return value;
    },

    update(key, updater) {
        const next = updater(this.get(key));
        this.set(key, next);
        return next;
    },

    remove(key) {
        localStorage.removeItem(PREFIX + key);
    },

    loadAll() {
        const state = {};
        Object.entries(DEFAULTS).forEach(([key, fallback]) => {
            state[key] = this.get(key, fallback);
        });
        return state;
    },

    saveAll(state) {
        Object.entries(state).forEach(([key, value]) => this.set(key, value));
    },

    export() {
        return this.loadAll();
    },

    import(payload) {
        if (!payload || typeof payload !== 'object') return false;
        Object.entries(DEFAULTS).forEach(([key, fallback]) => {
            if (payload[key] !== undefined) this.set(key, payload[key]);
            else if (this.get(key) === undefined) this.set(key, fallback);
        });
        return true;
    },

    todayKey(date = new Date()) {
        return date.toISOString().slice(0, 10);
    }
};

export { DEFAULTS };
