// Rejoue les duels de référence d'UnTruc dans Chrome sans tête et compare leurs empreintes.
// Usage : npm run build && node tools/hash-check.mjs   (ou : npm run check:hashes)
// Chrome : CHROME_PATH=/chemin/vers/chrome, sinon le chemin macOS ou `google-chrome` / `chromium` du PATH.
// Lance lui-même `vite preview` sur le port 4173 et l'arrête à la fin. Code de sortie 1 si une empreinte diffère.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Duels de référence : à mettre à jour seulement avec l'accord de Maxence (une story qui change le duel). */
const REFERENCES = [
  { query: 'seed=3&competences=aucune', tick: 1313, hash: '1a46eb7a' },
  { query: 'seed=3', tick: 1459, hash: 'd1973395' },
  { query: 'seed=7', tick: 1344, hash: 'a09e13b0' },
];
const PREVIEW_PORT = 4173;
const DEBUG_PORT = 9233;
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chromePath = process.env.CHROME_PATH ?? (existsSync(MAC_CHROME) ? MAC_CHROME : process.platform === 'win32' ? 'chrome' : 'google-chrome');

async function waitFor(url, tries = 120) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // Pas encore prêt.
    }
    await sleep(250);
  }
  throw new Error(`Rien ne répond sur ${url}`);
}

function connect(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      id += 1;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  return new Promise((resolve) => ws.addEventListener('open', () => resolve({ ws, send })));
}

async function playDuel(send, query) {
  await send('Page.navigate', { url: `http://localhost:${PREVIEW_PORT}/?${query}` });
  await sleep(1500);
  let state = null;
  for (let i = 0; i < 1500 && !state?.over; i += 1) {
    const result = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__untrucDuel ?? null)', returnByValue: true });
    state = JSON.parse(result.result.value);
    if (!state?.over) await sleep(200);
  }
  return state;
}

const preview = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], { stdio: 'ignore' });
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, '--window-size=1280,640', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'untruc-hash-'))}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let failures = 0;
try {
  await waitFor(`http://localhost:${PREVIEW_PORT}/`);
  const targets = await (await waitFor(`http://localhost:${DEBUG_PORT}/json`)).json();
  const { ws, send } = await connect(targets.find((t) => t.type === 'page'));
  await send('Page.enable');
  for (const reference of REFERENCES) {
    const state = await playDuel(send, reference.query);
    const same = state?.over === true && state.tick === reference.tick && state.stateHash === reference.hash;
    if (!same) failures += 1;
    console.log(`${same ? 'OK       ' : 'DIFFÉRENT'} ?${reference.query} : tick ${state?.tick} (attendu ${reference.tick}), empreinte ${state?.stateHash} (attendue ${reference.hash})`);
  }
  ws.close();
} finally {
  chrome.kill();
  preview.kill();
}
process.exit(failures === 0 ? 0 : 1);
