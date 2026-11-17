import type { SkillSpec } from '../../core/skill-spec';

/**
 * Saut : le combattant s'accroupit (la cible est marquée au sol), bondit, retombe poing en
 * avant sur l'endroit visé au lancement. Il peut être esquivé (l'adversaire recule, le saut
 * retombe dans le vide : « Esquivé ») ou paré (« Bloqué »). Vol de 840 ms (leap + dive), assez
 * long pour que l'arc se lise. Portée : 280 px au plus (9 px par pas sur 50 pas de vol, moins le frottement de l'air).
 */
export const JUMP: SkillSpec = {
  id: 'jump',
  category: 'attack',
  points: 2,
  cost: { stamina: 15, mana: 0 },
  cooldownMs: 4000,
  weight: 2,
  conditions: { minDistance: 90, maxDistance: 260, maxOwnHpShare: 1 },
  reactions: { dodgeable: true, parryable: true },
  hit: { damage: 18, scaling: 'physical', strikingParts: ['foreArmFront', 'shinFront'] },
  timeline: [
    {
      name: 'crouch',
      durationMs: 280,
      pose: { lean: -0.1, crouch: 24, hipFront: 0.6, kneeFront: 1.0, hipBack: -0.1, kneeBack: 1.0, shoulderFront: -0.6, shoulderBack: -0.5, elbowFront: 1.0 },
      cue: 'telegraph',
    },
    {
      name: 'leap',
      durationMs: 520,
      airborne: true,
      impulse: { maxSpeedX: 9, maxSpeedY: 11, standoff: 0 },
      pose: { lean: -0.2, crouch: 0, shoulderFront: 2.6, elbowFront: 0.6, shoulderBack: 2.3, elbowBack: 0.8, hipFront: 1.0, kneeFront: 1.4, hipBack: 0.4, kneeBack: 1.4 },
      cue: 'airborne',
    },
    {
      name: 'dive',
      durationMs: 320,
      airborne: true,
      strikeWindow: true,
      pose: { lean: 0.5, crouch: 0, shoulderFront: 1.6, elbowFront: 0.05, shoulderBack: 1.2, elbowBack: 0.4, hipFront: 0.5, kneeFront: 0.6, hipBack: -0.2, kneeBack: 0.4 },
      cue: 'dive',
    },
    {
      name: 'land',
      durationMs: 200,
      strikeWindow: true,
      pose: { lean: 0.4, crouch: 22, shoulderFront: 1.3, elbowFront: 0.2, hipFront: 0.5, kneeFront: 1.0, kneeBack: 1.0 },
      cue: 'land',
    },
    { name: 'recover', durationMs: 380, pose: {} },
  ],
};
