import { Storage } from './storage.js';
import { downloadJson, safeJsonParse } from './utils.js';
import { switchView } from './ui.js';

const COMMANDS = {
    focus: () => switchView('sessions'),
    timer: () => switchView('sessions'),
    task: () => switchView('tasks'),
    note: () => switchView('notes'),
    today: () => switchView('dashboard'),
    stats: () => switchView('analytics'),
    import: () => triggerImport(),
    export: () => downloadJson('nerd-tab-export.json', Storage.export())
};

export function initCommands() {
    const input = document.getElementById('cmd-input');
    if (!input) return;

    input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const value = input.value.trim();
        if (!value) return;

        if (value.startsWith('/')) {
            runCommand(value.slice(1).toLowerCase().split(' ')[0]);
        } else {
            window.open(`https://duckduckgo.com/?q=${encodeURIComponent(value)}`, '_blank', 'noopener,noreferrer');
        }
        input.value = '';
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === '/' && document.activeElement !== input) {
            event.preventDefault();
            input.value = '/';
            input.focus();
        }
    });
}

function runCommand(command) {
    if (COMMANDS[command]) {
        COMMANDS[command]();
        return;
    }
    switchView(command);
}

function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        const payload = safeJsonParse(text, null);
        if (payload) Storage.import(payload);
        window.location.reload();
    });
    input.click();
}
