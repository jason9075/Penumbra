import renderMathInElement from 'katex/dist/contrib/auto-render';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript.js';

/**
 * Wires up the three modals: math (💡), anatomy, and compare.
 * @param {Array} lights LIGHT_DATA entries
 * @param {() => string} getCurrentId returns the currently selected light id
 */
export function initModals(lights, getCurrentId) {
  const fab = document.getElementById('open-math');
  const mathModal = document.getElementById('math-modal');
  const closeMath = document.getElementById('close-math');
  const langToggle = document.getElementById('lang-toggle');
  const mathTitle = document.getElementById('math-title');
  const mathBody = document.getElementById('math-body');

  const anatomyModal = document.getElementById('anatomy-modal');
  const closeAnatomy = document.getElementById('close-anatomy');
  const anatomyTitle = document.getElementById('anatomy-title');
  const anatomyBody = document.getElementById('anatomy-body');

  const compareModal = document.getElementById('compare-modal');
  const openCompare = document.getElementById('open-compare');
  const closeCompare = document.getElementById('close-compare');

  let lang = 'en';

  /* ── Math modal — shows the current light's principle ── */
  function renderMath() {
    const light = lights.find(l => l.id === getCurrentId());
    if (!light) return;
    mathTitle.textContent = `Physics — ${light.name}`;
    mathBody.innerHTML = lang === 'en' ? light.mathEn : light.mathZh;
    renderMathInElement(mathBody, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
    Prism.highlightAllUnder(mathBody);
  }

  fab?.addEventListener('click', () => {
    renderMath();
    mathModal.hidden = false;
    closeMath?.focus();
  });

  closeMath?.addEventListener('click', () => { mathModal.hidden = true; fab?.focus(); });

  mathModal?.addEventListener('click', e => {
    if (e.target === mathModal) { mathModal.hidden = true; fab?.focus(); }
  });

  langToggle?.addEventListener('click', () => {
    lang = lang === 'en' ? 'zh' : 'en';
    langToggle.textContent = lang === 'en' ? 'Eng / 中' : '中 / Eng';
    if (!mathModal.hidden) renderMath();
  });

  /* ── Anatomy modal ── */
  function openAnatomy() {
    const light = lights.find(l => l.id === getCurrentId());
    if (!light) return;

    anatomyTitle.textContent = light.name;
    anatomyBody.innerHTML = `
      <div class="anatomy-svg-wrap">${light.anatomySvg}</div>
      <div class="anatomy-desc">
        <h3>${light.name}</h3>
        <p style="font-size:0.78rem;color:var(--mist);margin-bottom:1rem">${light.subtitle}</p>
        <dl>
          <dt>Shape</dt><dd>${light.table.shape}</dd>
          <dt>Direction</dt><dd>${light.table.direction}</dd>
          <dt>Attenuation</dt><dd>${light.table.attenuation}</dd>
          <dt>Shadow edge</dt><dd>${light.table.shadowEdge}</dd>
          <dt>Typical use</dt><dd>${light.table.use}</dd>
        </dl>
      </div>`;

    anatomyModal.hidden = false;
    closeAnatomy?.focus();
  }

  // Anatomy triggers live inside the re-rendered desc panel — delegate from document
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.id === 'anatomy-btn' || t.id === 'anatomy-trigger') openAnatomy();
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'anatomy-trigger') {
      e.preventDefault();
      openAnatomy();
    }
  });

  closeAnatomy?.addEventListener('click', () => { anatomyModal.hidden = true; });

  anatomyModal?.addEventListener('click', e => {
    if (e.target === anatomyModal) anatomyModal.hidden = true;
  });

  /* ── Compare modal ── */
  openCompare?.addEventListener('click', () => {
    compareModal.hidden = false;
    closeCompare?.focus();
  });

  closeCompare?.addEventListener('click', () => { compareModal.hidden = true; openCompare?.focus(); });

  compareModal?.addEventListener('click', e => {
    if (e.target === compareModal) compareModal.hidden = true;
  });

  /* ── Escape closes the topmost open modal ── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!anatomyModal.hidden) { anatomyModal.hidden = true; return; }
    if (!compareModal.hidden) { compareModal.hidden = true; openCompare?.focus(); return; }
    if (!mathModal.hidden) { mathModal.hidden = true; fab?.focus(); }
  });
}
