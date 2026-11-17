import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { BLEED } from '../../../src/content/statuses';
import { Duel } from '../../../src/core/duel';
import type { DuelConfig } from '../../../src/core/duel-config';
import type { DuelEvents } from '../../../src/core/events';
import type { Fighter } from '../../../src/core/fighter';
import { createRng } from '../../../src/core/rng';
import type { StatusSpec } from '../../../src/core/status-spec';
import { FakeDuelWorld } from '../duel/fake-duel-world';
import { FIGHTERS } from '../duel/plain-fighters';
import { configWith, IN_REACH, NEVER, SEED } from '../duel/reaction-fixtures';

/** Le saignement du jeu, retouché pour un test. */
export function bleedWith(patch: Partial<StatusSpec> = {}): StatusSpec {
  return { ...BLEED, ...patch };
}

/** Durée d'une charge, en ticks. */
export function chargeTicks(spec: StatusSpec, config: DuelConfig = DUEL_CONFIG): number {
  return Math.round((spec.chargeDurationMs * config.stepHz) / 1000);
}

const LOGGED = ['statusApplied', 'statusTick', 'statusExpired', 'hit', 'ko', 'duelEnd'] as const;

/**
 * Duel de deux combattants passifs (ils n'attaquent jamais) dans un monde factice :
 * seuls les statuts que le test applique changent l'état.
 */
export function statusDuel(config: DuelConfig = configWith({})) {
  const duel = new Duel(config, FIGHTERS, createRng(SEED));
  for (const fighter of duel.fighters) fighter.actionTicksLeft = NEVER;
  const world = new FakeDuelWorld(IN_REACH);
  const events: { type: string; payload: unknown }[] = [];
  for (const type of LOGGED) duel.events.on(type, (payload) => events.push({ type, payload }));
  const of = <K extends keyof DuelEvents>(type: K) => events.filter((event) => event.type === type).map((event) => event.payload as DuelEvents[K]);
  const [red, blue] = duel.fighters;
  const bleed = (victim: Fighter, spec: StatusSpec, charges = 1) => duel.statuses.apply(victim === red ? blue : red, victim, [{ status: spec, charges }], world);
  const run = (ticks: number) => {
    for (let i = 0; i < ticks && duel.phase !== 'over'; i += 1) {
      for (const fighter of duel.fighters) fighter.actionTicksLeft = NEVER;
      duel.update(world);
    }
  };
  return { duel, world, of, red, blue, bleed, run };
}

/** Charges actives d'un statut sur un combattant (0 s'il n'en a pas). */
export function chargesOf(fighter: Fighter, id: string): number {
  return fighter.statuses.find((active) => active.spec.id === id)?.chargeTicks.length ?? 0;
}
