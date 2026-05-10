export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function debounce(fn, delay = 150) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function formatDateLabel(date = new Date()) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

export function formatTimeLabel(date = new Date()) {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function formatDuration(minutes) {
    const total = Math.max(0, Math.round(minutes || 0));
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return hours ? `${hours}h ${String(mins).padStart(2, '0')}m` : `${mins}m`;
}

export function toMinutes(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    const text = value.toLowerCase();
    const hours = text.match(/(\d+(?:\.\d+)?)\s*h/);
    const minutes = text.match(/(\d+)\s*m/);
    if (hours || minutes) {
        return Math.round((hours ? parseFloat(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1], 10) : 0));
    }
    const plain = text.match(/(\d+(?:\.\d+)?)/);
    return plain ? Math.round(parseFloat(plain[1])) : 0;
}

export function uid(prefix = 'node') {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function deepClone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function normalizeTags(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.flatMap(normalizeTags).filter(Boolean);
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

export function flattenTree(nodes, output = []) {
    for (const node of nodes || []) {
        output.push(node);
        if (node.children?.length) flattenTree(node.children, output);
    }
    return output;
}

export function safeJsonParse(text, fallback = null) {
    try {
        return JSON.parse(text);
    } catch {
        return fallback;
    }
}

export function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
