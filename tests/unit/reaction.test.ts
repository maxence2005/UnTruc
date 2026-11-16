import { describe, expect, it } from 'vitest';
import { spreadReaction, type MovingBody } from '../../src/physics/reaction';

interface Body extends MovingBody {
  mass: number;
  velocity: { x: number; y: number };
}

/** Un porteur léger et une arme lourde, comme le marteau (près de la moitié de la masse). */
function carrierAndHeavyWeapon(): Body[] {
  return [
    { mass: 8, velocity: { x: 1, y: 0 } },
    { mass: 6, velocity: { x: 0, y: -2 } },
  ];
}

function momentum(bodies: readonly Body[]): { x: number; y: number } {
  return bodies.reduce((sum, body) => ({ x: sum.x + body.mass * body.velocity.x, y: sum.y + body.mass * body.velocity.y }), { x: 0, y: 0 });
}

function apply(bodies: Body[], pushX: number, pushY: number): void {
  spreadReaction(bodies, pushX, pushY, (body, velocity) => {
    body.velocity = velocity;
  });
}

describe('spreadReaction (story 002 : le poignet ne fait pas voler le porteur)', () => {
  it('ramène la quantité de mouvement totale à sa valeur d avant le muscle', () => {
    const bodies = carrierAndHeavyWeapon();
    const before = momentum(bodies);
    const [, weapon] = bodies;
    const muscleDeltaY = -5;
    weapon.velocity = { x: weapon.velocity.x, y: weapon.velocity.y + muscleDeltaY };
    apply(bodies, 0, weapon.mass * muscleDeltaY);
    const after = momentum(bodies);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('garde intact l écart de vitesse voulu par le muscle entre l arme et le porteur', () => {
    const bodies = carrierAndHeavyWeapon();
    const [carrier, weapon] = bodies;
    weapon.velocity = { x: weapon.velocity.x + 3, y: weapon.velocity.y - 4 };
    const gapX = weapon.velocity.x - carrier.velocity.x;
    const gapY = weapon.velocity.y - carrier.velocity.y;
    apply(bodies, weapon.mass * 3, weapon.mass * -4);
    expect(weapon.velocity.x - carrier.velocity.x).toBeCloseTo(gapX);
    expect(weapon.velocity.y - carrier.velocity.y).toBeCloseTo(gapY);
  });

  it('ne touche à rien sans poussée', () => {
    const bodies = carrierAndHeavyWeapon();
    apply(bodies, 0, 0);
    expect(bodies.map((body) => body.velocity)).toEqual(carrierAndHeavyWeapon().map((body) => body.velocity));
  });
});
