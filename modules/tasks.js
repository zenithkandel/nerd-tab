import { Storage } from './storage.js';
import { formatDuration, uid } from './utils.js';

let tasks = [];

export function initTasks(state = {}) {
    tasks = (state.tasks || Storage.get('tasks', [])).map(normalizeTask);
    renderTaskView();
    renderDashboardTasks();
}

function normalizeTask(task) {
    return {
        id: task.id || uid('task'),
        title: task.title || task.text || 'Untitled task',
        notes: task.notes || '',
        priority: task.priority || 'medium',
        due: task.due || '',
        duration: Number(task.duration || 15),
        recurring: task.recurring || '',
        completed: Boolean(task.completed),
        createdAt: task.createdAt || Date.now()
    };
}

function save() {
    Storage.set('tasks', tasks);
    renderTaskView();
    renderDashboardTasks();
}

export function renderTaskView() {
    const host = document.getElementById('tasks-view');
    if (!host) return;
    const sorted = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed) || priorityRank(a.priority) - priorityRank(b.priority) || String(a.due).localeCompare(String(b.due)));

    host.innerHTML = `
        <div class="panel-titlebar"><h2>Tasks</h2><span>${sorted.length} items</span></div>
        <div class="task-input-row">
            <input id="task-title-input" placeholder="Add a task, goal, or revision item" />
            <select id="task-priority-input"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
            <input id="task-due-input" type="date" />
            <button class="primary-button" id="task-add-button">Add task</button>
        </div>
        <div class="task-list" id="task-list"></div>
    `;

    document.getElementById('task-add-button')?.addEventListener('click', addTaskFromInputs);
    document.getElementById('task-title-input')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') addTaskFromInputs();
    });

    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = sorted.map((task) => `
        <article class="task-item" data-id="${task.id}">
            <div class="task-main">
                <strong>${escapeHtml(task.title)}</strong>
                <small>${task.completed ? 'Completed' : 'Due ' + (task.due || 'anytime')} • ${task.priority.toUpperCase()} • ${formatDuration(task.duration)}</small>
            </div>
            <div class="task-actions">
                <button class="ghost-button" data-action="toggle">${task.completed ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-regular fa-square"></i>'}</button>
                <button class="ghost-button" data-action="delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </article>
    `).join('');

    list.querySelectorAll('.task-item').forEach((item) => {
        item.querySelector('[data-action="toggle"]')?.addEventListener('click', () => {
            const task = tasks.find((entry) => entry.id === item.dataset.id);
            if (!task) return;
            task.completed = !task.completed;
            save();
        });
        item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
            tasks = tasks.filter((entry) => entry.id !== item.dataset.id);
            save();
        });
    });
}

export function renderDashboardTasks() {
    const host = document.getElementById('dashboard-tasks');
    const count = document.getElementById('dashboard-task-count');
    if (!host) return;
    const visible = tasks.map(normalizeTask).filter((task) => !task.completed).slice(0, 5);
    if (count) count.textContent = `${visible.length} open`;
    host.innerHTML = visible.map((task) => `
        <div class="metric">
            <div><small>${task.priority.toUpperCase()}</small><strong>${escapeHtml(task.title)}</strong></div>
            <span class="tag">${task.due || formatDuration(task.duration)}</span>
        </div>
    `).join('') || '<div class="metric"><div><small>No tasks queued</small><strong>Add the next revision item.</strong></div></div>';
}

function addTaskFromInputs() {
    const titleInput = document.getElementById('task-title-input');
    const priorityInput = document.getElementById('task-priority-input');
    const dueInput = document.getElementById('task-due-input');
    const title = titleInput?.value.trim();
    if (!title) return;
    tasks.unshift(normalizeTask({ title, priority: priorityInput?.value || 'medium', due: dueInput?.value || '' }));
    if (titleInput) titleInput.value = '';
    if (dueInput) dueInput.value = '';
    save();
}

function priorityRank(priority) {
    return { high: 0, medium: 1, low: 2 }[priority] ?? 1;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
