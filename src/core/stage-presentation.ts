import type { CosmeticSpec } from './cosmetic-spec';

/**
 * Ce que le spectateur voit d'un stade de compétence à déclenchement (story 005) : `SkillLook.stages`,
 * indexé par l'identifiant du stade (`skillTrigger.stage`). Le type vit dans `core` comme
 * `PresentationConfig` ; `content/presentation.ts` le remplit. Couleurs 0xRRGGBB, tailles en px, durées en ms.
 */

/** Onde d'arène (grognement) : anneaux qui traversent tout le terrain, et tremblement d'écran. */
export interface ArenaWaveLook {
  rings: number;
  /** Écart entre deux anneaux (ms). */
  ringDelayMs: number;
  lineWidth: number;
  color: number;
  alpha: number;
  /** Intensité du tremblement de caméra Phaser à `arena.intensity` = 1 (part de l'écran). */
  shakeIntensity: number;
  /** Arcs de voix devant la bouche du grogneur, pendant `mouthMs`. */
  mouthArcs: number;
  mouthRadius: number;
  mouthSpreadDeg: number;
  mouthMs: number;
}

/** Griffures laissées à l'impact par la forme du stade : traits parallèles qui s'effacent. */
export interface ScratchLook {
  maxShown: number;
  lines: number;
  length: number;
  spacing: number;
  /** Inclinaison des traits (degrés depuis l'horizontale), en miroir selon le côté de l'attaquant. */
  angleDeg: number;
  width: number;
  outlineWidth: number;
  color: number;
  outlineColor: number;
  /** Temps pour tracer les traits, puis durée totale avant disparition. */
  drawMs: number;
  lifeMs: number;
}

/** Éclair autour du combattant au déclenchement : disque qui grandit et s'efface (compte comme un flash). */
export interface StageFlashLook {
  color: number;
  radius: number;
  growth: number;
  alpha: number;
  durationMs: number;
}

/** Un stade : nom affiché, couleur du bandeau, effets et cosmétiques posés. */
export interface StageLook {
  name: string;
  color: number;
  flash?: StageFlashLook;
  /** Éclat de particules : nombre et couleurs (les autres réglages sont ceux de `fx.sparks`). */
  burst?: { count: number; colors: readonly number[]; spreadDeg: number };
  /** Court ralenti (`fx.slowmo`). */
  slowmo?: boolean;
  arena?: ArenaWaveLook;
  /** Cosmétiques posés au déclenchement, gardés jusqu'à la fin du duel. */
  cosmetics?: readonly CosmeticSpec[];
  /** Griffures des coups portés sous cette forme (`hit.form` = id du stade). */
  scratches?: ScratchLook;
}

/** Limite commune des flashs des stades (accessibilité : 3 par seconde au plus). */
export interface StageFlashLimit {
  maxFlashes: number;
  windowMs: number;
}
