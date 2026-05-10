import { StorageManager } from './storage.js';

let timerInterval;
let timeLeft = 25 * 60; // 25 mins default
let isRunning = false;
let currentMode = 'pomodoro'; // pomodoro, shortBreak, longBreak

export function initTimer() {
    const display = document.getElementById('timer-display');
    const toggleBtn = document.getElementById('timer-toggle');
    const resetBtn = document.getElementById('timer-reset');

    function updateDisplay() {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        if(display) display.textContent = `${m}:${s}`;
        document.title = isRunning ? `(${m}:${s}) Nerd Tab` : 'Nerd Tab';
    }

    function toggleTimer() {
        if(isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
            if(toggleBtn) toggleBtn.textContent = 'Resume';
        } else {
            isRunning = true;
            if(toggleBtn) toggleBtn.textContent = 'Pause';
            timerInterval = setInterval(() => {
                if(timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                    
                    // Track deep work
                    if(timeLeft % 60 === 0) {
                        incrementDeepWork();
                    }
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    if(toggleBtn) toggleBtn.textContent = 'Start';
                    alert("Focus session complete!");
                    // Handle logic for transitioning modes here
                }
            }, 1000);
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = 25 * 60; // reset to 25m
        if(toggleBtn) toggleBtn.textContent = 'Start';
        updateDisplay();
    }

    if(toggleBtn) toggleBtn.addEventListener('click', toggleTimer);
    if(resetBtn) resetBtn.addEventListener('click', resetTimer);

    updateDisplay();
    loadStats();
}

function incrementDeepWork() {
    const today = new Date().toDateString();
    const stats = StorageManager.get('stats', {});
    
    if(!stats[today]) {
        stats[today] = { deepWorkMinutes: 0 };
    }
    stats[today].deepWorkMinutes += 1;
    
    StorageManager.set('stats', stats);
    updateStatsDisplay();
}

function loadStats() {
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const today = new Date().toDateString();
    const stats = StorageManager.get('stats', {});
    const todayStats = stats[today] || { deepWorkMinutes: 0 };

    const dwEl = document.getElementById('stat-deep-work');
    if(dwEl) {
        const h = Math.floor(todayStats.deepWorkMinutes / 60);
        const m = todayStats.deepWorkMinutes % 60;
        dwEl.textContent = `${h}h ${m}m`;
    }

    // Basic streak calc
    const streakEl = document.getElementById('stat-streak');
    if(streakEl) {
        const streak = StorageManager.get('streak', 0);
        streakEl.textContent = streak;
    }
}
