import type { DuelConfig } from '../core/duel-config';

/** Réglages du duel : pas fixe, arène, rythme des actions, dégâts, physique. Voir README.md. */
export const DUEL_CONFIG: DuelConfig = {
  stepHz: 60,
  maxFrameMs: 100,
  endSettleMs: 2500,
  minHitSpeed: 2,
  seedDefault: 1,
  arena: {
    width: 1280,
    height: 720,
    groundHeight: 120,
    wallThickness: 100,
    spawnHalfGap: 220,
    spawnJitter: 30,
  },
  action: {
    firstDelayMs: 600,
    firstDelayStaggerMs: 300,
    delayBaseMs: 400,
    delayRandomMs: 300,
  },
  damage: {
    referenceSpeed: 8,
    minFactor: 0.5,
    maxFactor: 1.5,
  },
  physics: {
    gravityY: 1,
    positionIterations: 8,
    velocityIterations: 6,
    constraintIterations: 4,
    jointStiffness: 1,
    supportGain: 0.3,
    supportMaxRise: 9,
    supportMaxFall: 4,
    supportBlend: 0.5,
    walkBlend: 0.2,
    groundTolerance: 26,
    groundFriction: 0.8,
  },
};
