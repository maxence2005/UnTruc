import type * as Phaser from 'phaser';
import { BODY_PART_NAMES, type WeaponIntent } from '../core/duel-world';
import type { Facing } from '../core/facing';
import type { FighterSpec } from '../core/fighter-spec';
import { weaponLength, type WeaponSpec } from '../core/weapon-spec';
import { driveBone } from './muscles';
import type { Ragdoll } from './ragdoll';
import { spreadReaction } from './reaction';

type Matter = Phaser.Physics.Matter.MatterPhysics;

/** Catégorie de collision des armes : elles heurtent les corps et le sol, jamais une autre arme. */
const WEAPON_CATEGORY = 0x0002;
const EVERYTHING_BUT_WEAPONS = 0xffffffff ^ WEAPON_CATEGORY;

/** Arme tenue : un corps Matter composé (un rectangle par morceau), accroché à la main par une ou deux articulations. */
export interface WeaponBody {
  spec: WeaponSpec;
  body: MatterJS.BodyType;
  /** Point de prise principale, en repère local du corps de l'arme (angle 0). */
  mainPin: { pinX: number; pinY: number };
  /** Distance du centre de masse au bout le plus éloigné de l'arme : sert à plafonner la vitesse de la pointe. */
  tipRadius: number;
  /** Point de la seconde prise, en repère local du corps de l'arme (angle 0) ; absent à une main. */
  offPin?: { pinX: number; pinY: number };
}

/**
 * Construit l'arme et l'accroche à l'avant-bras avant au point de prise, par une
 * contrainte de longueur nulle comme les articulations du corps. C'est la seule
 * articulation : à deux mains, la main arrière suit le manche (`offGripPoint`, visé par
 * ses muscles dans `applyIntent`) sans y être attachée, car un second lien arrachait
 * l'arme de la main avant. L'arme naît tendue vers l'avant, à l'horizontale, pour ne
 * pas toucher le sol ; les muscles la mettent en garde dès le premier pas.
 * L'arme entre dans le groupe de collision de son porteur et dans sa propre catégorie.
 */
export function buildWeapon(matter: Matter, fighter: FighterSpec, ragdoll: Ragdoll): WeaponBody {
  const spec = fighter.weapon!;
  const filter = { group: ragdoll.group, category: WEAPON_CATEGORY, mask: EVERYTHING_BUT_WEAPONS };
  const pieces = spec.pieces.map((piece) =>
    matter.bodies.rectangle(piece.x, piece.y + piece.length / 2, piece.width, piece.length, {
      density: piece.density,
      friction: spec.friction,
      frictionAir: spec.frictionAir,
      restitution: spec.restitution,
      collisionFilter: filter,
    }),
  );
  const body = matter.body.create({ parts: pieces, collisionFilter: { ...filter } });
  for (const part of body.parts) part.collisionFilter = { ...filter };

  const centerX = body.position.x;
  const centerY = body.position.y;
  const local = (at: number) => ({ x: -centerX, y: at - centerY });
  const angle = -ragdoll.builtFacing * (Math.PI / 2);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rotate = (v: { x: number; y: number }) => ({ x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos });

  const mainLocal = local(spec.mainGrip.at);
  const front = ragdoll.parts.foreArmFront;
  const handY = front.position.y + fighter.body.foreArm / 2;
  matter.body.setAngle(body, angle);
  const offset = rotate(mainLocal);
  matter.body.setPosition(body, { x: front.position.x - offset.x, y: handY - offset.y });
  matter.world.add(body);

  const handPin = { x: 0, y: fighter.body.foreArm / 2 };
  matter.add.constraint(front, body, 0, spec.mainGrip.stiffness, { pointA: handPin, pointB: rotate(mainLocal) });
  const length = weaponLength(spec);
  const tipRadius = Math.max(Math.hypot(centerX, centerY), Math.hypot(centerX, length - centerY));
  const offLocal = spec.offGrip === undefined ? undefined : local(spec.offGrip.at);
  const offPin = offLocal === undefined ? undefined : { pinX: offLocal.x, pinY: offLocal.y };
  return { spec, body, mainPin: { pinX: mainLocal.x, pinY: mainLocal.y }, tipRadius, offPin };
}

/**
 * Écarts actuels (px) entre chaque main et le point du manche qu'elle doit tenir :
 * `main` pour la main avant (articulation : doit rester proche de 0), `off` pour la main
 * arrière d'une arme à deux mains (elle suit le manche et peut décrocher quand le point
 * est hors de portée). Sert à la sonde de debug, jamais aux règles.
 */
export function gripGaps(ragdoll: Ragdoll, weapon: WeaponBody, foreArm: number): { main: number; off?: number } {
  const handOf = (bone: MatterJS.BodyType) => ({
    x: bone.position.x - Math.sin(bone.angle) * (foreArm / 2),
    y: bone.position.y + Math.cos(bone.angle) * (foreArm / 2),
  });
  const { body, mainPin } = weapon;
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  const grip = { x: body.position.x + mainPin.pinX * cos - mainPin.pinY * sin, y: body.position.y + mainPin.pinX * sin + mainPin.pinY * cos };
  const front = handOf(ragdoll.parts.foreArmFront);
  const main = Math.hypot(grip.x - front.x, grip.y - front.y);
  const offPoint = offGripPoint(weapon);
  if (offPoint === undefined) return { main };
  const back = handOf(ragdoll.parts.foreArmBack);
  return { main, off: Math.hypot(offPoint.x - back.x, offPoint.y - back.y) };
}

/** Position actuelle de la seconde prise dans le monde, ou rien pour une arme à une main. */
export function offGripPoint(weapon: WeaponBody): { x: number; y: number } | undefined {
  if (weapon.offPin === undefined) return undefined;
  const { body, offPin } = weapon;
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  return { x: body.position.x + offPin.pinX * cos - offPin.pinY * sin, y: body.position.y + offPin.pinX * sin + offPin.pinY * cos };
}

/**
 * Applique les ordres à l'arme : le muscle du poignet vise l'angle voulu par
 * rapport à l'avant-bras avant, puis l'élan éventuel s'ajoute à la vitesse du
 * corps de l'arme. Si le poignet déclare `reaction`, la poussée qu'il donne à l'arme est
 * rendue à tout le combattant (voir `spreadReaction`) ; l'élan, lui, n'est pas compensé.
 * Aucune force propre au poids : l'arme pèse par sa densité,
 * et c'est l'articulation qui entraîne (ou non) le bras. `facing` est le regard
 * courant du porteur. Si l'arme déclare `maxSpeed`, sa vitesse est ramenée sous ce
 * plafond après l'élan, et sa rotation aussi, pour que la pointe ne le dépasse pas par
 * la seule rotation : une arme trop rapide s'enfonce dans la victime en un pas et
 * la correction de position de Matter la projette.
 */
export function driveWeapon(
  matter: Matter,
  ragdoll: Ragdoll,
  weapon: WeaponBody,
  intent: WeaponIntent,
  facing: Facing,
  strength: number,
  boost: number,
): void {
  const { body, spec } = weapon;
  const forearm = ragdoll.parts.foreArmFront;
  const target = forearm.angle - facing * intent.angle;
  const before = { x: body.velocity.x, y: body.velocity.y };
  driveBone(matter, body, forearm, weapon.mainPin, target, spec.wrist, strength, boost);
  if (spec.wrist.reaction === true) {
    const bodies = [...BODY_PART_NAMES.map((part) => ragdoll.parts[part]), body];
    const pushX = body.mass * (body.velocity.x - before.x);
    const pushY = body.mass * (body.velocity.y - before.y);
    spreadReaction(bodies, pushX, pushY, (moved, velocity) => matter.body.setVelocity(moved, velocity));
  }
  const { kick } = intent;
  if (kick !== null) {
    matter.body.setVelocity(body, { x: body.velocity.x + kick.x, y: body.velocity.y + kick.y });
    matter.body.setAngularVelocity(body, body.angularVelocity + kick.spin);
  }
  if (spec.maxSpeed === undefined) return;
  const speed = Math.hypot(body.velocity.x, body.velocity.y);
  if (speed > spec.maxSpeed) {
    const scale = spec.maxSpeed / speed;
    matter.body.setVelocity(body, { x: body.velocity.x * scale, y: body.velocity.y * scale });
  }
  const maxSpin = spec.maxSpeed / weapon.tipRadius;
  if (Math.abs(body.angularVelocity) > maxSpin) matter.body.setAngularVelocity(body, Math.sign(body.angularVelocity) * maxSpin);
}
