/**
 * Pose cible d'un combattant, en radians, du point de vue du combattant :
 * une valeur positive va vers l'avant (vers l'adversaire). C'est la couche
 * physique qui convertit en angles monde selon la direction du regard.
 *
 * - lean : inclinaison du torse vers l'avant
 * - head : inclinaison de la tête par rapport au torse
 * - shoulder : bras levé vers l'avant, par rapport au torse
 * - elbow : flexion de l'avant-bras vers l'avant, par rapport au bras
 * - hip : jambe portée vers l'avant, par rapport à la verticale du monde
 * - knee : flexion du genou (le tibia part vers l'arrière), par rapport à la cuisse
 * - crouch : abaissement du bassin, en pixels
 */
export interface Pose {
  lean: number;
  head: number;
  shoulderFront: number;
  elbowFront: number;
  shoulderBack: number;
  elbowBack: number;
  hipFront: number;
  kneeFront: number;
  hipBack: number;
  kneeBack: number;
  crouch: number;
}

/** Interpolation linéaire entre deux poses (t dans [0, 1]). */
export function lerpPose(from: Pose, to: Pose, t: number): Pose {
  const mix = (a: number, b: number): number => a + (b - a) * t;
  return {
    lean: mix(from.lean, to.lean),
    head: mix(from.head, to.head),
    shoulderFront: mix(from.shoulderFront, to.shoulderFront),
    elbowFront: mix(from.elbowFront, to.elbowFront),
    shoulderBack: mix(from.shoulderBack, to.shoulderBack),
    elbowBack: mix(from.elbowBack, to.elbowBack),
    hipFront: mix(from.hipFront, to.hipFront),
    kneeFront: mix(from.kneeFront, to.kneeFront),
    hipBack: mix(from.hipBack, to.hipBack),
    kneeBack: mix(from.kneeBack, to.kneeBack),
    crouch: mix(from.crouch, to.crouch),
  };
}
