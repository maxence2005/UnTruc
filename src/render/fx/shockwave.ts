import type * as Phaser from 'phaser';
import type { FxShockwave } from '../../core/presentation-config';

interface Ring {
  alive: boolean;
  x: number;
  y: number;
  radius: number;
  ageMs: number;
}

/** Ondes de choc : anneaux qui grandissent vite puis ralentissent en s'effaçant. Pool de taille fixe. */
export class ShockwaveFx {
  private readonly rings: Ring[];

  constructor(private readonly config: FxShockwave) {
    this.rings = Array.from({ length: config.maxRings }, () => ({ alive: false, x: 0, y: 0, radius: 0, ageMs: 0 }));
  }

  /** Lance une onde centrée en (`x`, `y`) qui atteint `radius` px. Sans place libre, l'appel est ignoré. */
  emit(x: number, y: number, radius: number): void {
    const ring = this.rings.find((candidate) => !candidate.alive);
    if (ring !== undefined) Object.assign(ring, { alive: true, x, y, radius, ageMs: 0 });
  }

  /** Fait avancer les ondes de `dtMs` (temps d'effet). */
  update(dtMs: number): void {
    for (const ring of this.rings) {
      if (!ring.alive) continue;
      ring.ageMs += dtMs;
      if (ring.ageMs >= this.config.lifeMs) ring.alive = false;
    }
  }

  /** Vrai tant qu'une onde est visible. */
  get active(): boolean {
    for (const ring of this.rings) if (ring.alive) return true;
    return false;
  }

  /** Dessine l'état courant sur `g` (déjà effacé par l'appelant). */
  draw(g: Phaser.GameObjects.Graphics): void {
    for (const ring of this.rings) {
      if (!ring.alive) continue;
      const t = ring.ageMs / this.config.lifeMs;
      const eased = 1 - (1 - t) ** 3;
      g.lineStyle(this.config.lineWidth * (1 - t) + this.config.minLineWidth, this.config.color, 1 - t);
      g.strokeCircle(ring.x, ring.y, ring.radius * eased);
    }
  }
}
