import type * as Phaser from 'phaser';
import type { FxSparks } from '../../core/presentation-config';
import type { Rng } from '../../core/rng';

interface Spark {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ageMs: number;
  color: number;
}

interface Burst {
  alive: boolean;
  x: number;
  y: number;
  ageMs: number;
}

/** Étincelles et disque lumineux d'impact. Deux pools de taille fixe : rien n'est alloué pendant le jeu. */
export class SparkFx {
  private readonly sparks: Spark[];
  private readonly bursts: Burst[];

  constructor(
    private readonly config: FxSparks,
    private readonly rng: Rng,
  ) {
    this.sparks = Array.from({ length: config.maxParticles }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, ageMs: 0, color: 0 }));
    this.bursts = Array.from({ length: config.maxBursts }, () => ({ alive: false, x: 0, y: 0, ageMs: 0 }));
  }

  /** Lance `count` étincelles en cône autour de `angleRad`, à `speedScale` fois la vitesse normale, et un disque lumineux. */
  emit(x: number, y: number, count: number, angleRad: number, speedScale: number): void {
    const spread = (this.config.spreadDeg * Math.PI) / 180;
    let left = count;
    for (const spark of this.sparks) {
      if (left === 0) break;
      if (spark.alive) continue;
      const angle = angleRad + this.rng.range(-spread, spread);
      const speed = this.rng.range(this.config.speedMin, this.config.speedMax) * speedScale;
      spark.alive = true;
      spark.x = x;
      spark.y = y;
      spark.vx = Math.cos(angle) * speed;
      spark.vy = Math.sin(angle) * speed;
      spark.ageMs = 0;
      spark.color = this.config.colors[this.rng.int(0, this.config.colors.length - 1)];
      left--;
    }
    const burst = this.bursts.find((candidate) => !candidate.alive);
    if (burst !== undefined) Object.assign(burst, { alive: true, x, y, ageMs: 0 });
  }

  /** Fait avancer les étincelles de `dtMs` (temps d'effet). */
  update(dtMs: number): void {
    const dtS = dtMs / 1000;
    for (const spark of this.sparks) {
      if (!spark.alive) continue;
      spark.ageMs += dtMs;
      if (spark.ageMs >= this.config.lifeMs) {
        spark.alive = false;
        continue;
      }
      spark.vy += this.config.gravity * dtS;
      spark.x += spark.vx * dtS;
      spark.y += spark.vy * dtS;
    }
    for (const burst of this.bursts) {
      if (!burst.alive) continue;
      burst.ageMs += dtMs;
      if (burst.ageMs >= this.config.burstMs) burst.alive = false;
    }
  }

  /** Vrai tant qu'une étincelle ou un disque est visible. */
  get active(): boolean {
    for (const spark of this.sparks) if (spark.alive) return true;
    for (const burst of this.bursts) if (burst.alive) return true;
    return false;
  }

  /** Dessine l'état courant sur `g` (déjà effacé par l'appelant). */
  draw(g: Phaser.GameObjects.Graphics): void {
    for (const burst of this.bursts) {
      if (!burst.alive) continue;
      const t = burst.ageMs / this.config.burstMs;
      g.fillStyle(this.config.burstColor, 1 - t);
      g.fillCircle(burst.x, burst.y, this.config.burstRadius * (this.config.burstStartScale + this.config.burstGrowth * t));
    }
    for (const spark of this.sparks) {
      if (!spark.alive) continue;
      g.lineStyle(this.config.lineWidth, spark.color, 1 - spark.ageMs / this.config.lifeMs);
      g.lineBetween(spark.x, spark.y, spark.x - spark.vx * this.config.tailS, spark.y - spark.vy * this.config.tailS);
    }
  }
}
