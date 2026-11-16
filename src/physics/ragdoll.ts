import type * as Phaser from 'phaser';
import type { BodyPartName } from '../core/duel-world';
import type { Facing } from '../core/fighter';
import type { BodySpec } from '../core/fighter-spec';

/** Articulation qui porte une partie : la partie parente et le point d'attache, en repère local de la partie portée. */
export interface Anchor {
  parent: BodyPartName;
  pinX: number;
  pinY: number;
}

/** Parties portées par une articulation (toutes sauf le torse, racine du corps). */
export type AnchoredPart = Exclude<BodyPartName, 'torso'>;

/** Corps Matter d'un combattant : les dix parties, leurs articulations et la hauteur de bassin à tenir debout. */
export interface Ragdoll {
  parts: Record<BodyPartName, MatterJS.BodyType>;
  anchors: Record<AnchoredPart, Anchor>;
  /**
   * Regard à la construction : il place les ancres d'épaule et de hanche avant/arrière, qui
   * gardent ensuite leur côté physique. Le regard courant vient de `FighterIntent.facing`.
   */
  builtFacing: Facing;
  /** Groupe de collision (négatif) du corps : l'arme tenue le partage pour ne pas heurter son porteur. */
  group: number;
  /** Hauteur du centre du torse quand le combattant se tient debout, jambes tendues. */
  standTorsoY: number;
}

/**
 * Construit un ragdoll debout, de profil, dont les pieds touchent le sol.
 * Les articulations sont des contraintes Matter de longueur nulle entre deux
 * points d'ancrage ; les muscles (voir `muscles.ts`) font le reste.
 * `massScale` multiplie toutes les densités : c'est le poids du combattant
 * (voir `massScale` dans `core/stats.ts`).
 */
export function buildRagdoll(
  matter: Phaser.Physics.Matter.MatterPhysics,
  spec: BodySpec,
  x: number,
  groundY: number,
  facing: Facing,
  jointStiffness: number,
  massScale: number,
): Ragdoll {
  const group = matter.world.nextGroup(true);
  const material = (density: number) => ({
    density: density * massScale,
    friction: spec.friction,
    frictionAir: spec.frictionAir,
    restitution: spec.restitution,
    collisionFilter: { group },
  });
  const limb = (cx: number, cy: number, width: number, length: number, density: number) =>
    matter.add.rectangle(cx, cy, width, length + width, {
      ...material(density),
      chamfer: { radius: width / 2 - 0.5 },
    });
  const joint = (
    a: MatterJS.BodyType,
    ax: number,
    ay: number,
    b: MatterJS.BodyType,
    bx: number,
    by: number,
  ) => matter.add.constraint(a, b, 0, jointStiffness, { pointA: { x: ax, y: ay }, pointB: { x: bx, y: by } });

  const hipPinY = groundY - (spec.thigh + spec.shin + spec.legWidth / 2);
  const torsoY = hipPinY - (spec.torsoHeight / 2 - spec.hipInset);
  const shoulderLocalY = -spec.torsoHeight / 2 + spec.shoulderInset;
  const hipLocalY = spec.torsoHeight / 2 - spec.hipInset;
  const shoulderLocalX = { Front: facing * spec.shoulderOffsetX, Back: -facing * spec.shoulderOffsetX };
  const hipLocalX = { Front: facing * spec.hipOffsetX, Back: -facing * spec.hipOffsetX };

  const torso = matter.add.rectangle(x, torsoY, spec.torsoWidth, spec.torsoHeight, {
    ...material(spec.torsoDensity),
    chamfer: { radius: spec.torsoCornerRadius },
  });
  const neckToHead = spec.headRadius - spec.neckOverlap;
  const head = matter.add.circle(x, torsoY - spec.torsoHeight / 2 - neckToHead, spec.headRadius, material(spec.headDensity));
  joint(torso, 0, -spec.torsoHeight / 2, head, 0, neckToHead);

  const arm = (side: 'Front' | 'Back') => {
    const shoulderX = x + shoulderLocalX[side];
    const shoulderY = torsoY + shoulderLocalY;
    const upper = limb(shoulderX, shoulderY + spec.upperArm / 2, spec.armWidth, spec.upperArm, spec.armDensity);
    const fore = limb(shoulderX, shoulderY + spec.upperArm + spec.foreArm / 2, spec.armWidth, spec.foreArm, spec.armDensity);
    joint(torso, shoulderLocalX[side], shoulderLocalY, upper, 0, -spec.upperArm / 2);
    joint(upper, 0, spec.upperArm / 2, fore, 0, -spec.foreArm / 2);
    return { upper, fore };
  };
  const leg = (side: 'Front' | 'Back') => {
    const hipX = x + hipLocalX[side];
    const thigh = limb(hipX, hipPinY + spec.thigh / 2, spec.legWidth, spec.thigh, spec.legDensity);
    const shin = limb(hipX, hipPinY + spec.thigh + spec.shin / 2, spec.legWidth, spec.shin, spec.legDensity);
    joint(torso, hipLocalX[side], hipLocalY, thigh, 0, -spec.thigh / 2);
    joint(thigh, 0, spec.thigh / 2, shin, 0, -spec.shin / 2);
    return { thigh, shin };
  };

  const armFront = arm('Front');
  const armBack = arm('Back');
  const legFront = leg('Front');
  const legBack = leg('Back');

  return {
    builtFacing: facing,
    group,
    standTorsoY: torsoY,
    anchors: {
      head: { parent: 'torso', pinX: 0, pinY: neckToHead },
      upperArmFront: { parent: 'torso', pinX: 0, pinY: -spec.upperArm / 2 },
      foreArmFront: { parent: 'upperArmFront', pinX: 0, pinY: -spec.foreArm / 2 },
      upperArmBack: { parent: 'torso', pinX: 0, pinY: -spec.upperArm / 2 },
      foreArmBack: { parent: 'upperArmBack', pinX: 0, pinY: -spec.foreArm / 2 },
      thighFront: { parent: 'torso', pinX: 0, pinY: -spec.thigh / 2 },
      shinFront: { parent: 'thighFront', pinX: 0, pinY: -spec.shin / 2 },
      thighBack: { parent: 'torso', pinX: 0, pinY: -spec.thigh / 2 },
      shinBack: { parent: 'thighBack', pinX: 0, pinY: -spec.shin / 2 },
    },
    parts: {
      torso,
      head,
      upperArmFront: armFront.upper,
      foreArmFront: armFront.fore,
      upperArmBack: armBack.upper,
      foreArmBack: armBack.fore,
      thighFront: legFront.thigh,
      shinFront: legFront.shin,
      thighBack: legBack.thigh,
      shinBack: legBack.shin,
    },
  };
}
