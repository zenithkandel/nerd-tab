import { Storage } from './modules/storage.js';
import { loadSyllabusSource } from './modules/data.js';
import { initUI } from './modules/ui.js';
import { initCommands } from './modules/commands.js';
import { initSyllabus } from './modules/syllabus.js';
import { initTasks } from './modules/tasks.js';
import { initTimer } from './modules/timer.js';
import { initAnalytics } from './modules/analytics.js';
import { initNotes } from './modules/notes.js';
import { initFlashcards } from './modules/flashcards.js';
import { initSearch } from './modules/search.js';
import { formatDateLabel, formatTimeLabel } from './modules/utils.js';

const quotes = [
    'Study like the exam is tomorrow and the future matters.',
    'Small sessions beat vague intentions.',
    'Clarity first. Progress next. Noise never.',
    'A syllabus tracked is a syllabus under control.'
];

async function boot() {
    const state = Storage.loadAll();
    const syllabusData = await loadSyllabusSource();

    initUI({ state });
    initCommands();
    initSearch();

    initSyllabus(syllabusData, state);
    initTasks(state);
    initTimer(state);
    initAnalytics(state);
    initNotes(state);
    initFlashcards(state);

    wireHeader();
    renderShellStats();
}

function wireHeader() {
    const quote = document.getElementById('motivational-quote');
    if (quote) quote.textContent = quotes[Math.floor(Date.now() / 60000) % quotes.length];

    const updateClock = () => {
        const now = new Date();
        const date = document.getElementById('current-date');
        const time = document.getElementById('current-time');
        if (date) date.textContent = formatDateLabel(now);
        if (time) time.textContent = formatTimeLabel(now);
    };

    updateClock();
    setInterval(updateClock, 1000);

    const settingsButton = document.getElementById('settings-button');
    settingsButton?.addEventListener('click', () => {
        document.querySelector('[data-target="settings"]')?.click();
    });

    document.querySelectorAll('[data-shortcut]').forEach((button) => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-shortcut');
            const urls = {
                youtube: 'https://www.youtube.com',
                gmail: 'https://mail.google.com',
                chatgpt: 'https://chat.openai.com',
                docs: 'https://docs.google.com'
            };
            window.open(urls[target] || 'https://www.google.com', '_blank', 'noopener,noreferrer');
        });
    });
}

function renderShellStats() {
    const stats = Storage.get('stats', {});
    const today = Storage.todayKey();
    const todayStats = stats[today] || { studyMinutes: 0, sessions: 0 };

    const summary = document.getElementById('stat-summary');
    if (summary) {
        summary.innerHTML = `
            <div class="metric"><div><small>Study time</small><strong>${Math.floor(todayStats.studyMinutes / 60)}h ${Math.round(todayStats.studyMinutes % 60)}m</strong></div><span class="tag">Today</span></div>
            <div class="metric"><div><small>Sessions</small><strong>${todayStats.sessions || 0}</strong></div><span class="tag">Deep work</span></div>
            <div class="metric"><div><small>Streak</small><strong>${Storage.get('focus_streak', 0)} days</strong></div><span class="tag">Momentum</span></div>
        `;
    }

    const shortcuts = document.getElementById('bookmarks-shortcuts');
    if (shortcuts) {
        const bookmarks = Storage.get('bookmarks', []);
        shortcuts.innerHTML = bookmarks.map((bookmark) => `
            <a class="shortcut-link" href="${bookmark.url}" target="_blank" rel="noreferrer noopener">
                <strong>${bookmark.label}</strong>
                <span>${bookmark.muted ? 'Muted' : 'Open'}</span>
            </a>
        `).join('');
    }

    const settingsHost = document.getElementById('settings-view');
    if (settingsHost) {
        const settings = Storage.get('settings', {});
        settingsHost.innerHTML = `
            <div class="panel-titlebar"><h2>Settings</h2><span>Local only</span></div>
            <div class="editor-row">
                <input id="settings-exam-date" type="date" value="${settings.examDate || ''}" />
                <input id="settings-theme" placeholder="Theme" value="${settings.theme || 'paper'}" />
                <button class="primary-button" id="settings-save-button">Save</button>
                <textarea id="settings-notes" placeholder="Focus rules, exam date notes, or study constraints">${settings.studyRules || ''}</textarea>
            </div>
            <div class="metric-list">
                <div class="metric"><div><small>Pomodoro minutes</small><strong>${settings.pomodoroMinutes || 25}</strong></div></div>
                <div class="metric"><div><small>Theme</small><strong>${settings.theme || 'paper'}</strong></div></div>
                <div class="metric"><div><small>Focus mode</small><strong>${settings.focusMode ? 'On' : 'Off'}</strong></div></div>
            </div>
        `;
        document.getElementById('settings-save-button')?.addEventListener('click', () => {
            const next = {
                ...settings,
                examDate: document.getElementById('settings-exam-date')?.value || '',
                theme: document.getElementById('settings-theme')?.value.trim() || 'paper',
                studyRules: document.getElementById('settings-notes')?.value.trim() || ''
            };
            Storage.set('settings', next);
            window.location.reload();
        });
    }
}

document.addEventListener('DOMContentLoaded', boot);
