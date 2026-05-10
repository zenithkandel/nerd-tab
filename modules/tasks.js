import { StorageManager } from './storage.js';

let tasks = [];

export function initTasks() {
    tasks = StorageManager.get('tasks', [
        { id: 1, text: "Review chapter 4", completed: false },
        { id: 2, text: "Complete mock test", completed: false }
    ]);
    renderDashboardTasks();
}

function renderDashboardTasks() {
    const container = document.getElementById('dashboard-tasks');
    if (!container) return;

    container.innerHTML = '';

    if (tasks.length === 0) {
        container.innerHTML = `<li class="text-sm text-[#92400e]/60 italic py-2">No tasks for today. Focus on the syllabus.</li>`;
    }

    tasks.forEach((task, i) => {
        const li = document.createElement('li');
        li.className = 'flex items-center space-x-3 py-1 group';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox-custom w-4 h-4 text-xs';
        checkbox.checked = task.completed;

        checkbox.addEventListener('change', (e) => {
            task.completed = e.target.checked;
            StorageManager.set('tasks', tasks);
            renderDashboardTasks();
        });

        const span = document.createElement('span');
        span.className = `flex-1 text-sm transition-opacity ${task.completed ? 'line-through opacity-50' : 'text-[#3f2d1d]'}`;
        span.textContent = task.text;

        const delBtn = document.createElement('button');
        delBtn.className = 'opacity-0 group-hover:opacity-100 text-red-700/60 hover:text-red-700 transition-opacity text-xs';
        delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        delBtn.addEventListener('click', () => {
            tasks.splice(i, 1);
            StorageManager.set('tasks', tasks);
            renderDashboardTasks();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(delBtn);

        container.appendChild(li);
    });

    // Add task input
    const addWrap = document.createElement('div');
    addWrap.className = 'flex items-center space-x-3 mt-4 border-t border-[#d97706]/20 pt-2';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = "Add a new task...";
    input.className = 'flex-1 bg-transparent border-none focus:outline-none text-sm text-[#3f2d1d] placeholder-[#92400e]/50 py-1';

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            tasks.push({ id: Date.now(), text: input.value.trim(), completed: false });
            StorageManager.set('tasks', tasks);
            renderDashboardTasks();
        }
    });

    addWrap.appendChild(input);
    container.appendChild(addWrap);
}
