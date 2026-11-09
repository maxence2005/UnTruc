import type { FighterSpec } from '../core/fighter-spec';
import type { Pose } from '../core/pose';

const STANCE: Pose = {
  lean: 0.1,
  head: -0.1,
  shoulderFront: 0.3,
  elbowFront: 1.2,
  shoulderBack: 0.2,
  elbowBack: 1.4,
  hipFront: 0.3,
  kneeFront: 0.4,
  hipBack: -0.3,
  kneeBack: 0.3,
  crouch: 6,
};

const PUNCH_WINDUP: Pose = {
  ...STANCE,
  lean: -0.1,
  shoulderFront: -0.5,
  elbowFront: 1.3,
  crouch: 8,
};

const PUNCH_STRIKE: Pose = {
  ...STANCE,
  lean: 0.3,
  shoulderFront: 1.55,
  elbowFront: 0.05,
  crouch: 10,
};

const SLUMP: Pose = {
  lean: 0.5,
  head: 0.4,
  shoulderFront: 0,
  elbowFront: 0.2,
  shoulderBack: 0,
  elbowBack: 0.2,
  hipFront: 0,
  kneeFront: 0.5,
  hipBack: 0,
  kneeBack: 0.5,
  crouch: 20,
};

const BASE_FIGHTER: Omit<FighterSpec, 'id' | 'name' | 'colors'> = {
  maxHp: 100,
  stunMs: 700,
  body: {
    torsoWidth: 30,
    torsoHeight: 58,
    shoulderInset: 9,
    hipInset: 4,
    shoulderOffsetX: 3,
    hipOffsetX: 3,
    headRadius: 13,
    neckOverlap: 4,
    upperArm: 28,
    foreArm: 28,
    armWidth: 9,
    thigh: 32,
    shin: 32,
    legWidth: 11,
    torsoDensity: 0.0022,
    headDensity: 0.0008,
    armDensity: 0.0012,
    legDensity: 0.0016,
    friction: 0.6,
    frictionAir: 0.02,
    restitution: 0.05,
    torsoCornerRadius: 10,
  },
  muscles: {
    torso: { kp: 0.32, kd: 0.45, pivotAtJoint: false },
    head: { kp: 0.3, kd: 0.35, pivotAtJoint: true },
    arm: { kp: 0.38, kd: 0.5, pivotAtJoint: true },
    leg: { kp: 0.35, kd: 0.5, pivotAtJoint: false },
  },
  stance: STANCE,
  slump: SLUMP,
  walk: { speed: 2.2, cycleMs: 520, hipSwing: 0.6, kneeBend: 0.8, kneeBendPhase: 1.4 },
  attack: {
    reach: 95,
    windupMs: 250,
    strikeMs: 220,
    recoveryMs: 350,
    windupPose: PUNCH_WINDUP,
    strikePose: PUNCH_STRIKE,
    lungeSpeed: 2.5,
    strikeArmBoost: 2,
    damageMin: 8,
    damageMax: 14,
    strikingParts: ['foreArmFront'],
  },
  stateTuning: {
    idle: { strength: 1, support: 1 },
    approach: { strength: 1, support: 1 },
    attack: { strength: 1, support: 1 },
    recovery: { strength: 0.9, support: 1 },
    stunned: { strength: 0.25, support: 0.3 },
    ko: { strength: 0, support: 0 },
  },
};

/** Les deux combattants du duel : même corps, couleurs différentes. */
export const FIGHTERS: readonly [FighterSpec, FighterSpec] = [
  {
    ...BASE_FIGHTER,
    id: 'rouge',
    name: 'Rouge',
    colors: { body: 0xd9534f, limbBack: 0x9c3a37, head: 0xf0c8a0, eye: 0x222222 },
  },
  {
    ...BASE_FIGHTER,
    id: 'bleu',
    name: 'Bleu',
    colors: { body: 0x4a7fd1, limbBack: 0x315590, head: 0xf0c8a0, eye: 0x222222 },
  },
];
