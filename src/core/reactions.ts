import type { ChanceConfig, ReactionsConfig } from './duel-config';
import type { FighterState } from './fighter-state';
import type { Rng } from './rng';

/** Réaction d'un défenseur à une attaque : aucune, esquive ou parade. */
export type Reaction = 'none' | 'dodge' | 'parry';

/** Ce que les tirages lisent d'un combattant. */
export interface Reactor {
  readonly state: FighterState;
  readonly stamina: number;
  /** Faux si l'arme tenue n'a pas de garde (voir `WeaponSpec.guard`) : pas de parade. */
  readonly canParry: boolean;
  readonly spec: { readonly stats: { readonly agility: number } };
}

/** Chance d'une réaction pour une agilité donnée : `base + perAgility × agilité`, bornée entre 0 et `max`. */
export function reactionChance(chance: ChanceConfig, agility: number): number {
  return Math.min(chance.max, Math.max(0, chance.base + chance.perAgility * agility));
}

/** Vrai si un combattant dans cet état peut esquiver ou parer (ni en pleine attaque, ni sonné, ni KO, ni déjà en réaction). */
export function canReact(state: FighterState): boolean {
  return state === 'idle' || state === 'approach' || state === 'recovery';
}

/** Vrai si le combattant a l'endurance pour payer `cost` et réussit son tirage. Sans l'endurance, aucun tirage n'a lieu. */
export function passes(fighter: Reactor, chance: ChanceConfig, cost: number, rng: Rng): boolean {
  return fighter.stamina >= cost && rng.next() < reactionChance(chance, fighter.spec.stats.agility);
}

/**
 * Décide la réaction du défenseur à une attaque qui commence : esquive d'abord,
 * parade si l'esquive échoue et que le défenseur peut parer, sinon rien. Un défenseur
 * hors d'état de réagir ne tire rien ; un défenseur qui ne peut pas parer ne tire pas la parade.
 */
export function rollReaction(config: ReactionsConfig, defender: Reactor, rng: Rng): Reaction {
  if (!canReact(defender.state)) return 'none';
  if (passes(defender, config.dodgeChance, config.staminaCost.dodge, rng)) return 'dodge';
  if (defender.canParry && passes(defender, config.parryChance, config.staminaCost.parry, rng)) return 'parry';
  return 'none';
}

/**
 * Index du combattant qui prend l'initiative quand les deux sont prêts à
 * frapper au même tick : tirage seedé, pondéré par la stat vitesse de chacun
 * (pile ou face si les deux vitesses sont nulles).
 */
export function initiativeWinner(speeds: readonly [number, number], rng: Rng): 0 | 1 {
  const [first, second] = speeds[0] + speeds[1] > 0 ? speeds : [1, 1];
  return rng.range(0, first + second) < first ? 0 : 1;
}
