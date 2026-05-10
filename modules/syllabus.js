import { StorageManager } from './storage.js';

let fullSyllabus = [];
let progressState = {}; // Record of checked items by ID: "id" -> true/false/"partial"
let collapseState = {}; // Record of collapsed items by ID

export function initSyllabus(data) {
    fullSyllabus = data.syllabus || data; // handle diff json wrappers
    if (!Array.isArray(fullSyllabus)) fullSyllabus = [fullSyllabus];

    progressState = StorageManager.get('progress', {});
    collapseState = StorageManager.get('collapse', {});

    renderTree();
    updateTotalProgress();
}

function processId(node, parentId, index) {
    if(!node.id) {
        node.id = parentId ? `${parentId}-${index}` : `root-${index}`;
    }
}

function createNodeElement(node, depth, parentId, index) {
    processId(node, parentId, index);

    // Ensure children arrays exist if needed
    const children = node.topics || node.subtopics || node.children || node.units || [];
    const hasChildren = children.length > 0;
    
    // State derivation
    const state = progressState[node.id] || false;
    const isCompleted = state === true;
    const isPartial = state === 'partial';
    const isCollapsed = collapseState[node.id] || false;

    // Component wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'syllabus-node my-1';

    // Header
    const header = document.createElement('div');
    header.className = `syllabus-node-header flex items-center py-2 px-2 rounded-sm transition-colors cursor-pointer group hover:bg-[#d97706]/10`;
    
    // Indent based on depth (or handled by margin left?)
    // We will handle nested margin via layout, but a slight padding tweak if needed.

    // Caret
    const caret = document.createElement('div');
    caret.className = 'w-6 text-center text-[#92400e]/50 cursor-pointer hover:text-[#92400e] transition-transform';
    if(hasChildren) {
        caret.innerHTML = isCollapsed ? '<i class="fa-solid fa-chevron-right text-xs"></i>' : '<i class="fa-solid fa-chevron-down text-xs"></i>';
        caret.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCollapse(node.id, wrapper);
        });
    } else {
        caret.innerHTML = `<span class="inline-block w-4"></span>`;
    }
    header.appendChild(caret);

    // Checkbox
    const checkboxWrap = document.createElement('div');
    checkboxWrap.className = 'mx-2 flex items-center';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = `checkbox-custom ${isPartial ? 'checkbox-partial' : ''}`;
    checkbox.checked = isCompleted;
    checkbox.dataset.nodeId = node.id;
    
    checkbox.addEventListener('change', (e) => {
        handleCheckboxChange(node, e.target.checked);
    });

    checkboxWrap.appendChild(checkbox);
    header.appendChild(checkboxWrap);

    // Title
    const titleObj = document.createElement('div');
    titleObj.className = `flex-1 ml-2 select-none ${isCompleted ? 'line-through opacity-50' : 'text-[#3f2d1d]'}`;
    
    const titleText = document.createElement('span');
    titleText.className = depth === 0 ? 'font-bold text-base' : (depth === 1 ? 'font-semibold text-sm' : 'text-sm');
    titleText.textContent = node.title || node.name || node.topic || "Untitled";
    titleObj.appendChild(titleText);

    // Tags / Metadata
    if(node.weightage || node.priority) {
        const tag = document.createElement('span');
        tag.className = 'ml-3 text-[10px] uppercase font-bold bg-[#d97706]/20 text-[#d97706] px-1.5 py-0.5 rounded-sm';
        tag.textContent = node.weightage || node.priority;
        titleObj.appendChild(tag);
    }

    header.appendChild(titleObj);
    
    // Click header to toggle if children exist
    header.addEventListener('click', (e) => {
        if(e.target !== checkbox && hasChildren) {
            toggleCollapse(node.id, wrapper);
        }
    });

    wrapper.appendChild(header);

    // Sub-items container
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'syllabus-children-container';
    childrenContainer.style.display = isCollapsed ? 'none' : 'block';

    if(hasChildren) {
        children.forEach((child, i) => {
            childrenContainer.appendChild(createNodeElement(child, depth + 1, node.id, i));
        });
        wrapper.appendChild(childrenContainer);
    }

    // Store node ref for quick lookups if needed
    node._children = children;
    node._parent = parentId;

    return wrapper;
}

export function renderTree() {
    const container = document.getElementById('syllabus-tree-container');
    if(!container) return;
    container.innerHTML = '';
    
    fullSyllabus.forEach((node, i) => {
        container.appendChild(createNodeElement(node, 0, null, i));
    });
}

function handleCheckboxChange(targetNode, isChecked) {
    // 1. Update this node
    progressState[targetNode.id] = isChecked;

    // 2. Propagate DOWN
    const setChildren = (node, checkedStatus) => {
        const children = node._children || [];
        children.forEach(child => {
            progressState[child.id] = checkedStatus;
            setChildren(child, checkedStatus);
        });
    };
    setChildren(targetNode, isChecked);

    // 3. Propagate UP
    // A separate pass recalculating from roots is more bulletproof.
    recalculateProgressUpward();

    // 4. Save & Re-render
    StorageManager.set('progress', progressState);
    renderTree(); // Re-rendering whole tree is fine for simple trees. For very large, we'd do surgical DOM updates.
    updateTotalProgress();
}

function recalculateProgressUpward() {
    // Post-order traversal to calculate parent states
    const calcNode = (node) => {
        const children = node._children || [];
        if(children.length === 0) {
            return progressState[node.id] || false;
        }

        let completeCount = 0;
        let partialCount = 0;

        children.forEach(child => {
            const childState = calcNode(child);
            if(childState === true) completeCount++;
            else if(childState === 'partial') partialCount++;
        });

        let newState = false;
        if(completeCount === children.length) {
            newState = true;
        } else if(completeCount > 0 || partialCount > 0) {
            newState = 'partial';
        }

        progressState[node.id] = newState;
        return newState;
    };

    fullSyllabus.forEach(root => calcNode(root));
}

function toggleCollapse(id, wrapperNode) {
    const container = wrapperNode.querySelector('.syllabus-children-container');
    const caretIcon = wrapperNode.querySelector('.fa-solid');
    if(!container) return;

    const isCurrentlyCollapsed = collapseState[id] || false;
    const newState = !isCurrentlyCollapsed;
    
    collapseState[id] = newState;
    StorageManager.set('collapse', collapseState);

    if(newState) {
        container.style.display = 'none';
        caretIcon.classList.replace('fa-chevron-down', 'fa-chevron-right');
    } else {
        container.style.display = 'block';
        caretIcon.classList.replace('fa-chevron-right', 'fa-chevron-down');
    }
}

function updateTotalProgress() {
    let totalLeaves = 0;
    let completedLeaves = 0;

    const countLeaves = (node) => {
        const children = node._children || [];
        if(children.length === 0) {
            totalLeaves++;
            if(progressState[node.id] === true) completedLeaves++;
        } else {
            children.forEach(countLeaves);
        }
    };

    fullSyllabus.forEach(countLeaves);

    const percent = totalLeaves === 0 ? 0 : Math.round((completedLeaves / totalLeaves) * 100);
    const progressEl = document.getElementById('syllabus-total-progress');
    if(progressEl) progressEl.textContent = `${percent}%`;
}
