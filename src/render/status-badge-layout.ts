import type { StatusBadgeLook } from '../core/status-presentation';

/** Où dessiner le contenu d'une pastille, relatif à son centre (px). */
export interface BadgeParts {
  /** Le carré : coin haut gauche et côté. */
  boxX: number;
  boxY: number;
  boxSize: number;
  /** Centre du rond de la goutte et son rayon (la pointe monte au-dessus). */
  glyphX: number;
  glyphY: number;
  glyphRadius: number;
  /** Centre du chiffre des charges, dans le coin bas droit. */
  countX: number;
  countY: number;
}

/**
 * Mise en page d'une pastille de statut (`StatusBadge`), relative à son centre. Fonction pure,
 * calculée une fois par pastille.
 *
 * @example const parts = badgeParts(look.badge); // parts.countX, parts.glyphRadius...
 */
export function badgeParts(look: StatusBadgeLook): BadgeParts {
  const half = look.size / 2;
  return {
    boxX: -half,
    boxY: -half,
    boxSize: look.size,
    glyphX: 0,
    glyphY: look.size * look.glyphDropShare,
    glyphRadius: look.size * look.glyphShare,
    countX: half - look.countInset,
    countY: half - look.countInset,
  };
}

/**
 * Décalage horizontal du centre de la pastille `index` d'une rangée qui part d'un bord (celui de la
 * barre de vie) vers `direction` : +1 vers la droite, −1 vers la gauche (miroir du combattant de
 * droite). `size + gap` entre deux centres. Fonction pure, sans allocation.
 *
 * @example x = row.x + badgeRowX(i, row.direction, look.size, look.gap);
 */
export function badgeRowX(index: number, direction: 1 | -1, size: number, gap: number): number {
  return direction * (size / 2 + index * (size + gap));
}
