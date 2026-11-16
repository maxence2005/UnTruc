import { describe, expect, it } from 'vitest';
import { reachAngles } from '../../src/physics/muscles';

const UPPER = 20;
const FORE = 18;
const SHOULDER = { x: 100, y: 100 };

/** Main au bout du bras, avec la convention des os du ragdoll (angle 0 = os pendant vers le bas). */
function handOf(upper: number, fore: number) {
  const elbow = { x: SHOULDER.x - Math.sin(upper) * UPPER, y: SHOULDER.y + Math.cos(upper) * UPPER };
  return { x: elbow.x - Math.sin(fore) * FORE, y: elbow.y + Math.cos(fore) * FORE };
}

describe('Two-bone reach', () => {
  it('puts the hand on any target within reach, elbow down', () => {
    for (const target of [
      { x: 120, y: 110 },
      { x: 80, y: 90 },
      { x: 110, y: 75 },
      { x: 95, y: 125 },
    ]) {
      const { upper, fore } = reachAngles(SHOULDER, target, UPPER, FORE);
      const hand = handOf(upper, fore);

      expect(hand.x).toBeCloseTo(target.x, 6);
      expect(hand.y).toBeCloseTo(target.y, 6);
    }
  });

  it('stretches the arm toward a target out of reach', () => {
    const target = { x: 200, y: 100 };
    const { upper, fore } = reachAngles(SHOULDER, target, UPPER, FORE);
    const hand = handOf(upper, fore);

    expect(hand.x).toBeCloseTo(SHOULDER.x + UPPER + FORE, 6);
    expect(hand.y).toBeCloseTo(SHOULDER.y, 6);
  });
});
