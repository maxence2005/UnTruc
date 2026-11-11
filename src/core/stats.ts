import type { DuelConfig } from './duel-config';
import { msToTicks } from './duel-config';

/**
 * Les dix stats d'un combattant (stories 008 et 009). Branchées dans le duel :
 * `hp`, `physicalPower`, `weight`, `stamina`, `recovery`, `agility`, `speed`.
 * Les autres sont portées par les données et l'état, lues plus tard
 * (puissance magique, mana, intelligence : story 004).
 */
export interface FighterStats {
  /** Points de vie maximaux. */
  hp: number;
  /** Multiplie les dégâts des coups physiques (rapporté à `referencePhysicalPower`). */
  physicalPower: number;
  /** Dégâts des compétences magiques (non branchée). */
  magicPower: number;
  /** Réserve d'endurance au départ et son plafond ; chaque action et réaction en dépense. */
  stamina: number;
  /** Récupération d'endurance : endurance regagnée par seconde × `staminaRegenPerRecovery`. */
  recovery: number;
  /** Réserve de mana au départ (non dépensée dans le duel pour l'instant). */
  mana: number;
  /** Chances d'esquive, de parade, de contre-attaque et d'enchaînement (`ReactionsConfig`). */
  agility: number;
  /** Raccourcit le délai entre deux actions (rapportée à `referenceActionSpeed`). */
  speed: number;
  /** Masse du corps, résistance à l'étourdissement et au recul, lenteur de marche (rapportée à `referenceWeight`). */
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Facteur du délai entre deux actions : vitesse de référence / vitesse, borné par la config (1 à la vitesse de référence). */
export function actionDelayScale(config: DuelConfig, stats: FighterStats): number {
  const { referenceActionSpeed, minDelayScale, maxDelayScale } = config.stats;
  return clamp(referenceActionSpeed / stats.speed, minDelayScale, maxDelayScale);
}

/** Facteur de vitesse de marche : (poids de référence / poids) ^ exposant, borné par la config. Un lourd marche plus lentement. */
export function walkSpeedScale(config: DuelConfig, stats: FighterStats): number {
  const { referenceWeight, walkWeightExponent, minWalkScale, maxWalkScale } = config.stats;
  return clamp((referenceWeight / stats.weight) ** walkWeightExponent, minWalkScale, maxWalkScale);
}

/**
 * Vitesse de recul (px par pas) donnée à la victime d'un coup :
 * `knockbackSpeed` × facteur d'impact × (poids attaquant / poids victime), ce rapport étant borné.
 */
export function knockbackSpeed(config: DuelConfig, impactSpeed: number, attacker: FighterStats, victim: FighterStats): number {
  const { minKnockbackRatio, maxKnockbackRatio } = config.stats;
  const weightRatio = clamp(massScale(config, attacker) / massScale(config, victim), minKnockbackRatio, maxKnockbackRatio);
  return config.stats.knockbackSpeed * impactFactor(config, impactSpeed) * weightRatio;
}

/** Endurance regagnée par tick : `staminaRegenPerRecovery` × récupération, par seconde. */
export function staminaRegenPerTick(config: DuelConfig, stats: FighterStats): number {
  return (config.stats.staminaRegenPerRecovery * stats.recovery) / config.stepHz;
}
