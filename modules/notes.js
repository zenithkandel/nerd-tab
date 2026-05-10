import { Storage } from './storage.js';
import { uid } from './utils.js';

let notes = [];

export function initNotes() {
    notes = Storage.get('notes', []).map((note) => ({ id: note.id || uid('note'), title: note.title || 'Untitled', body: note.body || '', category: note.category || 'General', pinned: Boolean(note.pinned), updatedAt: note.updatedAt || Date.now() }));
    renderNotes();
}

function save() {
    Storage.set('notes', notes);
    renderNotes();
}

function renderNotes() {
    const host = document.getElementById('notes-view');
    if (!host) return;
    host.innerHTML = `
    <div class="panel-titlebar"><h2>Notes</h2><span>${notes.length} notes</span></div>
    <div class="editor-row">
      <input id="note-title-input" placeholder="Note title" />
      <input id="note-category-input" placeholder="Category" value="General" />
      <button class="primary-button" id="note-add-button">Add note</button>
      <textarea id="note-body-input" placeholder="Write markdown-friendly revision notes..."></textarea>
    </div>
    <div class="note-list" id="note-list"></div>
  `;

    document.getElementById('note-add-button')?.addEventListener('click', addNote);
    document.getElementById('note-title-input')?.addEventListener('keydown', (event) => event.key === 'Enter' && addNote());

    const list = document.getElementById('note-list');
    if (!list) return;
    list.innerHTML = notes.map((note) => `
    <article class="note-item" data-id="${note.id}">
      <div class="note-main">
        <strong>${escapeHtml(note.title)}</strong>
        <small>${escapeHtml(note.category)} • Updated ${new Date(note.updatedAt).toLocaleDateString()}</small>
        <div>${escapeHtml(note.body).slice(0, 240)}</div>
      </div>
      <div class="note-actions">
        <button class="ghost-button" data-action="pin">${note.pinned ? '<i class="fa-solid fa-thumbtack"></i>' : '<i class="fa-regular fa-thumbtack"></i>'}</button>
        <button class="ghost-button" data-action="delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </article>
  `).join('');

    list.querySelectorAll('.note-item').forEach((item) => {
        item.querySelector('[data-action="pin"]')?.addEventListener('click', () => {
            const note = notes.find((entry) => entry.id === item.dataset.id);
            if (!note) return;
            note.pinned = !note.pinned;
            note.updatedAt = Date.now();
            save();
        });
        item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
            notes = notes.filter((entry) => entry.id !== item.dataset.id);
            save();
        });
    });
}

function addNote() {
    const title = document.getElementById('note-title-input')?.value.trim();
    const category = document.getElementById('note-category-input')?.value.trim() || 'General';
    const body = document.getElementById('note-body-input')?.value.trim() || '';
    if (!title && !body) return;
    notes.unshift({ id: uid('note'), title: title || 'Untitled', category, body, pinned: false, updatedAt: Date.now() });
    save();
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
