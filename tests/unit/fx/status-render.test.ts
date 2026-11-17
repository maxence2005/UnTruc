import { describe, expect, it } from 'vitest';
import { PRESENTATION } from '../../../src/content/presentation';
import { BLEED, STATUSES } from '../../../src/content/statuses';
import { FIGHTERS } from '../../../src/content/fighters';
import { createRng } from '../../../src/core/rng';
import type { BloodLook, StatusDripLook } from '../../../src/core/status-presentation';
import { readDemoStatus, withDemoStatus } from '../../../src/debug/status-demo';
import { BloodFx } from '../../../src/render/fx/blood';
import { DripClock, dripIntervalMs } from '../../../src/render/fx/drip-clock';
import { FlashLimiter } from '../../../src/render/fx/flash-limiter';
import { badgeParts, badgeRowX } from '../../../src/render/status-badge-layout';
import { StatusBoard } from '../../../src/render/status-board';
import { statusDamageText } from '../../../src/render/status-damage';

function drips(patch: Partial<StatusDripLook> = {}): StatusDripLook {
  return { intervalMs: 600, minIntervalMs: 120, spreadX: 0, spreadY: 0, fallSpeedMax: 0, ...patch };
}
function blood(patch: Partial<BloodLook> = {}): BloodLook {
  return { ...PRESENTATION.statuses.blood, ...patch };
}
const GROUND_Y = 600;

describe('dripIntervalMs', () => {
  it('divides the interval by the number of charges', () => {
    expect(dripIntervalMs(1, drips())).toBe(600);
    expect(dripIntervalMs(2, drips())).toBe(300);
  });
  it('never goes under the minimum', () => expect(dripIntervalMs(10, drips())).toBe(120));
  it('drops nothing without a charge', () => expect(dripIntervalMs(0, drips())).toBe(Number.POSITIVE_INFINITY));
});

describe('DripClock', () => {
  it('drops the first drop as soon as the status appears, then one per interval', () => {
    const clock = new DripClock();
    expect(clock.advance(16, 1, drips())).toBe(1);
    expect(clock.advance(599, 1, drips())).toBe(0);
    expect(clock.advance(1, 1, drips())).toBe(1);
  });
  it('drops more over the same time with more charges', () => {
    const count = (charges: number) => {
      const clock = new DripClock();
      let total = 0;
      for (let i = 0; i < 120; i += 1) total += clock.advance(1000 / 60, charges, drips());
      return total;
    };
    expect(count(1)).toBeLessThan(count(3));
    expect(count(3)).toBeLessThan(count(5));
  });
  it('stops on expiry and restarts at once when the status comes back', () => {
    const clock = new DripClock();
    clock.advance(16, 1, drips());
    expect(clock.advance(5000, 0, drips())).toBe(0);
    expect(clock.advance(16, 1, drips())).toBe(1);
  });
  it('does not loop forever on a zero interval', () => expect(new DripClock().advance(16, 1, drips({ intervalMs: 0, minIntervalMs: 0 }))).toBe(0));
});

describe('FlashLimiter', () => {
  it('accepts 3 flashes within a second and refuses the fourth', () => {
    const limiter = new FlashLimiter(3, 1000);
    expect([limiter.tryFlash(), limiter.tryFlash(), limiter.tryFlash(), limiter.tryFlash()]).toEqual([true, true, true, false]);
  });
  it('accepts again once the oldest leaves the window', () => {
    const limiter = new FlashLimiter(3, 1000);
    limiter.tryFlash();
    limiter.advance(400);
    limiter.tryFlash();
    limiter.tryFlash();
    limiter.advance(599);
    expect(limiter.tryFlash()).toBe(false);
    limiter.advance(1);
    expect(limiter.tryFlash()).toBe(true);
  });
  it('never lets more than 3 flashes through a sliding second at 5 requests per second', () => {
    const limiter = new FlashLimiter(3, 1000);
    const times: number[] = [];
    for (let t = 0; t < 5000; t += 200) {
      if (limiter.tryFlash()) times.push(t);
      limiter.advance(200);
    }
    for (const start of times) expect(times.filter((t) => t >= start && t < start + 1000).length).toBeLessThanOrEqual(3);
  });
});

describe('BloodFx', () => {
  it('ignores extra drops when the pool is full', () => {
    const fx = new BloodFx(blood({ maxDrops: 3 }), GROUND_Y, createRng(1));
    expect([1, 2, 3, 4].map(() => fx.drip(0, 0, 0, 0, 0xff0000))).toEqual([true, true, true, false]);
    fx.splash(0, 0, 5, 10, 20, 30, 0xff0000);
    expect(fx.dropCount).toBe(3);
  });
  it('removes a drop at the ground and frees its slot', () => {
    const fx = new BloodFx(blood({ maxDrops: 1, lifeMs: 100000 }), GROUND_Y, createRng(1));
    fx.drip(0, GROUND_Y - 10, 0, 0, 0xff0000);
    for (let i = 0; i < 60 && fx.active; i += 1) fx.update(1000 / 60);
    expect(fx.active).toBe(false);
    expect(fx.drip(0, 0, 0, 0, 0xff0000)).toBe(true);
  });
  it('fades the small flash out after its duration', () => {
    const fx = new BloodFx(blood({ pulseDurationMs: 100 }), GROUND_Y, createRng(1));
    fx.pulse(0, 0, 0xff0000);
    fx.update(99);
    expect(fx.active).toBe(true);
    fx.update(1);
    expect(fx.active).toBe(false);
  });
});

describe('StatusBoard', () => {
  it('follows the charges from the events and removes the status at 0 charges', () => {
    const board = new StatusBoard(2, 3);
    board.set(1, 'bleed', 1);
    board.set(1, 'bleed', 3);
    expect(board.charges(1, 'bleed')).toBe(3);
    expect(board.count(0)).toBe(0);
    board.set(1, 'bleed', 0);
    expect(board.count(1)).toBe(0);
  });
  it('keeps application order and closes the row on removal', () => {
    const board = new StatusBoard(1, 3);
    for (const id of ['a', 'b', 'c']) board.set(0, id, 1);
    board.set(0, 'a', 0);
    expect([board.entry(0, 0).status, board.entry(0, 1).status]).toEqual(['b', 'c']);
    board.set(0, 'd', 2);
    expect(board.entry(0, 2).status).toBe('d');
  });
  it('tracks no status beyond the maximum per fighter', () => {
    const board = new StatusBoard(1, 2);
    for (const id of ['a', 'b', 'c']) board.set(0, id, 1);
    expect(board.count(0)).toBe(2);
    expect(board.charges(0, 'c')).toBe(0);
  });
  it('forgets every status of every fighter when cleared at the end of the duel', () => {
    const board = new StatusBoard(2, 3);
    board.set(0, 'bleed', 2);
    board.set(1, 'bleed', 1);
    board.set(1, 'burn', 1);
    board.clear();
    expect([board.count(0), board.count(1)]).toEqual([0, 0]);
    board.set(1, 'bleed', 1);
    expect(board.entry(1, 0)).toMatchObject({ status: 'bleed', charges: 1 });
  });
});

describe('status badge layout', () => {
  const look = { ...PRESENTATION.statuses.badge, size: 28, countInset: 3, glyphShare: 0.25, glyphDropShare: 0.125 };
  it('centres the square, puts the drop in the middle and the count in the bottom right corner', () => {
    expect(badgeParts(look)).toEqual({ boxX: -14, boxY: -14, boxSize: 28, glyphX: 0, glyphY: 3.5, glyphRadius: 7, countX: 11, countY: 11 });
  });
  it('lines badges up from the bar edge, rightwards for the left fighter and mirrored for the right one', () => {
    expect([0, 1, 2].map((i) => badgeRowX(i, 1, 28, 6))).toEqual([14, 48, 82]);
    expect([0, 1, 2].map((i) => badgeRowX(i, -1, 28, 6))).toEqual([-14, -48, -82]);
  });
});

describe('status damage text', () => {
  it('replaces {damage}', () => expect(statusDamageText('-{damage}', 2)).toBe('-2'));
});

describe('?statut= demo', () => {
  it('reads the French name and the id, nothing for an unknown or missing name', () => {
    expect(readDemoStatus('saignement', STATUSES)).toBe(BLEED);
    expect(readDemoStatus('bleed', STATUSES)).toBe(BLEED);
    expect(readDemoStatus('gel', STATUSES)).toBeNull();
    expect(readDemoStatus(null, STATUSES)).toBeNull();
  });
  it('adds one charge of the status to every skill hit without touching the data', () => {
    const before = JSON.stringify(FIGHTERS);
    const demo = withDemoStatus(FIGHTERS, BLEED);
    for (const fighter of demo) for (const skill of fighter.skills ?? []) expect(skill.hit.applies).toEqual([{ status: BLEED, charges: 1 }]);
    expect(JSON.stringify(FIGHTERS)).toBe(before);
    expect(FIGHTERS.flatMap((fighter) => fighter.skills ?? []).every((skill) => skill.hit.applies === undefined)).toBe(true);
  });
});
