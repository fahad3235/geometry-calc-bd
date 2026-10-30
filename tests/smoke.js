// Geometry Calculator BD — headless-Chrome smoke tests via raw CDP.
// Run: node tests/smoke.js   (spawns /opt/meta-chromium/chrome, file:// page)
'use strict';
const { spawn, execSync } = require('child_process');
const path = require('path');

const PORT = 9335;
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log('ok - ' + name); }
  else { failed++; console.log('FAIL - ' + name + (extra ? ' :: ' + extra : '')); }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + '/json/list');
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) { /* not up yet */ }
    await sleep(200);
  }
  throw new Error('chrome debugger endpoint never came up');
}

async function main() {
  const fs = require('fs');
  const policyPath = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
  const policySha = require('crypto').createHash('sha256').update(fs.readFileSync(policyPath)).digest('hex');
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--no-first-run',
    '--user-data-dir=/tmp/geometry-calc-smoke-profile',
    '--hatch-webgl-allowed-domains-file=' + policyPath,
    '--hatch-webgl-allowed-domains-sha256=' + policySha,
    PAGE
  ], { stdio: 'ignore' });
  const errors = [];
  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let seq = 0;
    const pending = new Map();
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && pending.has(data.id)) {
        const { resolve } = pending.get(data.id);
        pending.delete(data.id);
        resolve(data);
      }
      if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
        errors.push('console.error: ' + JSON.stringify(data.params.args));
      }
      if (data.method === 'Runtime.exceptionThrown') {
        errors.push('exception: ' + (data.params.exceptionDetails.exception.description || 'unknown'));
      }
    };
    function send(method, params) {
      return new Promise((resolve) => {
        const id = ++seq;
        pending.set(id, { resolve });
        ws.send(JSON.stringify({ id, method, params: params || {} }));
      });
    }
    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.error) return { error: JSON.stringify(res.error) };
      const inner = res.result ? res.result.result : undefined;
      if (!inner) return { error: 'no result: ' + JSON.stringify(res).slice(0, 200) };
      if (inner.subtype === 'error') return { error: inner.description };
      return { value: inner.value };
    };
    await send('Runtime.enable');
    await send('Page.enable');
    await sleep(1200);

    let r = await evaluate('document.title');
    check('page title is Geometry Calculator BD', r.value === 'Geometry Calculator BD', JSON.stringify(r));
    r = await evaluate('document.querySelectorAll(".chip").length');
    check('6 2D shape chips present', r.value === 6, JSON.stringify(r));
    r = await evaluate('document.getElementById("unitSelect") !== null && document.getElementById("calcBtn") !== null');
    check('unit select + calculate button present', r.value === true);
    r = await evaluate('document.getElementById("historyEmpty").hidden === false');
    check('empty history state shown initially', r.value === true);
    r = await evaluate('document.getElementById("diagramEl").innerHTML.length > 0');
    check('shape diagram renders', r.value === true);

    // Empty calculate -> inline error
    await evaluate('document.getElementById("calcBtn").click()');
    await sleep(200);
    r = await evaluate('document.getElementById("errorEl").hidden === false && document.getElementById("errorEl").textContent.length > 0');
    check('empty calculate shows inline error', r.value === true, JSON.stringify(r));

    // Rectangle 5 x 3 (cm) -> Area 15.00, Perimeter 16.00, SI 0.0015 m^2
    await evaluate('document.getElementById("f-length").value = "5"; document.getElementById("f-width").value = "3"; document.getElementById("calcBtn").click()');
    await sleep(300);
    r = await evaluate('document.getElementById("resultBox").hidden === false');
    check('result box shown after calculate', r.value === true);
    r = await evaluate('document.getElementById("resultRows").textContent');
    check('rectangle area 15.00 cm²', (r.value || '').indexOf('15.00') >= 0, JSON.stringify(r));
    check('rectangle perimeter 16.00 cm', (r.value || '').indexOf('16.00') >= 0, JSON.stringify(r));
    check('SI conversion keeps precision (0.0015 m², not 0.00)', (r.value || '').indexOf('0.0015') >= 0, JSON.stringify(r));
    r = await evaluate('document.getElementById("formulaEl").textContent');
    check('formula shown', (r.value || '').indexOf('l × w') >= 0, JSON.stringify(r));
    r = await evaluate('document.querySelectorAll("#historyList li").length');
    check('calculation added to history', r.value === 1, JSON.stringify(r));

    // Triangle inequality error: base 1, sides 2 and 10
    await evaluate('document.querySelector(\'[data-shape="triangle"]\').click()');
    await sleep(200);
    r = await evaluate('document.querySelectorAll("#fieldsForm input").length');
    check('triangle form has 4 inputs', r.value === 4, JSON.stringify(r));
    await evaluate('document.getElementById("f-base").value = "1"; document.getElementById("f-height").value = "1"; document.getElementById("f-sideA").value = "2"; document.getElementById("f-sideB").value = "10"; document.getElementById("calcBtn").click()');
    await sleep(200);
    r = await evaluate('document.getElementById("errorEl").hidden === false && /triangle/i.test(document.getElementById("errorEl").textContent)');
    check('impossible triangle shows triangle error', r.value === true, JSON.stringify(r));

    // 3D tab: cube 3 -> V27 SA54
    await evaluate('document.getElementById("tab3d").click()');
    await sleep(200);
    r = await evaluate('document.querySelectorAll(".chip").length');
    check('5 3D shape chips present', r.value === 5, JSON.stringify(r));
    await evaluate('document.getElementById("f-side").value = "3"; document.getElementById("calcBtn").click()');
    await sleep(300);
    r = await evaluate('document.getElementById("resultRows").textContent');
    check('cube volume 27.00 cm³', (r.value || '').indexOf('27.00') >= 0, JSON.stringify(r));
    check('cube surface 54.00 cm²', (r.value || '').indexOf('54.00') >= 0, JSON.stringify(r));
    check('cube volume litres shown (0.027)', (r.value || '').indexOf('0.027') >= 0, JSON.stringify(r));

    // Language toggle -> Bangla title + Bengali digits in results
    await evaluate('document.getElementById("langBtn").click()');
    await sleep(300);
    r = await evaluate('document.querySelector("h1").textContent');
    check('lang toggle switches title to Bangla', /[\u09e6-\u09ef\u0985-\u09b9]/.test(r.value || ''), JSON.stringify(r));
    r = await evaluate('document.getElementById("resultRows").textContent');
    check('Bengali digits shown in bn mode', /[\u09e6-\u09ef]/.test(r.value || ''), JSON.stringify(r));

    // History persists after reload
    await send('Page.reload');
    await sleep(1200);
    r = await evaluate('document.querySelectorAll("#historyList li").length');
    check('history survives reload', r.value >= 2, JSON.stringify(r));

    // 390px mobile: no horizontal overflow
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await sleep(400);
    r = await evaluate('document.documentElement.scrollWidth');
    check('390px viewport has no horizontal overflow', r.value <= 390, 'scrollWidth=' + r.value);

    check('zero console errors / page exceptions during smoke run', errors.length === 0, errors.join(' | '));
    ws.close();
  } finally {
    try { execSync('pkill -x chrome 2>/dev/null || true'); } catch (e) {}
    try { chrome.kill('SIGKILL'); } catch (e) {}
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed.');
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error('SMOKE HARNESS ERROR: ' + e.message); process.exit(2); });
