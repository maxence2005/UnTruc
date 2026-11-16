import type { FxThresholds } from '../../core/presentation-config';

/** Ce qu'un coup déclenche comme effets (calcul pur, sans Phaser). */
export interface HitImpact {
  /** Taille de la gerbe d'étincelles. */
  sparks: 'parried' | 'normal' | 'strong';
  slowmo: boolean;
  shockwave: boolean;
}

/**
 * Classe un coup d'après la part de PV max de la victime qu'il fait perdre.
 * Un coup paré ne donne que de petites étincelles : ni ralenti ni onde de choc.
 */
export function classifyHit(damage: number, parried: boolean, victimMaxHp: number, thresholds: FxThresholds): HitImpact {
  if (parried) return { sparks: 'parried', slowmo: false, shockwave: false };
  const share = victimMaxHp > 0 ? damage / victimMaxHp : 0;
  const slowmo = share >= thresholds.slowmoDamageShare;
  return { sparks: slowmo ? 'strong' : 'normal', slowmo, shockwave: share >= thresholds.shockwaveDamageShare };
}

/** Point entre la partie qui frappe et la victime : `pull` = 0 sur la partie qui frappe, 1 sur la victime. */
export function impactPoint(striker: { x: number; y: number }, victim: { x: number; y: number }, pull: number): { x: number; y: number } {
  return { x: striker.x + (victim.x - striker.x) * pull, y: striker.y + (victim.y - striker.y) * pull };
}
