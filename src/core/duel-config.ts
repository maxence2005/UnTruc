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
  physics: PhysicsTuning;
}

/** Convertit des millisecondes en nombre de ticks de simulation (au moins 1). */
export function msToTicks(ms: number, stepHz: number): number {
  return Math.max(1, Math.round((ms * stepHz) / 1000));
}
