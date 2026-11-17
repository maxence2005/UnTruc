import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { SKILLS } from '../../../src/content/skills';
import { Duel } from '../../../src/core/duel';
import type { DuelConfig } from '../../../src/core/duel-config';
import type { DuelEvents } from '../../../src/core/events';
import type { FighterSpec } from '../../../src/core/fighter-spec';
import { createRng, type Rng } from '../../../src/core/rng';
import type { SkillContext } from '../../../src/core/skill-choice';
import type { SkillProjectile, SkillSpec } from '../../../src/core/skill-spec';
import { FakeDuelWorld } from './fake-duel-world';
import { FIGHTERS } from './plain-fighters';
import { configWith, SEED } from './reaction-fixtures';

export const JUMP = SKILLS.get('jump');
export const FIREBALL = SKILLS.get('fireball');
export const CHARGE = SKILLS.get('charge');
/** Chance d'utiliser une compétence qui passe toujours. */
export const ALWAYS_SKILL = { base: 1, perIntelligence: 0, max: 1 };
/** Combattant plein, à distance 0, sans recharge. */
export const READY: SkillContext = { distance: 0, stamina: 100, mana: 100, hp: 100, maxHp: 100, cooldowns: {} };
/** Assez loin pour la boule de feu, trop loin pour un coup simple. */
export const FAR = 400;
export const SKILL_MAX_TICKS = 2000;

/** RNG qui compte ses tirages, pour vérifier qu'un choix impossible n'en fait aucun. */
export function countingRng(seed: number = SEED): Rng & { draws: number } {
  const inner = createRng(seed);
  const rng = {
    draws: 0,
    next: () => {
      rng.draws += 1;
      return inner.next();
    },
    int: (min: number, max: number) => min + Math.floor(rng.next() * (max - min + 1)),
    range: (min: number, max: number) => min + rng.next() * (max - min),
  };
  return rng;
}

/** La config donnée, où un combattant tente toujours une compétence possible. */
export function skillConfig(base: DuelConfig = DUEL_CONFIG): DuelConfig {
  return { ...base, skills: { ...base.skills, useChance: ALWAYS_SKILL } };
}

/** La compétence avec son projectile retouché (vitesse, durée de vie...). */
export function withProjectile(skill: SkillSpec, patch: Partial<SkillProjectile>): SkillSpec {
  return {
    ...skill,
    timeline: skill.timeline.map((phase) => (phase.projectile === undefined ? phase : { ...phase, projectile: { ...phase.projectile, ...patch } })),
  };
}

const LOGGED = ['skillStart', 'skillCue', 'skillEnd', 'hit', 'noDamage', 'projectileEnd', 'dodge', 'parry', 'counter', 'combo', 'attackStart', 'ko'] as const;

export interface SkillDuelOptions {
  config?: DuelConfig;
  /** Compétences de Bleu ; sans elles, Bleu est passif et n'attaque jamais. */
  blueSkills?: readonly SkillSpec[];
  seed?: number;
}

/** Rouge avec `skills` contre Bleu (passif sauf `blueSkills`) dans un monde factice, à `distance`. */
export function skillDuel(skills: readonly SkillSpec[], distance: number, options: SkillDuelOptions = {}) {
  const { config = skillConfig(configWith({})), blueSkills, seed = SEED } = options;
  const specs: readonly [FighterSpec, FighterSpec] = [{ ...FIGHTERS[0], skills }, { ...FIGHTERS[1], skills: blueSkills ?? [] }];
  const duel = new Duel(config, specs, createRng(seed));
  if (blueSkills === undefined) duel.fighters[1].actionTicksLeft = Number.MAX_SAFE_INTEGER;
  const world = new FakeDuelWorld([0, distance]);
  const events: { type: string; payload: unknown }[] = [];
  for (const type of LOGGED) duel.events.on(type, (payload) => events.push({ type, payload }));
  const of = <K extends keyof DuelEvents>(type: K) => events.filter((event) => event.type === type).map((event) => event.payload as DuelEvents[K]);
  const runUntil = (done: () => boolean) => {
    while (!done() && duel.phase === 'running' && duel.tick < SKILL_MAX_TICKS) duel.update(world);
  };
  const run = (ticks: number) => {
    const end = duel.tick + ticks;
    runUntil(() => duel.tick >= end);
  };
  return { duel, world, of, runUntil, run };
}
