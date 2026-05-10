import { Storage } from './storage.js';

export function initUI() {
    wireNavigation();
    wireButtons();
    applySettings();
}

function wireNavigation() {
    const navItems = [...document.querySelectorAll('.nav-item')];
    const views = [...document.querySelectorAll('.view-section')];

    const showView = (target) => {
        navItems.forEach((item) => item.classList.toggle('active', item.dataset.target === target));
        views.forEach((view) => {
            const active = view.id === `view-${target}`;
            view.classList.toggle('hidden', !active);
            view.classList.toggle('active', active);
        });
    };

    navItems.forEach((item) => item.addEventListener('click', () => showView(item.dataset.target)));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.getElementById('cmd-input')?.blur();
        }
    });

    showView('dashboard');
}

function wireButtons() {
    document.querySelectorAll('[data-command]').forEach((button) => {
        button.addEventListener('click', () => {
            const input = document.getElementById('cmd-input');
            if (input) {
                input.value = button.getAttribute('data-command');
                input.focus();
            }
        });
    });
}

function applySettings() {
    const settings = Storage.get('settings', {});
    document.body.dataset.theme = settings.theme || 'paper';
    document.body.classList.toggle('focus-mode', Boolean(settings.focusMode));
}

export function switchView(target) {
    document.querySelector(`.nav-item[data-target="${target}"]`)?.click();
}
const timeEl = document.getElementById('current-time');
const dateEl = document.getElementById('current-date');

function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

updateTime();
setInterval(updateTime, 60000);
}
