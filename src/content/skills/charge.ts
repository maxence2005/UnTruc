import type { SkillSpec } from '../../core/skill-spec';

/**
 * Charge : le combattant se ramasse, puis fonce au sol sur l'adversaire, épaule en avant, et
 * s'arrête dès qu'il le percute. La plus simple à lire : un trait de poussière au sol, un
 * choc. Se distingue du saut (jamais en l'air) et de la boule de feu (corps à corps).
 * Esquivable et parable. Portée : 260 px au plus (6,5 px par pas pendant 520 ms).
 */
export const CHARGE: SkillSpec = {
  id: 'charge',
  category: 'attack',
  points: 2,
  cost: { stamina: 12, mana: 0 },
  cooldownMs: 5000,
  weight: 3,
  conditions: { minDistance: 140, maxDistance: 260, maxOwnHpShare: 1 },
  reactions: { dodgeable: true, parryable: true },
  hit: { damage: 14, scaling: 'physical', strikingParts: ['torso', 'upperArmFront', 'foreArmFront'] },
  timeline: [
    {
      name: 'brace',
      durationMs: 300,
      pose: { lean: -0.3, crouch: 20, hipFront: 0.6, kneeFront: 0.9, kneeBack: 0.8, shoulderFront: -0.4, shoulderBack: -0.3 },
      cue: 'brace',
    },
    {
      name: 'rush',
      durationMs: 520,
      walkSpeed: 6.5,
      strikeWindow: true,
      endOnHit: true,
      pose: { lean: 0.65, crouch: 14, shoulderFront: 1.2, elbowFront: 1.5, shoulderBack: 1.0, elbowBack: 1.5, hipFront: 0.9, kneeFront: 0.6, hipBack: -0.6 },
      cue: 'rush',
    },
    { name: 'recover', durationMs: 400, pose: {} },
  ],
};
