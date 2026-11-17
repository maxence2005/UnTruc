import type * as Phaser from 'phaser';
import type { Rng } from '../../core/rng';
import type { BloodLook } from '../../core/status-presentation';

interface Drop {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ageMs: number;
  radius: number;
  color: number;
}

interface Pulse {
  alive: boolean;
  x: number;
  y: number;
  ageMs: number;
  color: number;
}

/** Premier élément libre d'un pool, sans fermeture allouée ; `undefined` si le pool est plein. */
function firstFree<T extends { alive: boolean }>(pool: readonly T[]): T | undefined {
  for (const item of pool) if (!item.alive) return item;
  return undefined;
}

/** Hauteur de la pointe d'une goutte, en rayons au-dessus du centre de son rond. */
export const TEARDROP_TIP = 2.3;

/** Remplit une goutte (rond + pointe vers le haut) de centre (`x`, `y`) et de rayon `r`, avec le style courant de `g`. */
export function fillTeardrop(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillCircle(x, y, r);
  g.fillTriangle(x - r, y, x + r, y, x, y - r * TEARDROP_TIP);
}

/**
 * Gouttes de sang et petits flashs rouges des statuts (story 013). Deux pools de taille fixe :
 * au plein, une goutte ou un flash de plus est ignoré, rien n'est alloué pendant le jeu. Les gouttes
 * tombent sous la gravité et disparaissent au sol (`groundY`) ou en fin de vie.
 *
 * @example blood.drip(x, y, 0, 40, color); blood.update(dtMs); blood.draw(layer);
 */
export class BloodFx {
  private readonly drops: Drop[];
  private readonly pulses: Pulse[];

  constructor(
    private readonly look: BloodLook,
    private readonly groundY: number,
    private readonly rng: Rng,
  ) {
    this.drops = Array.from({ length: look.maxDrops }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, ageMs: 0, radius: 0, color: 0 }));
    this.pulses = Array.from({ length: look.maxPulses }, () => ({ alive: false, x: 0, y: 0, ageMs: 0, color: 0 }));
  }

  /** Lance une goutte en (`x`, `y`) à la vitesse (`vx`, `vy`) px/s ; faux si le pool est plein. */
  drip(x: number, y: number, vx: number, vy: number, color: number): boolean {
    const drop = firstFree(this.drops);
    if (drop === undefined) return false;
    drop.alive = true;
    drop.x = x;
    drop.y = y;
    drop.vx = vx;
    drop.vy = vy;
    drop.ageMs = 0;
    drop.radius = this.look.dropRadius;
    drop.color = color;
    return true;
  }

  /** Projette `count` gouttes vers le haut, dans un cône de demi-ouverture `spreadDeg` autour de la verticale. */
  splash(x: number, y: number, count: number, speedMin: number, speedMax: number, spreadDeg: number, color: number): void {
    const spread = (spreadDeg * Math.PI) / 180;
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + this.rng.range(-spread, spread);
      const speed = this.rng.range(speedMin, speedMax);
      if (!this.drip(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color)) return;
    }
  }

  /** Petit flash : un disque de `color` qui grandit et s'efface en (`x`, `y`) ; faux si le pool est plein. */
  pulse(x: number, y: number, color: number): boolean {
    const pulse = firstFree(this.pulses);
    if (pulse === undefined) return false;
    pulse.alive = true;
    pulse.x = x;
    pulse.y = y;
    pulse.ageMs = 0;
    pulse.color = color;
    return true;
  }

  /** Fait avancer gouttes et flashs de `dtMs` (temps d'effet). */
  update(dtMs: number): void {
    const dtS = dtMs / 1000;
    const { gravity, lifeMs, pulseDurationMs } = this.look;
    for (const drop of this.drops) {
      if (!drop.alive) continue;
      drop.ageMs += dtMs;
      drop.vy += gravity * dtS;
      drop.x += drop.vx * dtS;
      drop.y += drop.vy * dtS;
      if (drop.ageMs >= lifeMs || drop.y >= this.groundY) drop.alive = false;
    }
    for (const pulse of this.pulses) {
      if (!pulse.alive) continue;
      pulse.ageMs += dtMs;
      if (pulse.ageMs >= pulseDurationMs) pulse.alive = false;
    }
  }

  /** Nombre de gouttes en vol. */
  get dropCount(): number {
    let count = 0;
    for (const drop of this.drops) if (drop.alive) count += 1;
    return count;
  }

  /** Vrai tant qu'une goutte ou un flash est visible. */
  get active(): boolean {
    for (const drop of this.drops) if (drop.alive) return true;
    for (const pulse of this.pulses) if (pulse.alive) return true;
    return false;
  }

  /** Dessine l'état courant sur `g` (déjà effacé par l'appelant) : flashs dessous, gouttes cernées d'encre dessus. */
  draw(g: Phaser.GameObjects.Graphics): void {
    const { pulseRadius, pulseGrowth, pulseDurationMs, pulseAlpha, outlineWidth, outlineColor } = this.look;
    for (const pulse of this.pulses) {
      if (!pulse.alive) continue;
      const t = pulse.ageMs / pulseDurationMs;
      g.fillStyle(pulse.color, pulseAlpha * (1 - t));
      g.fillCircle(pulse.x, pulse.y, pulseRadius * (1 + pulseGrowth * t));
    }
    for (const drop of this.drops) {
      if (!drop.alive) continue;
      g.fillStyle(outlineColor, 1);
      fillTeardrop(g, drop.x, drop.y, drop.radius + outlineWidth);
      g.fillStyle(drop.color, 1);
      fillTeardrop(g, drop.x, drop.y, drop.radius);
    }
  }
}
