import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { aimLaunch } from '../../src/core/ballistics';
import type { Rng } from '../../src/core/rng';
import { createRng } from '../../src/core/rng';
import { canLaunch, chooseSkill, skillUseChance } from '../../src/core/skill-choice';
import { assertSkillSpec, skillDamage, type SkillSpec } from '../../src/core/skill-spec';
import { hitDamage } from '../../src/core/stats';
import { stunVictim } from '../../src/core/stun';
import { punchContact } from './duel/fake-duel-world';
import { FIGHTERS } from './duel/plain-fighters';
import { ALWAYS, configWith, OTHER_SEED, REFERENCE_SPEED, SEED } from './duel/reaction-fixtures';
import { ALWAYS_SKILL, CHARGE, FAR, FIREBALL, JUMP, READY, skillConfig, skillDuel, withProjectile } from './duel/skill-fixtures';

const SKILLS_CONFIG = { ...DUEL_CONFIG.skills, useChance: ALWAYS_SKILL };
/** Assez de ticks pour qu'un étourdissement finisse sans que la recharge de la boule de feu ne s'écoule. */
const AFTER_STUN_TICKS = 200;
/** Ticks joués après un coup pour vérifier qu'aucune contre-attaque ne suit (une garde intacte contrerait bien avant). */
const AFTER_COUNTER_TICKS = 60;

/** RNG à tirages imposés : `next` rend les valeurs dans l'ordre. */
function scriptedRng(values: readonly number[]): Rng {
  let index = 0;
  const next = () => values[index++];
  return { next, int: (min, max) => min + Math.floor(next() * (max - min + 1)), range: (min, max) => min + next() * (max - min) };
}

describe('Skill interruption', () => {
  it.each([
    { skill: JUMP, phase: 'leap', distance: JUMP.conditions.minDistance + 50 },
    { skill: CHARGE, phase: 'rush', distance: CHARGE.conditions.minDistance },
  ])('a $skill.id stunned in its $phase phase ends interrupted and leaves the skill state', ({ skill, phase, distance }) => {
    const { duel, of, runUntil, run } = skillDuel([skill], distance);
    const red = duel.fighters[0];
    runUntil(() => red.skillRun?.phase.name === phase);

    stunVictim(DUEL_CONFIG, red, REFERENCE_SPEED);
    run(1);

    expect(of('skillEnd')).toEqual([expect.objectContaining({ skill: skill.id, interrupted: true })]);
    expect(red.skillRun).toBeNull();
    expect(red.state).not.toBe('skill');
  });

  it('a caster stunned while the fireball flies does not stop it from hitting', () => {
    const { duel, of, runUntil } = skillDuel([FIREBALL], FAR);
    runUntil(() => duel.skills.projectiles.length > 0);

    stunVictim(DUEL_CONFIG, duel.fighters[0], REFERENCE_SPEED);
    runUntil(() => of('projectileEnd').length > 0);

    expect(of('hit')).toEqual([expect.objectContaining({ attacker: 0, skill: 'fireball' })]);
    expect(of('projectileEnd')[0]).toMatchObject({ reason: 'hit' });
  });

  it('a fireball interrupted while charging launches nothing and keeps the mana spent', () => {
    const { duel, of, runUntil, run } = skillDuel([FIREBALL], FAR);
    const red = duel.fighters[0];
    const manaBefore = red.mana;
    runUntil(() => red.skillRun?.phase.name === 'charge');

    stunVictim(DUEL_CONFIG, red, REFERENCE_SPEED);
    run(AFTER_STUN_TICKS);

    expect(duel.skills.projectiles).toHaveLength(0);
    expect(of('projectileEnd')).toHaveLength(0);
    expect(of('skillCue').map((cue) => cue.cue)).not.toContain('launch');
    expect(red.mana).toBe(manaBefore - FIREBALL.cost.mana);
  });
});

describe('Several projectiles', () => {
  const crossfire = (seed: number = SEED) => skillDuel([FIREBALL], FAR, { blueSkills: [FIREBALL], seed });

  it('two fireballs in flight at once get distinct ids and each one ends', () => {
    const { duel, of, runUntil } = crossfire();
    runUntil(() => duel.skills.projectiles.length === 2);
    const ids = duel.skills.projectiles.map((projectile) => projectile.id);

    runUntil(() => of('projectileEnd').length === 2);

    expect(new Set(ids).size).toBe(2);
    expect(of('projectileEnd').map((end) => end.id).sort()).toEqual([...ids].sort());
  });

  it('a knockout while two fireballs fly empties the projectile list', () => {
    const { duel, of, runUntil } = crossfire();
    runUntil(() => duel.skills.projectiles.length === 2);
    for (const fighter of duel.fighters) fighter.hp = 1;

    runUntil(() => of('ko').length > 0);

    expect(of('ko').length).toBeGreaterThan(0);
    expect(duel.skills.projectiles).toHaveLength(0);
  });

  it('two duels with the same seed give the same skill snapshot with two fireballs in flight', () => {
    const first = crossfire();
    const second = crossfire();
    const other = crossfire(OTHER_SEED);
    for (const duel of [first, second, other]) duel.runUntil(() => duel.duel.skills.projectiles.length === 2);

    expect(first.duel.tick).toBe(second.duel.tick);
    expect(first.duel.skills.snapshot()).toEqual(second.duel.skills.snapshot());
  });
});

describe('Skills that deal no damage', () => {
  it('a jump aimed beyond its maximum speed falls short and is reported missed', () => {
    const weakJump: SkillSpec = { ...JUMP, timeline: JUMP.timeline.map((phase) => (phase.impulse === undefined ? phase : { ...phase, impulse: { ...phase.impulse, maxSpeedX: 2 } })) };
    const { world, of, runUntil } = skillDuel([weakJump], JUMP.conditions.maxDistance);

    runUntil(() => of('skillEnd').length > 0);

    expect(world.impulses.find((impulse) => impulse.fighter === 0)?.velocityX).toBe(2);
    expect(of('noDamage')).toEqual([expect.objectContaining({ reason: 'missed', skill: 'jump' })]);
  });

  it.each([
    { name: 'leaving the arena', skill: FIREBALL, distance: DUEL_CONFIG.arena.width * 2 },
    { name: 'reaching the end of its life', skill: withProjectile(FIREBALL, { maxFlightMs: 100 }), distance: FAR },
  ])('a fireball $name is reported missed and ends', ({ skill, distance }) => {
    const { of, runUntil } = skillDuel([skill], distance);

    runUntil(() => of('projectileEnd').length > 0);

    expect(of('noDamage')).toEqual([expect.objectContaining({ reason: 'missed', skill: 'fireball' })]);
    expect(of('projectileEnd')).toEqual([expect.objectContaining({ reason: 'missed' })]);
    expect(of('hit')).toHaveLength(0);
  });

  it('a charge that never makes contact is reported missed', () => {
    const { of, runUntil } = skillDuel([CHARGE], CHARGE.conditions.minDistance);

    runUntil(() => of('skillEnd').length > 0);

    expect(of('noDamage')).toEqual([expect.objectContaining({ reason: 'missed', skill: 'charge' })]);
    expect(of('hit')).toHaveLength(0);
  });

  it('a fireball against a parrying defender deals full damage and breaks the guard without stunning or a counter', () => {
    const { duel, world, of, runUntil, run } = skillDuel([FIREBALL], FAR, { config: skillConfig(configWith({ counterChance: ALWAYS })) });
    const blue = duel.fighters[1];
    runUntil(() => duel.skills.projectiles.length > 0);

    blue.machine.transition('parry');
    runUntil(() => of('hit').length > 0);
    const stateAfterHit = blue.state;
    const noDamageAtHit = of('noDamage').length;
    world.positions[1] = world.positions[0] + blue.attack.reach / 2;
    run(AFTER_COUNTER_TICKS);

    const full = skillDamage(DUEL_CONFIG, FIREBALL.hit, FIGHTERS[0].stats, FIREBALL.timeline[2].projectile!.speed);
    expect(of('hit')[0]).toMatchObject({ skill: 'fireball', parried: false, damage: full });
    expect(noDamageAtHit).toBe(0);
    expect(['idle', 'approach']).toContain(stateAfterHit);
    expect(of('counter')).toHaveLength(0);
  });

  it('a fireball that cannot be dodged hits a dodging defender, ends the dodge and does not stun', () => {
    const undodgeable: SkillSpec = { ...FIREBALL, reactions: { ...FIREBALL.reactions, dodgeable: false } };
    const { duel, of, runUntil } = skillDuel([undodgeable], FAR);
    runUntil(() => duel.skills.projectiles.length > 0);

    duel.fighters[1].machine.transition('dodge');
    runUntil(() => of('hit').length > 0);

    expect(of('hit')[0]).toMatchObject({ skill: 'fireball', parried: false });
    expect(['idle', 'approach']).toContain(duel.fighters[1].state);
  });

  it('a fireball that knocks out a parrying defender ends the duel with a knockout', () => {
    const { duel, of, runUntil } = skillDuel([FIREBALL], FAR);
    runUntil(() => duel.skills.projectiles.length > 0);

    duel.fighters[1].hp = 1;
    duel.fighters[1].machine.transition('parry');
    runUntil(() => of('hit').length > 0);

    expect(duel.fighters[1].state).toBe('ko');
    expect(duel.winner).toBe(0);
  });

  it('a parried jump is reported blocked', () => {
    const { world, of, runUntil } = skillDuel([JUMP], JUMP.conditions.minDistance + 50, { config: skillConfig(configWith({ parryChance: ALWAYS })) });
    world.contacts = [punchContact(0, JUMP.hit.strikingParts[0], REFERENCE_SPEED)];

    runUntil(() => of('skillEnd').length > 0);

    expect(of('parry')).toHaveLength(1);
    expect(of('noDamage')).toEqual([expect.objectContaining({ reason: 'blocked', skill: 'jump' })]);
  });
});

describe('Skill data checks', () => {
  const projectilePhase = FIREBALL.timeline.find((phase) => phase.projectile !== undefined)!;

  it('rejects a second projectile, endOnHit without a strike window, an out-of-range hp share and empty hit parts', () => {
    expect(() => assertSkillSpec({ ...FIREBALL, timeline: [...FIREBALL.timeline, projectilePhase] })).toThrow('un seul projectile');
    expect(() => assertSkillSpec({ ...CHARGE, timeline: CHARGE.timeline.map((phase) => ({ ...phase, strikeWindow: undefined })) })).toThrow('endOnHit sans strikeWindow');
    expect(() => assertSkillSpec({ ...JUMP, conditions: { ...JUMP.conditions, maxOwnHpShare: 0 } })).toThrow('maxOwnHpShare');
    expect(() => assertSkillSpec({ ...JUMP, conditions: { ...JUMP.conditions, maxOwnHpShare: 1.5 } })).toThrow('maxOwnHpShare');
    expect(() => assertSkillSpec(withProjectile(FIREBALL, { hitParts: [] }))).toThrow('hitParts');
  });
});

describe('Skill choice rules', () => {
  const light: SkillSpec = { ...JUMP, id: 'light', weight: 1 };
  const heavy: SkillSpec = { ...JUMP, id: 'heavy', weight: 3 };
  const inRange = { ...READY, distance: JUMP.conditions.minDistance };

  it('the weighted draw picks each skill on its share of the total weight', () => {
    expect(chooseSkill([light, heavy], inRange, 0, SKILLS_CONFIG, scriptedRng([0, 0.2]))).toBe(light);
    expect(chooseSkill([light, heavy], inRange, 0, SKILLS_CONFIG, scriptedRng([0, 0.3]))).toBe(heavy);
    const rng = createRng(SEED);
    let heavyPicks = 0;
    for (let draw = 0; draw < 400; draw += 1) if (chooseSkill([light, heavy], inRange, 0, SKILLS_CONFIG, rng) === heavy) heavyPicks += 1;
    expect(heavyPicks / 400).toBeGreaterThan(0.65);
    expect(heavyPicks / 400).toBeLessThan(0.85);
  });

  it('canLaunch accepts the distance and hp bounds themselves and refuses just past them', () => {
    const lastResort: SkillSpec = { ...JUMP, conditions: { ...JUMP.conditions, maxOwnHpShare: 0.5 } };
    const { minDistance, maxDistance } = JUMP.conditions;

    expect(canLaunch(JUMP, { ...READY, distance: minDistance })).toBe(true);
    expect(canLaunch(JUMP, { ...READY, distance: maxDistance })).toBe(true);
    expect(canLaunch(JUMP, { ...READY, distance: maxDistance + 1 })).toBe(false);
    expect(canLaunch(lastResort, { ...inRange, hp: 50 })).toBe(true);
    expect(canLaunch(lastResort, { ...inRange, hp: 51 })).toBe(false);
  });

  it('a physical skill deals damage like a plain hit', () => {
    const stats = FIGHTERS[0].stats;

    expect(skillDamage(DUEL_CONFIG, JUMP.hit, stats, REFERENCE_SPEED)).toBe(hitDamage(DUEL_CONFIG, JUMP.hit.damage, REFERENCE_SPEED, stats));
  });

  it('the skill use chance stays between zero and its maximum', () => {
    expect(skillUseChance({ ...DUEL_CONFIG.skills, useChance: { base: -1, perIntelligence: 0, max: 0.8 } }, 10)).toBe(0);
    expect(skillUseChance({ ...DUEL_CONFIG.skills, useChance: { base: 0.5, perIntelligence: 1, max: 0.8 } }, 10)).toBe(0.8);
  });

  it('threatens is true for a plain attack or a fireball on its way, and false once it has passed', () => {
    const melee = skillDuel([], FIGHTERS[0].attack.reach / 2);
    melee.runUntil(() => melee.duel.fighters[0].state === 'attack');
    const ranged = skillDuel([FIREBALL], FAR);
    const caster = ranged.duel.fighters[0];
    const idle = ranged.duel.skills.threatens(caster);

    ranged.runUntil(() => ranged.duel.skills.projectiles.length > 0);
    const inFlight = ranged.duel.skills.threatens(caster);
    ranged.duel.skills.projectiles[0].passed = true;

    expect(melee.duel.skills.threatens(melee.duel.fighters[0])).toBe(true);
    expect(idle).toBe(false);
    expect(inFlight).toBe(true);
    expect(ranged.duel.skills.threatens(caster)).toBe(false);
  });
});

describe('Jump aim guards', () => {
  it.each([
    { name: 'a drag of 1', ticks: 50, drag: 1 },
    { name: 'zero flight ticks', ticks: 0, drag: 0.02 },
    { name: 'a drag that is not a number', ticks: 50, drag: Number.NaN },
  ])('aiming with $name gives a still, clamped launch and never NaN', ({ ticks, drag }) => {
    const result = aimLaunch({ dx: 180, dy: 0, ticks, gravity: 0.28, drag, maxSpeedX: 9, maxSpeedY: 11 });

    expect(result).toEqual({ vx: 0, vy: 0, clamped: true });
  });
});
