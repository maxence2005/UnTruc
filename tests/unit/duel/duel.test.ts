import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { FIGHTERS } from './plain-fighters';
import { Duel } from '../../../src/core/duel';
import type { DuelConfig } from '../../../src/core/duel-config';
import type { DuelEvents } from '../../../src/core/events';
import type { FighterSpec } from '../../../src/core/fighter-spec';
import { initiativeWinner } from '../../../src/core/reactions';
import { createRng } from '../../../src/core/rng';
import { FakeDuelWorld, punchContact } from './fake-duel-world';

const SEED = 1;
const MAX_TICKS = 5000;
/** Les deux combattants à portée de coup l'un de l'autre. */
const IN_REACH: readonly [number, number] = [0, FIGHTERS[0].attack.reach / 2];
const STRIKING_PART = FIGHTERS[0].attack.strikingParts[0];
const REFERENCE_SPEED = DUEL_CONFIG.damage.referenceSpeed;
const TICK_MS = 1000 / DUEL_CONFIG.stepHz;
/** Les deux combattants sont prêts à frapper sur le même pas. */
const READY_TOGETHER: DuelConfig = { ...DUEL_CONFIG, action: { ...DUEL_CONFIG.action, firstDelayStaggerMs: 0 } };
/**
 * Les deux frappes tombent sur le même pas sans que les deux soient prêts
 * ensemble : le second part un pas plus tard, avec un armement plus court d'un pas.
 */
const SIMULTANEOUS: DuelConfig = { ...DUEL_CONFIG, action: { ...DUEL_CONFIG.action, firstDelayStaggerMs: TICK_MS } };
const SIMULTANEOUS_FIGHTERS: readonly [FighterSpec, FighterSpec] = [
  FIGHTERS[0],
  { ...FIGHTERS[1], attack: { ...FIGHTERS[1].attack, windupMs: FIGHTERS[1].attack.windupMs - TICK_MS } },
];

function runUntilEnd(duel: Duel, world: FakeDuelWorld): void {
  while (duel.phase === 'running' && duel.tick < MAX_TICKS) duel.update(world);
}

function collectHits(duel: Duel): DuelEvents['hit'][] {
  const hits: DuelEvents['hit'][] = [];
  duel.events.on('hit', (hit) => hits.push(hit));
  return hits;
}

describe('Duel', () => {
  it('ends in a draw when both fighters are knocked out on the same step', () => {
    const duel = new Duel(SIMULTANEOUS, SIMULTANEOUS_FIGHTERS, createRng(SEED));
    const world = new FakeDuelWorld(IN_REACH);
    for (const fighter of duel.fighters) fighter.hp = 1;
    world.contacts = [punchContact(0, STRIKING_PART, REFERENCE_SPEED), punchContact(1, STRIKING_PART, REFERENCE_SPEED)];
    const ends: DuelEvents['duelEnd'][] = [];
    duel.events.on('duelEnd', (end) => ends.push(end));

    runUntilEnd(duel, world);

    expect(duel.fighters.map((fighter) => fighter.hp)).toEqual([0, 0]);
    expect(duel.fighters.map((fighter) => fighter.state)).toEqual(['ko', 'ko']);
    expect(duel.winner).toBeNull();
    expect(ends).toHaveLength(1);
    expect(ends[0].winner).toBeNull();
  });

  it('names the fighter left standing as the winner', () => {
    const duel = new Duel(DUEL_CONFIG, FIGHTERS, createRng(SEED));
    const world = new FakeDuelWorld(IN_REACH);
    duel.fighters[1].hp = 1;
    world.contacts = [punchContact(0, STRIKING_PART, REFERENCE_SPEED)];

    runUntilEnd(duel, world);

    expect(duel.winner).toBe(0);
    expect(duel.fighters[1].state).toBe('ko');
    expect(duel.fighters[0].hp).toBe(FIGHTERS[0].stats.hp);
  });

  it('lets both fighters land a hit on the same step without taking turns', () => {
    const duel = new Duel(SIMULTANEOUS, SIMULTANEOUS_FIGHTERS, createRng(SEED));
    const world = new FakeDuelWorld(IN_REACH);
    world.contacts = [punchContact(0, STRIKING_PART, REFERENCE_SPEED), punchContact(1, STRIKING_PART, REFERENCE_SPEED)];
    const hits = collectHits(duel);

    while (hits.length === 0 && duel.tick < MAX_TICKS) duel.update(world);

    expect(hits.map((hit) => hit.attacker).sort()).toEqual([0, 1]);
    expect(hits[0].tick).toBe(hits[1].tick);
  });

  it('gives the initiative to one fighter when both are ready on the same step', () => {
    const duel = new Duel(READY_TOGETHER, FIGHTERS, createRng(SEED));
    const world = new FakeDuelWorld(IN_REACH);
    const starts: DuelEvents['attackStart'][] = [];
    duel.events.on('attackStart', (start) => starts.push(start));

    while (starts.length < 2 && duel.tick < MAX_TICKS) duel.update(world);

    const [first, second] = starts;
    expect(second.fighter).toBe(1 - first.fighter);
    const { windupMs, strikeMs } = FIGHTERS[first.fighter].attack;
    expect(second.tick - first.tick).toBeGreaterThanOrEqual(Math.round((windupMs + strikeMs) / TICK_MS));
  });

  it('draws the initiative in proportion to the speed of each fighter', () => {
    const rng = createRng(SEED);
    const wins = [0, 0];
    const even = [0, 0];
    for (let draw = 0; draw < 1000; draw += 1) {
      wins[initiativeWinner([30, 10], rng)] += 1;
      even[initiativeWinner([0, 0], rng)] += 1;
    }

    expect(initiativeWinner([10, 0], createRng(SEED))).toBe(0);
    expect(initiativeWinner([0, 10], createRng(SEED))).toBe(1);
    expect(wins[0]).toBeGreaterThan(wins[1] * 2);
    expect(Math.min(...even)).toBeGreaterThan(400);
  });

  it('scales damage with impact speed between the configured bounds', () => {
    const { minFactor, maxFactor } = DUEL_CONFIG.damage;
    const base = FIGHTERS[0].attack.damage;
    const firstDamageAt = (speed: number): number => {
      const duel = new Duel(DUEL_CONFIG, FIGHTERS, createRng(SEED));
      const world = new FakeDuelWorld(IN_REACH);
      world.contacts = [punchContact(0, STRIKING_PART, speed)];
      const hits = collectHits(duel);
      while (hits.length === 0 && duel.tick < MAX_TICKS) duel.update(world);
      return hits[0].damage;
    };

    expect(firstDamageAt(REFERENCE_SPEED)).toBe(base);
    expect(firstDamageAt(REFERENCE_SPEED * maxFactor * 10)).toBe(Math.round(base * maxFactor));
    expect(firstDamageAt(Math.max(DUEL_CONFIG.minHitSpeed, REFERENCE_SPEED * minFactor * 0.5))).toBe(Math.round(base * minFactor));
  });

  it('ignores a contact slower than the minimum hit speed', () => {
    const duel = new Duel(DUEL_CONFIG, FIGHTERS, createRng(SEED));
    const world = new FakeDuelWorld(IN_REACH);
    world.contacts = [punchContact(0, STRIKING_PART, DUEL_CONFIG.minHitSpeed / 2)];
    const hits = collectHits(duel);

    for (let tick = 0; tick < 600; tick += 1) duel.update(world);

    expect(hits).toHaveLength(0);
    expect(duel.fighters[1].hp).toBe(FIGHTERS[1].stats.hp);
  });

  it('replays the same hits for the same seed', () => {
    const play = (seed: number): DuelEvents['hit'][] => {
      const duel = new Duel(DUEL_CONFIG, FIGHTERS, createRng(seed));
      const world = new FakeDuelWorld(IN_REACH);
      world.contacts = [punchContact(0, STRIKING_PART, REFERENCE_SPEED), punchContact(1, STRIKING_PART, REFERENCE_SPEED)];
      const hits = collectHits(duel);
      runUntilEnd(duel, world);
      return hits;
    };

    const first = play(SEED);

    expect(first.length).toBeGreaterThan(0);
    expect(play(SEED)).toEqual(first);
  });
});
