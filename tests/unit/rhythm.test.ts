import { describe, expect, it } from 'vitest';
import { punchContact } from './duel/fake-duel-world';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { FIGHTERS } from '../../src/content/fighters';
import { Duel } from '../../src/core/duel';
import { msToTicks, type DuelConfig, type ReactionsConfig, type StatsConfig } from '../../src/core/duel-config';
import { createRng } from '../../src/core/rng';
import { actionDelayScale, knockbackSpeed, staminaRegenPerTick, walkSpeedScale, type FighterStats, stunTicksFor } from '../../src/core/stats';
import { SEED, MAX_TICKS, LOTS_OF_HP, reach, REFERENCE_SPEED, BASE_STATS, COST, ALWAYS, configWith, withStats, setUp, TARGET, type EventName, STRIKING_PART } from './duel/reaction-fixtures';

describe('Combat rhythm', () => {
  it('charges stamina for an attack, a dodge, a parry, a counter and a combo', () => {
    const staminaAfter = (reactions: Partial<ReactionsConfig>, fighter: number, event: EventName): number => {
      const { duel, of, runUntil } = setUp({ config: configWith(reactions, { staminaRegenPerRecovery: 0 }), specs: [FIGHTERS[0], TARGET], passive: [1] });
      runUntil(() => of(event).length > 0);
      return duel.fighters[fighter].stamina;
    };
    const full = BASE_STATS.stamina;

    expect(staminaAfter({}, 0, 'attackStart')).toBe(full - COST.attack);
    expect(staminaAfter({ dodgeChance: ALWAYS }, 1, 'dodge')).toBe(full - COST.dodge);
    expect(staminaAfter({ parryChance: ALWAYS }, 1, 'parry')).toBe(full - COST.parry);
    expect(staminaAfter({ dodgeChance: ALWAYS, counterChance: ALWAYS }, 1, 'counter')).toBe(full - COST.dodge - COST.counter);
    expect(staminaAfter({ comboChance: ALWAYS }, 0, 'combo')).toBe(full - COST.attack - COST.combo);
  });

  it('stops an exhausted fighter from dodging, parrying and chaining', () => {
    const everything = { dodgeChance: ALWAYS, parryChance: ALWAYS, counterChance: ALWAYS, comboChance: ALWAYS };
    const drained: Partial<FighterStats> = { stamina: 0, recovery: 0 };
    const { of, run } = setUp({
      config: configWith(everything),
      specs: [withStats(FIGHTERS[0], drained), withStats(TARGET, drained)],
      passive: [1],
    });

    run(MAX_TICKS / 5);

    expect(of('hit').length).toBeGreaterThan(1);
    expect(of('hit').every((hit) => !hit.parried)).toBe(true);
    for (const type of ['dodge', 'parry', 'counter', 'combo'] as const) expect(of(type)).toHaveLength(0);
  });

  it('regains stamina over time from the recovery stat up to the maximum', () => {
    const { duel, run } = setUp({ contactsFrom: [], passive: [0, 1] });
    const [rested, tired] = duel.fighters;
    const spent = BASE_STATS.stamina / 2;
    tired.spendStamina(spent);
    const perTick = staminaRegenPerTick(DUEL_CONFIG, BASE_STATS);

    run(1);
    const afterOneTick = tired.stamina;
    run(Math.ceil(spent / perTick));

    expect(perTick).toBeGreaterThan(0);
    expect(afterOneTick).toBeCloseTo(BASE_STATS.stamina - spent + perTick);
    expect(tired.stamina).toBe(BASE_STATS.stamina);
    expect(rested.stamina).toBe(BASE_STATS.stamina);
    expect(staminaRegenPerTick(DUEL_CONFIG, { ...BASE_STATS, recovery: BASE_STATS.recovery * 2 })).toBeCloseTo(perTick * 2);
    expect(staminaRegenPerTick(DUEL_CONFIG, { ...BASE_STATS, recovery: 0 })).toBe(0);
  });

  it('does not regain stamina during an attack', () => {
    const { duel, of, runUntil } = setUp({ config: configWith({}), passive: [1] });

    runUntil(() => of('attackStart').length > 0);
    runUntil(() => duel.fighters[0].inStrikeWindow);

    expect(duel.fighters[0].stamina).toBe(BASE_STATS.stamina - COST.attack);
  });

  it('shortens the delay between actions for a fast fighter', () => {
    const { referenceActionSpeed, minDelayScale, maxDelayScale } = DUEL_CONFIG.stats;
    const scaleAt = (speed: number) => actionDelayScale(DUEL_CONFIG, { ...BASE_STATS, speed });

    expect(scaleAt(referenceActionSpeed)).toBe(1);
    expect(scaleAt(referenceActionSpeed * 2)).toBe(0.5);
    expect(scaleAt(LOTS_OF_HP)).toBe(minDelayScale);
    expect(scaleAt(0)).toBe(maxDelayScale);
  });

  it('lets a fast fighter attack more often than a slow one', () => {
    const attacksAt = (speed: number): number => {
      const { of, run } = setUp({ config: configWith({}), specs: [withStats(FIGHTERS[0], { speed }), TARGET], passive: [1] });
      run(MAX_TICKS / 5);
      return of('attackStart').length;
    };
    const { speed } = BASE_STATS;

    expect(attacksAt(speed * 2)).toBeGreaterThan(attacksAt(speed));
    expect(attacksAt(speed)).toBeGreaterThan(attacksAt(speed / 2));
  });

  it('knocks the victim back away from the attacker in proportion to the weight ratio', () => {
    const { referenceWeight, knockbackLift, minKnockbackRatio, maxKnockbackRatio } = DUEL_CONFIG.stats;
    const base = DUEL_CONFIG.stats.knockbackSpeed;
    const recoilFor = (attackerWeight: number, victimWeight: number) => {
      const specs = [withStats(FIGHTERS[0], { weight: attackerWeight }), withStats(TARGET, { weight: victimWeight })] as const;
      const { world, of, runUntil } = setUp({ config: configWith({}), specs, passive: [1] });
      runUntil(() => of('hit').length > 0);
      return world.impulses[0];
    };

    const even = recoilFor(referenceWeight, referenceWeight);
    const heavyOnLight = recoilFor(referenceWeight * 2, referenceWeight);
    const lightOnHeavy = recoilFor(referenceWeight, referenceWeight * 2);

    expect(even).toEqual({ fighter: 1, velocityX: base, velocityY: -base * knockbackLift });
    expect(heavyOnLight.velocityX).toBeCloseTo(base * 2);
    expect(lightOnHeavy.velocityX).toBeCloseTo(base / 2);
    const extreme = (attacker: number, victim: number) =>
      knockbackSpeed(DUEL_CONFIG, REFERENCE_SPEED, { ...BASE_STATS, weight: attacker }, { ...BASE_STATS, weight: victim });
    expect(extreme(LOTS_OF_HP, 1)).toBeCloseTo(base * maxKnockbackRatio);
    expect(extreme(1, LOTS_OF_HP)).toBeCloseTo(base * minKnockbackRatio);
  });

  it('knocks back harder for a harder hit and less for a parried one', () => {
    const { maxFactor } = DUEL_CONFIG.damage;
    const parried = setUp({ config: configWith({ parryChance: ALWAYS }), passive: [1] });

    parried.runUntil(() => parried.of('hit').length > 0);

    expect(knockbackSpeed(DUEL_CONFIG, REFERENCE_SPEED * maxFactor, BASE_STATS, BASE_STATS)).toBeCloseTo(DUEL_CONFIG.stats.knockbackSpeed * maxFactor);
    expect(parried.world.impulses[0].velocityX).toBeCloseTo(DUEL_CONFIG.stats.knockbackSpeed * DUEL_CONFIG.reactions.parryFactor);
  });

  it('makes a heavy fighter walk slower than a light one', () => {
    const { referenceWeight, minWalkScale, maxWalkScale } = DUEL_CONFIG.stats;
    const walkAt = (weight: number): number => {
      const { duel, run } = setUp({ specs: [withStats(FIGHTERS[0], { weight }), FIGHTERS[1]], positions: [0, reach * 4] });
      run(1);
      expect(duel.fighters[0].state).toBe('approach');
      return duel.fighters[0].intent().walkVelocity;
    };

    expect(walkAt(referenceWeight)).toBe(FIGHTERS[0].walk.speed);
    expect(walkAt(referenceWeight * 2)).toBeLessThan(walkAt(referenceWeight) * 0.75);
    expect(walkAt(referenceWeight / 2)).toBeGreaterThan(walkAt(referenceWeight));
    expect(walkSpeedScale(DUEL_CONFIG, { ...BASE_STATS, weight: LOTS_OF_HP })).toBe(minWalkScale);
    expect(walkSpeedScale(DUEL_CONFIG, { ...BASE_STATS, weight: 0 })).toBe(maxWalkScale);
  });

  it('does not flicker between walking and standing at the edge of reach', () => {
    const margin = DUEL_CONFIG.action.approachResumeMargin;
    const { duel, world, run } = setUp({ contactsFrom: [], passive: [0, 1], positions: [0, reach * 2] });
    const [walker] = duel.fighters;
    const states: string[] = [];

    run(1);
    states.push(walker.state);
    world.positions[1] = reach;
    run(1);
    states.push(walker.state);
    for (const offset of [margin / 2, -1, margin, 1, margin / 2]) {
      world.positions[1] = reach + offset;
      run(1);
      states.push(walker.state);
    }
    world.positions[1] = reach + margin + 1;
    run(1);
    states.push(walker.state);

    expect(states).toEqual(['approach', 'idle', 'idle', 'idle', 'idle', 'idle', 'idle', 'approach']);
  });

  it('walks in to attack when its delay is over and the opponent stands inside the margin', () => {
    const { duel, world, of, run } = setUp({ contactsFrom: [], passive: [1] });
    world.positions[1] = reach + DUEL_CONFIG.action.approachResumeMargin / 2;

    run(msToTicks(DUEL_CONFIG.action.firstDelayMs, DUEL_CONFIG.stepHz) + 1);
    const stateOutOfReach = duel.fighters[0].state;
    world.positions[1] = reach;
    run(1);

    expect(stateOutOfReach).toBe('approach');
    expect(of('attackStart')).toHaveLength(1);
  });

  it('wakes a fighter hit in series once the total stun reaches the cap', () => {
    const quick = { ...FIGHTERS[0].attack, windupMs: 1, strikeMs: 1, recoveryMs: 1 };
    const config: DuelConfig = { ...configWith({}), action: { ...DUEL_CONFIG.action, delayBaseMs: 1, delayRandomMs: 0 } };
    const { duel, of, run } = setUp({ config, specs: [{ ...FIGHTERS[0], attack: quick }, TARGET], passive: [1] });
    const capTicks = msToTicks(DUEL_CONFIG.stats.maxStunSeriesMs, DUEL_CONFIG.stepHz);
    const victim = duel.fighters[1];
    let longestStun = 0;
    let currentStun = 0;
    let wakeUps = 0;

    for (let tick = 0; tick < capTicks * 10; tick += 1) {
      const wasStunned = victim.state === 'stunned';
      run(1);
      currentStun = victim.state === 'stunned' ? currentStun + 1 : 0;
      longestStun = Math.max(longestStun, currentStun);
      if (wasStunned && victim.state !== 'stunned') wakeUps += 1;
    }

    const hitTicks = of('hit').map((hit) => hit.tick);
    const minStunTicks = msToTicks(DUEL_CONFIG.stats.minStunMs, DUEL_CONFIG.stepHz);
    expect(Math.max(...hitTicks.slice(1).map((tick, index) => tick - hitTicks[index]))).toBeLessThan(minStunTicks);
    expect(longestStun).toBeGreaterThan(minStunTicks);
    expect(longestStun).toBeLessThanOrEqual(capTicks);
    expect(wakeUps).toBeGreaterThan(1);
    expect(victim.hp).toBe(LOTS_OF_HP - of('hit').reduce((sum, hit) => sum + hit.damage, 0));
  });

  it('keeps the longer stun when a weak hit lands on a stunned fighter', () => {
    const quick = { ...FIGHTERS[0].attack, windupMs: 1, strikeMs: 1, recoveryMs: 1 };
    const config: DuelConfig = { ...configWith({}), action: { ...DUEL_CONFIG.action, delayBaseMs: 1, delayRandomMs: 0 } };
    const { duel, world, of, runUntil } = setUp({ config, specs: [{ ...FIGHTERS[0], attack: quick }, TARGET], passive: [1] });
    const victim = duel.fighters[1];
    const { referenceSpeed, maxFactor } = DUEL_CONFIG.damage;
    const weakSpeed = DUEL_CONFIG.minHitSpeed;

    world.contacts = [punchContact(0, STRIKING_PART, referenceSpeed * maxFactor)];
    runUntil(() => of('hit').length === 1);
    const firstStun = victim.stunTicks;
    world.contacts = [punchContact(0, STRIKING_PART, weakSpeed)];
    runUntil(() => of('hit').length === 2);

    const elapsed = of('hit')[1].tick - of('hit')[0].tick;
    expect(stunTicksFor(DUEL_CONFIG, TARGET.stunMs, weakSpeed, TARGET.stats)).toBeLessThan(firstStun - elapsed);
    expect(victim.stunTicks).toBe(firstStun - elapsed);
  });

  it('lets the fighter who lost the initiative attack as soon as its dodge ends', () => {
    const config: DuelConfig = { ...configWith({ dodgeChance: ALWAYS }), action: { ...DUEL_CONFIG.action, firstDelayStaggerMs: 0 } };
    const { of, runUntil } = setUp({ config, contactsFrom: [] });

    runUntil(() => of('attackStart').length === 2);

    const [first, second] = of('attackStart');
    const { windupMs, strikeMs } = FIGHTERS[first.fighter].attack;
    const attackTicks = msToTicks(windupMs, DUEL_CONFIG.stepHz) + msToTicks(strikeMs, DUEL_CONFIG.stepHz);
    expect(of('dodge')).toHaveLength(1);
    expect(second.fighter).toBe(1 - first.fighter);
    expect(second.tick - first.tick).toBeLessThanOrEqual(attackTicks + 2);
  });

  it('refuses a config whose action speed reference or lower bounds are zero', () => {
    const create = (stats: Partial<StatsConfig>) => () => new Duel(configWith({}, stats), FIGHTERS, createRng(SEED));

    expect(create({ referenceActionSpeed: 0 })).toThrow('referenceActionSpeed');
    expect(create({ minDelayScale: 0 })).toThrow('minDelayScale');
    expect(create({ minWalkScale: 0 })).toThrow('minWalkScale');
    expect(() => new Duel(configWith({ maxComboHits: 0 }), FIGHTERS, createRng(SEED))).toThrow('maxComboHits');
  });
});
