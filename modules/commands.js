// modules/commands.js
export function initCommands() {
    const input = document.getElementById('cmd-input');
    if(!input) return;

    input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            const val = input.value.trim();
            if(val.startsWith('/')) {
                executeCommand(val.substring(1).toLowerCase());
                input.value = '';
            } else if (val) {
                // Web search fallback
                window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(val)}`;
            }
        }
    });

    // Auto-focus with slash
    document.addEventListener('keydown', (e) => {
        if(e.key === '/' && document.activeElement !== input) {
            e.preventDefault();
            input.focus();
            // adding slash is handled manually if we want, but prevent default stops typed slash.
            input.value = '/';
        }
    });
}

function executeCommand(cmd) {
    const viewMap = {
        'dashboard': 'dashboard',
        'syllabus': 'syllabus',
        'tasks': 'tasks',
        'timer': 'timer',
        'analytics': 'analytics',
        'settings': 'settings'
    };

    if(viewMap[cmd]) {
        // Trigger nav click
        const btn = document.querySelector(`.nav-item[data-target="${viewMap[cmd]}"]`);
        if(btn) btn.click();
    } else if (cmd === 'focus') {
        const btn = document.querySelector(`.nav-item[data-target="timer"]`);
        if(btn) btn.click();
        const toggle = document.getElementById('timer-toggle');
        if(toggle && toggle.textContent === 'Start') {
            toggle.click();
        }
    } else {
        console.log("Unknown command:", cmd);
    }
}
