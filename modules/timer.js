import { Storage } from './storage.js';

let state = null;
let interval = null;

export function initTimer() {
    const settings = Storage.get('settings', {});
    state = Storage.get('timer_state', {
        mode: 'pomodoro',
        running: false,
        remaining: (settings.pomodoroMinutes || 25) * 60,
        startedAt: null,
        sessionTitle: 'Focus',
        stopwatch: 0
    });

    wireControls();
    renderTimer();
    renderStats();
    syncInterval();
}

function wireControls() {
    document.getElementById('timer-toggle')?.addEventListener('click', toggleTimer);
    document.getElementById('timer-reset')?.addEventListener('click', resetTimer);
}

function toggleTimer() {
    state.running = !state.running;
    if (state.running && !state.startedAt) state.startedAt = Date.now();
    Storage.set('timer_state', state);
    syncInterval();
    renderTimer();
}

function resetTimer() {
    const settings = Storage.get('settings', {});
    state.running = false;
    state.startedAt = null;
    state.remaining = (settings.pomodoroMinutes || 25) * 60;
    state.stopwatch = 0;
    Storage.set('timer_state', state);
    syncInterval();
    renderTimer();
}

function syncInterval() {
    clearInterval(interval);
    interval = setInterval(tick, 1000);
}

function tick() {
    if (!state?.running) return;
    state.remaining = Math.max(0, state.remaining - 1);
    state.stopwatch += 1;

    const stats = Storage.get('stats', {});
    const today = Storage.todayKey();
    const record = stats[today] || { studyMinutes: 0, sessions: 0 };
    record.studyMinutes += 1 / 60;
    Storage.set('stats', { ...stats, [today]: record });

    if (state.remaining === 0) {
        state.running = false;
        state.startedAt = null;
        record.sessions += 1;
        pushSession();
    }

    Storage.set('timer_state', state);
    renderTimer();
    renderStats();
}

function pushSession() {
    const sessions = Storage.get('sessions', []);
    sessions.unshift({ id: Date.now(), type: 'pomodoro', minutes: 25, createdAt: Date.now() });
    Storage.set('sessions', sessions.slice(0, 200));
}

function renderTimer() {
    const display = document.getElementById('timer-display');
    const toggle = document.getElementById('timer-toggle');
    const stateLabel = document.getElementById('timer-state-label');
    if (display) display.textContent = formatTime(state.remaining);
    if (toggle) toggle.textContent = state.running ? 'Pause' : 'Start';
    if (stateLabel) stateLabel.textContent = state.running ? 'Running' : 'Idle';
    const sessionLabel = document.getElementById('timer-session-label');
    if (sessionLabel) sessionLabel.textContent = state.sessionTitle || 'Focus';
    document.title = `${formatTime(state.remaining)} Nerd Tab`;
}

function renderStats() {
    const today = Storage.todayKey();
    const stats = Storage.get('stats', {});
    const record = stats[today] || { studyMinutes: 0, sessions: 0 };
    const host = document.getElementById('dashboard-stats');
    const summary = document.getElementById('stat-summary');
    const countdown = document.getElementById('exam-countdown');
    const settings = Storage.get('settings', {});

    if (host) {
        host.innerHTML = `
            <div class="metric"><div><small>Deep work</small><strong>${Math.floor(record.studyMinutes / 60)}h ${Math.round(record.studyMinutes % 60)}m</strong></div><span class="tag">Today</span></div>
            <div class="metric"><div><small>Focus sessions</small><strong>${record.sessions || 0}</strong></div><span class="tag">Count</span></div>
            <div class="metric"><div><small>Pomodoro</small><strong>${Math.floor(state.remaining / 60)}m left</strong></div><span class="tag">${state.running ? 'Live' : 'Paused'}</span></div>
        `;
    }

    if (summary) {
        summary.innerHTML = `
            <div class="metric"><div><small>Today</small><strong>${Math.floor(record.studyMinutes / 60)}h ${Math.round(record.studyMinutes % 60)}m</strong></div></div>
            <div class="metric"><div><small>Sessions</small><strong>${record.sessions || 0}</strong></div></div>
            <div class="metric"><div><small>Mode</small><strong>${state.mode}</strong></div></div>
        `;
    }

    if (countdown) {
        countdown.textContent = settings.examDate ? remainingUntil(settings.examDate) : 'Set exam date in Settings';
    }
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.max(0, totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function remainingUntil(dateValue) {
    const target = new Date(dateValue);
    if (Number.isNaN(target.getTime())) return 'Set exam date in Settings';
    const diff = Math.max(0, target.getTime() - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h left`;
}
