import { Storage } from './storage.js';
import { getSyllabusStats } from './syllabus.js';

export function initAnalytics() {
  renderAnalytics();
  renderMiniChart();
}

function renderAnalytics() {
  const host = document.getElementById('analytics-view');
  if (!host) return;
  const sessions = Storage.get('sessions', []);
  const stats = Storage.get('stats', {});
  const syllabus = getSyllabusStats();
  const days = Object.keys(stats).slice(-7);

  host.innerHTML = `
    <div class="panel-titlebar"><h2>Analytics</h2><span>${sessions.length} sessions</span></div>
    <div class="chart-grid">
      <section class="chart-card"><h3>Study time</h3><canvas id="analytics-time" width="440" height="180"></canvas></section>
      <section class="chart-card"><h3>Completion</h3><canvas id="analytics-completion" width="440" height="180"></canvas></section>
      <section class="chart-card"><h3>Summary</h3><div class="metric-list">
        <div class="metric"><div><small>Total syllabus leaves</small><strong>${syllabus.total}</strong></div></div>
        <div class="metric"><div><small>Completed leaves</small><strong>${syllabus.complete}</strong></div></div>
        <div class="metric"><div><small>Remaining leaves</small><strong>${syllabus.remaining}</strong></div></div>
      </div></section>
      <section class="chart-card"><h3>Recent days</h3><div class="metric-list">${days.map((day) => `<div class="metric"><div><small>${day}</small><strong>${Math.round((stats[day]?.studyMinutes || 0) * 60)}m</strong></div></div>`).join('')}</div></section>
    </div>
  `;

  drawBarChart(document.getElementById('analytics-time'), days.map((day) => (stats[day]?.studyMinutes || 0) * 60), '#d97706');
  drawBarChart(document.getElementById('analytics-completion'), [syllabus.complete, syllabus.remaining], ['#d97706', 'rgba(63,45,29,.2)']);
}

function renderMiniChart() {
  const canvas = document.getElementById('mini-study-chart');
  const stats = Storage.get('stats', {});
  const days = Object.keys(stats).slice(-5);
  drawBarChart(canvas, days.map((day) => (stats[day]?.studyMinutes || 0) * 60), '#92400e');
}

function drawBarChart(canvas, values, color) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.fillRect(0, 0, width, height);
  const max = Math.max(1, ...values);
  const barWidth = width / Math.max(values.length, 1);
  values.forEach((value, index) => {
    const barHeight = (value / max) * (height - 28);
    ctx.fillStyle = Array.isArray(color) ? color[index % color.length] : color;
    ctx.fillRect(index * barWidth + 10, height - barHeight - 12, Math.max(16, barWidth - 20), barHeight);
  });
}
