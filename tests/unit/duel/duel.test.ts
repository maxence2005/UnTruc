import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { FIGHTERS } from '../../../src/content/fighters';
import { Duel } from '../../../src/core/duel';
import type { DuelConfig } from '../../../src/core/duel-config';
import type { DuelEvents } from '../../../src/core/events';
import { createRng } from '../../../src/core/rng';
import { FakeDuelWorld, punchContact } from './fake-duel-world';

const SEED = 1;
const MAX_TICKS = 5000;
/** Les deux combattants à portée de coup l'un de l'autre. */
const IN_REACH: readonly [number, number] = [0, FIGHTERS[0].attack.reach / 2];
const STRIKING_PART = FIGHTERS[0].attack.strikingParts[0];
const REFERENCE_SPEED = DUEL_CONFIG.damage.referenceSpeed;
/** Les deux combattants lancent leur premier coup sur le même pas. */
const SIMULTANEOUS: DuelConfig = { ...DUEL_CONFIG, action: { ...DUEL_CONFIG.action, firstDelayStaggerMs: 0 } };

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
    const duel = new Duel(SIMULTANEOUS, FIGHTERS, createRng(SEED));
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
    const duel = new Duel(SIMULTANEOUS, FIGHTERS, createRng(SEED));
    const world = new FakeDuelWorld(IN_REACH);
    world.contacts = [punchContact(0, STRIKING_PART, REFERENCE_SPEED), punchContact(1, STRIKING_PART, REFERENCE_SPEED)];
    const hits = collectHits(duel);

    while (hits.length === 0 && duel.tick < MAX_TICKS) duel.update(world);

    expect(hits.map((hit) => hit.attacker).sort()).toEqual([0, 1]);
    expect(hits[0].tick).toBe(hits[1].tick);
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
