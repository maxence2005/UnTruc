import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { BLEED } from '../../../src/content/statuses';
import type { DuelWorld } from '../../../src/core/duel-world';
import type { Fighter } from '../../../src/core/fighter';
import { SKILLS } from '../../../src/content/skills';
import { contactHit, type PendingHit } from '../../../src/core/hit';
import type { SkillRun } from '../../../src/core/skill-run';
import { massScale, stunTicksFor, walkSpeedScale } from '../../../src/core/stats';
import { REFERENCE_SPEED, STRIKING_PART } from '../duel/reaction-fixtures';
import { FAR, FIREBALL, skillDuel } from '../duel/skill-fixtures';
import { bleedWith, chargesOf, chargeTicks, statusDuel } from './status-fixtures';

/** Saignement sans dégâts ni perte de poids : seul le décompte des charges compte. */
const INERT = bleedWith({ damagePerSecondPerCharge: 0, weightLossPerCharge: 0 });

describe('Status stacking', () => {
  it('adds one charge per application up to the maximum', () => {
    const { red, bleed } = statusDuel();

    for (let i = 0; i < 3; i += 1) bleed(red, INERT);

    expect(chargesOf(red, 'bleed')).toBe(3);
  });

  it('replaces the oldest charge once the maximum is reached', () => {
    const spec = bleedWith({ ...INERT, maxCharges: 2 });
    const { red, bleed, run, of } = statusDuel();
    bleed(red, spec);
    run(10);
    bleed(red, spec);
    run(10);

    bleed(red, spec);

    const active = red.statuses[0];
    expect(active.chargeTicks).toHaveLength(2);
    expect(Math.max(...active.chargeTicks)).toBe(chargeTicks(spec));
    expect(Math.min(...active.chargeTicks)).toBe(chargeTicks(spec) - 10);
    expect(of('statusApplied').at(-1)).toMatchObject({ status: 'bleed', charges: 2, chargesAdded: 1, replaced: true });
  });
});

describe('Status duration', () => {
  it('gives each charge its own duration: a new charge does not refresh the others', () => {
    const { red, bleed, run, of } = statusDuel();
    const half = Math.floor(chargeTicks(INERT) / 2);
    bleed(red, INERT);
    run(half);
    bleed(red, INERT);

    run(chargeTicks(INERT) - half);

    expect(chargesOf(red, 'bleed')).toBe(1);
    expect(of('statusExpired')).toEqual([expect.objectContaining({ victim: 0, status: 'bleed', chargesLeft: 1 })]);
  });

  it('expires on its own once every charge has run out', () => {
    const { red, bleed, run, of, duel } = statusDuel();
    bleed(red, INERT, 2);

    run(chargeTicks(INERT));

    expect(red.statuses).toEqual([]);
    expect(of('statusExpired').at(-1)).toMatchObject({ chargesLeft: 0 });
    expect(duel.statuses.snapshot()).toEqual([]);
  });
});

describe('Bleed weight loss', () => {
  const lossy = bleedWith({ damagePerSecondPerCharge: 0, weightLossPerCharge: 3, weightFloorShare: 0.5 });

  it('removes a fixed weight per charge and gives it back when the charge expires', () => {
    const { red, bleed, run } = statusDuel();
    const base = red.spec.stats.weight;
    bleed(red, lossy, 2);

    expect(red.effectiveStats.weight).toBe(base - 6);

    run(chargeTicks(lossy));

    expect(red.effectiveStats.weight).toBe(base);
  });

  it('never goes under the floor share of the base weight', () => {
    const spec = bleedWith({ ...lossy, weightLossPerCharge: 20, weightFloorShare: 0.8, maxCharges: 5 });
    const { red, bleed } = statusDuel();

    bleed(red, spec, 5);

    expect(red.effectiveStats.weight).toBe(red.spec.stats.weight * 0.8);
  });

  it('rescales the body mass when the weight changes, and only then', () => {
    const { red, bleed, run, world } = statusDuel();
    run(5);
    expect(world.massScales).toEqual([]);

    bleed(red, lossy);

    expect(world.massScales).toEqual([{ fighter: 0, scale: massScale(DUEL_CONFIG, red.effectiveStats) }]);
    expect(world.massScales[0].scale).toBeLessThan(massScale(DUEL_CONFIG, red.spec.stats));
  });

  it('makes a bleeding fighter stunned longer and walk faster', () => {
    const { red, bleed } = statusDuel();
    const freshStun = stunTicksFor(DUEL_CONFIG, red.spec.stunMs, REFERENCE_SPEED, red.effectiveStats);
    red.machine.transition('approach');
    const freshWalk = Math.abs(red.intent().walkVelocity);

    bleed(red, bleedWith({ ...lossy, weightLossPerCharge: 10 }));

    expect(stunTicksFor(DUEL_CONFIG, red.spec.stunMs, REFERENCE_SPEED, red.effectiveStats)).toBeGreaterThan(freshStun);
    expect(Math.abs(red.intent().walkVelocity)).toBeCloseTo(red.spec.walk.speed * walkSpeedScale(DUEL_CONFIG, red.effectiveStats));
    expect(Math.abs(red.intent().walkVelocity)).toBeGreaterThan(freshWalk);
  });

  it('makes a bleeding victim recoil further from the same hit', () => {
    const recoilOn = (weightLoss: number) => {
      const { duel, red, blue, bleed, world } = statusDuel();
      if (weightLoss > 0) bleed(blue, bleedWith({ ...lossy, weightLossPerCharge: weightLoss }));
      applyHit(duel, { attacker: red, part: STRIKING_PART, impactSpeed: REFERENCE_SPEED, damage: 1 }, blue, world);
      return Math.abs(world.impulses[0].velocityX);
    };

    expect(recoilOn(10)).toBeGreaterThan(recoilOn(0));
  });
});

describe('Bleed damage', () => {
  it('deals exactly damage per second x charges x seconds, with no rounding drift', () => {
    const spec = bleedWith({ damagePerSecondPerCharge: 7, weightLossPerCharge: 0, chargeDurationMs: 3000, maxCharges: 5 });
    const { red, bleed, run, of } = statusDuel();
    const hpBefore = red.hp;

    bleed(red, spec, 3);
    run(chargeTicks(spec));

    expect(hpBefore - red.hp).toBe(7 * 3 * 3);
    expect(of('statusTick').reduce((sum, tick) => sum + tick.damage, 0)).toBe(7 * 3 * 3);
  });

  it('reports each hp loss as a status tick with its place, never as a hit', () => {
    const { red, bleed, run, of, world } = statusDuel();

    bleed(red, BLEED);
    run(chargeTicks(BLEED));

    expect(of('statusTick').length).toBeGreaterThan(0);
    expect(of('statusTick')[0]).toMatchObject({ victim: 0, status: 'bleed', x: world.positions[0], y: 0 });
    expect(of('hit')).toEqual([]);
    expect(world.impulses).toEqual([]);
    expect(red.state).not.toBe('stunned');
  });
});

describe('Bleed knockout', () => {
  it('knocks out a fighter through the usual KO path', () => {
    const { red, bleed, run, of, duel } = statusDuel();
    red.hp = 1;

    bleed(red, BLEED);
    run(chargeTicks(BLEED));

    expect(red.hp).toBe(0);
    expect(of('ko')).toEqual([expect.objectContaining({ fighter: 0 })]);
    expect(duel.winner).toBe(1);
  });

  it('gives a draw when both fighters bleed out on the same tick', () => {
    const { red, blue, bleed, run, duel, of } = statusDuel();
    red.hp = 1;
    blue.hp = 1;

    bleed(red, BLEED);
    bleed(blue, BLEED);
    run(chargeTicks(BLEED));

    expect(of('ko')).toHaveLength(2);
    expect(duel.winner).toBeNull();
  });

  it('does not tick once the duel is already over', () => {
    const { red, bleed, run, duel } = statusDuel();
    bleed(red, BLEED, 5);
    duel.phase = 'ending';
    const hpBefore = red.hp;

    run(chargeTicks(BLEED));

    expect(red.hp).toBe(hpBefore);
  });
});

describe('Status applied by a hit', () => {
  const withBleed = (red: Fighter): PendingHit => ({ attacker: red, part: STRIKING_PART, impactSpeed: REFERENCE_SPEED, damage: 1, applies: [{ status: BLEED, charges: 2 }] });

  it('applies the charges a clean hit declares', () => {
    const { duel, red, blue, world } = statusDuel();

    applyHit(duel, withBleed(red), blue, world);

    expect(chargesOf(blue, 'bleed')).toBe(2);
  });

  it('carries the statuses a skill declares into its contact hit', () => {
    const { red } = statusDuel();
    const charge = SKILLS.get('charge');
    const applies = [{ status: BLEED, charges: 1 }];
    red.machine.transition('skill');
    red.skillRun = { skill: { ...charge, hit: { ...charge.hit, applies } } } as unknown as SkillRun;

    expect(contactHit(DUEL_CONFIG, red, STRIKING_PART, REFERENCE_SPEED).applies).toBe(applies);
  });

  it('carries no status from a plain attack', () => {
    const { red } = statusDuel();

    expect(contactHit(DUEL_CONFIG, red, STRIKING_PART, REFERENCE_SPEED).applies).toBeUndefined();
  });

  it('applies nothing when the hit is parried', () => {
    const { duel, red, blue, world } = statusDuel();
    blue.machine.transition('parry');

    applyHit(duel, withBleed(red), blue, world);

    expect(chargesOf(blue, 'bleed')).toBe(0);
  });

  it('applies nothing to a victim that this hit knocks out', () => {
    const { duel, red, blue, world } = statusDuel();
    blue.hp = 1;

    applyHit(duel, withBleed(red), blue, world);

    expect(chargesOf(blue, 'bleed')).toBe(0);
  });
});

describe('Status determinism', () => {
  it('gives the same status snapshot for the same scenario', () => {
    const play = () => {
      const { red, blue, bleed, run, duel } = statusDuel();
      bleed(red, BLEED, 2);
      run(37);
      bleed(blue, BLEED);
      bleed(red, BLEED);
      run(53);
      return duel.statuses.snapshot();
    };

    const first = play();

    expect(first.length).toBeGreaterThan(0);
    expect(play()).toEqual(first);
  });

  it('adds nothing to the snapshot while no status is active', () => {
    const { run, duel } = statusDuel();

    run(30);

    expect(duel.statuses.snapshot()).toEqual([]);
  });
});

describe('Bleed knockout during a skill', () => {
  it('ends the running skill, interrupted, before the knockout', () => {
    const { duel, world, runUntil } = skillDuel([FIREBALL], FAR);
    const [red, blue] = duel.fighters;
    const order: string[] = [];
    duel.events.on('skillEnd', ({ interrupted }) => order.push(interrupted ? 'skillEnd:interrupted' : 'skillEnd'));
    duel.events.on('ko', () => order.push('ko'));
    runUntil(() => red.state === 'skill');
    expect(red.state).toBe('skill');

    red.hp = 1;
    duel.statuses.apply(blue, red, [{ status: bleedWith({ damagePerSecondPerCharge: DUEL_CONFIG.stepHz }), charges: 1 }], world);
    duel.update(world);

    expect(order).toEqual(['skillEnd:interrupted', 'ko']);
    expect(red.state).toBe('ko');
    expect(duel.skills.projectiles).toHaveLength(0);
  });
});

/** Passe par le chemin de touche commun du duel (privé), comme un contact ou un projectile. */
function applyHit(duel: unknown, hit: PendingHit, victim: Fighter, world: DuelWorld): void {
  (duel as { applyHit(hit: PendingHit, victim: Fighter, world: DuelWorld): void }).applyHit(hit, victim, world);
}
