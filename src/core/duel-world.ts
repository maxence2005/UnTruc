import type { Pose } from './pose';

/** Parties du corps d'un combattant, identifiées de la même façon par la logique, la physique et le rendu. */
export const BODY_PART_NAMES = [
  'torso',
  'head',
  'upperArmFront',
  'foreArmFront',
  'upperArmBack',
  'foreArmBack',
  'thighFront',
  'shinFront',
  'thighBack',
  'shinBack',
] as const;

export type BodyPartName = (typeof BODY_PART_NAMES)[number];

/** Position et angle monde d'une partie du corps (lecture seule). */
export interface PartTransform {
  x: number;
  y: number;
  angle: number;
}

/** Ordres donnés par la logique à la physique pour un combattant, à chaque tick. */
export interface FighterIntent {
  /** Pose que les muscles cherchent à atteindre. */
  pose: Pose;
  /** Vitesse horizontale voulue du bassin quand le combattant est au sol (signée, monde). */
  walkVelocity: number;
  /** Force globale des muscles : 0 = pantin mou, 1 = pleine force. */
  strength: number;
  /** Force du maintien debout : 0 = aucun. */
  support: number;
  /** Multiplicateur de force des muscles des bras (coups). */
  armBoost: number;
}

/** Contact entre deux parties de combattants différents, relevé pendant un pas physique. */
export interface ContactReport {
  fighterA: number;
  partA: BodyPartName;
  fighterB: number;
  partB: BodyPartName;
  /** Vitesse relative des deux corps, en px par pas. */
  relativeSpeed: number;
}

/**
 * Ce que la logique du duel attend de la physique. Défini dans `core` pour que
 * `core` ne dépende pas de l'adaptateur Matter ; `physics/` l'implémente.
 */
export interface DuelWorld {
  /** Donne ses ordres à un combattant pour le prochain pas. */
  drive(fighter: number, intent: FighterIntent): void;
  /** Avance la physique d'un pas fixe. */
  step(): void;
  /** Position x du bassin d'un combattant. */
  fighterX(fighter: number): number;
  /** Rend les contacts relevés depuis le dernier appel, puis les oublie. */
  drainContacts(): ContactReport[];
  /** Position et angle d'une partie du corps (lecture seule). */
  readPart(fighter: number, part: BodyPartName): PartTransform;
  /** Tous les nombres décrivant l'état physique, dans un ordre stable (pour l'empreinte). */
  snapshot(): number[];
}
