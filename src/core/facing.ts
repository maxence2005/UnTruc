import { msToTicks } from './duel-config';
import type { FighterState } from './fighter-state';

/** Direction du regard : 1 = vers la droite de l'écran, -1 = vers la gauche. */
export type Facing = 1 | -1;

/** Réglages du retournement : le combattant fait toujours face à l'adversaire, sans clignoter quand ils se superposent. */
export interface FacingConfig {
  /** Écart horizontal (px, entre bassins) en deçà duquel le côté de l'adversaire est jugé incertain : le regard ne change pas. */
  turnMargin: number;
  /** Temps (ms) pendant lequel l'adversaire doit rester franchement de l'autre côté avant le demi-tour. */
  turnDelayMs: number;
}

/** Ce que le retournement lit et écrit d'un combattant. */
export interface Turner {
  facing: Facing;
  /** Ticks consécutifs passés avec l'adversaire franchement derrière soi. */
  turnTicks: number;
  readonly state: FighterState;
}

/** Côté où se trouve l'adversaire, ou le regard courant s'il est dans la marge (superposés). */
export function wantedFacing(selfX: number, opponentX: number, current: Facing, turnMargin: number): Facing {
  const dx = opponentX - selfX;
  if (dx > turnMargin) return 1;
  if (dx < -turnMargin) return -1;
  return current;
}

/**
 * Un tick de retournement : l'adversaire franchement derrière soi pendant
 * `turnDelayMs` donne un demi-tour. Pas de demi-tour au milieu d'une attaque (le
 * geste lancé va au bout, le compteur continue) ni une fois KO.
 * Implémente la décision « regard » de la story 002 (2026-11-14).
 */
export function updateFacing(fighter: Turner, selfX: number, opponentX: number, config: FacingConfig, stepHz: number): void {
  if (fighter.state === 'ko') return;
  if (wantedFacing(selfX, opponentX, fighter.facing, config.turnMargin) === fighter.facing) {
    fighter.turnTicks = 0;
    return;
  }
  fighter.turnTicks += 1;
  if (fighter.turnTicks >= msToTicks(config.turnDelayMs, stepHz) && fighter.state !== 'attack') {
    fighter.facing = fighter.facing === 1 ? -1 : 1;
    fighter.turnTicks = 0;
  }
}
