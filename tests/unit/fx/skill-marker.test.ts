import type * as Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import type { SkillMarkerLook } from '../../../src/core/presentation-config';
import { SkillMarker } from '../../../src/render/skill-marker';

/** Trait plein (pas de trou) : chaque segment de l'arc est tracé. */
const SOLID: SkillMarkerLook = { alpha: 1, ringRadius: 20, ringSquash: 0.3, ringWidth: 2, arcHeight: 40, dashLength: 10000, gapLength: 0, lineWidth: 2, arcSegments: 10 };
const DASHED: SkillMarkerLook = { ...SOLID, dashLength: 10, gapLength: 10 };
const CASTER = { x: 0, y: 100 };
const TARGET = { x: 200, y: 100 };

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Faux `Graphics` : relève les segments de l'arc (`lineBetween`) et compte les ellipses. */
function recordingGraphics(): { g: Phaser.GameObjects.Graphics; segments: Segment[]; ellipses: () => number } {
  const segments: Segment[] = [];
  let ellipses = 0;
  const fake = {
    lineStyle: () => fake,
    strokeEllipse: () => {
      ellipses += 1;
      return fake;
    },
    lineBetween: (x1: number, y1: number, x2: number, y2: number) => {
      segments.push({ x1, y1, x2, y2 });
      return fake;
    },
  };
  return { g: fake as unknown as Phaser.GameObjects.Graphics, segments, ellipses: () => ellipses };
}

function drawMarker(look: SkillMarkerLook, from: { x: number; y: number }, shown = true) {
  const marker = new SkillMarker(1, look);
  marker.show(0, TARGET.x, TARGET.y, 0xffffff);
  if (!shown) marker.hide(0);
  const recorded = recordingGraphics();
  marker.draw(recorded.g, () => from);
  return recorded;
}

describe('SkillMarker arc', () => {
  it('a solid arc runs from the caster to the target and peaks arcHeight above the midpoint', () => {
    const { segments, ellipses } = drawMarker(SOLID, CASTER);
    const middle = segments[SOLID.arcSegments / 2 - 1];

    expect(ellipses()).toBe(1);
    expect(segments).toHaveLength(SOLID.arcSegments);
    expect(segments[0]).toMatchObject({ x1: CASTER.x, y1: CASTER.y });
    expect(segments[segments.length - 1].x2).toBeCloseTo(TARGET.x, 9);
    expect(segments[segments.length - 1].y2).toBeCloseTo(TARGET.y, 9);
    expect(middle.x2).toBeCloseTo((CASTER.x + TARGET.x) / 2, 9);
    expect(middle.y2).toBeCloseTo((CASTER.y + TARGET.y) / 2 - SOLID.arcHeight, 9);
  });

  it('a dashed arc skips the segments that fall in a gap', () => {
    const { segments } = drawMarker(DASHED, CASTER);

    expect(segments.length).toBeGreaterThan(0);
    expect(segments.length).toBeLessThan(DASHED.arcSegments);
  });

  it('the arc follows the caster from one frame to the next', () => {
    const before = drawMarker(SOLID, CASTER).segments[0];
    const after = drawMarker(SOLID, { x: 50, y: 60 }).segments[0];

    expect(before).toMatchObject({ x1: CASTER.x, y1: CASTER.y });
    expect(after).toMatchObject({ x1: 50, y1: 60 });
  });

  it('a hidden marker draws nothing', () => {
    const { segments, ellipses } = drawMarker(SOLID, CASTER, false);

    expect(segments).toHaveLength(0);
    expect(ellipses()).toBe(0);
  });
});
