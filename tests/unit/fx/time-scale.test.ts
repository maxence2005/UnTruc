import { describe, expect, it } from 'vitest';
import { FlashTracker } from '../../../src/render/fx/flash';
import { TimeScale } from '../../../src/render/fx/time-scale';

const SLOW = 0.2;
const HOLD_MS = 1000;
const RAMP_MS = 200;

describe('TimeScale', () => {
  it('vaut 1 sans ralenti', () => expect(new TimeScale().value).toBe(1));

  it('garde l échelle pendant le maintien puis revient à 1', () => {
    const timer = new TimeScale();
    timer.trigger(SLOW, HOLD_MS, RAMP_MS);
    expect(timer.value).toBe(SLOW);
    timer.advance(HOLD_MS - 1);
    expect(timer.value).toBe(SLOW);
    timer.advance(1 + RAMP_MS / 2);
    expect(timer.value).toBeCloseTo((SLOW + 1) / 2);
    timer.advance(RAMP_MS);
    expect(timer.value).toBe(1);
  });

  it('un ralenti plus fort remplace le courant, un plus faible est ignoré', () => {
    const timer = new TimeScale();
    timer.trigger(SLOW, HOLD_MS, RAMP_MS);
    timer.trigger(0.6, HOLD_MS / 2, RAMP_MS);
    expect(timer.value).toBe(SLOW);
    timer.trigger(0.1, HOLD_MS / 2, RAMP_MS);
    expect(timer.value).toBe(0.1);
  });

  it('un ralenti plus faible mais plus long allonge le maintien', () => {
    const timer = new TimeScale();
    timer.trigger(SLOW, HOLD_MS, RAMP_MS);
    timer.advance(HOLD_MS / 2);
    timer.trigger(0.6, HOLD_MS * 2, RAMP_MS);
    timer.advance(HOLD_MS);
    expect(timer.value).toBe(SLOW);
  });
});

describe('FlashTracker', () => {
  const duration = 100;
  const peak = 0.8;
  it('démarre au maximum et s éteint à la fin de la durée', () => {
    const flash = new FlashTracker(2, duration, peak);
    flash.start(1);
    expect(flash.alpha(1)).toBe(peak);
    expect(flash.alpha(0)).toBe(0);
    flash.advance(duration / 2);
    expect(flash.alpha(1)).toBeCloseTo(peak / 2);
    flash.advance(duration);
    expect(flash.alpha(1)).toBe(0);
  });
});
