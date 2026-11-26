import type { BodyPartName } from './duel-world';

/**
 * Cosmétiques (story 005, critère 5) : des formes accrochées à une partie du corps, réutilisables par
 * toute compétence ou tout combattant. Ce sont des données lues par le rendu seul : un cosmétique ne
 * change jamais le duel (aucun corps physique, aucune collision). Coordonnées en px dans le repère de la
 * partie : `+x` = vers l'avant du combattant (retourné pour qui regarde à gauche), `+y` = vers le bas de la
 * partie au repos (bout de la main pour un avant-bras, bassin pour le torse, menton pour la tête).
 */

/** Une forme pleine cernée d'encre : polygone de points `[x0, y0, x1, y1, ...]`. */
export interface CosmeticPolygon {
  points: readonly number[];
  color: number;
}

/**
 * Queue : petite chaîne simulée côté rendu (inertie et gravité, sans corps Matter). `anchor` : point
 * d'attache dans le repère de la partie ; `rest` : direction de repos (repère de la partie, `+x` avant)
 * vers laquelle chaque segment est rappelé.
 */
export interface CosmeticChain {
  segments: number;
  segmentLength: number;
  /** Épaisseur à la base, puis part de cette épaisseur au bout (effilé). */
  width: number;
  tipShare: number;
  color: number;
  anchor: { x: number; y: number };
  rest: { x: number; y: number };
  /** Rappel vers la direction de repos, par pas (0 = chaîne molle, 1 = raide). */
  stiffness: number;
  /** Part de la vitesse gardée à chaque pas (inertie). */
  damping: number;
  /** Gravité en px/s². */
  gravity: number;
  /** Pas fixe de la simulation (ms) : la chaîne reste stable quel que soit le nombre d'images par seconde. */
  stepMs: number;
}

/** Un cosmétique : ses formes, sa partie d'attache et sa couche de dessin. */
export interface CosmeticSpec {
  id: string;
  part: BodyPartName;
  /** Couche dans le combattant (membres arrière 0, torse 1, tête 2, membres avant 3) : 1.9 passe sous la tête, 2.1 dessus. */
  layer: number;
  polygons?: readonly CosmeticPolygon[];
  chain?: CosmeticChain;
}
