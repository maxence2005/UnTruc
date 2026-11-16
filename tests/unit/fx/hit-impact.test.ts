import { describe, expect, it } from 'vitest';
import type { FxThresholds } from '../../../src/core/presentation-config';
import { classifyHit, impactPoint } from '../../../src/render/fx/hit-impact';

function thresholds(): FxThresholds {
  return { slowmoDamageShare: 0.2, shockwaveDamageShare: 0.4 };
}
const MAX_HP = 50;

describe('classifyHit', () => {
  it('un coup léger ne donne que des étincelles', () => {
    expect(classifyHit(MAX_HP * 0.1, false, MAX_HP, thresholds())).toEqual({ sparks: 'normal', slowmo: false, shockwave: false });
  });

  it('un gros coup déclenche le ralenti, pas l onde de choc', () => {
    expect(classifyHit(MAX_HP * 0.2, false, MAX_HP, thresholds())).toEqual({ sparks: 'strong', slowmo: true, shockwave: false });
  });

  it('un coup très fort déclenche aussi l onde de choc', () => {
    expect(classifyHit(MAX_HP * 0.4, false, MAX_HP, thresholds())).toEqual({ sparks: 'strong', slowmo: true, shockwave: true });
  });

  it('un coup paré ne donne que de petites étincelles, même très fort', () => {
    expect(classifyHit(MAX_HP, true, MAX_HP, thresholds())).toEqual({ sparks: 'parried', slowmo: false, shockwave: false });
  });

  it('des PV max nuls ne produisent pas d effet fort', () => {
    expect(classifyHit(10, false, 0, thresholds()).slowmo).toBe(false);
  });
});

describe('impactPoint', () => {
  const striker = { x: 0, y: 0 };
  const victim = { x: 100, y: 50 };
  it('pull 0 : sur la partie qui frappe', () => expect(impactPoint(striker, victim, 0)).toEqual(striker));
  it('pull 1 : sur la victime', () => expect(impactPoint(striker, victim, 1)).toEqual(victim));
  it('pull 0.5 : au milieu', () => expect(impactPoint(striker, victim, 0.5)).toEqual({ x: 50, y: 25 }));
});
