import { Storage } from './storage.js';
import { uid } from './utils.js';

let cards = [];

export function initFlashcards() {
  cards = Storage.get('flashcards', []).map((card) => ({ id: card.id || uid('card'), front: card.front || '', back: card.back || '', subject: card.subject || 'General', ease: card.ease || 2.5, due: card.due || Date.now(), pinned: Boolean(card.pinned) }));
  renderFlashcards();
}

function save() {
  Storage.set('flashcards', cards);
  renderFlashcards();
}

function renderFlashcards() {
  const host = document.getElementById('flashcards-view');
  if (!host) return;
  host.innerHTML = `
    <div class="panel-titlebar"><h2>Flashcards</h2><span>${cards.length} cards</span></div>
    <div class="editor-row">
      <input id="card-front-input" placeholder="Front side" />
      <input id="card-subject-input" placeholder="Subject" value="General" />
      <button class="primary-button" id="card-add-button">Add card</button>
      <textarea id="card-back-input" placeholder="Back side"></textarea>
    </div>
    <div class="card-list" id="card-list"></div>
  `;

  document.getElementById('card-add-button')?.addEventListener('click', addCard);
  const list = document.getElementById('card-list');
  if (!list) return;
  list.innerHTML = cards.map((card) => `
    <article class="card-item" data-id="${card.id}">
      <div class="card-main"><strong>${escapeHtml(card.front)}</strong><small>${escapeHtml(card.subject)} • Ease ${card.ease.toFixed(1)}</small><div>${escapeHtml(card.back).slice(0, 160)}</div></div>
      <div class="card-actions"><button class="ghost-button" data-action="easy">Easy</button><button class="ghost-button" data-action="hard">Hard</button><button class="ghost-button" data-action="delete"><i class="fa-solid fa-trash"></i></button></div>
    </article>
  `).join('');

  list.querySelectorAll('.card-item').forEach((item) => {
    item.querySelector('[data-action="easy"]')?.addEventListener('click', () => updateEase(item.dataset.id, 0.15));
    item.querySelector('[data-action="hard"]')?.addEventListener('click', () => updateEase(item.dataset.id, -0.2));
    item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      cards = cards.filter((entry) => entry.id !== item.dataset.id);
      save();
    });
  });
}

function addCard() {
  const front = document.getElementById('card-front-input')?.value.trim();
  const back = document.getElementById('card-back-input')?.value.trim();
  const subject = document.getElementById('card-subject-input')?.value.trim() || 'General';
  if (!front || !back) return;
  cards.unshift({ id: uid('card'), front, back, subject, ease: 2.5, due: Date.now(), pinned: false });
  save();
}

function updateEase(id, delta) {
  const card = cards.find((entry) => entry.id === id);
  if (!card) return;
  card.ease = Math.max(1.3, Math.min(3.5, card.ease + delta));
  card.due = Date.now() + Math.round(86400000 / card.ease);
  save();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
