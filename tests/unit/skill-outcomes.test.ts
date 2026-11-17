import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { skillDamage, type SkillSpec } from '../../src/core/skill-spec';
import { punchContact } from './duel/fake-duel-world';
import { FIGHTERS } from './duel/plain-fighters';
import { ALWAYS, configWith, REFERENCE_SPEED } from './duel/reaction-fixtures';
import { JUMP, skillConfig, skillDuel } from './duel/skill-fixtures';

/** Assez près pour le saut, trop loin pour un coup simple. */
const JUMP_DISTANCE = JUMP.conditions.minDistance + 50;
/** Ticks joués après le coup pour vérifier qu'aucune contre-attaque ne suit (Bleu est alors à portée de contre). */
const AFTER_HIT_TICKS = 60;
const JUMP_FULL_DAMAGE = skillDamage(DUEL_CONFIG, JUMP.hit, FIGHTERS[0].stats, REFERENCE_SPEED);
const JUMP_STRIKE = punchContact(0, JUMP.hit.strikingParts[0], REFERENCE_SPEED);

describe('Knockout during a skill', () => {
  it('a caster knocked out mid-skill ends its skill interrupted and keeps no skill run', () => {
    const { duel, of, runUntil, run } = skillDuel([JUMP], JUMP_DISTANCE);
    const red = duel.fighters[0];
    runUntil(() => red.skillRun?.phase.name === 'leap');

    red.hp = 0;
    run(1);

    expect(of('ko')).toEqual([expect.objectContaining({ fighter: 0 })]);
    expect(of('skillEnd')).toEqual([expect.objectContaining({ fighter: 0, skill: 'jump', interrupted: true })]);
    expect(red.skillRun).toBeNull();
  });

  it('a caster whose opponent is knocked out mid-skill ends its skill interrupted and goes idle', () => {
    const { duel, of, runUntil, run } = skillDuel([JUMP], JUMP_DISTANCE);
    const red = duel.fighters[0];
    runUntil(() => red.skillRun?.phase.name === 'leap');

    duel.fighters[1].hp = 0;
    run(1);

    expect(of('ko')).toEqual([expect.objectContaining({ fighter: 1 })]);
    expect(of('skillEnd')).toEqual([expect.objectContaining({ fighter: 0, skill: 'jump', interrupted: true })]);
    expect(red.skillRun).toBeNull();
    expect(red.state).toBe('idle');
  });
});

describe('Melee skills against reactions', () => {
  it('an unparryable jump against a parrying defender deals full damage, breaks the guard, does not stun and draws no counter', () => {
    const unparryable: SkillSpec = { ...JUMP, reactions: { ...JUMP.reactions, parryable: false } };
    const { duel, world, of, runUntil, run } = skillDuel([unparryable], JUMP_DISTANCE, { config: skillConfig(configWith({ counterChance: ALWAYS })) });
    const [red, blue] = duel.fighters;
    runUntil(() => red.skillRun?.strikeWindow === true);

    blue.machine.transition('parry');
    world.positions[1] = world.positions[0] + blue.attack.reach / 2;
    world.contacts = [JUMP_STRIKE];
    runUntil(() => of('hit').length > 0);
    const stateAfterHit = blue.state;
    const noDamageAtHit = of('noDamage').length;
    run(AFTER_HIT_TICKS);

    expect(of('hit')[0]).toMatchObject({ skill: 'jump', parried: false, damage: JUMP_FULL_DAMAGE });
    expect(noDamageAtHit).toBe(0);
    expect(['idle', 'approach']).toContain(stateAfterHit);
    expect(of('counter')).toHaveLength(0);
  });

  it('an undodgeable jump against a dodging defender deals full damage, ends the dodge and does not stun', () => {
    const undodgeable: SkillSpec = { ...JUMP, reactions: { ...JUMP.reactions, dodgeable: false } };
    const { duel, world, of, runUntil } = skillDuel([undodgeable], JUMP_DISTANCE);
    const [red, blue] = duel.fighters;
    runUntil(() => red.skillRun?.strikeWindow === true);

    blue.machine.transition('dodge');
    world.contacts = [JUMP_STRIKE];
    runUntil(() => of('hit').length > 0);

    expect(of('hit')[0]).toMatchObject({ skill: 'jump', parried: false, damage: JUMP_FULL_DAMAGE });
    expect(of('noDamage')).toHaveLength(0);
    expect(['idle', 'approach']).toContain(blue.state);
  });

  it('a dodged jump deals no damage and is reported dodged', () => {
    const { world, of, runUntil } = skillDuel([JUMP], JUMP_DISTANCE, { config: skillConfig(configWith({ dodgeChance: ALWAYS })) });
    world.contacts = [JUMP_STRIKE];

    runUntil(() => of('skillEnd').length > 0);

    expect(of('dodge')).toHaveLength(1);
    expect(of('hit')).toHaveLength(0);
    expect(of('noDamage')).toEqual([expect.objectContaining({ reason: 'dodged', skill: 'jump' })]);
  });

  it('a caster hit by a plain attack mid-jump ends its skill interrupted', () => {
    const { duel, world, of, runUntil } = skillDuel([JUMP], JUMP_DISTANCE, { blueSkills: [] });
    const [red, blue] = duel.fighters;
    runUntil(() => red.skillRun?.phase.name === 'leap');

    world.positions[1] = world.positions[0] + blue.attack.reach / 2;
    world.contacts = [punchContact(1, FIGHTERS[1].attack.strikingParts[0], REFERENCE_SPEED)];
    blue.actionTicksLeft = 1;
    runUntil(() => of('skillEnd').length > 0);

    expect(of('hit')[0]).toMatchObject({ attacker: 1, victim: 0 });
    expect(of('hit')[0].skill).toBeUndefined();
    expect(of('skillEnd')).toEqual([expect.objectContaining({ fighter: 0, skill: 'jump', interrupted: true })]);
    expect(red.skillRun).toBeNull();
    expect(red.state).toBe('stunned');
  });
});
