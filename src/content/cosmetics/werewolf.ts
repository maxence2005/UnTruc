import type { CosmeticSpec } from '../../core/cosmetic-spec';

/**
 * Attributs du loup-garou (story 005, critère 5) : des cosmétiques accrochés aux parties du corps, posés
 * par le stade `transformation` (`content/presentation.ts`) et réutilisables ailleurs. Repère de chaque
 * partie et couches : `core/cosmetic-spec.ts`. Tailles pour le corps de `content/fighters.ts` (tête de
 * rayon 13, torse 30 × 58, avant-bras de 28 et 9 de large). Fourrure gris-brun neutre : le vert
 * transformation (#6FB04A, art bible section 4) reste aux effets ; griffes blanc craie (#F3F5EF).
 */
const FUR = 0x6b5848;
const FUR_LIGHT = 0x8a7462;
const EAR_INNER = 0xc98f86;
const NOSE = 0x22302a;
const CLAW = 0xf3f5ef;

/**
 * Oreilles pointues sur le dessus de la tête, dessinées par-dessus la tête et les cheveux (sinon une
 * coiffure en pics les cache) ; leur base reste sur le haut du crâne, loin des yeux.
 */
export const WOLF_EARS: CosmeticSpec = {
  id: 'wolf-ears',
  part: 'head',
  layer: 2.05,
  polygons: [
    { points: [-13, -7, -3, -13, -13, -33], color: FUR },
    { points: [-11, -11, -6, -13, -11, -27], color: EAR_INNER },
    { points: [-1, -14, 10, -9, 6, -32], color: FUR },
    { points: [1, -13, 8, -10, 6, -26], color: EAR_INNER },
  ],
};

/** Museau qui avance devant le visage, à hauteur de bouche, avec la truffe au bout. */
export const WOLF_SNOUT: CosmeticSpec = {
  id: 'wolf-snout',
  part: 'head',
  layer: 2.1,
  polygons: [
    { points: [6, -3, 20, 0, 21, 6, 8, 10], color: FUR_LIGHT },
    { points: [17, -1, 23, 1, 22, 5, 17, 4], color: NOSE },
  ],
};

/** Trois griffes au bout de la main (avant-bras : la main est en `+y`, à 18 px du centre), penchées vers l'avant. */
function claws(id: string, part: 'foreArmFront' | 'foreArmBack', layer: number): CosmeticSpec {
  const spike = (x: number): number[] => [x - 1.8, 15, x + 1.8, 15, x + 3, 26];
  return { id, part, layer, polygons: [spike(-3.5), spike(0), spike(3.5)].map((points) => ({ points, color: CLAW })) };
}

export const WOLF_CLAWS_FRONT: CosmeticSpec = claws('wolf-claws-front', 'foreArmFront', 3.1);
export const WOLF_CLAWS_BACK: CosmeticSpec = claws('wolf-claws-back', 'foreArmBack', 0.1);

/** Queue au bas du dos, derrière le torse : 6 segments de 7 px, rappelés vers l'arrière et un peu vers le haut. */
export const WOLF_TAIL: CosmeticSpec = {
  id: 'wolf-tail',
  part: 'torso',
  layer: 0.9,
  chain: {
    segments: 6,
    segmentLength: 7,
    width: 9,
    tipShare: 0.35,
    color: FUR,
    anchor: { x: -12, y: 22 },
    rest: { x: -1, y: -0.35 },
    stiffness: 0.12,
    damping: 0.92,
    gravity: 900,
    stepMs: 1000 / 120,
  },
};

/** Tout le loup-garou, dans l'ordre de pose. */
export const WEREWOLF_COSMETICS: readonly CosmeticSpec[] = [WOLF_TAIL, WOLF_CLAWS_BACK, WOLF_EARS, WOLF_SNOUT, WOLF_CLAWS_FRONT];
