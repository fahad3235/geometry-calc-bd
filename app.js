// Geometry Calculator BD — UI wiring. Depends on logic.js + i18n.js.
'use strict';

const $ = (id) => document.getElementById(id);
const LS_LANG = 'geometrycalc_lang';
const LS_HISTORY = 'geometrycalc_history';
const LS_UNIT = 'geometrycalc_unit';

let lang = localStorage.getItem(LS_LANG) || 'en';
let kind = '2d';
let shapeId = 'rectangle';
let history = [];
try { history = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch (e) { history = []; }
if (!Array.isArray(history)) history = [];

const DIAGRAMS = {
  rectangle: '<svg viewBox="0 0 200 120"><rect x="30" y="25" width="140" height="70" rx="4"/><text x="100" y="65">l × w</text></svg>',
  square: '<svg viewBox="0 0 200 120"><rect x="55" y="20" width="90" height="90" rx="4"/><text x="100" y="70">a²</text></svg>',
  circle: '<svg viewBox="0 0 200 120"><circle cx="100" cy="60" r="45"/><line x1="100" y1="60" x2="145" y2="60"/><text x="118" y="52">r</text></svg>',
  triangle: '<svg viewBox="0 0 200 120"><polygon points="100,15 25,105 175,105"/><text x="100" y="88">½bh</text></svg>',
  parallelogram: '<svg viewBox="0 0 200 120"><polygon points="70,25 170,25 130,95 30,95"/><text x="100" y="68">b × h</text></svg>',
  trapezoid: '<svg viewBox="0 0 200 120"><polygon points="70,25 130,25 165,95 35,95"/><text x="100" y="68">½(a+b)h</text></svg>',
  cube: '<svg viewBox="0 0 200 120"><polygon points="60,30 120,30 140,50 140,100 80,100 60,80"/><polygon points="60,30 80,50 140,50 120,30"/><line x1="80" y1="50" x2="80" y2="100"/></svg>',
  cuboid: '<svg viewBox="0 0 200 120"><polygon points="40,35 130,35 155,60 155,100 65,100 40,75"/><polygon points="40,35 65,60 155,60 130,35"/><line x1="65" y1="60" x2="65" y2="100"/></svg>',
  cylinder: '<svg viewBox="0 0 200 120"><ellipse cx="100" cy="30" rx="45" ry="12"/><path d="M55 30 L55 95 A45 12 0 0 0 145 95 L145 30"/><ellipse cx="100" cy="95" rx="45" ry="12"/></svg>',
  sphere: '<svg viewBox="0 0 200 120"><circle cx="100" cy="60" r="45"/><ellipse cx="100" cy="60" rx="45" ry="18"/><line x1="100" y1="60" x2="145" y2="60"/></svg>',
  cone: '<svg viewBox="0 0 200 120"><polygon points="100,15 55,105 145,105"/><ellipse cx="100" cy="105" rx="45" ry="8"/></svg>',
};

function t() { return STRINGS[lang]; }
function fmt(n) {
  const s = Number(n).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return lang === 'bn' ? toBnDigits(s) : s;
}
function fmtFixed2(n) {
  const s = Number(n).toFixed(2);
  return lang === 'bn' ? toBnDigits(s) : s;
}
// SI conversions need more decimals when small (15 cm^2 = 0.0015 m^2, not 0.00).
function fmtSI(n) {
  const a = Math.abs(Number(n));
  let s;
  if (a === 0) s = '0.00';
  else if (a < 0.01) s = Number(n).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  else if (a < 1) s = Number(n).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  else s = Number(n).toFixed(2);
  return lang === 'bn' ? toBnDigits(s) : s;
}

function shape() { return getShape(shapeId); }

function renderStatic() {
  $('titleEl').textContent = t().title;
  $('subtitleEl').textContent = t().subtitle;
  $('tab2d').textContent = t().tab2d;
  $('tab3d').textContent = t().tab3d;
  $('chooseLabel').textContent = t().chooseShape;
  $('unitLabel').textContent = t().unitLabel;
  $('calcBtn').textContent = t().calculate;
  $('clearBtn').textContent = t().clearForm;
  $('formulaLabel').textContent = t().formula;
  $('resultsLabel').textContent = t().results;
  $('historyLabel').textContent = t().history;
  $('clearHistoryBtn').textContent = t().clearHistory;
  $('disclaimerEl').textContent = t().disclaimer;
  $('langBtn').textContent = t().langBtn;
  $('noResultEl').textContent = t().noResult;
  $('historyEmpty').textContent = t().historyEmpty;
  const unitSel = $('unitSelect');
  unitSel.innerHTML = '';
  for (const u of ['mm', 'cm', 'm', 'inch', 'ft']) {
    const o = document.createElement('option');
    o.value = u; o.textContent = t().unitNames[u];
    unitSel.appendChild(o);
  }
  unitSel.value = localStorage.getItem(LS_UNIT) || 'cm';
  $('tab2d').classList.toggle('active', kind === '2d');
  $('tab3d').classList.toggle('active', kind === '3d');
  document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
}

function renderShapes() {
  const wrap = $('shapeChips');
  wrap.innerHTML = '';
  for (const s of SHAPES.filter((x) => x.kind === kind)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (s.id === shapeId ? ' active' : '');
    b.textContent = t().shapeNames[s.id];
    b.setAttribute('data-shape', s.id);
    b.addEventListener('click', () => { shapeId = s.id; renderShapes(); renderForm(); });
    wrap.appendChild(b);
  }
  $('hintEl').textContent = t().shapeHints[shapeId];
  $('diagramEl').innerHTML = DIAGRAMS[shapeId] || '';
}

function renderForm() {
  // Preserve typed values across re-renders (e.g. language toggle).
  const prev = {};
  for (const f of (shape() ? shape().fields : [])) {
    const el = $('f-' + f);
    if (el) prev[f] = el.value;
  }
  const form = $('fieldsForm');
  form.innerHTML = '';
  for (const f of shape().fields) {
    const div = document.createElement('div');
    div.className = 'field';
    const label = document.createElement('label');
    label.setAttribute('for', 'f-' + f);
    label.textContent = t().fieldLabels[f] + ' (' + $('unitSelect').value + ')';
    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'f-' + f;
    input.min = '0';
    input.step = 'any';
    input.placeholder = t().fieldLabels[f];
    input.setAttribute('inputmode', 'decimal');
    if (prev[f] !== undefined) input.value = prev[f];
    div.appendChild(label);
    div.appendChild(input);
    form.appendChild(div);
  }
  $('errorEl').hidden = true;
  $('resultBox').hidden = true;
  $('noResultEl').hidden = false;
  renderShapes();
}

function readInputs() {
  const vals = {};
  for (const f of shape().fields) {
    const el = $('f-' + f);
    vals[f] = el ? parseFloat(el.value) : NaN;
  }
  return vals;
}

function showError(code) {
  const el = $('errorEl');
  el.textContent = code === 'triangle' ? t().errTriangle : t().errPositive;
  el.hidden = false;
}

function calculate() {
  const vals = readInputs();
  const out = calcShape(shapeId, vals);
  if (out.error) { showError(out.error); return; }
  $('errorEl').hidden = true;
  const unit = $('unitSelect').value;
  localStorage.setItem(LS_UNIT, unit);
  $('formulaEl').textContent = out.formula;
  const box = $('resultRows');
  box.innerHTML = '';
  const summary = [];
  for (const r of out.results) {
    const row = document.createElement('div');
    row.className = 'result-row';
    const powSuffix = r.pow === 2 ? '²' : r.pow === 3 ? '³' : '';
    const main = fmtFixed2(r.value) + ' ' + unit + powSuffix;
    let sub = '';
    const si = toSI(r.value, unit, r.pow);
    if (r.pow === 2) sub = fmtSI(si.value) + ' m² (' + t().inSI + ')';
    if (r.pow === 3) sub = fmtSI(si.m3) + ' m³ (' + t().inSI3 + ') · ' + fmtSI(si.litres) + ' ' + t().litres;
    if (r.pow === 1) sub = fmtSI(toSI(r.value, unit, 1).value) + ' m';
    row.innerHTML = '<span class="r-label"></span><span class="r-main"></span><span class="r-sub"></span>';
    row.querySelector('.r-label').textContent = t()[r.key];
    row.querySelector('.r-main').textContent = main;
    row.querySelector('.r-sub').textContent = sub;
    box.appendChild(row);
    summary.push(t()[r.key] + ': ' + main);
  }
  $('resultBox').hidden = false;
  $('noResultEl').hidden = true;
  const inputSummary = shape().fields.map((f) => t().fieldLabels[f] + ' ' + fmt(vals[f])).join(', ');
  history.unshift({ shape: t().shapeNames[shapeId], inputs: inputSummary, summary: summary.join(' · '), time: new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB') });
  history = history.slice(0, 20);
  try { localStorage.setItem(LS_HISTORY, JSON.stringify(history)); } catch (e) { /* storage full: ignore */ }
  renderHistory();
}

function renderHistory() {
  const list = $('historyList');
  const empty = $('historyEmpty');
  list.innerHTML = '';
  empty.hidden = history.length > 0;
  for (const h of history) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = h.shape;
    const s = document.createElement('span');
    s.textContent = h.inputs + ' → ' + h.summary;
    const tm = document.createElement('small');
    tm.textContent = h.time;
    li.appendChild(b); li.appendChild(s); li.appendChild(tm);
    list.appendChild(li);
  }
}

function init() {
  renderStatic();
  renderShapes();
  renderForm();
  renderHistory();
  $('tab2d').addEventListener('click', () => { kind = '2d'; shapeId = 'rectangle'; renderStatic(); renderForm(); });
  $('tab3d').addEventListener('click', () => { kind = '3d'; shapeId = 'cube'; renderStatic(); renderForm(); });
  $('calcBtn').addEventListener('click', calculate);
  $('clearBtn').addEventListener('click', () => { renderForm(); });
  $('unitSelect').addEventListener('change', (e) => { localStorage.setItem(LS_UNIT, e.target.value); renderForm(); });
  $('clearHistoryBtn').addEventListener('click', () => { history = []; localStorage.removeItem(LS_HISTORY); renderHistory(); });
  $('langBtn').addEventListener('click', () => {
    lang = lang === 'en' ? 'bn' : 'en';
    localStorage.setItem(LS_LANG, lang);
    // Capture visibility BEFORE renderForm hides the result box.
    const hadResult = !$('resultBox').hidden;
    renderStatic(); renderForm(); renderHistory();
    // Re-render results labels in the new language if a result was shown.
    if (hadResult) calculate();
  });
  $('fieldsForm').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); calculate(); } });
}

document.addEventListener('DOMContentLoaded', init);
