import type * as Phaser from 'phaser';
import type { PhysicsTuning } from '../core/duel-config';
import type { FighterIntent } from '../core/duel-world';
import type { BodySpec, MuscleGain, MuscleSpec } from '../core/fighter-spec';
import type { AnchoredPart, Ragdoll } from './ragdoll';

type Matter = Phaser.Physics.Matter.MatterPhysics;

function wrapAngle(angle: number): number {
  const turn = 2 * Math.PI;
  return angle - turn * Math.floor((angle + Math.PI) / turn);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Vitesse angulaire visée par le muscle PD : tirée vers `kp * erreur`, à la vitesse `kd * force`. */
function pdAngularVelocity(bone: MatterJS.BodyType, targetAngle: number, gain: MuscleGain, strength: number, boost: number): number {
  const wanted = wrapAngle(targetAngle - bone.angle) * gain.kp * boost;
  const blend = clamp(gain.kd * strength, 0, 1);
  return bone.angularVelocity + (wanted - bone.angularVelocity) * blend;
}

/**
 * Muscle d'un os (voir `Anchor` : `pinX`/`pinY` est son point d'attache, en repère de l'os). Avec
 * `pivotAtJoint`, l'os tourne autour de ce point et non autour de son centre : sans ça, la
 * contrainte Matter annule une bonne part de la rotation à chaque pas et un bras n'arrive
 * jamais à l'horizontale. Sert aux os du corps et à l'arme tenue.
 */
export function driveBone(
  matter: Matter,
  bone: MatterJS.BodyType,
  parent: MatterJS.BodyType,
  anchor: { pinX: number; pinY: number },
  targetAngle: number,
  gain: MuscleGain,
  strength: number,
  boost: number,
): void {
  if (strength <= 0) return;
  const omega = pdAngularVelocity(bone, targetAngle, gain, strength, boost);
  matter.body.setAngularVelocity(bone, omega);
  if (!gain.pivotAtJoint) return;
  const cos = Math.cos(bone.angle);
  const sin = Math.sin(bone.angle);
  const jointX = bone.position.x + anchor.pinX * cos - anchor.pinY * sin;
  const jointY = bone.position.y + anchor.pinX * sin + anchor.pinY * cos;
  const parentOmega = parent.angularVelocity;
  const jointVx = parent.velocity.x - parentOmega * (jointY - parent.position.y);
  const jointVy = parent.velocity.y + parentOmega * (jointX - parent.position.x);
  matter.body.setVelocity(bone, {
    x: jointVx - omega * (bone.position.y - jointY),
    y: jointVy + omega * (bone.position.x - jointX),
  });
}

/** Angle d'un os qui pointe de `from` vers `to` (0 = os pendant vers le bas, comme les parties du ragdoll). */
function boneAngle(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.atan2(-(to.x - from.x), to.y - from.y);
}

/**
 * Angles d'un bras à deux os (épaule, coude) qui amènent la main sur `target` : la
 * cinématique inverse à deux segments, coude vers le bas. Une cible hors de portée
 * donne le bras tendu dans sa direction.
 */
export function reachAngles(
  shoulder: { x: number; y: number },
  target: { x: number; y: number },
  upperLength: number,
  foreLength: number,
): { upper: number; fore: number } {
  const distance = Math.min(Math.hypot(target.x - shoulder.x, target.y - shoulder.y), upperLength + foreLength);
  const toTarget = boneAngle(shoulder, target);
  const cosBend = (upperLength * upperLength + distance * distance - foreLength * foreLength) / (2 * upperLength * Math.max(distance, Number.EPSILON));
  const bend = Math.acos(clamp(cosBend, -1, 1));
  const elbowAt = (upper: number) => ({ x: shoulder.x - Math.sin(upper) * upperLength, y: shoulder.y + Math.cos(upper) * upperLength });
  const [first, second] = [toTarget + bend, toTarget - bend];
  const upper = elbowAt(first).y >= elbowAt(second).y ? first : second;
  return { upper, fore: boneAngle(elbowAt(upper), target) };
}

function driveJoint(
  matter: Matter,
  ragdoll: Ragdoll,
  part: AnchoredPart,
  targetAngle: number,
  gain: MuscleGain,
  strength: number,
  boost: number,
): void {
  const anchor = ragdoll.anchors[part];
  driveBone(matter, ragdoll.parts[part], ragdoll.parts[anchor.parent], anchor, targetAngle, gain, strength, boost);
}

/**
 * Applique les ordres de la logique à un ragdoll : angles cibles des
 * articulations (en repère combattant, voir `Pose`), puis maintien debout et
 * marche sur le bassin tant que les pieds touchent le sol. Le sens des angles
 * suit le regard courant (`intent.facing`) : un combattant retourné vise les
 * angles miroirs avec les mêmes os, ses ancres gardant leur place (écart de
 * quelques px seulement, `shoulderOffsetX` et `hipOffsetX`).
 * `backHandTarget` : la main arrière tient une arme à deux mains ; son bras ne vise pas
 * sa pose mais va chercher ce point du manche (voir `reachAngles`), sinon il tirerait
 * l'arme hors de la main avant.
 */
export function applyIntent(
  matter: Matter,
  ragdoll: Ragdoll,
  intent: FighterIntent,
  muscles: MuscleSpec,
  body: BodySpec,
  tuning: PhysicsTuning,
  groundY: number,
  backHandTarget?: { x: number; y: number },
): void {
  const { parts } = ragdoll;
  const { pose, strength, armBoost, facing } = intent;
  const forward = -facing;
  if (strength > 0) {
    matter.body.setAngularVelocity(parts.torso, pdAngularVelocity(parts.torso, facing * pose.lean, muscles.torso, strength, 1));
  }
  const joint = (part: AnchoredPart, target: number, gain: MuscleGain, boost: number) =>
    driveJoint(matter, ragdoll, part, target, gain, strength, boost);

  joint('head', parts.torso.angle + facing * pose.head, muscles.head, 1);
  joint('upperArmFront', parts.torso.angle + forward * pose.shoulderFront, muscles.arm, armBoost);
  joint('foreArmFront', parts.upperArmFront.angle + forward * pose.elbowFront, muscles.arm, armBoost);
  if (backHandTarget === undefined) {
    joint('upperArmBack', parts.torso.angle + forward * pose.shoulderBack, muscles.arm, 1);
    joint('foreArmBack', parts.upperArmBack.angle + forward * pose.elbowBack, muscles.arm, 1);
  } else {
    const upper = parts.upperArmBack;
    const half = body.upperArm / 2;
    const shoulder = { x: upper.position.x + Math.sin(upper.angle) * half, y: upper.position.y - Math.cos(upper.angle) * half };
    const reach = reachAngles(shoulder, backHandTarget, body.upperArm, body.foreArm);
    joint('upperArmBack', reach.upper, muscles.arm, 1);
    joint('foreArmBack', reach.fore, muscles.arm, 1);
  }
  joint('thighFront', forward * pose.hipFront, muscles.leg, 1);
  joint('shinFront', parts.thighFront.angle + facing * pose.kneeFront, muscles.leg, 1);
  joint('thighBack', forward * pose.hipBack, muscles.leg, 1);
  joint('shinBack', parts.thighBack.angle + facing * pose.kneeBack, muscles.leg, 1);

  if (intent.support <= 0 || !feetOnGround(ragdoll, body, tuning, groundY)) return;
  const { torso } = parts;
  const targetY = ragdoll.standTorsoY + pose.crouch;
  const wantedVy = clamp((targetY - torso.position.y) * tuning.supportGain, -tuning.supportMaxRise, tuning.supportMaxFall);
  const blend = tuning.supportBlend * intent.support;
  matter.body.setVelocity(torso, {
    x: torso.velocity.x + (intent.walkVelocity - torso.velocity.x) * tuning.walkBlend * intent.support,
    y: torso.velocity.y + (wantedVy - torso.velocity.y) * blend,
  });
}

function feetOnGround(ragdoll: Ragdoll, body: BodySpec, tuning: PhysicsTuning, groundY: number): boolean {
  const footReach = body.shin / 2 + body.legWidth / 2;
  const lowest = Math.max(
    ragdoll.parts.shinFront.position.y + Math.cos(ragdoll.parts.shinFront.angle) * footReach,
    ragdoll.parts.shinBack.position.y + Math.cos(ragdoll.parts.shinBack.angle) * footReach,
  );
  return lowest >= groundY - tuning.groundTolerance;
}
