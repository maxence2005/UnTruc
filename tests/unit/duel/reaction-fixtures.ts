import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { FIGHTERS } from '../../../src/content/fighters';
import { Duel } from '../../../src/core/duel';
import { type ChanceConfig, type DuelConfig, type ReactionsConfig, type StatsConfig } from '../../../src/core/duel-config';
import { type DuelEvents } from '../../../src/core/events';
import { type FighterSpec } from '../../../src/core/fighter-spec';
import { createRng } from '../../../src/core/rng';
import { type FighterStats } from '../../../src/core/stats';
import { FakeDuelWorld, punchContact } from './fake-duel-world';

export const SEED = 1;
export const OTHER_SEED = 2;
export const MAX_TICKS = 5000;
/** Assez de ticks pour qu'un combattant passif n'attaque jamais pendant un test. */
export const NEVER = 10 * MAX_TICKS;
export const LOTS_OF_HP = 100000;
export const { reach } = FIGHTERS[0].attack;
export const IN_REACH: readonly [number, number] = [0, reach / 2];
export const STRIKING_PART = FIGHTERS[0].attack.strikingParts[0];
export const REFERENCE_SPEED = DUEL_CONFIG.damage.referenceSpeed;
export const BASE_STATS = FIGHTERS[0].stats;
export const COST = DUEL_CONFIG.reactions.staminaCost;
export const ALWAYS: ChanceConfig = { base: 1, perAgility: 0, max: 1 };
export const NEVER_CHANCE: ChanceConfig = { base: 0, perAgility: 0, max: 0 };
/** Aucune réaction : chaque test n'active que celle qu'il vérifie. */
export const CALM: ReactionsConfig = {
  ...DUEL_CONFIG.reactions,
  dodgeChance: NEVER_CHANCE,
  parryChance: NEVER_CHANCE,
  counterChance: NEVER_CHANCE,
  comboChance: NEVER_CHANCE,
};

export type EventName = keyof DuelEvents;
export type Logged = { [K in EventName]: { type: K } & DuelEvents[K] }[EventName];
export const EVENT_NAMES: EventName[] = ['attackStart', 'hit', 'dodge', 'parry', 'counter', 'combo', 'ko', 'duelEnd'];

export function configWith(reactions: Partial<ReactionsConfig>, stats: Partial<StatsConfig> = {}): DuelConfig {
  return { ...DUEL_CONFIG, reactions: { ...CALM, ...reactions }, stats: { ...DUEL_CONFIG.stats, ...stats } };
}

export function withStats(spec: FighterSpec, stats: Partial<FighterStats>): FighterSpec {
  return { ...spec, stats: { ...spec.stats, ...stats } };
}

export interface Setup {
  config?: DuelConfig;
  specs?: readonly [FighterSpec, FighterSpec];
  seed?: number;
  /** Combattants dont les coups touchent. */
  contactsFrom?: readonly number[];
  /** Combattants qui n'attaquent jamais d'eux-mêmes. */
  passive?: readonly number[];
  positions?: readonly [number, number];
}

export function setUp({ config = DUEL_CONFIG, specs = FIGHTERS, seed = SEED, contactsFrom = [0], passive = [], positions = IN_REACH }: Setup = {}) {
  const duel = new Duel(config, specs, createRng(seed));
  const world = new FakeDuelWorld(positions);
  world.contacts = contactsFrom.map((attacker) => punchContact(attacker, STRIKING_PART, REFERENCE_SPEED));
  for (const index of passive) duel.fighters[index].actionTicksLeft = NEVER;
  const log: Logged[] = [];
  for (const type of EVENT_NAMES) duel.events.on(type, (payload) => log.push({ type, ...payload } as Logged));
  const of = <K extends EventName>(type: K) => log.filter((event): event is Extract<Logged, { type: K }> => event.type === type);
  const run = (ticks: number) => {
    for (let tick = 0; tick < ticks && duel.phase === 'running'; tick += 1) duel.update(world);
  };
  const runUntil = (done: () => boolean) => {
    while (!done() && duel.phase === 'running' && duel.tick < MAX_TICKS) duel.update(world);
  };
  return { duel, world, log, of, run, runUntil };
}

/** Bleu, passif et increvable, sert de cible à Rouge. */
export const TARGET = withStats(FIGHTERS[1], { hp: LOTS_OF_HP });
