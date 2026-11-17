import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { FIGHTERS } from './duel/plain-fighters';
import { WEAPONS } from '../../src/content/weapons';
import { Duel } from '../../src/core/duel';
import { msToTicks } from '../../src/core/duel-config';
import type { FighterSpec } from '../../src/core/fighter-spec';
import { createRng } from '../../src/core/rng';
import { FakeDuelWorld, punchContact, type FakeMotion } from './duel/fake-duel-world';

const SEED = 7;
const MAX_TICKS = 20000;
const { turnMargin, turnDelayMs } = DUEL_CONFIG.facing;
const TURN_TICKS = msToTicks(turnDelayMs, DUEL_CONFIG.stepHz);
/** Marche et recul simulés : un px par pas de vitesse, le recul déplace d'autant de pas d'élan. */
const MOVING: FakeMotion = { walkScale: 1, knockbackScale: 10 };
const ARMED: readonly [FighterSpec, FighterSpec] = [
  { ...FIGHTERS[0], weapon: WEAPONS.get('sword') },
  { ...FIGHTERS[1], weapon: WEAPONS.get('hammer') },
];
const START: readonly [number, number] = [400, 800];

/** Duel où personne n'attaque : seul le regard bouge. */
function passiveDuel(positions: readonly [number, number]) {
  const duel = new Duel(DUEL_CONFIG, [FIGHTERS[0], FIGHTERS[1]], createRng(SEED));
  for (const fighter of duel.fighters) fighter.actionTicksLeft = Number.MAX_SAFE_INTEGER;
  return { duel, world: new FakeDuelWorld(positions) };
}

/** Duel armé où chaque arme touche dès sa fenêtre de frappe ; renvoie le regard des deux à chaque tick. */
function armedDuel(swapAtFirstHit: boolean) {
  const duel = new Duel(DUEL_CONFIG, ARMED, createRng(SEED));
  const world = new FakeDuelWorld(START, MOVING);
  const speed = DUEL_CONFIG.damage.referenceSpeed;
  world.contacts = [punchContact(0, 'weapon', speed), punchContact(1, 'weapon', speed)];
  let swapped = false;
  duel.events.on('hit', () => {
    if (!swapAtFirstHit || swapped) return;
    swapped = true;
    world.positions.reverse();
  });
  const facings: string[] = [];
  while (duel.phase === 'running' && duel.tick < MAX_TICKS) {
    duel.update(world);
    facings.push(`${duel.fighters[0].facing}${duel.fighters[1].facing}`);
  }
  return { duel, facings, swapped };
}

describe('Facing', () => {
  it('turns both fighters once the opponent has been clearly on the other side for the turn delay', () => {
    const { duel, world } = passiveDuel([600, 700]);
    duel.update(world);
    world.positions[1] = world.positions[0] - turnMargin * 3;
    for (let tick = 1; tick < TURN_TICKS; tick += 1) duel.update(world);
    expect(duel.fighters.map((fighter) => fighter.facing)).toEqual([1, -1]);
    duel.update(world);
    expect(duel.fighters.map((fighter) => fighter.facing)).toEqual([-1, 1]);
  });

  it('does not turn for a micro-crossing inside the margin', () => {
    const { duel, world } = passiveDuel([600, 600 - turnMargin / 2]);
    for (let tick = 0; tick < TURN_TICKS * 10; tick += 1) duel.update(world);
    expect(duel.fighters.map((fighter) => fighter.facing)).toEqual([1, -1]);
  });

  it('does not turn when the opponent comes back before the delay', () => {
    const { duel, world } = passiveDuel([600, 700]);
    world.positions[1] = 600 - turnMargin * 3;
    for (let tick = 0; tick < TURN_TICKS - 1; tick += 1) duel.update(world);
    world.positions[1] = 700;
    for (let tick = 0; tick < TURN_TICKS * 2; tick += 1) duel.update(world);
    expect(duel.fighters.map((fighter) => fighter.facing)).toEqual([1, -1]);
  });

  it('is replayable at a fixed seed', () => {
    const first = armedDuel(true);
    const second = armedDuel(true);
    expect(second.facings).toEqual(first.facings);
    expect(new Set(first.facings).size).toBeGreaterThan(1);
  });

  it('sends the walk toward the opponent after a turn', () => {
    const { duel, world } = passiveDuel([600, 700]);
    world.positions[1] = 400;
    for (let tick = 0; tick < TURN_TICKS * 2; tick += 1) duel.update(world);
    const intent = duel.fighters[0].intent();
    expect(intent.facing).toBe(-1);
    expect(duel.fighters[0].state).toBe('approach');
    expect(intent.walkVelocity).toBeLessThan(0);
  });
});

describe('Armed duel (sword vs hammer)', () => {
  it('goes to a KO', () => {
    const { duel } = armedDuel(false);
    expect(duel.phase).not.toBe('running');
    expect(duel.fighters.some((fighter) => fighter.hp === 0)).toBe(true);
  });

  it('still goes to a KO after one fighter is thrown behind the other', () => {
    const { duel, facings, swapped } = armedDuel(true);
    expect(swapped).toBe(true);
    expect(facings).toContain('-11');
    expect(duel.phase).not.toBe('running');
    expect(duel.fighters.some((fighter) => fighter.hp === 0)).toBe(true);
  });
});
