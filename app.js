import { initUI } from './modules/ui.js';
import { StorageManager } from './modules/storage.js';
import { initSyllabus } from './modules/syllabus.js';
import { initTimer } from './modules/timer.js';
import { initCommands } from './modules/commands.js';
import { initTasks } from './modules/tasks.js';

document.addEventListener('DOMContentLoaded', async () => {
    initUI();
    initTimer();
    initCommands();
    initTasks();

    try {
        // Fetch syllabus data dynamically. Defaulting to data.json at root.
        const response = await fetch('./data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const syllabusData = await response.json();
        
        // Initialize syllabus engine
        initSyllabus(syllabusData);

    } catch (error) {
        console.error("Failed to load syllabus:", error);
        document.getElementById('syllabus-tree-container').innerHTML = 
            `<div class="text-red-600 p-4 border border-red-500/30 rounded bg-red-50">
                Failed to load data.json. Ensure the extension is serving the file correctly.
             </div>`;
    }
});
