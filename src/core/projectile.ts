import { msToTicks, type DuelConfig } from './duel-config';
import type { DuelWorld } from './duel-world';
import type { Fighter } from './fighter';
import { rollReaction, type Reaction } from './reactions';
import type { Rng } from './rng';
import type { SkillProjectile, SkillSpec } from './skill-spec';

/** Projectile en vol (balistique simple, sans corps physique). Lu par le rendu, jamais modifié par lui. */
export interface Projectile {
  readonly id: number;
  readonly owner: number;
  readonly skill: SkillSpec;
  /** Le projectile de la timeline de `skill`, retenu au lancement. */
  readonly spec: SkillProjectile;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ticksLeft: number;
  reaction: Reaction;
  reactionPlayed: boolean;
  /** Vrai une fois dépassé ou esquivé : il ne menace plus sa cible. */
  passed: boolean;
  /** Vrai une fois la raison du non-coup émise. */
  reported: boolean;
}

/** Ce qu'il faut pour lancer un projectile : qui tire, sur qui, quelle compétence, dans quel duel. */
export interface ProjectileLaunch {
  id: number;
  fighter: Fighter;
  opponent: Fighter;
  skill: SkillSpec;
  spec: SkillProjectile;
  config: DuelConfig;
  rng: Rng;
}

/**
 * Nouveau projectile, parti de `spec.spawnPart` du lanceur droit vers le torse de l'adversaire, à
 * `spec.speed` px par pas. La réaction du défenseur est tirée ici (RNG seedé), une fois pour tout le vol.
 */
export function createProjectile({ id, fighter, opponent, skill, spec, config, rng }: ProjectileLaunch, world: DuelWorld): Projectile {
  const from = world.readPart(fighter.index, spec.spawnPart);
  const to = world.readPart(opponent.index, 'torso');
  const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return {
    id,
    owner: fighter.index,
    skill,
    spec,
    x: from.x,
    y: from.y,
    vx: ((to.x - from.x) / distance) * spec.speed,
    vy: ((to.y - from.y) / distance) * spec.speed,
    ticksLeft: msToTicks(spec.maxFlightMs, config.stepHz),
    reaction: rollReaction(config.reactions, opponent, rng, skill.reactions),
    reactionPlayed: false,
    passed: false,
    reported: false,
  };
}
