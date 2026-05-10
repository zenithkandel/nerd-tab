import { Storage } from './storage.js';
import { flattenSyllabus, normalizeSyllabus } from './data.js';
import { formatDuration } from './utils.js';

let syllabusTree = [];
let progress = {};
let collapse = {};
let filterText = '';

export function initSyllabus(data, state = {}) {
  const normalized = data?.tree ? data : normalizeSyllabus(data || {});
  syllabusTree = normalized.tree || [];
  progress = state.progress || Storage.get('progress', {});
  collapse = state.collapse || Storage.get('collapse', {});
  wireToolbar();
  render();
  renderDashboardPreview();
}

function wireToolbar() {
  document.getElementById('syllabus-expand-all')?.addEventListener('click', () => {
    flattenSyllabus(syllabusTree).forEach((node) => {
      if (node.children?.length) collapse[node.id] = false;
    });
    Storage.set('collapse', collapse);
    render();
  });

  document.getElementById('syllabus-collapse-all')?.addEventListener('click', () => {
    flattenSyllabus(syllabusTree).forEach((node) => {
      if (node.children?.length) collapse[node.id] = true;
    });
    Storage.set('collapse', collapse);
    render();
  });
}

export function setSyllabusFilter(value) {
  filterText = String(value || '').trim().toLowerCase();
  render();
}

export function render() {
  const container = document.getElementById('syllabus-tree-container');
  if (!container) return;
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  syllabusTree.forEach((node) => fragment.appendChild(renderNode(node)));
  container.appendChild(fragment);
  updateProgress();
}

function renderNode(node) {
  const branch = document.createElement('div');
  branch.className = 'syllabus-node';
  branch.dataset.id = node.id;
  branch.dataset.complete = String(getCompletion(node) === 1);
  branch.dataset.partial = String(getCompletion(node) === 0.5);

  const visible = matchesFilter(node);
  if (!visible) branch.hidden = true;

  const row = document.createElement('div');
  row.className = 'node-row';

  const toggle = document.createElement('button');
  toggle.className = 'node-toggle';
  toggle.innerHTML = node.children?.length ? `<i class="fa-solid ${collapse[node.id] ? 'fa-chevron-right' : 'fa-chevron-down'}"></i>` : '<span>•</span>';
  toggle.disabled = !node.children?.length;
  toggle.addEventListener('click', () => {
    if (!node.children?.length) return;
    collapse[node.id] = !collapse[node.id];
    Storage.set('collapse', collapse);
    render();
  });

  const checkbox = document.createElement('button');
  checkbox.className = `node-checkbox ${getCompletion(node) === 1 ? 'is-complete' : ''}`;
  checkbox.innerHTML = getCompletion(node) === 1 ? '<i class="fa-solid fa-check"></i>' : getCompletion(node) === 0.5 ? '<i class="fa-solid fa-minus"></i>' : '<i class="fa-regular fa-square"></i>';
  checkbox.addEventListener('click', () => toggleNode(node, getCompletion(node) !== 1));

  const content = document.createElement('div');
  content.className = 'node-content';
  const metaBits = [];
  if (node.meta.importance) metaBits.push(`<span class="node-tag">${escapeHtml(node.meta.importance)}</span>`);
  if (node.meta.weightage) metaBits.push(`<span class="node-tag">${escapeHtml(String(node.meta.weightage))}</span>`);
  if (node.meta.difficulty) metaBits.push(`<span class="node-tag">${escapeHtml(String(node.meta.difficulty))}</span>`);
  if (node.meta.examWeight) metaBits.push(`<span class="node-tag">${escapeHtml(String(node.meta.examWeight))}</span>`);
  if (node.meta.tags?.length) metaBits.push(...node.meta.tags.slice(0, 3).map((tag) => `<span class="node-tag">#${escapeHtml(tag)}</span>`));
  if (node.estimatedMinutes) metaBits.push(`<span class="node-tag">${formatDuration(node.estimatedMinutes)}</span>`);
  content.innerHTML = `
    <div class="node-title">${escapeHtml(node.title)}</div>
    <div class="node-meta">${metaBits.join('')}</div>
  `;

  const pin = document.createElement('button');
  pin.className = `node-pin ${node.meta.pinned ? 'is-pinned' : ''}`;
  pin.innerHTML = node.meta.pinned ? '<i class="fa-solid fa-thumbtack"></i>' : '<i class="fa-regular fa-thumbtack"></i>';
  pin.addEventListener('click', () => {
    node.meta.pinned = !node.meta.pinned;
    render();
  });

  row.append(toggle, checkbox, content, pin);
  branch.appendChild(row);

  if (node.children?.length && !collapse[node.id]) {
    const childrenWrap = document.createElement('div');
    childrenWrap.className = 'node-children';
    node.children.forEach((child) => childrenWrap.appendChild(renderNode(child)));
    branch.appendChild(childrenWrap);
  }

  return branch;
}

function matchesFilter(node) {
  if (!filterText) return true;
  const haystack = [node.title, node.meta.importance, node.meta.weightage, node.meta.difficulty, node.meta.examWeight, ...(node.meta.tags || [])].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(filterText) || (node.children || []).some(matchesFilter);
}

function toggleNode(node, checked) {
  const visit = (current, value) => {
    progress[current.id] = value;
    current.children?.forEach((child) => visit(child, value));
  };
  visit(node, checked);
  syncParents();
  Storage.set('progress', progress);
  updateProgress();
  renderDashboardPreview();
  render();
}

function syncParents() {
  const walk = (node) => {
    if (!node.children?.length) return progress[node.id] === true ? 1 : 0;
    const childStates = node.children.map(walk);
    const complete = childStates.every((state) => state === 1);
    const partial = childStates.some((state) => state === 1 || state === 0.5);
    progress[node.id] = complete ? true : partial ? 'partial' : false;
    return progress[node.id] === true ? 1 : progress[node.id] === 'partial' ? 0.5 : 0;
  };
  syllabusTree.forEach(walk);
}

function getCompletion(node) {
  if (!node.children?.length) return progress[node.id] === true ? 1 : progress[node.id] === 'partial' ? 0.5 : 0;
  const states = node.children.map(getCompletion);
  if (states.every((state) => state === 1)) return 1;
  if (states.some((state) => state > 0)) return 0.5;
  return progress[node.id] === true ? 1 : progress[node.id] === 'partial' ? 0.5 : 0;
}

function updateProgress() {
  let total = 0;
  let complete = 0;
  flattenSyllabus(syllabusTree).forEach((node) => {
    if (!node.children?.length) {
      total += 1;
      if (progress[node.id] === true) complete += 1;
    }
  });
  const percent = total ? Math.round((complete / total) * 100) : 0;
  const element = document.getElementById('syllabus-total-progress');
  if (element) element.textContent = `${percent}%`;
}

export function renderDashboardPreview() {
  const container = document.getElementById('next-topics-container');
  const counter = document.getElementById('dashboard-syllabus-count');
  if (!container) return;
  const leaves = flattenSyllabus(syllabusTree).filter((node) => !node.children?.length);
  const pending = leaves.filter((node) => progress[node.id] !== true).slice(0, 5);
  if (counter) counter.textContent = `${pending.length} visible`;
  container.innerHTML = pending.map((node) => `
    <div class="metric">
      <div><small>${escapeHtml(node.meta.importance || node.type)}</small><strong>${escapeHtml(node.title)}</strong></div>
      <span class="tag">${formatDuration(node.estimatedMinutes)}</span>
    </div>
  `).join('') || '<div class="metric"><div><small>All caught up</small><strong>Nothing pending right now.</strong></div></div>';
}

export function getSyllabusStats() {
  const leaves = flattenSyllabus(syllabusTree).filter((node) => !node.children?.length);
  const done = leaves.filter((node) => progress[node.id] === true).length;
  return { total: leaves.length, complete: done, remaining: Math.max(0, leaves.length - done) };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
