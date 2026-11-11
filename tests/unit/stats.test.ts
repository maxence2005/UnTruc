import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { FIGHTERS } from '../../src/content/fighters';
import { Duel } from '../../src/core/duel';
import type { DuelEvents } from '../../src/core/events';
import type { FighterSpec } from '../../src/core/fighter-spec';
import { createRng } from '../../src/core/rng';
import { hitDamage, massScale, stunTicksFor, type FighterStats } from '../../src/core/stats';
import { FakeDuelWorld, punchContact } from './duel/fake-duel-world';

const SEED = 1;
const MAX_TICKS = 5000;
const IN_REACH: readonly [number, number] = [0, FIGHTERS[0].attack.reach / 2];
const STRIKING_PART = FIGHTERS[0].attack.strikingParts[0];
const REFERENCE_SPEED = DUEL_CONFIG.damage.referenceSpeed;
const BASE_STATS = FIGHTERS[0].stats;
const STAT_NAMES: (keyof FighterStats)[] = [
  'hp',
  'physicalPower',
  'magicPower',
  'stamina',
  'mana',
  'agility',
  'speed',
  'weight',
  'intelligence',
];

function withStats(spec: FighterSpec, stats: Partial<FighterStats>): FighterSpec {
  return { ...spec, stats: { ...spec.stats, ...stats } };
}

/** Joue un duel où les deux combattants touchent à chaque attaque ; renvoie les coups et le duel. */
function play(specs: readonly [FighterSpec, FighterSpec], seed = SEED, contactsFrom: readonly number[] = [0, 1]) {
  const duel = new Duel(DUEL_CONFIG, specs, createRng(seed));
  const world = new FakeDuelWorld(IN_REACH);
  world.contacts = contactsFrom.map((attacker) => punchContact(attacker, STRIKING_PART, REFERENCE_SPEED));
  const hits: DuelEvents['hit'][] = [];
  duel.events.on('hit', (hit) => hits.push(hit));
  while (duel.phase === 'running' && duel.tick < MAX_TICKS) duel.update(world);
  return { duel, hits };
}

describe('Fighter stats', () => {
  it('gives every fighter the nine stats as numbers in the data', () => {
    for (const fighter of FIGHTERS) {
      expect(Object.keys(fighter.stats).sort()).toEqual([...STAT_NAMES].sort());
      for (const name of STAT_NAMES) expect(Number.isFinite(fighter.stats[name])).toBe(true);
    }
  });

  it('starts a fighter with hp, stamina and mana read from the stats', () => {
    const stats = { ...BASE_STATS, hp: 77, stamina: 33, mana: 21 };
    const duel = new Duel(DUEL_CONFIG, [withStats(FIGHTERS[0], stats), FIGHTERS[1]], createRng(SEED));

    expect(duel.fighters[0].hp).toBe(77);
    expect(duel.fighters[0].stamina).toBe(33);
    expect(duel.fighters[0].mana).toBe(21);
  });

  it('never lets stamina or mana go below zero when spending', () => {
    const duel = new Duel(DUEL_CONFIG, FIGHTERS, createRng(SEED));
    const fighter = duel.fighters[0];

    fighter.spendStamina(30);
    fighter.spendMana(20);
    expect([fighter.stamina, fighter.mana]).toEqual([BASE_STATS.stamina - 30, BASE_STATS.mana - 20]);
    fighter.spendStamina(1000);
    fighter.spendMana(1000);

    expect([fighter.stamina, fighter.mana]).toEqual([0, 0]);
  });

  it('knocks out a fighter with more hp later at equal hits', () => {
    const koTick = (hp: number): number => {
      const { duel } = play([FIGHTERS[0], withStats(FIGHTERS[1], { hp })], SEED, [0]);
      expect(duel.winner).toBe(0);
      return duel.fighters[1].machine.state === 'ko' ? duel.tick : -1;
    };

    expect(koTick(200)).toBeGreaterThan(koTick(100));
  });

  it('deals damage proportional to physical power', () => {
    const { physicalPower } = BASE_STATS;
    const damageAt = (power: number) => hitDamage(DUEL_CONFIG, FIGHTERS[0].attack.damage, REFERENCE_SPEED, { ...BASE_STATS, physicalPower: power });

    expect(damageAt(physicalPower)).toBe(FIGHTERS[0].attack.damage);
    expect(damageAt(physicalPower * 2)).toBe(FIGHTERS[0].attack.damage * 2);
    expect(damageAt(physicalPower / 2)).toBe(Math.round(FIGHTERS[0].attack.damage / 2));
  });

  it('keeps reference damage and mass identical to the previous duel', () => {
    const { damage } = FIGHTERS[0].attack;

    expect(hitDamage(DUEL_CONFIG, damage, REFERENCE_SPEED, BASE_STATS)).toBe(damage);
    expect(massScale(DUEL_CONFIG, BASE_STATS)).toBe(1);
  });

  it('computes the mass scale from weight within the configured bounds', () => {
    const { referenceWeight, minMassScale, maxMassScale } = DUEL_CONFIG.stats;
    const scaleAt = (weight: number) => massScale(DUEL_CONFIG, { ...BASE_STATS, weight });

    expect(scaleAt(referenceWeight * 2)).toBe(2);
    expect(scaleAt(referenceWeight / 2)).toBe(0.5);
    expect(scaleAt(referenceWeight * 1000)).toBe(maxMassScale);
    expect(scaleAt(0)).toBe(minMassScale);
  });

  it('stuns a heavy fighter for a shorter time than a light one at equal hit', () => {
    const { referenceWeight } = DUEL_CONFIG.stats;
    const stunFor = (weight: number) => stunTicksFor(DUEL_CONFIG, FIGHTERS[0].stunMs, REFERENCE_SPEED, { ...BASE_STATS, weight });
    const { stepHz } = DUEL_CONFIG;
    const { minStunMs, maxStunMs } = DUEL_CONFIG.stats;
    const heavy = stunFor(referenceWeight * 1.5);
    const light = stunFor(referenceWeight * 0.75);

    expect(heavy).toBeLessThan(light);
    for (const ticks of [heavy, light, stunFor(1), stunFor(100000)]) {
      expect(ticks).toBeGreaterThanOrEqual(Math.round((minStunMs * stepHz) / 1000));
      expect(ticks).toBeLessThanOrEqual(Math.round((maxStunMs * stepHz) / 1000));
    }
  });

  it('stuns longer for a harder hit on the same fighter', () => {
    const stunAt = (speed: number) => stunTicksFor(DUEL_CONFIG, FIGHTERS[0].stunMs, speed, BASE_STATS);

    expect(stunAt(REFERENCE_SPEED * DUEL_CONFIG.damage.maxFactor)).toBeGreaterThan(stunAt(REFERENCE_SPEED * DUEL_CONFIG.damage.minFactor));
  });

  it('sets the victim stun duration from the hit it just received', () => {
    const { duel } = play(FIGHTERS, SEED, [0]);

    expect(duel.fighters[1].stunTicks).toBe(stunTicksFor(DUEL_CONFIG, FIGHTERS[1].stunMs, REFERENCE_SPEED, BASE_STATS));
  });

  it('plays a different duel when only hp differs', () => {
    const base = play(FIGHTERS);
    const tougher = play([FIGHTERS[0], withStats(FIGHTERS[1], { hp: 300 })]);

    expect(tougher.hits).not.toEqual(base.hits);
  });

  it('plays a different duel when only physical power differs', () => {
    const base = play(FIGHTERS);
    const stronger = play([withStats(FIGHTERS[0], { physicalPower: BASE_STATS.physicalPower * 2 }), FIGHTERS[1]]);

    expect(stronger.hits).not.toEqual(base.hits);
  });

  it('plays a different duel when only weight differs', () => {
    const base = play(FIGHTERS);
    const light = play([FIGHTERS[0], withStats(FIGHTERS[1], { weight: BASE_STATS.weight / 2 })]);

    expect(light.hits).not.toEqual(base.hits);
  });

  it('refuses a config whose reference value is zero', () => {
    const withStatsConfig = (stats: Partial<typeof DUEL_CONFIG.stats>) => ({ ...DUEL_CONFIG, stats: { ...DUEL_CONFIG.stats, ...stats } });
    const create = (config: typeof DUEL_CONFIG) => () => new Duel(config, FIGHTERS, createRng(SEED));

    expect(create(withStatsConfig({ referencePhysicalPower: 0 }))).toThrow('referencePhysicalPower');
    expect(create(withStatsConfig({ referenceWeight: 0 }))).toThrow('referenceWeight');
    expect(create({ ...DUEL_CONFIG, damage: { ...DUEL_CONFIG.damage, referenceSpeed: 0 } })).toThrow('referenceSpeed');
    expect(create(DUEL_CONFIG)).not.toThrow();
  });

  it('replays the same duel for the same seed with different stats', () => {
    const specs: readonly [FighterSpec, FighterSpec] = [
      withStats(FIGHTERS[0], { physicalPower: 14, weight: 90 }),
      withStats(FIGHTERS[1], { hp: 140, weight: 50 }),
    ];

    expect(play(specs).hits).toEqual(play(specs).hits);
  });
});
