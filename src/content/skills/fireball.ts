import type { SkillPhase, SkillSpec } from '../../core/skill-spec';

const THRUST_POSE: SkillPhase['pose'] = { lean: 0.35, crouch: 12, shoulderFront: 1.55, elbowFront: 0.05, shoulderBack: 0.6, elbowBack: 1.0 };

/**
 * Boule de feu : le combattant lève les deux mains (charge), pousse le bras vers l'adversaire,
 * et la boule part de sa main. Jamais au corps à corps : `minDistance` 260 px. Coûte du mana ;
 * les dégâts suivent la puissance magique (22 à la puissance de référence). Esquivable, pas
 * parable (la garde ne retient pas le feu). Projectile balistique simple : 9 px par pas, droit
 * vers le torse visé au lancement.
 */
export const FIREBALL: SkillSpec = {
  id: 'fireball',
  category: 'magic',
  points: 3,
  cost: { stamina: 0, mana: 20 },
  cooldownMs: 6000,
  weight: 3,
  conditions: { minDistance: 260, maxDistance: Number.POSITIVE_INFINITY, maxOwnHpShare: 1 },
  reactions: { dodgeable: true, parryable: false },
  hit: { damage: 22, scaling: 'magic', strikingParts: [] },
  timeline: [
    {
      name: 'charge',
      durationMs: 450,
      pose: { lean: -0.2, crouch: 10, shoulderFront: 2.4, elbowFront: 0.5, shoulderBack: 2.2, elbowBack: 0.6 },
      cue: 'charge',
    },
    { name: 'thrust', durationMs: 120, pose: THRUST_POSE },
    {
      name: 'release',
      durationMs: 140,
      pose: THRUST_POSE,
      projectile: { speed: 9, spawnPart: 'foreArmFront', hitRadius: 30, hitParts: ['torso', 'head'], maxFlightMs: 2500 },
      cue: 'launch',
    },
    { name: 'recover', durationMs: 420, pose: {} },
  ],
};
