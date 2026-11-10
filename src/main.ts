import * as Phaser from 'phaser';
import { DUEL_CONFIG } from './content/duel-config';
import { FIGHTERS } from './content/fighters';
import { PRESENTATION } from './content/presentation';
import { DuelScene } from './scenes/duel-scene';

/** Seed demandé dans l'URL (`?seed=123`), sinon celui de la config. */
function readSeed(): number {
  const raw = new URLSearchParams(window.location.search).get('seed');
  const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : DUEL_CONFIG.seedDefault;
}

const { arena } = DUEL_CONFIG;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: arena.width,
  height: arena.height,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'matter', matter: { autoUpdate: false, enableSleeping: false } },
  scene: new DuelScene({ seed: readSeed(), config: DUEL_CONFIG, fighters: FIGHTERS, presentation: PRESENTATION }),
});
