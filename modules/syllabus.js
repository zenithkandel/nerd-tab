import { StorageManager } from './storage.js';

let fullSyllabus = [];
let progressState = {}; 
let collapseState = {}; 
let nodeRegistry = {};

export function initSyllabus(data) {
    fullSyllabus = data.syllabus || data; 
    if (!Array.isArray(fullSyllabus)) fullSyllabus = [fullSyllabus];

    progressState = StorageManager.get('progress', {});
    collapseState = StorageManager.get('collapse', {});
    nodeRegistry = {};

    renderTree();
    updateTotalProgress();
}

function processNode(node, depth, parentId, index) {
    const isString = typeof node === 'string';
    const title = isString ? node : (node.title || node.name || node.unit_name || node.chapter_name || node.topic_name || "Untitled");
    const nodeId = isString ? `${parentId}-${index}` : (node.id || (parentId ? `${parentId}-${index}` : `root-${index}`));
    
    let children = [];
    if (!isString) {
        children = node.topics || node.subtopics || node.children || node.units || node.chapters || [];
    }
    const hasChildren = children.length > 0;
    
    const state = progressState[nodeId] || false;
    const isCompleted = state === true;
    const isPartial = state === 'partial';
    const isCollapsed = collapseState[nodeId] || false;

    nodeRegistry[nodeId] = { id: nodeId, childrenIds: [], parentId: parentId };

    const wrapper = document.createElement('div');
    wrapper.className = 'my-1';

    const header = document.createElement('div');
    header.className = `syllabus-node-header flex items-center py-2 px-2 rounded-sm transition-colors cursor-pointer group hover:bg-[#d97706]/10`;
    
    const caret = document.createElement('div');
    caret.className = 'w-6 text-center text-[#92400e]/50 cursor-pointer hover:text-[#92400e] transition-transform';
    if(hasChildren) {
        caret.innerHTML = isCollapsed ? '<i class="fa-solid fa-chevron-right text-xs"></i>' : '<i class="fa-solid fa-chevron-down text-xs"></i>';
        caret.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCollapse(nodeId, wrapper);
        });
    } else {
        caret.innerHTML = `<span class="inline-block w-4"></span>`;
    }
    header.appendChild(caret);

    const checkboxWrap = document.createElement('div');
    checkboxWrap.className = 'mx-2 flex items-center';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = `checkbox-custom ${isPartial ? 'checkbox-partial' : ''}`;
    checkbox.checked = isCompleted;
    checkbox.dataset.nodeId = nodeId;
    checkbox.addEventListener('change', (e) => handleCheckboxChange(nodeId, e.target.checked));
    checkboxWrap.appendChild(checkbox);
    header.appendChild(checkboxWrap);

    const titleObj = document.createElement('div');
    titleObj.className = `flex-1 ml-2 select-none ${isCompleted ? 'line-through opacity-50' : 'text-[#3f2d1d]'}`;
    
    const titleText = document.createElement('span');
    titleText.className = depth === 0 ? 'font-bold text-base text-[#92400e]' : (depth === 1 ? 'font-semibold text-sm' : 'text-sm');
    titleText.textContent = title;
    titleObj.appendChild(titleText);

    if(!isString && (node.weightage || node.priority || node.importance_level)) {
        const tag = document.createElement('span');
        tag.className = 'ml-3 text-[10px] uppercase font-bold bg-[#d97706]/20 text-[#d97706] px-1.5 py-0.5 rounded-sm';
        tag.textContent = node.weightage || node.priority || node.importance_level;
        titleObj.appendChild(tag);
    }

    header.appendChild(titleObj);
    header.addEventListener('click', (e) => {
        if(e.target !== checkbox && hasChildren) toggleCollapse(nodeId, wrapper);
    });

    wrapper.appendChild(header);

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'syllabus-children-container';
    childrenContainer.style.display = isCollapsed ? 'none' : 'block';

    if(hasChildren) {
        children.forEach((child, i) => {
            const childWrapper = processNode(child, depth + 1, nodeId, i);
            childrenContainer.appendChild(childWrapper);
            const childId = typeof child === 'string' ? `${nodeId}-${i}` : (child.id || `${nodeId}-${i}`);
            nodeRegistry[nodeId].childrenIds.push(childId);
        });
        wrapper.appendChild(childrenContainer);
    }
    return wrapper;
}

export function renderTree() {
    const container = document.getElementById('syllabus-tree-container');
    if(!container) return;
    container.innerHTML = '';
    nodeRegistry = {};
    fullSyllabus.forEach((node, i) => {
        container.appendChild(processNode(node, 0, null, i));
    });
}

function handleCheckboxChange(nodeId, isChecked) {
    progressState[nodeId] = isChecked;
    const setChildren = (id, checkedStatus) => {
        const nodeInfo = nodeRegistry[id];
        if(!nodeInfo) return;
        nodeInfo.childrenIds.forEach(childId => {
            progressState[childId] = checkedStatus;
            setChildren(childId, checkedStatus);
        });
    };
    setChildren(nodeId, isChecked);
    recalculateProgressUpward();
    StorageManager.set('progress', progressState);
    renderTree(); 
    updateTotalProgress();
}

function recalculateProgressUpward() {
    const roots = fullSyllabus.map((node, i) => typeof node === 'string' ? `root-${i}` : (node.id || `root-${i}`));
    const calcNode = (id) => {
        const nodeInfo = nodeRegistry[id];
        if(!nodeInfo || nodeInfo.childrenIds.length === 0) return progressState[id] || false;
        let completeCount = 0, partialCount = 0;
        nodeInfo.childrenIds.forEach(childId => {
            const childState = calcNode(childId);
            if(childState === true) completeCount++;
            else if(childState === 'partial') partialCount++;
        });
        let newState = false;
        if(completeCount === nodeInfo.childrenIds.length) newState = true;
        else if(completeCount > 0 || partialCount > 0) newState = 'partial';
        progressState[id] = newState;
        return newState;
    };
    roots.forEach(rootId => calcNode(rootId));
}

function toggleCollapse(id, wrapperNode) {
    const container = wrapperNode.querySelector('.syllabus-children-container');
    const caretIcon = wrapperNode.querySelector('.fa-solid');
    if(!container) return;
    const newState = !(collapseState[id] || false);
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
    let totalLeaves = 0, completedLeaves = 0;
    Object.keys(nodeRegistry).forEach(id => {
        if(nodeRegistry[id].childrenIds.length === 0) {
            totalLeaves++;
            if(progressState[id] === true) completedLeaves++;
        }
    });
    const percent = totalLeaves === 0 ? 0 : Math.round((completedLeaves / totalLeaves) * 100);
    const progressEl = document.getElementById('syllabus-total-progress');
    if(progressEl) progressEl.textContent = `${percent}%`;
}
