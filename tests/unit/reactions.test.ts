import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { FIGHTERS } from '../../src/content/fighters';
import { reactionChance } from '../../src/core/reactions';
import { SEED, OTHER_SEED, MAX_TICKS, LOTS_OF_HP, BASE_STATS, ALWAYS, configWith, withStats, setUp, TARGET, type Logged } from './duel/reaction-fixtures';

describe('Combat reactions', () => {
  it('dodges an attack and takes no damage from it', () => {
    const { duel, of, runUntil } = setUp({ config: configWith({ dodgeChance: ALWAYS }), passive: [1] });

    runUntil(() => duel.fighters[0].state === 'recovery');

    expect(of('dodge')).toHaveLength(1);
    expect(of('dodge')[0]).toMatchObject({ defender: 1, attacker: 0 });
    expect(of('hit')).toHaveLength(0);
    expect(duel.fighters[1].hp).toBe(BASE_STATS.hp);
  });

  it('starts the dodge before the strike so the move is seen', () => {
    const { duel, of, runUntil } = setUp({ config: configWith({ dodgeChance: ALWAYS }), passive: [1] });

    runUntil(() => of('dodge').length > 0);

    expect(duel.fighters[1].state).toBe('dodge');
    expect(duel.fighters[0].inStrikeWindow).toBe(false);
    expect(duel.fighters[1].intent().pose).toBe(FIGHTERS[1].dodgePose);
    expect(duel.fighters[1].intent().walkVelocity * duel.fighters[1].facing).toBe(-DUEL_CONFIG.reactions.dodgeRetreatSpeed);
  });

  it('parries a hit which then deals reduced damage and does not stun', () => {
    const { duel, of, runUntil } = setUp({ config: configWith({ parryChance: ALWAYS }), passive: [1] });

    runUntil(() => of('hit').length > 0);

    const expected = Math.round(FIGHTERS[0].attack.damage * DUEL_CONFIG.reactions.parryFactor);
    expect(of('parry')).toHaveLength(1);
    expect(of('hit')[0]).toMatchObject({ parried: true, damage: expected, hpLeft: BASE_STATS.hp - expected });
    expect(expected).toBeLessThan(FIGHTERS[0].attack.damage);
    expect(duel.fighters[1].state).toBe('parry');
    expect(duel.fighters[1].intent().pose).toBe(FIGHTERS[1].parryPose);
  });

  it('counter-attacks right after a dodge without waiting for its action delay', () => {
    const { duel, of, runUntil } = setUp({ config: configWith({ dodgeChance: ALWAYS, counterChance: ALWAYS }), passive: [1] });

    runUntil(() => of('dodge').length > 0);
    const delayLeftWhenDodging = duel.fighters[1].actionTicksLeft;
    runUntil(() => of('counter').length > 0);

    expect(delayLeftWhenDodging).toBeGreaterThan(MAX_TICKS);
    expect(of('counter')[0]).toMatchObject({ fighter: 1, trigger: 'dodge' });
    expect(duel.fighters[1].state).toBe('attack');
    expect(of('attackStart').filter((start) => start.fighter === 1)[0].tick).toBe(of('counter')[0].tick);
  });

  it('counter-attacks right after a parry', () => {
    const { of, runUntil } = setUp({ config: configWith({ parryChance: ALWAYS, counterChance: ALWAYS }), passive: [1] });

    runUntil(() => of('counter').length > 0);

    expect(of('counter')[0]).toMatchObject({ fighter: 1, trigger: 'parry' });
  });

  it('chains several hits in a row up to the configured maximum', () => {
    const { duel, of, runUntil } = setUp({ config: configWith({ comboChance: ALWAYS }), specs: [FIGHTERS[0], TARGET], passive: [1] });
    const { maxComboHits } = DUEL_CONFIG.reactions;
    const attackTicks = duel.fighters[0].windupTicks + duel.fighters[0].strikeTicks;

    runUntil(() => of('attackStart').length > maxComboHits);

    const starts = of('attackStart').map((start) => start.tick);
    const series = of('combo').slice(0, maxComboHits - 1);
    expect(series.map((combo) => combo.count)).toEqual(Array.from({ length: maxComboHits - 1 }, (_, rank) => rank + 2));
    for (let rank = 1; rank < maxComboHits; rank += 1) expect(starts[rank] - starts[rank - 1]).toBe(attackTicks);
    expect(starts[maxComboHits] - starts[maxComboHits - 1]).toBeGreaterThan(attackTicks);
    expect(of('hit').filter((hit) => hit.tick < starts[maxComboHits])).toHaveLength(maxComboHits);
  });

  it('does not chain after a hit that missed', () => {
    const { of, run } = setUp({ config: configWith({ comboChance: ALWAYS }), contactsFrom: [], passive: [1] });

    run(MAX_TICKS / 10);

    expect(of('attackStart').length).toBeGreaterThan(1);
    expect(of('combo')).toHaveLength(0);
  });

  it('raises every reaction chance with agility within the configured bounds', () => {
    const { dodgeChance, parryChance, counterChance, comboChance } = DUEL_CONFIG.reactions;

    for (const chance of [dodgeChance, parryChance, counterChance, comboChance]) {
      expect(reactionChance(chance, BASE_STATS.agility)).toBeCloseTo(chance.base + chance.perAgility * BASE_STATS.agility);
      expect(reactionChance(chance, BASE_STATS.agility * 2)).toBeGreaterThan(reactionChance(chance, BASE_STATS.agility));
      expect(reactionChance(chance, LOTS_OF_HP)).toBe(chance.max);
      expect(reactionChance(chance, -LOTS_OF_HP)).toBe(0);
    }
  });

  it('lets an agile fighter dodge more often than a clumsy one', () => {
    const dodgesWith = (agility: number): number => {
      const target = withStats(TARGET, { agility, stamina: LOTS_OF_HP });
      const { of, run } = setUp({ config: configWith({ dodgeChance: DUEL_CONFIG.reactions.dodgeChance }), specs: [FIGHTERS[0], target], passive: [1] });
      run(MAX_TICKS);
      return of('dodge').length;
    };

    expect(dodgesWith(BASE_STATS.agility * 3)).toBeGreaterThan(dodgesWith(0));
  });

  it('replays the same events for the same seed and different ones for another seed', () => {
    const play = (seed: number): Logged[] => {
      const { log, run } = setUp({ seed, contactsFrom: [0, 1] });
      run(MAX_TICKS);
      return log;
    };

    const first = play(SEED);

    expect(first.length).toBeGreaterThan(0);
    expect(play(SEED)).toEqual(first);
    expect(play(OTHER_SEED)).not.toEqual(first);
  });

  it('mixes dodges, parries, counters and combos in a duel with the shipped config', () => {
    const { of, run } = setUp({ specs: [withStats(FIGHTERS[0], { hp: LOTS_OF_HP }), TARGET], contactsFrom: [0, 1] });

    run(MAX_TICKS);

    for (const type of ['dodge', 'parry', 'counter', 'combo'] as const) expect(of(type).length).toBeGreaterThan(0);
    expect(new Set(of('attackStart').map((start) => start.fighter)).size).toBe(2);
  });

});
