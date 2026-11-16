import type { WeaponSpec } from '../../core/weapon-spec';
import { ARM_YELLOW, STEEL } from './colors';

/**
 * Marteau : deux mains, lourd (poids ~6, dix fois l'épée), grosse tête d'acier au bout
 * du manche. Le poids vit dans la tête : sa densité est celle qui fait traîner les bras.
 */
export const HAMMER: WeaponSpec = {
  id: 'hammer',
  name: 'Marteau',
  hands: 2,
  pieces: [
    { x: 0, y: 0, width: 8, length: 72, density: 0.0012, radius: 3, color: ARM_YELLOW },
    { x: 0, y: 46, width: 34, length: 28, density: 0.006, radius: 4, color: STEEL },
  ],
  mainGrip: { at: 8, stiffness: 1 },
  offGrip: { at: 30 },
  friction: 0.5,
  frictionAir: 0.01,
  restitution: 0.02,
  wrist: { kp: 0.15, kd: 0.3, pivotAtJoint: true, reaction: true },
  maxSpeed: 14,
  stancePose: { shoulderFront: 0.9, elbowFront: 1.3, shoulderBack: 0.8, elbowBack: 1.4, lean: 0.15 },
  stanceAngle: 1.2,
  // Pas de garde : trop lourd pour parer ; son porteur peut seulement esquiver.
  attack: {
    reach: 110,
    windupMs: 380,
    strikeMs: 360,
    recoveryMs: 600,
    windupPose: { shoulderFront: 2.5, elbowFront: 0.6, shoulderBack: 2.5, elbowBack: 0.6, lean: -0.3, crouch: 8 },
    strikePose: { shoulderFront: 1.3, elbowFront: 0.1, shoulderBack: 1.3, elbowBack: 0.1, lean: 0.35, crouch: 14 },
    windupAngle: 0.6,
    strikeAngle: 0.5,
    kick: { forward: 3, down: 6, spin: 0 },
    lungeSpeed: 1.5,
    strikeArmBoost: 2.2,
    damage: 24,
    strikingParts: ['weapon'],
  },
};
