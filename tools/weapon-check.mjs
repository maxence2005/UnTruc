// Vérifie des armes en duel, sans toucher aux données : bâtit le jeu, joue chaque seed
// jusqu'au KO dans Chrome sans fenêtre, lit le hook du duel et la sonde des armes,
// et dit ce qui ne va pas. Voir src/content/weapons/README.md.
//
//   npm run check:weapons -- sword,hammer 3,7 [dossierCaptures]
//
// Variables : CHROME (chemin de Chrome), PORT (4173 par défaut).
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Seuil du verdict : l'arme doit rester dans la main avant (articulation). La main arrière
 * d'une arme à deux mains est seulement affichée : elle suit le manche et décroche quand la
 * seconde prise est hors de portée du bras tendu, surtout derrière le torse, donc peu visible.
 */
const GRIP_MAX_OK = 3;
/** Temps réel maximal par duel avant d'abandonner (ms), et intervalle entre deux lectures. */
const DUEL_TIMEOUT_MS = 60_000;
const POLL_MS = 100;
const SHOTS_PER_DUEL = 6;

const [weaponsArg, seedsArg = '3,7', shotsDir] = process.argv.slice(2);
if (weaponsArg === undefined) {
  console.error('Usage : npm run check:weapons -- <arme0>,<arme1> [seeds, ex. 3,7] [dossierCaptures]');
  process.exit(2);
}
const seeds = seedsArg.split(',').map((seed) => Number.parseInt(seed, 10));
const chromePath = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = Number(process.env.PORT ?? 4173);
const debugPort = port + 5000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('Build…');
execSync('npx vite build', { stdio: 'ignore' });
const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
const profile = mkdtempSync(join(tmpdir(), 'untruc-weapon-check-'));
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${debugPort}`, '--window-size=1280,640', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });

/** Petit client CDP : une page, des commandes qui renvoient leur résultat. */
async function connect() {
  let target;
  for (let i = 0; i < 60 && target === undefined; i += 1) {
    await sleep(250);
    try {
      target = (await (await fetch(`http://localhost:${debugPort}/json`)).json()).find((t) => t.type === 'page');
    } catch {
      // Chrome démarre encore.
    }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id !== undefined && pending.has(msg.id)) {
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
  return { send, close: () => ws.close() };
}

const fmt = (value) => (value === null || value === undefined ? '—' : Math.round(value * 10) / 10);
let failures = 0;
try {
  const page = await connect();
  await page.send('Page.enable');
  for (const seed of seeds) {
    await page.send('Page.navigate', { url: `http://localhost:${port}/?seed=${seed}&armes=${weaponsArg}` });
    await sleep(1500);
    const started = Date.now();
    let state;
    let shot = 0;
    const parryShot = new Set();
    while (Date.now() - started < DUEL_TIMEOUT_MS) {
      const read = await page.send('Runtime.evaluate', {
        expression: 'JSON.stringify({ duel: window.__untrucDuel, weapons: window.__untrucWeapons })',
        returnByValue: true,
      });
      state = JSON.parse(read.result.value);
      const elapsed = Date.now() - started;
      if (shotsDir !== undefined && (state.duel.over || elapsed >= (shot * DUEL_TIMEOUT_MS) / (SHOTS_PER_DUEL * 4))) {
        mkdirSync(shotsDir, { recursive: true });
        const image = await page.send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(shotsDir, `seed${seed}-${String(shot).padStart(2, '0')}-tick${state.duel.tick}.png`), Buffer.from(image.data, 'base64'));
        shot += 1;
      }
      if (shotsDir !== undefined) {
        for (const [index, stats] of (state.weapons ?? []).entries()) {
          if (stats === null || stats.state !== 'parry' || parryShot.has(index)) continue;
          parryShot.add(index);
          const image = await page.send('Page.captureScreenshot', { format: 'png' });
          writeFileSync(join(shotsDir, `seed${seed}-parade-combattant${index}-tick${state.duel.tick}.png`), Buffer.from(image.data, 'base64'));
        }
      }
      if (state.duel.over) break;
      await sleep(POLL_MS);
    }
    const { duel, weapons } = state;
    const problems = [];
    if (!duel.over) problems.push(`pas de KO au bout de ${DUEL_TIMEOUT_MS / 1000} s (tick ${duel.tick})`);
    const names = weaponsArg.split(',');
    console.log(`\nSeed ${seed} : tick ${duel.tick}, PV ${duel.hp.join(' / ')}, vainqueur ${duel.winner ?? 'égalité'}`);
    weapons.forEach((stats, index) => {
      if (stats === null) {
        console.log(`  combattant ${index} : poings`);
        return;
      }
      console.log(
        `  combattant ${index} (${names[index]}) : main-prise max ${fmt(stats.gripMax)} px (moy. ${fmt(stats.gripAvg)}), ` +
          `main arrière moy. ${fmt(stats.offHandAvg)} px (info), torse au plus haut y=${fmt(stats.torsoMinY)}, ` +
          `envolée sans coup ${stats.flightTicksWithoutHit} ticks, coups d'arme ${stats.hits} (${stats.damage} dégâts), ` +
          `parades ${stats.parries}, esquives ${stats.dodges}`,
      );
      if (stats.gripMax > GRIP_MAX_OK) problems.push(`${names[index]} sort de la main avant (${fmt(stats.gripMax)} px > ${GRIP_MAX_OK})`);
      if (stats.flightTicksWithoutHit > 0) problems.push(`combattant ${index} s'envole sans avoir été frappé (${stats.flightTicksWithoutHit} ticks)`);
      if (stats.hits === 0) problems.push(`${names[index]} ne touche jamais`);
      if (stats.parries > 0 && !stats.canParry) problems.push(`${names[index]} pare alors qu'elle n'a pas de garde`);
    });
    if (problems.length === 0) console.log('  OK');
    for (const problem of problems) console.log(`  ⚠ ${problem}`);
    failures += problems.length;
  }
  page.close();
} finally {
  chrome.kill();
  preview.kill();
}
console.log(failures === 0 ? '\nTout est OK.' : `\n${failures} problème(s).`);
process.exit(failures === 0 ? 0 : 1);
