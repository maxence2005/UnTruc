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

/** Rythme des tours, en millisecondes. */
export interface TurnConfig {
  firstDelayMs: number;
  gapMs: number;
  approachTimeoutMs: number;
}

/** Configuration générale d'un duel. */
export interface DuelConfig {
  stepHz: number;
  /** Plafond du temps réel pris en compte par image (onglet caché, ralentissement). */
  maxFrameMs: number;
  /** Temps simulé après le KO avant de figer le duel. */
  endSettleMs: number;
  /** Vitesse relative minimale (px par pas) pour qu'un contact compte comme un coup. */
  minHitSpeed: number;
  seedDefault: number;
  arena: ArenaConfig;
  turn: TurnConfig;
  physics: PhysicsTuning;
}

/** Convertit des millisecondes en nombre de ticks de simulation (au moins 1). */
export function msToTicks(ms: number, stepHz: number): number {
  return Math.max(1, Math.round((ms * stepHz) / 1000));
}
