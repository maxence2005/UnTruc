import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { SKILLS } from '../../src/content/skills';
import { aimLaunch } from '../../src/core/ballistics';
import { Duel } from '../../src/core/duel';
import type { DuelConfig } from '../../src/core/duel-config';
import type { DuelEvents } from '../../src/core/events';
import { createRng } from '../../src/core/rng';
import { canLaunch, chooseSkill } from '../../src/core/skill-choice';
import { assertSkillSpec, SKILL_CATEGORIES, type SkillSpec } from '../../src/core/skill-spec';
import { FakeDuelWorld, punchContact } from './duel/fake-duel-world';
import { FIGHTERS } from './duel/plain-fighters';
import { ALWAYS, configWith, REFERENCE_SPEED, SEED } from './duel/reaction-fixtures';
import { ALWAYS_SKILL, CHARGE, countingRng, FAR, FIREBALL, JUMP, READY, SKILL_MAX_TICKS as MAX_TICKS, skillConfig, skillDuel, withProjectile } from './duel/skill-fixtures';

describe('Skill data', () => {
  it('loads the three skills and validates every entry', () => {
    expect(SKILLS.all().map((skill) => skill.id)).toEqual(['jump', 'fireball', 'charge']);
    for (const skill of SKILLS.all()) expect(() => assertSkillSpec(skill)).not.toThrow();
  });

  it('gives every skill a known category and a whole number of points of at least one', () => {
    for (const skill of SKILLS.all()) {
      expect(SKILL_CATEGORIES).toContain(skill.category);
      expect(Number.isInteger(skill.points) && skill.points >= 1).toBe(true);
    }
    expect(FIREBALL.category).toBe('magic');
    expect(JUMP.category).toBe('attack');
  });

  it('rejects an unknown category and invalid points', () => {
    expect(() => assertSkillSpec({ ...JUMP, category: 'dance' as SkillSpec['category'] })).toThrow('catégorie');
    expect(() => assertSkillSpec({ ...JUMP, points: 0 })).toThrow('points');
    expect(() => assertSkillSpec({ ...JUMP, points: 1.5 })).toThrow('points');
  });

  it('rejects a skill that can never touch, an empty timeline, a grounded impulse and a reversed range', () => {
    expect(() => assertSkillSpec({ ...JUMP, timeline: [] })).toThrow('timeline');
    expect(() => assertSkillSpec({ ...JUMP, timeline: [{ name: 'idle', durationMs: 100, pose: {} }] })).toThrow('ne touche jamais');
    const grounded = JUMP.timeline.map((phase) => (phase.impulse === undefined ? phase : { ...phase, airborne: false }));
    expect(() => assertSkillSpec({ ...JUMP, timeline: grounded })).toThrow('airborne');
    expect(() => assertSkillSpec({ ...JUMP, conditions: { ...JUMP.conditions, maxDistance: JUMP.conditions.minDistance } })).toThrow('maxDistance');
  });

  it('makes the fireball cost mana, scale with magic power, and never be parried', () => {
    expect(FIREBALL.cost.mana).toBeGreaterThan(0);
    expect(FIREBALL.hit.scaling).toBe('magic');
    expect(FIREBALL.reactions).toEqual({ dodgeable: true, parryable: false });
  });
});

describe('Skill choice', () => {
  it('never picks the fireball at melee range, whatever the draw', () => {
    const rng = countingRng();
    const close = { ...READY, distance: FIREBALL.conditions.minDistance - 1 };

    expect(chooseSkill([FIREBALL], close, 0, { ...DUEL_CONFIG.skills, useChance: ALWAYS_SKILL }, rng)).toBeNull();
    expect(rng.draws).toBe(0);
  });

  it('picks the fireball beyond its minimum distance when the chance passes', () => {
    const far = { ...READY, distance: FIREBALL.conditions.minDistance };

    expect(chooseSkill([FIREBALL], far, 0, { ...DUEL_CONFIG.skills, useChance: ALWAYS_SKILL }, createRng(SEED))).toBe(FIREBALL);
  });

  it('leaves out a skill without the mana or still on cooldown', () => {
    const far = { ...READY, distance: FAR };

    expect(canLaunch(FIREBALL, { ...far, mana: FIREBALL.cost.mana - 1 })).toBe(false);
    expect(canLaunch(FIREBALL, { ...far, cooldowns: { fireball: 1 } })).toBe(false);
    expect(canLaunch(FIREBALL, far)).toBe(true);
    expect(canLaunch(JUMP, { ...READY, distance: JUMP.conditions.minDistance, stamina: JUMP.cost.stamina - 1 })).toBe(false);
  });
});

describe('Jump aim', () => {
  it('lands on the target after the flight time, air drag and gravity included', () => {
    const input = { dx: 180, dy: 0, ticks: 50, gravity: 0.28, drag: 0.02, maxSpeedX: 20, maxSpeedY: 20 };
    const { vx, vy, clamped } = aimLaunch(input);
    let [x, y, speedX, speedY] = [0, 0, vx, vy];
    for (let tick = 0; tick < input.ticks; tick += 1) {
      speedX = speedX * (1 - input.drag);
      speedY = speedY * (1 - input.drag) + input.gravity;
      x += speedX;
      y += speedY;
    }

    expect(clamped).toBe(false);
    expect(vy).toBeLessThan(0);
    expect(x).toBeCloseTo(input.dx, 6);
    expect(y).toBeCloseTo(0, 6);
  });

  it('falls short, and says so, when the target is out of reach', () => {
    const result = aimLaunch({ dx: 2000, dy: 0, ticks: 50, gravity: 0.28, drag: 0.02, maxSpeedX: 9, maxSpeedY: 20 });

    expect(result.clamped).toBe(true);
    expect(result.vx).toBe(9);
  });
});

describe('Skills in a duel', () => {
  it('casts the fireball from afar and hits through the common hit path', () => {
    const { of, runUntil } = skillDuel([FIREBALL], FAR);

    runUntil(() => of('hit').length > 0);

    expect(of('skillStart')[0]).toMatchObject({ fighter: 0, skill: 'fireball' });
    expect(of('skillCue').map((cue) => cue.cue)).toEqual(['charge', 'launch']);
    const expected = Math.round((FIREBALL.hit.damage * FIGHTERS[0].stats.magicPower) / DUEL_CONFIG.skills.referenceMagicPower);
    expect(of('hit')[0]).toMatchObject({ attacker: 0, victim: 1, skill: 'fireball', damage: expected, parried: false });
    expect(of('projectileEnd')[0]).toMatchObject({ reason: 'hit' });
  });

  it('shows "dodged" when the target dodges the fireball, which then deals no damage', () => {
    const { duel, of, runUntil } = skillDuel([FIREBALL], FAR, { config: skillConfig(configWith({ dodgeChance: ALWAYS })) });

    runUntil(() => of('projectileEnd').length > 0);

    expect(of('dodge')).toHaveLength(1);
    expect(of('noDamage')[0]).toMatchObject({ attacker: 0, victim: 1, reason: 'dodged', skill: 'fireball' });
    expect(of('hit')).toHaveLength(0);
    expect(duel.fighters[1].hp).toBe(FIGHTERS[1].stats.hp);
  });

  it('aims the jump at the target with a real impulse, and reports a miss when it lands on nothing', () => {
    const { world, of, runUntil } = skillDuel([JUMP], JUMP.conditions.minDistance + 50);

    runUntil(() => of('skillEnd').length > 0);

    expect(of('skillStart')[0].target.x).toBe(JUMP.conditions.minDistance + 50);
    const leap = world.impulses.find((impulse) => impulse.fighter === 0)!;
    expect(leap.velocityX).toBeGreaterThan(0);
    expect(leap.velocityY).toBeLessThan(0);
    expect(of('noDamage')).toEqual([expect.objectContaining({ reason: 'missed', skill: 'jump' })]);
    expect(of('skillEnd')[0]).toMatchObject({ skill: 'jump', interrupted: false });
  });

  it('stops the charge as soon as it connects', () => {
    const { world, of, runUntil } = skillDuel([CHARGE], CHARGE.conditions.minDistance);
    world.contacts = [punchContact(0, 'torso', DUEL_CONFIG.damage.referenceSpeed)];

    runUntil(() => of('skillEnd').length > 0);

    expect(of('hit')).toHaveLength(1);
    expect(of('hit')[0]).toMatchObject({ skill: 'charge' });
    expect(of('noDamage')).toHaveLength(0);
  });

  it('shows "blocked" when a plain punch is parried', () => {
    const duel = new Duel(configWith({ parryChance: ALWAYS }), FIGHTERS, createRng(SEED));
    duel.fighters[1].actionTicksLeft = Number.MAX_SAFE_INTEGER;
    const world = new FakeDuelWorld([0, FIGHTERS[0].attack.reach / 2]);
    world.contacts = [punchContact(0, FIGHTERS[0].attack.strikingParts[0], DUEL_CONFIG.damage.referenceSpeed)];
    const reasons: string[] = [];
    duel.events.on('noDamage', ({ reason }) => reasons.push(reason));

    while (reasons.length === 0 && duel.tick < MAX_TICKS) duel.update(world);

    expect(reasons).toEqual(['blocked']);
  });

  it('plays exactly the same duel when no skill can ever launch as with no skills at all', () => {
    const unreachable = { ...JUMP, conditions: { ...JUMP.conditions, minDistance: 1e6, maxDistance: 2e6 } };
    const play = (skills: readonly SkillSpec[]) => {
      const duel = new Duel(skillConfig(), [{ ...FIGHTERS[0], skills }, { ...FIGHTERS[1], skills }], createRng(SEED));
      const world = new FakeDuelWorld([0, FIGHTERS[0].attack.reach / 2]);
      world.contacts = [punchContact(0, 'foreArmFront', 8), punchContact(1, 'foreArmFront', 8)];
      const hits: DuelEvents['hit'][] = [];
      duel.events.on('hit', (hit) => hits.push(hit));
      while (duel.phase === 'running' && duel.tick < MAX_TICKS) duel.update(world);
      return { tick: duel.tick, winner: duel.winner, hits };
    };

    expect(play([unreachable])).toEqual(play([]));
  });
});

/** Boule de feu lente : elle est encore en vol quand le lanceur, rapproché, donne un coup simple. */
const SLOW_FIREBALL = withProjectile(FIREBALL, { speed: 1, maxFlightMs: 60000 });

/** Rouge lance la boule, se retrouve à portée de Bleu, et la boule touche pendant l'élan de son coup simple. */
function fireballLandsDuringPunch(config: DuelConfig, punchConnects: boolean) {
  const setup = skillDuel([SLOW_FIREBALL], FAR, { config });
  const { duel, world, runUntil, run } = setup;
  const red = duel.fighters[0];
  runUntil(() => duel.skills.projectiles.length > 0);
  world.positions[0] = FAR - red.attack.reach / 2;
  runUntil(() => red.state === 'attack');
  const ball = duel.skills.projectiles[0];
  ball.x = world.fighterX(1) - ball.vx;
  ball.y = 0;
  if (punchConnects) world.contacts = [punchContact(0, red.attack.strikingParts[0], REFERENCE_SPEED)];
  run(red.windupTicks + red.strikeTicks + 2);
  return setup;
}

describe('Projectile hit during the caster\'s next move (E1)', () => {
  it('a fireball landing during the caster\'s punch windup leaves that punch free to connect', () => {
    const { of } = fireballLandsDuringPunch(skillConfig(configWith({})), true);

    const redHits = of('hit').filter((hit) => hit.attacker === 0);
    expect(redHits.map((hit) => hit.skill ?? 'punch')).toEqual(['fireball', 'punch']);
  });

  it('a punch that whiffs after its caster\'s fireball lands is reported missed and never chains', () => {
    const { of } = fireballLandsDuringPunch(skillConfig(configWith({ comboChance: ALWAYS })), false);

    expect(of('noDamage')).toContainEqual(expect.objectContaining({ attacker: 0, reason: 'missed', skill: null }));
    expect(of('combo')).toHaveLength(0);
  });
});
