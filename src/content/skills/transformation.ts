import type { SkillSpec } from '../../core/skill-spec';
import { BLEED } from '../statuses/bleed';

/**
 * Transformation en loup-garou (story 005) : une compétence à déclenchement, qui ne se tire pas.
 * Repères (`fighters.ts`, `duel-config.ts`) : 100 PV, vitesse et agilité 10, un coup simple ~10 PV,
 * plafonds d'étourdissement des coups 600 ms / 900 ms de série.
 * - Grognement à 50 % des PV : le grogneur est immobile 1,2 s ; l'adversaire perd 5 PV et est étourdi 2 s
 *   (au-delà des plafonds), sans esquive ni parade possibles ; onde et tremblement d'arène à pleine force 0,8 s.
 * - Transformation à 30 % des PV : immobile 0,5 s pour la lire, puis vitesse +10 et agilité +10 (le double :
 *   délai d'action divisé par deux, tirages de réaction bien plus hauts) jusqu'à la fin du duel, même soigné.
 *   Chaque coup qui touche applique 1 charge de saignement (griffes). Les griffes ne donnent pas de dégâts en
 *   plus : le saignement (4 PV par charge) est déjà leur prime, et la vitesse la multiplie.
 * Un seul coup qui fait passer de plus de 50 % à moins de 30 % : transformation sans grognement.
 * Les champs `cost`, `cooldownMs`, `weight`, `conditions`, `reactions`, `hit` et `timeline` sont neutres :
 * la compétence ne se tire jamais, `trigger` fait tout. 4 points : plus que le saut, la charge (2) et la boule de feu (3).
 */
export const TRANSFORMATION: SkillSpec = {
  id: 'transformation',
  category: 'transformation',
  points: 4,
  cost: { stamina: 0, mana: 0 },
  cooldownMs: 0,
  weight: 1,
  conditions: { minDistance: 0, maxDistance: Infinity, maxOwnHpShare: 1 },
  reactions: { dodgeable: false, parryable: false },
  hit: { damage: 1, scaling: 'physical', strikingParts: [] },
  timeline: [],
  trigger: {
    stages: [
      {
        id: 'growl',
        hpShare: 0.5,
        timeline: [
          {
            name: 'growl',
            durationMs: 1200,
            pose: { lean: -0.25, head: -0.4, crouch: 8, shoulderFront: 2.3, elbowFront: 0.5, shoulderBack: 2.1, elbowBack: 0.5 },
            cue: 'growl',
          },
        ],
        strike: { damage: 5, stunMs: 2000 },
        arena: { intensity: 1, durationMs: 800 },
      },
      {
        id: 'transformation',
        hpShare: 0.3,
        timeline: [
          {
            name: 'transform',
            durationMs: 500,
            pose: { lean: 0.2, crouch: 14, shoulderFront: 0.9, elbowFront: 1.2, shoulderBack: 0.7, elbowBack: 1.2 },
            cue: 'transform',
          },
        ],
        statBonus: { speed: 10, agility: 10 },
        hitApplies: [{ status: BLEED, charges: 1 }],
      },
    ],
  },
};
