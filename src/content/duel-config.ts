import type { DuelConfig } from '../core/duel-config';

/** Réglages du duel : pas fixe, arène, rythme des tours, physique. Voir README.md. */
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
  turn: {
    firstDelayMs: 1000,
    gapMs: 500,
    approachTimeoutMs: 4000,
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
