import { describe, expect, it } from 'vitest';
import { WEREWOLF_COSMETICS, WOLF_TAIL } from '../../../src/content/cosmetics/werewolf';
import { PRESENTATION } from '../../../src/content/presentation';
import type { CosmeticChain } from '../../../src/core/cosmetic-spec';
import { GrowlWave } from '../../../src/render/fx/growl-wave';
import { ScratchPool, scratchAngle } from '../../../src/render/fx/scratches';
import { partToWorld, TailChain } from '../../../src/render/fx/tail-chain';
import { arenaShake, leavesScratches, readReducedMotion, scratchLooksByForm, stageBanner } from '../../../src/render/stage-look';

const FRAME_MS = 1000 / 60;
const TAIL = WOLF_TAIL.chain!;
const STAGES = PRESENTATION.skills.byId.transformation.stages!;
const SCRATCHES = STAGES.transformation.scratches!;
const WAVE = STAGES.growl.arena!;

function segmentLengths(chain: TailChain): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < chain.xs.length; i += 1) lengths.push(Math.hypot(chain.xs[i] - chain.xs[i - 1], chain.ys[i] - chain.ys[i - 1]));
  return lengths;
}

describe('TailChain (queue côté rendu)', () => {
  it('garde la longueur de chaque segment quand l’attache bouge', () => {
    const chain = new TailChain(TAIL);
    chain.reset(0, 0, -1, 0);
    for (let frame = 0; frame < 300; frame += 1) chain.update(FRAME_MS, Math.sin(frame / 7) * 60, Math.cos(frame / 5) * 30, -1, -0.35);
    for (const length of segmentLengths(chain)) expect(length).toBeCloseTo(TAIL.segmentLength, 6);
  });

  it('se pose et reste stable à l’arrêt : ni NaN ni dérive', () => {
    const chain = new TailChain(TAIL);
    chain.reset(100, 100, -1, -0.35);
    for (let frame = 0; frame < 600; frame += 1) chain.update(FRAME_MS, 100, 100, -1, -0.35);
    const tipX = chain.xs[TAIL.segments];
    const tipY = chain.ys[TAIL.segments];
    chain.update(FRAME_MS, 100, 100, -1, -0.35);
    expect(Number.isFinite(tipX) && Number.isFinite(tipY)).toBe(true);
    expect(Math.hypot(chain.xs[TAIL.segments] - tipX, chain.ys[TAIL.segments] - tipY)).toBeLessThan(0.01);
    expect(tipX).toBeLessThan(100);
  });

  it('pend sous l’attache sans rappel (raideur nulle) : la gravité agit', () => {
    const limp: CosmeticChain = { ...TAIL, stiffness: 0 };
    const chain = new TailChain(limp);
    chain.reset(0, 0, -1, 0);
    for (let frame = 0; frame < 600; frame += 1) chain.update(FRAME_MS, 0, 0, -1, 0);
    expect(chain.ys[limp.segments]).toBeGreaterThan(limp.segmentLength * limp.segments * 0.9);
  });

  it('ne joue pas plus de pas qu’un plafond après une longue pause', () => {
    const chain = new TailChain(TAIL);
    chain.reset(0, 0, -1, 0);
    chain.update(60_000, 0, 0, -1, 0);
    for (const length of segmentLengths(chain)) expect(length).toBeCloseTo(TAIL.segmentLength, 6);
  });

  it('partToWorld retourne le repère selon le regard', () => {
    const out = { x: 0, y: 0 };
    expect(partToWorld({ x: 10, y: 20, angle: 0 }, 1, 5, 2, out)).toEqual({ x: 15, y: 22 });
    expect(partToWorld({ x: 10, y: 20, angle: 0 }, -1, 5, 2, out)).toEqual({ x: 5, y: 22 });
  });
});

describe('ScratchPool (griffures)', () => {
  it('pose puis efface après lifeMs', () => {
    const pool = new ScratchPool(SCRATCHES);
    pool.emit(1, 0, 0, 0);
    expect(pool.count).toBe(1);
    pool.update(SCRATCHES.lifeMs);
    expect(pool.count).toBe(0);
  });

  it('plein, réutilise la plus ancienne sans grandir', () => {
    const pool = new ScratchPool(SCRATCHES);
    for (let i = 0; i < SCRATCHES.maxShown + 3; i += 1) {
      pool.emit(1, i, 0, 0);
      pool.update(10);
    }
    expect(pool.items).toHaveLength(SCRATCHES.maxShown);
    expect(pool.count).toBe(SCRATCHES.maxShown);
    expect(Math.min(...pool.items.map((item) => item.dx))).toBe(3);
  });

  it('incline les traits dans le sens de la main', () => {
    expect(scratchAngle(0, 100, 60)).toBeCloseTo(Math.PI / 3);
    expect(scratchAngle(100, 0, 60)).toBeCloseTo((2 * Math.PI) / 3);
  });

  it('seul un coup sous forme, non paré et non mortel laisse des griffures', () => {
    const byForm = scratchLooksByForm(PRESENTATION.skills);
    expect(byForm.get('transformation')).toBe(SCRATCHES);
    expect(leavesScratches({ form: 'transformation', parried: false, hpLeft: 10 }, byForm)).toBe(true);
    expect(leavesScratches({ form: 'transformation', parried: true, hpLeft: 10 }, byForm)).toBe(false);
    expect(leavesScratches({ form: 'transformation', parried: false, hpLeft: 0 }, byForm)).toBe(false);
    expect(leavesScratches({ parried: false, hpLeft: 10 }, byForm)).toBe(false);
  });
});

describe('Présentation des stades', () => {
  it('affiche le nom propre à chaque stade', () => {
    expect(stageBanner(PRESENTATION.skills, 'transformation', 'growl').name).toBe('Grognement');
    expect(stageBanner(PRESENTATION.skills, 'transformation', 'transformation').name).toBe('Transformation');
  });

  it('retombe sur le nom de la compétence, puis sur l’identifiant du stade', () => {
    expect(stageBanner(PRESENTATION.skills, 'jump', 'inconnu').name).toBe('Saut');
    expect(stageBanner(PRESENTATION.skills, 'inconnue', 'stade').name).toBe('stade');
  });

  it('pose oreilles, museau, griffes et queue, chacun sur sa partie', () => {
    const cosmetics = STAGES.transformation.cosmetics!;
    expect(cosmetics).toBe(WEREWOLF_COSMETICS);
    expect(cosmetics.map((cosmetic) => cosmetic.part).sort()).toEqual(['foreArmBack', 'foreArmFront', 'head', 'head', 'torso']);
  });
});

describe('Tremblement d’écran', () => {
  const arena = { intensity: 0.5, durationMs: 800 };

  it('suit la durée de l’événement et met l’intensité à l’échelle', () => {
    expect(arenaShake(arena, WAVE, false)).toEqual({ durationMs: 800, intensity: WAVE.shakeIntensity * 0.5 });
  });

  it('est coupé en mouvement réduit et sans effet d’arène', () => {
    expect(arenaShake(arena, WAVE, true)).toBeNull();
    expect(arenaShake(undefined, WAVE, false)).toBeNull();
  });

  it('lit prefers-reduced-motion, faux sans matchMedia', () => {
    expect(readReducedMotion({ matchMedia: (query) => ({ matches: query === '(prefers-reduced-motion: reduce)' }) })).toBe(true);
    expect(readReducedMotion({ matchMedia: () => ({ matches: false }) })).toBe(false);
    expect(readReducedMotion({})).toBe(false);
    expect(readReducedMotion(undefined)).toBe(false);
  });
});

describe('GrowlWave', () => {
  it('ses anneaux partent l’un après l’autre puis l’onde s’éteint', () => {
    const wave = new GrowlWave(1000);
    wave.emit(WAVE, 0, 1, 0, 0, 1, 800);
    wave.update(WAVE.ringDelayMs / 2);
    expect(wave.ringProgress(0)).toBeGreaterThan(0);
    expect(wave.ringProgress(1)).toBeLessThan(0);
    wave.update(800 + WAVE.rings * WAVE.ringDelayMs + WAVE.mouthMs);
    expect(wave.active).toBe(false);
  });
});
