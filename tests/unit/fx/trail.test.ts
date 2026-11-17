import type * as Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import type { SkillTrailLook } from '../../../src/core/presentation-config';
import { TrailFx } from '../../../src/render/fx/trail';

/** Mêmes valeurs que `skills.trail` de la présentation : 16 points, un tous les 1000/60 ms. */
const LOOK: SkillTrailLook = { points: 16, sampleMs: 1000 / 60, width: 26, alpha: 0.55 };
const TORSO = { x: 100, y: 200 };
const at = () => TORSO;
/** Durée qui tombe sur une image entière à 60 comme à 144 i/s (5 et 12 images). */
const UNIT_MS = 1000 / 12;

/** Faux `Graphics` : ne compte que les points dessinés (`fillCircle`). */
function countingGraphics(): { g: Phaser.GameObjects.Graphics; drawn: () => number } {
  let circles = 0;
  const fake = { fillStyle: () => fake, fillCircle: () => { circles += 1; return fake; } };
  return { g: fake as unknown as Phaser.GameObjects.Graphics, drawn: () => circles };
}

/** Avance `trail` de `durationMs` de temps d'effet, découpés en images de `fps`. */
function run(trail: TrailFx, durationMs: number, fps: number): void {
  const frames = Math.round((durationMs * fps) / 1000);
  for (let i = 0; i < frames; i += 1) trail.update(1000 / fps, at);
}

function pointsAfter(durationMs: number, fps: number, stopAfterMs?: number): number {
  const trail = new TrailFx(1, LOOK);
  trail.start(0, 0xffffff);
  if (stopAfterMs === undefined) {
    run(trail, durationMs, fps);
  } else {
    run(trail, stopAfterMs, fps);
    trail.stop(0);
    run(trail, durationMs - stopAfterMs, fps);
  }
  const { g, drawn } = countingGraphics();
  trail.draw(g);
  return drawn();
}

describe('TrailFx', () => {
  it('keeps the same number of points at 60 and 144 frames per second for the same effect time', () => {
    expect(pointsAfter(3 * UNIT_MS, 60)).toBe(pointsAfter(3 * UNIT_MS, 144));
    expect(pointsAfter(3 * UNIT_MS, 60)).toBe(15);
  });

  it('caps the trail at its point count after a long run, at any frame rate', () => {
    expect(pointsAfter(1000, 60)).toBe(LOOK.points);
    expect(pointsAfter(1000, 144)).toBe(LOOK.points);
  });

  it('fades at the same pace at 60 and 144 frames per second', () => {
    expect(pointsAfter(4 * UNIT_MS, 60, 3 * UNIT_MS)).toBe(pointsAfter(4 * UNIT_MS, 144, 3 * UNIT_MS));
    expect(pointsAfter(4 * UNIT_MS, 60, 3 * UNIT_MS)).toBe(10);
  });

  it('follows the slow motion: half the effect time gives half the points', () => {
    const trail = new TrailFx(1, LOOK);
    trail.start(0, 0xffffff);
    for (let i = 0; i < 12; i += 1) trail.update(1000 / 60 / 2, at);
    const { g, drawn } = countingGraphics();
    trail.draw(g);
    expect(drawn()).toBe(6);
  });

  it('draws the points from oldest to newest after the ring has wrapped', () => {
    const trail = new TrailFx(1, LOOK);
    let sample = 0;
    const moving = () => ({ x: (sample += 1), y: 0 });
    trail.start(0, 0xffffff);
    for (let i = 0; i < LOOK.points + 5; i += 1) trail.update(LOOK.sampleMs, moving);

    const xs: number[] = [];
    const fake = { fillStyle: () => fake, fillCircle: (x: number) => { xs.push(x); return fake; } };
    trail.draw(fake as unknown as Phaser.GameObjects.Graphics);

    expect(xs).toEqual(Array.from({ length: LOOK.points }, (_, i) => i + 6));
  });

  it('a start after a stop drops the fading points and draws only the new ones in the new colour', () => {
    const trail = new TrailFx(1, LOOK);
    trail.start(0, 0xff0000);
    for (let i = 0; i < 5; i += 1) trail.update(LOOK.sampleMs, at);
    trail.stop(0);
    trail.update(LOOK.sampleMs, at);

    trail.start(0, 0x00ff00);
    trail.update(LOOK.sampleMs, at);
    const colors: number[] = [];
    const fake = { fillStyle: (color: number) => { colors.push(color); return fake; }, fillCircle: () => fake };
    trail.draw(fake as unknown as Phaser.GameObjects.Graphics);

    expect(colors).toEqual([0x00ff00]);
  });

  it('refuses a sample period that is not positive and a point count below one', () => {
    expect(() => new TrailFx(1, { ...LOOK, sampleMs: 0 })).toThrow('sampleMs');
    expect(() => new TrailFx(1, { ...LOOK, sampleMs: -5 })).toThrow('sampleMs');
    expect(() => new TrailFx(1, { ...LOOK, points: 0 })).toThrow('points');
  });
});
