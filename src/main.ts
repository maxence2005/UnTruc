import * as Phaser from 'phaser';
import { DUEL_CONFIG } from './content/duel-config';
import { FIGHTERS } from './content/fighters';
import { WEAPONS } from './content/weapons';
import { PRESENTATION } from './content/presentation';
import type { FighterSpec } from './core/fighter-spec';
import { DuelScene } from './scenes/duel-scene';

/** Seed demandé dans l'URL (`?seed=123`), sinon celui de la config. */
function readSeed(): number {
  const raw = new URLSearchParams(window.location.search).get('seed');
  const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : DUEL_CONFIG.seedDefault;
}

/**
 * Armes demandées dans l'URL, dans l'ordre des combattants : `?armes=sword,hammer`
 * (un nom vide = aux poings, `?armes=,hammer`). Sert à essayer une arme sans toucher
 * aux données (voir `src/content/weapons/README.md`). Sans le paramètre : `FIGHTERS` tels quels.
 */
function readFighters(): readonly [FighterSpec, FighterSpec] {
  const raw = new URLSearchParams(window.location.search).get('armes');
  if (raw === null) return FIGHTERS;
  const ids = raw.split(',').map((id) => id.trim());
  const arm = (spec: FighterSpec, id: string | undefined): FighterSpec => (id === undefined || id === '' ? spec : { ...spec, weapon: WEAPONS.get(id) });
  return [arm(FIGHTERS[0], ids[0]), arm(FIGHTERS[1], ids[1])];
}

/** `?fx=fireball` : lance une boule de feu de démonstration au début du duel (touche F : une à tout moment). */
function readDemoFireball(): boolean {
  return new URLSearchParams(window.location.search).get('fx') === 'fireball';
}

const { arena } = DUEL_CONFIG;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: arena.width,
  height: arena.height,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'matter', matter: { autoUpdate: false, enableSleeping: false } },
  scene: new DuelScene({ seed: readSeed(), config: DUEL_CONFIG, fighters: readFighters(), presentation: PRESENTATION, demoFireball: readDemoFireball() }),
});
