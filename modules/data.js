import { deepClone, normalizeTags, safeJsonParse, toMinutes, uid } from './utils.js';

function collectChildren(source) {
  const keys = ['children', 'units', 'chapters', 'topics', 'subtopics', 'sections', 'items', 'nodes'];
  for (const key of keys) {
    if (Array.isArray(source?.[key]) && source[key].length) return source[key];
  }
  return [];
}

function inferType(node, depth) {
  return node?.type || node?.kind || ['unit', 'chapter', 'topic', 'subtopic'][depth] || 'node';
}

function titleFrom(node, fallback) {
  if (typeof node === 'string') return node;
  return node?.title || node?.name || node?.unit_name || node?.chapter_name || node?.topic_name || node?.label || fallback;
}

function normalizeNode(node, depth = 0, parentId = null, index = 0, path = []) {
  if (typeof node === 'string') {
    const id = `${parentId || 'root'}-${index}-${uid('s')}`;
    return {
      id,
      parentId,
      type: inferType({}, depth),
      depth,
      title: node,
      raw: node,
      children: [],
      path: [...path, id],
      meta: { tags: [] },
      estimatedMinutes: 0,
      collapsed: false,
      source: node
    };
  }

  const id = String(node.id || node.code || node.slug || `${parentId || 'root'}-${index}-${uid('n')}`);
  const children = collectChildren(node).map((child, childIndex) => normalizeNode(child, depth + 1, id, childIndex, [...path, id]));
  const title = titleFrom(node, `Item ${index + 1}`);
  const meta = {
    importance: node.importance_level || node.importance || node.priority || '',
    weightage: node.estimated_weightage_percent || node.weightage || node.weight || '',
    deadline: node.deadline || node.due_date || '',
    notes: node.notes || node.description || '',
    tags: normalizeTags(node.tags || node.tag || node.keywords),
    revisionCount: Number(node.revision_count || node.revisions || 0),
    difficulty: node.difficulty_level || node.difficulty || '',
    weak: Boolean(node.weak_topic || node.weak || node.difficult),
    pinned: Boolean(node.pinned || node.important || node.starred),
    practical: Boolean(node.practical || node.lab || node.experimental),
    strategy: node.study_strategy || node.strategy || '',
    examWeight: node.estimated_exam_weight || node.exam_weight || ''
  };
  const estimatedMinutes = toMinutes(node.estimated_time || node.estimated_minutes || node.study_time || node.duration || node.hours || node.minutes) || (children.length ? children.length * 8 : 8);

  return {
    id,
    parentId,
    type: inferType(node, depth),
    depth,
    title,
    raw: deepClone(node),
    children,
    path: [...path, id],
    meta,
    estimatedMinutes,
    collapsed: false,
    source: node
  };
}

export async function loadSyllabusSource() {
  const url = chrome?.runtime?.getURL ? chrome.runtime.getURL('data.json') : './data.json';
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load syllabus source: ${response.status}`);
  const text = await response.text();
  const json = safeJsonParse(text, {});
  return normalizeSyllabus(json);
}

export function normalizeSyllabus(source) {
  const rootItems = Array.isArray(source) ? source : (source?.syllabus || source?.units || source?.chapters || source?.topics || [source]);
  const tree = (rootItems || []).map((node, index) => normalizeNode(node, 0, null, index, []));
  return {
    meta: source?.meta || {},
    raw: source,
    tree
  };
}

export function flattenSyllabus(tree, output = []) {
  for (const node of tree || []) {
    output.push(node);
    if (node.children?.length) flattenSyllabus(node.children, output);
  }
  return output;
}
