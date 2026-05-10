import { flattenSyllabus } from './data.js';

let query = '';

export function initSearch() {
    const input = document.getElementById('cmd-input');
    if (!input) return;
    input.addEventListener('input', () => {
        query = input.value.trim().toLowerCase();
        if (query && !query.startsWith('/')) {
            renderQuickResults(query);
        }
    });
}

function renderQuickResults(text) {
    const host = document.getElementById('dashboard-stats');
    if (!host) return;
    host.innerHTML = `
    <div class="metric"><div><small>Search</small><strong>${escapeHtml(text)}</strong></div><span class="tag">Query</span></div>
    <div class="metric"><div><small>Hint</small><strong>Use /commands for fast actions.</strong></div></div>
  `;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
