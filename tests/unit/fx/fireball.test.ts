import type * as Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import type { FxFireball } from '../../../src/core/presentation-config';
import { FireballFx } from '../../../src/render/fx/fireball';

/**
 * Valeurs de `fx.fireball` de la présentation, sauf `trailPoints` (64) : assez de place pour que
 * la longueur de la traînée ne bute jamais sur le plafond dans ces tests.
 */
const CONFIG: FxFireball = {
  maxFireballs: 4,
  speed: 450,
  radius: 22,
  trailPoints: 64,
  trailSampleMs: 1000 / 60,
  trailTaper: 0.2,
  outerColor: 0xff4d2e,
  midColor: 0xff9a3c,
  coreColor: 0xfff0a0,
  outerAlpha: 0.9,
  midRadiusShare: 0.7,
  coreRadiusShare: 0.4,
  trailAlphaMin: 0.25,
  trailAlphaGain: 0.45,
  impactRadius: 130,
  demoDelayMs: 600,
  demoRepeatMs: 1500,
};
/** Durée qui tombe sur une image entière à 60 comme à 144 i/s (5 et 12 images). */
const UNIT_MS = 1000 / 12;
/** Cercles dessinés par la tête d'une boule : couches extérieure, du milieu et cœur. */
const HEAD_LAYERS = 3;

interface Drawn {
  /** Centres des têtes (couche extérieure, au rayon plein). */
  heads: { x: number; y: number }[];
  /** Points de traînée dessinés, toutes boules confondues. */
  trail: number;
}

/** Faux `Graphics` : relève les têtes et compte les points de traînée. */
function drawn(fx: FireballFx): Drawn {
  const heads: { x: number; y: number }[] = [];
  let circles = 0;
  const fake = {
    fillStyle: () => fake,
    fillCircle: (x: number, y: number, radius: number) => {
      circles += 1;
      if (radius === CONFIG.radius) heads.push({ x, y });
      return fake;
    },
  };
  fx.draw(fake as unknown as Phaser.GameObjects.Graphics);
  return { heads, trail: circles - heads.length * HEAD_LAYERS };
}

/** Points de traînée d'une boule posée, après `frames` images de `frameMs` de temps d'effet. */
function trailAfter(frames: number, frameMs: number): number {
  const fx = new FireballFx(CONFIG, () => undefined);
  fx.place(0, 100, 100);
  for (let i = 0; i < frames; i += 1) fx.update(frameMs);
  return drawn(fx).trail;
}

describe('FireballFx trail', () => {
  it('keeps the same number of trail points at 60 and 144 frames per second for the same effect time', () => {
    const at60 = trailAfter(Math.round((3 * UNIT_MS * 60) / 1000), 1000 / 60);
    const at144 = trailAfter(Math.round((3 * UNIT_MS * 144) / 1000), 1000 / 144);

    expect(at60).toBe(15);
    expect(at144).toBe(at60);
  });

  it('follows the slow motion: half the effect time gives half the trail points', () => {
    const normal = trailAfter(12, 1000 / 60);
    const slowed = trailAfter(12, 1000 / 60 / 2);

    expect(normal).toBe(12);
    expect(slowed).toBe(6);
  });

  it('refuses a trail sample period that is not positive', () => {
    expect(() => new FireballFx({ ...CONFIG, trailSampleMs: 0 }, () => undefined)).toThrow('trailSampleMs');
  });
});

describe('FireballFx slots', () => {
  it('a fireball keeps flying when another one whose id falls on the same pool slot is released', () => {
    const fx = new FireballFx(CONFIG, () => undefined);
    fx.place(0, 10, 10);
    fx.place(CONFIG.maxFireballs, 50, 50);

    fx.release(CONFIG.maxFireballs);

    expect(drawn(fx).heads).toEqual([{ x: 10, y: 10 }]);
  });

  it('ignores a new fireball while the pool is full and leaves the others where they are', () => {
    const fx = new FireballFx(CONFIG, () => undefined);
    for (let id = 0; id < CONFIG.maxFireballs; id += 1) fx.place(id, id, 0);

    fx.place(CONFIG.maxFireballs, 999, 999);
    fx.release(CONFIG.maxFireballs);

    expect(drawn(fx).heads).toEqual([0, 1, 2, 3].map((x) => ({ x, y: 0 })));
  });

  it('reuses the slot of a released fireball for the next one', () => {
    const fx = new FireballFx(CONFIG, () => undefined);
    for (let id = 0; id < CONFIG.maxFireballs; id += 1) fx.place(id, id, 0);

    fx.release(1);
    fx.place(9, 90, 90);

    expect(drawn(fx).heads).toContainEqual({ x: 90, y: 90 });
    expect(drawn(fx).heads).toHaveLength(CONFIG.maxFireballs);
  });
});
