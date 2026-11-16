import type { WeaponSpec } from '../../core/weapon-spec';
import { ARM_YELLOW, STEEL } from './colors';

/**
 * Épée : une main, légère (poids ~0,9 : à peine plus qu'un bras), longue lame fine.
 * Taille de haut en bas : le bras monte derrière la tête, puis la lame tombe vers l'avant.
 */
export const SWORD: WeaponSpec = {
  id: 'sword',
  name: 'Épée',
  hands: 1,
  pieces: [
    { x: 0, y: 0, width: 6, length: 12, density: 0.002, radius: 2, color: ARM_YELLOW },
    { x: 0, y: 12, width: 20, length: 5, density: 0.003, radius: 2, color: ARM_YELLOW },
    { x: 0, y: 17, width: 7, length: 62, density: 0.0015, radius: 3, color: STEEL },
  ],
  mainGrip: { at: 6, stiffness: 1 },
  friction: 0.4,
  frictionAir: 0.02,
  restitution: 0.05,
  wrist: { kp: 0.3, kd: 0.5, pivotAtJoint: true, reaction: true },
  maxSpeed: 16,
  stancePose: {},
  stanceAngle: 1.4,
  // Garde haute : bras levé devant le visage, lame en travers au-dessus de la tête.
  guard: { pose: { shoulderFront: 2.3, elbowFront: 0.9, lean: -0.05 }, angle: 1.5 },
  attack: {
    reach: 115,
    windupMs: 230,
    strikeMs: 210,
    recoveryMs: 340,
    windupPose: { shoulderFront: 2.7, elbowFront: 0.8, lean: -0.2, crouch: 8 },
    strikePose: { shoulderFront: 1.55, elbowFront: 0.1, lean: 0.25, crouch: 8 },
    windupAngle: 0.9,
    strikeAngle: 0.05,
    kick: { forward: 3, down: 3, spin: 0 },
    lungeSpeed: 2.5,
    strikeArmBoost: 2,
    damage: 14,
    strikingParts: ['weapon'],
  },
};
