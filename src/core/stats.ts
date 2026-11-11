import type { DuelConfig } from './duel-config';
import { msToTicks } from './duel-config';

/**
 * Les neuf stats d'un combattant (story-008). Branchées dans le duel :
 * `hp`, `physicalPower`, `weight`. Les autres sont portées par les données et
 * l'état, lues plus tard (agilité, vitesse, endurance : story 009 ;
 * puissance magique, mana, intelligence : story 004).
 */
export interface FighterStats {
  /** Points de vie maximaux. */
  hp: number;
  /** Multiplie les dégâts des coups physiques (rapporté à `referencePhysicalPower`). */
  physicalPower: number;
  /** Dégâts des compétences magiques (non branchée). */
  magicPower: number;
  /** Réserve d'énergie au départ (non dépensée dans le duel pour l'instant). */
  stamina: number;
  /** Réserve de mana au départ (non dépensée dans le duel pour l'instant). */
  mana: number;
  /** Esquive, parade, contre-attaque (non branchée). */
  agility: number;
  /** Délai entre deux actions (non branchée). */
  speed: number;
  /** Masse du corps et résistance à l'étourdissement (rapportée à `referenceWeight`). */
  weight: number;
  /** Qualité d'usage des compétences (non branchée). */
  intelligence: number;
}

/** Facteur de vitesse d'impact : vitesse / vitesse de référence, borné par la config. */
export function impactFactor(config: DuelConfig, impactSpeed: number): number {
  const { referenceSpeed, minFactor, maxFactor } = config.damage;
  return Math.min(maxFactor, Math.max(minFactor, impactSpeed / referenceSpeed));
}

/** Dégâts d'un coup : dégât de base × facteur d'impact × (puissance physique / référence), arrondi à l'entier. */
export function hitDamage(config: DuelConfig, baseDamage: number, impactSpeed: number, attacker: FighterStats): number {
  const powerRatio = attacker.physicalPower / config.stats.referencePhysicalPower;
  return Math.round(baseDamage * impactFactor(config, impactSpeed) * powerRatio);
}

/** Échelle de masse du corps : poids / poids de référence, bornée par la config. S'applique aux densités du ragdoll. */
export function massScale(config: DuelConfig, stats: FighterStats): number {
  const { referenceWeight, minMassScale, maxMassScale } = config.stats;
  return Math.min(maxMassScale, Math.max(minMassScale, stats.weight / referenceWeight));
}

/**
 * Durée d'étourdissement, en ticks : `stunMs` × facteur d'impact du coup /
 * échelle de masse de la victime, bornée entre `minStunMs` et `maxStunMs`.
 */
export function stunTicksFor(config: DuelConfig, stunMs: number, impactSpeed: number, victim: FighterStats): number {
  const { minStunMs, maxStunMs } = config.stats;
  const ms = (stunMs * impactFactor(config, impactSpeed)) / massScale(config, victim);
  return msToTicks(Math.min(maxStunMs, Math.max(minStunMs, ms)), config.stepHz);
}
