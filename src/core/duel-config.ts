import type { FacingConfig } from './facing';

/** Réglages de la physique Matter (hors corps des combattants). */
export interface PhysicsTuning {
  gravityY: number;
  positionIterations: number;
  velocityIterations: number;
  constraintIterations: number;
  /** Raideur de l'articulation entre deux parties du corps (0..1). */
  jointStiffness: number;
  /** Gain du maintien debout : vitesse verticale voulue par pixel d'écart de hauteur. */
  supportGain: number;
  /** Vitesse maximale (px par pas) à laquelle le maintien soulève le bassin. */
  supportMaxRise: number;
  /** Vitesse maximale (px par pas) à laquelle le maintien abaisse le bassin. */
  supportMaxFall: number;
  /** Part de l'écart de vitesse corrigée à chaque pas (0..1). */
  supportBlend: number;
  /** Part de l'écart de vitesse horizontale corrigée à chaque pas (0..1). */
  walkBlend: number;
  /** Marge en px sous laquelle un pied compte comme posé au sol. */
  groundTolerance: number;
  /** Friction du sol et des murs. */
  groundFriction: number;
}

/** Arène 2D vue de côté, en pixels. */
export interface ArenaConfig {
  width: number;
  height: number;
  /** Épaisseur de sol visible et physique, en bas de l'écran. */
  groundHeight: number;
  wallThickness: number;
  /** Demi-distance entre les deux combattants au départ. */
  spawnHalfGap: number;
  /** Écart aléatoire maximal (seedé) de la position de départ. */
  spawnJitter: number;
}

/**
 * Rythme des actions, en millisecondes. Chaque combattant a son propre délai
 * avant d'attaquer ; il ne s'écoule que hors attaque et hors étourdissement.
 */
export interface ActionConfig {
  /** Délai avant le premier coup du combattant d'index 0. */
  firstDelayMs: number;
  /** Décalage ajouté au premier délai par index de combattant (évite deux coups strictement synchrones). */
  firstDelayStaggerMs: number;
  /** Délai minimal entre la fin d'un coup (touché ou non) et le suivant. */
  delayBaseMs: number;
  /** Part aléatoire (seedée) ajoutée au délai de base : tirée dans [0, delayRandomMs). */
  delayRandomMs: number;
  /**
   * Marge en px contre l'hésitation en limite de portée : un combattant en
   * marche s'arrête à `reach`, un combattant arrêté ne repart qu'au-delà de
   * `reach + approachResumeMargin` (ou quand son délai d'action est écoulé).
   */
  approachResumeMargin: number;
}

/** Chance d'une réaction : `base + perAgility × agilité`, bornée entre 0 et `max`. */
export interface ChanceConfig {
  base: number;
  perAgility: number;
  max: number;
}

/** Coût en endurance de chaque action et réaction. */
export interface StaminaCostConfig {
  attack: number;
  dodge: number;
  parry: number;
  /** Remplace le coût d'attaque pour une contre-attaque. */
  counter: number;
  /** Remplace le coût d'attaque pour un coup enchaîné. */
  combo: number;
}

/** Esquive, parade, contre-attaque, enchaînement (story-009). */
export interface ReactionsConfig {
  dodgeChance: ChanceConfig;
  /** Tirée seulement si l'esquive a échoué. */
  parryChance: ChanceConfig;
  /** Tirée à la fin d'une esquive ou d'une parade. */
  counterChance: ChanceConfig;
  /** Tirée à la fin d'un coup qui a touché sans être paré. */
  comboChance: ChanceConfig;
  /** Avance du geste du défenseur sur le début de la frappe adverse, en ms. */
  leadMs: number;
  /** Vitesse de recul du bassin pendant une esquive (px par pas). */
  dodgeRetreatSpeed: number;
  /** Facteur appliqué aux dégâts et au recul d'un coup paré (0..1). */
  parryFactor: number;
  /** Nombre maximal de coups d'une même série (premier coup compris). */
  maxComboHits: number;
  staminaCost: StaminaCostConfig;
}

/**
 * Dégâts d'un coup : dégât de base de l'attaque multiplié par
 * (vitesse de l'impact / `referenceSpeed`), borné entre `minFactor` et `maxFactor`.
 */
export interface DamageConfig {
  /** Vitesse relative d'impact (px par pas) qui donne exactement le dégât de base. */
  referenceSpeed: number;
  minFactor: number;
  maxFactor: number;
}

/**
 * Formules des stats : valeurs de référence (qui donnent un facteur de 1) et bornes.
 * Dégâts × `physicalPower / referencePhysicalPower` ; masse du corps ×
 * `weight / referenceWeight` ; étourdissement ÷ ce même facteur de poids.
 */
export interface StatsConfig {
  /** Puissance physique qui donne exactement les dégâts de base. */
  referencePhysicalPower: number;
  /** Poids qui donne exactement la masse de base du ragdoll. */
  referenceWeight: number;
  /** Bornes du facteur de poids (masse du corps et étourdissement). */
  minMassScale: number;
  maxMassScale: number;
  /** Bornes de la durée d'étourdissement d'un coup, en ms. */
  minStunMs: number;
  maxStunMs: number;
  /** Durée totale maximale d'une série d'étourdissements, en ms (voir `Duel`). */
  maxStunSeriesMs: number;
  /** Vitesse qui donne exactement le délai d'action de base. */
  referenceActionSpeed: number;
  /** Bornes du facteur de délai `referenceActionSpeed / speed`. */
  minDelayScale: number;
  maxDelayScale: number;
  /** Vitesse de marche × `(referenceWeight / weight) ^ walkWeightExponent`, bornée ci-dessous. */
  walkWeightExponent: number;
  minWalkScale: number;
  maxWalkScale: number;
  /** Recul (px par pas) donné à la victime par un coup d'impact de référence, à poids égaux. */
  knockbackSpeed: number;
  /** Part du recul envoyée vers le haut (0 = recul à plat). */
  knockbackLift: number;
  /** Bornes du rapport de poids attaquant / victime qui multiplie le recul. */
  minKnockbackRatio: number;
  maxKnockbackRatio: number;
  /** Endurance regagnée par seconde et par point de la stat `recovery`. */
  staminaRegenPerRecovery: number;
}

/** Compétences (story 004) : formules communes ; chaque compétence porte ses propres valeurs (`content/skills/`). */
export interface SkillsConfig {
  /** Puissance magique qui donne exactement le dégât de base d'une compétence magique. */
  referenceMagicPower: number;
  /** Chance de tenter une compétence possible plutôt qu'un coup simple : `base + perIntelligence × intelligence`, bornée entre 0 et `max`. */
  useChance: { base: number; perIntelligence: number; max: number };
}

/** Configuration générale d'un duel. */
export interface DuelConfig {
  /**
   * Pas de simulation par seconde. Les durées en ms s'y adaptent (`msToTicks`),
   * mais les réglages des muscles et du maintien (`kd`, `supportBlend`,
   * `walkBlend`, vitesses en px par pas) sont exprimés par pas : changer cette
   * valeur oblige à les régler de nouveau.
   */
  stepHz: number;
  /** Plafond du temps réel pris en compte par image (onglet caché, ralentissement). */
  maxFrameMs: number;
  /** Temps simulé après le KO avant de figer le duel. */
  endSettleMs: number;
  /** Vitesse relative minimale (px par pas) pour qu'un contact compte comme un coup. */
  minHitSpeed: number;
  seedDefault: number;
  arena: ArenaConfig;
  action: ActionConfig;
  damage: DamageConfig;
  stats: StatsConfig;
  reactions: ReactionsConfig;
  skills: SkillsConfig;
  /** Retournement vers l'adversaire (story 002). */
  facing: FacingConfig;
  physics: PhysicsTuning;
}

/**
 * Refuse une config dont une valeur qui doit être strictement positive ne
 * l'est pas (diviseurs des formules, bornes basses des facteurs) : sans ce
 * contrôle, les dégâts ou la masse deviendraient infinis ou `NaN` sans erreur. Appelée à la création d'un duel.
 */
export function assertDuelConfig(config: DuelConfig): void {
  const positives: Record<string, number> = {
    'damage.referenceSpeed': config.damage.referenceSpeed,
    'stats.referencePhysicalPower': config.stats.referencePhysicalPower,
    'stats.referenceWeight': config.stats.referenceWeight,
    'stats.minMassScale': config.stats.minMassScale,
    'stats.referenceActionSpeed': config.stats.referenceActionSpeed,
    'stats.minDelayScale': config.stats.minDelayScale,
    'stats.minWalkScale': config.stats.minWalkScale,
    'reactions.maxComboHits': config.reactions.maxComboHits,
    'skills.referenceMagicPower': config.skills.referenceMagicPower,
  };
  if (!(config.facing.turnMargin >= 0) || !(config.facing.turnDelayMs >= 0)) {
    throw new Error('Config du duel invalide : facing.turnMargin et facing.turnDelayMs doivent être positifs ou nuls.');
  }
  for (const [name, value] of Object.entries(positives)) {
    if (!(value > 0)) throw new Error(`Config du duel invalide : ${name} doit être strictement positif (reçu ${value}).`);
  }
}

/** Convertit des millisecondes en nombre de ticks de simulation (au moins 1). */
export function msToTicks(ms: number, stepHz: number): number {
  return Math.max(1, Math.round((ms * stepHz) / 1000));
}
