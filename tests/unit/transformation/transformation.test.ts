import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { SKILLS } from '../../../src/content/skills';
import { msToTicks } from '../../../src/core/duel-config';
import type { DuelEvents } from '../../../src/core/events';
import { rollReaction } from '../../../src/core/reactions';
import type { Rng } from '../../../src/core/rng';
import { assertSkillSpec, type SkillSpec } from '../../../src/core/skill-spec';
import type { TriggerStage } from '../../../src/core/skill-trigger-spec';
import { stunVictim } from '../../../src/core/stun';
import { configWith, IN_REACH, setUp } from '../duel/reaction-fixtures';
import { FAR, skillDuel } from '../duel/skill-fixtures';

const TRANSFORMATION = SKILLS.get('transformation');
const [GROWL, TRANSFORM] = TRANSFORMATION.trigger!.stages;
const TICKS = (ms: number) => msToTicks(ms, DUEL_CONFIG.stepHz);

/** Rouge porte la Transformation ; Bleu est passif (ou en porte une aussi). Tous deux hors de portée : seuls les PV bougent. */
function wolfDuel(blueSkills?: readonly SkillSpec[]) {
  const made = skillDuel([TRANSFORMATION], FAR, { blueSkills });
  const triggers: DuelEvents['skillTrigger'][] = [];
  made.duel.events.on('skillTrigger', (payload) => triggers.push(payload));
  const [red, blue] = made.duel.fighters;
  const hpShare = (fighter: typeof red, share: number) => {
    fighter.hp = Math.round(fighter.spec.stats.hp * share);
  };
  return { ...made, triggers, red, blue, hpShare };
}

function withStage(patch: Partial<TriggerStage>): SkillSpec {
  return { ...TRANSFORMATION, trigger: { stages: [{ ...GROWL, ...patch }, TRANSFORM] } };
}

describe('Transformation data', () => {
  it('is a registered skill of category transformation that costs more points than the others', () => {
    expect(TRANSFORMATION.category).toBe('transformation');
    for (const id of ['jump', 'charge', 'fireball']) expect(TRANSFORMATION.points).toBeGreaterThan(SKILLS.get(id).points);
    expect(() => assertSkillSpec(TRANSFORMATION)).not.toThrow();
  });

  it('is never drawn like a normal skill', () => {
    const { duel, run, red } = wolfDuel();
    run(600);
    expect(red.skillRun).toBeNull();
    expect(duel.fighters[0].cooldowns.transformation).toBeUndefined();
  });

  it.each([
    { name: 'a threshold of 1', patch: { hpShare: 1 } },
    { name: 'a threshold of 0', patch: { hpShare: 0 } },
    { name: 'an empty timeline', patch: { timeline: [] } },
    { name: 'a zero stun', patch: { strike: { damage: 5, stunMs: 0 } } },
    { name: 'a zero arena intensity', patch: { arena: { intensity: 0, durationMs: 100 } } },
    { name: 'a negative bonus', patch: { statBonus: { speed: -1, agility: 0 } } },
    { name: 'a striking phase', patch: { timeline: [{ name: 'x', durationMs: 100, pose: {}, strikeWindow: true }] } },
  ])('rejects a stage with $name', ({ patch }) => {
    expect(() => assertSkillSpec(withStage(patch))).toThrow(/Compétence transformation/);
  });

  it('rejects stages that are not ordered from the highest threshold to the lowest', () => {
    const broken = { ...TRANSFORMATION, trigger: { stages: [TRANSFORM, GROWL] } };
    expect(() => assertSkillSpec(broken)).toThrow(/seuil/);
  });

  it('rejects two stages with the same id', () => {
    const broken = { ...TRANSFORMATION, trigger: { stages: [GROWL, { ...TRANSFORM, id: 'growl' }] } };
    expect(() => assertSkillSpec(broken)).toThrow(/double/);
  });
});

describe('Growl at half health', () => {
  it('fires once HP reach the threshold, with the arena effect', () => {
    const { run, red, hpShare, triggers } = wolfDuel();
    hpShare(red, 0.5);
    run(1);
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toMatchObject({ fighter: 0, stage: 'growl', arena: GROWL.arena });
  });

  it('does not fire above the threshold', () => {
    const { run, red, hpShare, triggers } = wolfDuel();
    hpShare(red, 0.51);
    run(30);
    expect(triggers).toHaveLength(0);
  });

  it('hurts the opponent and stuns past the hit caps', () => {
    const { run, red, blue, hpShare } = wolfDuel();
    const before = blue.hp;
    hpShare(red, 0.5);
    run(1);
    expect(blue.hp).toBe(before - GROWL.strike!.damage);
    expect(blue.state).toBe('stunned');
    expect(blue.stunTicks).toBe(TICKS(GROWL.strike!.stunMs));
    expect(blue.stunTicks).toBeGreaterThan(TICKS(DUEL_CONFIG.stats.maxStunMs));
    expect(blue.stunTicks).toBeGreaterThan(TICKS(DUEL_CONFIG.stats.maxStunSeriesMs));
  });

  it('keeps the long stun when an ordinary hit lands during it', () => {
    const { run, red, blue, hpShare } = wolfDuel();
    hpShare(red, 0.5);
    run(11);
    const remaining = blue.stunTicks - blue.machine.ticksInState;
    stunVictim(DUEL_CONFIG, blue, DUEL_CONFIG.damage.referenceSpeed);
    expect(blue.stunTicks).toBeGreaterThanOrEqual(remaining);
  });

  it.each(['dodge', 'parry'] as const)('cannot be dodged or parried: a %s is broken and the stun still lands', (reaction) => {
    const { run, red, blue, hpShare } = wolfDuel();
    blue.machine.transition(reaction);
    const before = blue.hp;
    hpShare(red, 0.5);
    run(1);
    expect(blue.hp).toBe(before - GROWL.strike!.damage);
    expect(blue.state).toBe('stunned');
  });

  it('leaves the growler still for its hold time, then lets it act again', () => {
    const { run, red, world, hpShare } = wolfDuel();
    hpShare(red, 0.5);
    run(1);
    const hold = TICKS(GROWL.timeline[0].durationMs);
    run(hold - 10);
    expect(red.state).toBe('skill');
    expect(world.intents[0]?.walkVelocity).toBe(0);
    run(20);
    expect(red.state).not.toBe('skill');
  });

  it('does not play twice in one duel', () => {
    const { run, red, hpShare, triggers } = wolfDuel();
    hpShare(red, 0.5);
    run(400);
    hpShare(red, 0.5);
    run(100);
    expect(triggers.filter((trigger) => trigger.stage === 'growl')).toHaveLength(1);
  });

  it('is not triggered by a fatal blow: no stage, no form', () => {
    const { run, red, hpShare, triggers } = wolfDuel();
    hpShare(red, 0);
    run(5);
    expect(triggers).toHaveLength(0);
    expect(red.firedStages).toHaveLength(0);
    expect(red.formApplies).toHaveLength(0);
    expect(red.effectiveStats.speed).toBe(red.spec.stats.speed);
  });

  it('waits for the end of a stun, then fires', () => {
    const { run, red, hpShare, triggers } = wolfDuel();
    red.machine.transition('stunned');
    red.stunTicks = 30;
    hpShare(red, 0.5);
    run(20);
    expect(triggers).toHaveLength(0);
    run(40);
    expect(triggers).toHaveLength(1);
  });

  it('fires on the very tick the stun ends, before any attack', () => {
    const made = skillDuel([TRANSFORMATION], IN_REACH[1]);
    const [red] = made.duel.fighters;
    const order: string[] = [];
    made.duel.events.on('skillTrigger', () => order.push('trigger'));
    made.duel.events.on('attackStart', () => order.push('attack'));
    red.machine.transition('stunned');
    red.stunTicks = 10;
    red.hp = Math.round(red.spec.stats.hp * 0.5);
    red.actionTicksLeft = 0;
    made.run(40);
    expect(order[0]).toBe('trigger');
  });

  it('ends the duel without letting the winner act on the tick its growl knocks the opponent out', () => {
    const made = skillDuel([TRANSFORMATION], IN_REACH[1]);
    const [red, blue] = made.duel.fighters;
    const acts: string[] = [];
    made.duel.events.on('attackStart', () => acts.push('attack'));
    made.duel.events.on('skillStart', ({ skill }) => acts.push(skill));
    red.hp = Math.round(red.spec.stats.hp * GROWL.hpShare);
    blue.hp = 1;
    red.actionTicksLeft = 0;
    made.run(1);
    expect(made.duel.phase).toBe('ending');
    expect(made.duel.winner).toBe(0);
    expect(red.state).toBe('idle');
    expect(acts).toEqual(['transformation']);
  });
});

describe('Transformation at thirty percent', () => {
  it('fires with a speed and agility bonus that the duel reads', () => {
    const { run, red, hpShare, triggers } = wolfDuel();
    hpShare(red, 0.3);
    run(1);
    expect(triggers.map((trigger) => trigger.stage)).toEqual(['growl', 'transformation'].slice(1));
    expect(red.effectiveStats.speed).toBe(red.spec.stats.speed + TRANSFORM.statBonus!.speed);
    expect(red.effectiveStats.agility).toBe(red.spec.stats.agility + TRANSFORM.statBonus!.agility);
    expect(red.spec.stats.speed).toBe(10);
  });

  it('skips the growl when one blow goes from above half to below thirty percent', () => {
    const { run, red, blue, hpShare, triggers } = wolfDuel();
    const before = blue.hp;
    hpShare(red, 0.25);
    run(1);
    expect(triggers.map((trigger) => trigger.stage)).toEqual(['transformation']);
    expect(blue.hp).toBe(before);
    expect(blue.state).not.toBe('stunned');
  });

  it('plays the growl then the transformation, once each', () => {
    const { run, red, hpShare, triggers } = wolfDuel();
    hpShare(red, 0.5);
    run(1);
    run(TICKS(GROWL.timeline[0].durationMs) + 20);
    hpShare(red, 0.3);
    run(TICKS(TRANSFORM.timeline[0].durationMs) + 40);
    hpShare(red, 0.2);
    run(100);
    expect(triggers.map((trigger) => trigger.stage)).toEqual(['growl', 'transformation']);
  });

  it('stays a wolf after healing above the threshold', () => {
    const { run, red, hpShare, triggers } = wolfDuel();
    hpShare(red, 0.3);
    run(1);
    hpShare(red, 1);
    run(200);
    expect(red.effectiveStats.speed).toBe(red.spec.stats.speed + TRANSFORM.statBonus!.speed);
    expect(red.formApplies).toHaveLength(1);
    expect(triggers).toHaveLength(1);
  });

  it('shortens the action delay and lifts reaction chances through the effective stats', () => {
    const delayOf = (bonus: number) => {
      const { duel, log, run } = setUp({ config: configWith({}), contactsFrom: [], passive: [1] });
      duel.fighters[0].grantForm(DUEL_CONFIG, 'x', { speed: bonus, agility: 0 }, []);
      run(400);
      expect(log.some((event) => event.type === 'attackStart')).toBe(true);
      return duel.fighters[0].actionTicksLeft;
    };
    const slow = delayOf(0);
    const fast = delayOf(10);
    expect(fast).toBeLessThan(slow);

    const chance = { base: 0, perAgility: 0.05, max: 1 };
    const rng = { next: () => 0.5 } as Rng;
    const config = { ...DUEL_CONFIG.reactions, dodgeChance: chance };
    const defender = (agility: number) => ({ state: 'idle' as const, stamina: 100, canParry: false, spec: { stats: { agility: 10 } }, effectiveStats: { agility } });
    expect(rollReaction(config, defender(10), rng)).toBe('none');
    expect(rollReaction(config, defender(20), rng)).toBe('dodge');
  });
});

describe('Claws', () => {
  function clawDuel() {
    const made = setUp({ config: configWith({}), contactsFrom: [0], passive: [1], positions: IN_REACH });
    const applied: DuelEvents['statusApplied'][] = [];
    made.duel.events.on('statusApplied', (payload) => applied.push(payload));
    made.duel.fighters[0].grantForm(DUEL_CONFIG, 'transformation', { speed: 0, agility: 0 }, TRANSFORM.hitApplies!);
    return { ...made, applied };
  }

  it('makes a plain blow that lands apply bleed and tells the renderer', () => {
    const { duel, runUntil, applied, of } = clawDuel();
    runUntil(() => applied.length > 0 || duel.phase !== 'running');
    expect(applied[0]).toMatchObject({ source: 0, victim: 1, status: 'bleed', chargesAdded: 1 });
    expect(of('hit')[0]).toMatchObject({ attacker: 0, parried: false });
    expect((of('hit')[0] as { form?: string }).form).toBe('transformation');
  });

  it('applies nothing to a parried blow', () => {
    const { duel, runUntil, applied } = clawDuel();
    runUntil(() => duel.fighters[0].state === 'attack');
    duel.fighters[1].machine.transition('parry');
    runUntil(() => duel.fighters[0].hasHit);
    expect(duel.fighters[0].hasHit).toBe(true);
    expect(applied).toHaveLength(0);
  });
});

describe('Several triggers and determinism', () => {
  it('lets one fighter trigger per tick, red first, and the other waits out its stun', () => {
    const { run, red, blue, hpShare, triggers } = wolfDuel([TRANSFORMATION]);
    hpShare(red, 0.5);
    hpShare(blue, 0.5);
    run(1);
    expect(triggers.map((trigger) => trigger.fighter)).toEqual([0]);
    run(TICKS(GROWL.strike!.stunMs) + 20);
    expect(triggers.map((trigger) => trigger.fighter)).toEqual([0, 1]);
  });

  it('adds the triggered state to the snapshot only once a stage was played', () => {
    const { run, duel, red, hpShare } = wolfDuel();
    run(5);
    const before = duel.skills.snapshot().length;
    hpShare(red, 0.3);
    run(1);
    expect(duel.skills.snapshot().length).toBeGreaterThan(before);
  });

  it('tells apart which stage was played, not only how many', () => {
    const neutral = (id: string, hpShare: number): SkillSpec => ({ ...TRANSFORMATION, id, trigger: { stages: [{ id: 'only', hpShare, timeline: GROWL.timeline }] } });
    const snapshotWith = (skills: readonly SkillSpec[]) => {
      const made = skillDuel(skills, FAR);
      const [red] = made.duel.fighters;
      red.hp = Math.round(red.spec.stats.hp * 0.45);
      made.run(1);
      expect(red.firedStages).toHaveLength(1);
      return made.duel.skills.snapshot();
    };
    const first = snapshotWith([neutral('a', 0.5), neutral('b', 0.4)]);
    const second = snapshotWith([neutral('a', 0.4), neutral('b', 0.5)]);
    expect(first).not.toEqual(second);
  });

  it('replays identically from the same seed', () => {
    const play = () => {
      const { run, duel, red, hpShare, triggers } = wolfDuel([TRANSFORMATION]);
      hpShare(red, 0.5);
      run(300);
      hpShare(red, 0.3);
      run(300);
      return JSON.stringify([duel.tick, duel.fighters.map((fighter) => [fighter.hp, fighter.state, fighter.actionTicksLeft]), duel.skills.snapshot(), triggers]);
    };
    expect(play()).toBe(play());
  });
});
