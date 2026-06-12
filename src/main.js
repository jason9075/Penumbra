import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import 'katex/dist/katex.min.css';
import 'prismjs';
import 'prismjs/components/prism-javascript.js';
import 'prism-themes/themes/prism-nord.css';
import './style.css';
import { LIGHT_DATA } from './data.js';
import { createScene } from './scenes.js';
import { initModals } from './ui.js';

RectAreaLightUniformsLib.init();

/** @type {Map<string, ReturnType<typeof createScene>>} */
const scenes = new Map();
/** Per-light saved param values, so switching tabs preserves user adjustments. */
const paramState = new Map();
let currentId = LIGHT_DATA[0].id;

/* ── DOM generation ── */
function buildDOM() {
  document.body.innerHTML = `
    <div id="app">
      <header class="site-header">
        <span class="site-logo">Penumbra</span>
        <span class="site-sub">Interactive Light Types Explorer</span>
        <button id="open-compare" class="header-btn" type="button"
          aria-haspopup="dialog">Compare</button>
      </header>

      <nav id="light-nav" aria-label="Light type selector" role="tablist">
        ${LIGHT_DATA.map(l => `<button class="nav-item" data-id="${l.id}" type="button"
          role="tab" aria-selected="false" aria-controls="canvas-${l.id}">
          <span class="nav-icon" aria-hidden="true">${l.icon}</span>${l.name}
        </button>`).join('')}
      </nav>

      <main id="stage">
        <aside class="section-desc" id="desc-panel" aria-live="polite"></aside>
        <div class="demo-stage">
          ${LIGHT_DATA.map(l => `<canvas class="light-canvas" id="canvas-${l.id}"
            aria-label="${l.name} light demonstration"></canvas>`).join('')}
          <div class="demo-diagram" id="mini-diagram" aria-hidden="true"></div>
        </div>
      </main>
    </div>

    <button id="open-math" class="fab" type="button"
      aria-label="Explain the physics behind this light" aria-haspopup="dialog">💡</button>

    <!-- Math principle modal -->
    <div id="math-modal" role="dialog" aria-modal="true" aria-labelledby="math-title" hidden>
      <div class="modal-panel">
        <div class="modal-header">
          <h2 id="math-title">Physics of Light Sources</h2>
          <div class="modal-actions">
            <button id="lang-toggle" class="modal-btn" type="button">Eng / 中</button>
            <button id="close-math" class="modal-btn" type="button" aria-label="Close">✕</button>
          </div>
        </div>
        <div id="math-body" class="modal-body"></div>
      </div>
    </div>

    <!-- Anatomy modal -->
    <div id="anatomy-modal" role="dialog" aria-modal="true" aria-labelledby="anatomy-title" hidden>
      <div class="modal-panel">
        <div class="modal-header">
          <h2 id="anatomy-title"></h2>
          <div class="modal-actions">
            <button id="close-anatomy" class="modal-btn" type="button" aria-label="Close">✕</button>
          </div>
        </div>
        <div id="anatomy-body" class="modal-body anatomy-body"></div>
      </div>
    </div>

    <!-- Compare matrix modal -->
    <div id="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-title" hidden>
      <div class="modal-panel wide">
        <div class="modal-header">
          <h2 id="compare-title">Light Source Reference</h2>
          <div class="modal-actions">
            <button id="close-compare" class="modal-btn" type="button" aria-label="Close">✕</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Shape</th>
                  <th scope="col">Direction</th>
                  <th scope="col">Attenuation</th>
                  <th scope="col">Shadow Edge</th>
                  <th scope="col">Typical Use</th>
                </tr>
              </thead>
              <tbody>
                ${LIGHT_DATA.map(l => `<tr>
                  <td class="accent">${l.name}</td>
                  <td>${l.table.shape}</td>
                  <td>${l.table.direction}</td>
                  <td>${l.table.attenuation}</td>
                  <td>${l.table.shadowEdge}</td>
                  <td>${l.table.use}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── Description panel for the selected light ── */
function renderDescPanel(light) {
  const panel = document.getElementById('desc-panel');
  const saved = paramState.get(light.id) || {};

  const paramsHtml = light.params.map(p => {
    if (p.type === 'preset') {
      const active = saved[p.id] ?? p.default;
      return `<div class="param-row">
        <span class="param-name" style="grid-column:1/-1">${p.label}</span>
        <div class="preset-btns" style="grid-column:1/-1">
          ${p.options.map(o => `<button class="preset-btn${o.value === active ? ' active' : ''}"
            data-preset="${o.value}" data-param="${p.id}" type="button">${o.label}</button>`).join('')}
        </div>
      </div>`;
    }
    const val = saved[p.id] ?? p.default;
    return `<div class="param-row">
      <span class="param-name">${p.label}</span>
      <span class="param-value" id="val-${p.id}">${val}${p.unit}</span>
      <input type="range" class="param-slider" data-param="${p.id}"
        min="${p.min}" max="${p.max}" value="${val}" step="${p.step || 1}"
        aria-label="${p.label}" aria-valuetext="${val}${p.unit}" />
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="light-tag" aria-hidden="true">${light.icon}</div>
    <h2 class="light-name" id="anatomy-trigger" role="button" tabindex="0"
      title="Click to view anatomy">${light.name}</h2>
    <p class="light-subtitle">${light.subtitle}</p>
    <p class="light-shape">${light.shape}</p>
    <div class="light-uses">
      <strong>Typical uses</strong>
      <ul>${light.uses.map(u => `<li>${u}</li>`).join('')}</ul>
    </div>
    <div class="light-params">
      <strong>Parameters</strong>
      ${paramsHtml}
    </div>
    <button class="anatomy-btn" id="anatomy-btn" type="button"
      aria-haspopup="dialog" aria-label="View ${light.name} anatomy diagram">
      Anatomy ↗
    </button>
  `;

  // Wire sliders
  panel.querySelectorAll('.param-slider').forEach(slider => {
    const pid = slider.dataset.param;
    const p = light.params.find(x => x.id === pid);
    slider.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      const display = document.getElementById(`val-${pid}`);
      if (display) display.textContent = `${val}${p.unit}`;
      slider.setAttribute('aria-valuetext', `${val}${p.unit}`);
      saveParam(light.id, pid, val);
      scenes.get(light.id)?.setParam(pid, val);
    });
  });

  // Wire preset buttons
  panel.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveParam(light.id, btn.dataset.param, btn.dataset.preset);
      scenes.get(light.id)?.setParam(btn.dataset.param, btn.dataset.preset);
    });
  });
}

function saveParam(lightId, paramId, val) {
  const s = paramState.get(lightId) || {};
  s[paramId] = val;
  paramState.set(lightId, s);
}

/* ── Light selection ── */
function selectLight(id) {
  const light = LIGHT_DATA.find(l => l.id === id);
  if (!light) return;

  // Stop + hide previous
  if (currentId !== id) {
    scenes.get(currentId)?.stop();
    document.getElementById(`canvas-${currentId}`)?.classList.remove('active');
  }
  currentId = id;

  // Tabs state
  document.querySelectorAll('.nav-item').forEach(n => {
    const on = n.dataset.id === id;
    n.classList.toggle('active', on);
    n.setAttribute('aria-selected', String(on));
  });

  // Show canvas, lazy-create scene
  const canvas = document.getElementById(`canvas-${id}`);
  canvas.classList.add('active');

  let scene = scenes.get(id);
  if (!scene) {
    scene = createScene(id, canvas);
    if (scene) {
      scenes.set(id, scene);
      // Apply any defaults that differ from factory state — none on first create
    }
  }
  if (scene) {
    // Re-apply saved params so the scene matches the panel
    const saved = paramState.get(id) || {};
    Object.entries(saved).forEach(([pid, val]) => scene.setParam(pid, val));
    scene.start();
  }

  document.getElementById('mini-diagram').innerHTML = light.miniSvg;
  renderDescPanel(light);
}

/* ── Init ── */
function init() {
  buildDOM();

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => selectLight(btn.dataset.id));
  });

  initModals(LIGHT_DATA, () => currentId);

  selectLight(currentId);
}

document.addEventListener('DOMContentLoaded', init);
