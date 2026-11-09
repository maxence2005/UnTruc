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
 * Muscle d'une articulation. Avec `pivotAtJoint`, l'os tourne autour de son point
 * d'attache et non autour de son centre : sans ça, la contrainte Matter annule une
 * bonne part de la rotation à chaque pas et un bras n'arrive jamais à l'horizontale.
 */
function driveJoint(
  matter: Matter,
  ragdoll: Ragdoll,
  part: AnchoredPart,
  targetAngle: number,
  gain: MuscleGain,
  strength: number,
  boost: number,
): void {
  if (strength <= 0) return;
  const bone = ragdoll.parts[part];
  const anchor = ragdoll.anchors[part];
  const parent = ragdoll.parts[anchor.parent];
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

/**
 * Applique les ordres de la logique à un ragdoll : angles cibles des
 * articulations (en repère combattant, voir `Pose`), puis maintien debout et
 * marche sur le bassin tant que les pieds touchent le sol.
 */
export function applyIntent(
  matter: Matter,
  ragdoll: Ragdoll,
  intent: FighterIntent,
  muscles: MuscleSpec,
  body: BodySpec,
  tuning: PhysicsTuning,
  groundY: number,
): void {
  const { parts, facing } = ragdoll;
  const { pose, strength, armBoost } = intent;
  const forward = -facing;
  if (strength > 0) {
    matter.body.setAngularVelocity(parts.torso, pdAngularVelocity(parts.torso, facing * pose.lean, muscles.torso, strength, 1));
  }
  const joint = (part: AnchoredPart, target: number, gain: MuscleGain, boost: number) =>
    driveJoint(matter, ragdoll, part, target, gain, strength, boost);

  joint('head', parts.torso.angle + facing * pose.head, muscles.head, 1);
  joint('upperArmFront', parts.torso.angle + forward * pose.shoulderFront, muscles.arm, armBoost);
  joint('foreArmFront', parts.upperArmFront.angle + forward * pose.elbowFront, muscles.arm, armBoost);
  joint('upperArmBack', parts.torso.angle + forward * pose.shoulderBack, muscles.arm, 1);
  joint('foreArmBack', parts.upperArmBack.angle + forward * pose.elbowBack, muscles.arm, 1);
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
