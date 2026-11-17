import { describe, expect, it } from 'vitest';
import { separateBanners, type BannerSpan } from '../../../src/render/banner-layout';

const GAP = 10;
const banner = (x: number, width = 100, active = true): BannerSpan => ({ active, width, x });

describe('separateBanners', () => {
  it('pushes two overlapping banners apart around their middle until gap pixels separate their edges', () => {
    const a = banner(100);
    const b = banner(140);

    separateBanners(a, b, GAP);

    expect(b.x - a.x).toBe(100 + GAP);
    expect((a.x + b.x) / 2).toBe(120);
  });

  it('leaves banners that are already far enough apart where they are', () => {
    const a = banner(0);
    const b = banner(200);

    separateBanners(a, b, GAP);

    expect([a.x, b.x]).toEqual([0, 200]);
  });

  it('leaves an overlapping banner alone when the other one is hidden or missing', () => {
    const a = banner(100);
    const hidden = banner(110, 100, false);

    separateBanners(a, hidden, GAP);
    separateBanners(a, undefined, GAP);

    expect([a.x, hidden.x]).toEqual([100, 110]);
  });

  it('sends the first banner to the left when both sit at the same x', () => {
    const a = banner(100, 60);
    const b = banner(100, 40);

    separateBanners(a, b, GAP);

    expect(a.x).toBeLessThan(b.x);
    expect(b.x - a.x).toBe(50 + GAP);
  });
});
