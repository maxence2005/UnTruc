import type * as Phaser from 'phaser';
import type { FxFireball } from '../../core/presentation-config';

interface Point {
  x: number;
  y: number;
}

interface Ball {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  trailX: Float32Array;
  trailY: Float32Array;
  trailCount: number;
  trailHead: number;
}

/**
 * Boule de feu : tête lumineuse à trois couches et traînée qui s'affine. Effet prêt à
 * l'emploi : une compétence appellera `launch` ; rien ne l'appelle encore dans le jeu.
 */
export class FireballFx {
  private readonly balls: Ball[];

  constructor(
    private readonly config: FxFireball,
    private readonly onArrive: (x: number, y: number) => void,
  ) {
    this.balls = Array.from({ length: config.maxFireballs }, () => ({
      alive: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 0,
      targetY: 0,
      trailX: new Float32Array(config.trailPoints),
      trailY: new Float32Array(config.trailPoints),
      trailCount: 0,
      trailHead: 0,
    }));
  }

  /** Lance une boule de `from` vers `to` en ligne droite ; à l'arrivée, appelle `onArrive`. Sans place libre, ignoré. */
  launch(from: Point, to: Point): void {
    const ball = this.balls.find((candidate) => !candidate.alive);
    if (ball === undefined) return;
    const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    ball.alive = true;
    ball.x = from.x;
    ball.y = from.y;
    ball.vx = ((to.x - from.x) / distance) * this.config.speed;
    ball.vy = ((to.y - from.y) / distance) * this.config.speed;
    ball.targetX = to.x;
    ball.targetY = to.y;
    ball.trailCount = 0;
    ball.trailHead = 0;
  }

  /** Fait avancer les boules de `dtMs` (temps d'effet). */
  update(dtMs: number): void {
    const dtS = dtMs / 1000;
    for (const ball of this.balls) {
      if (!ball.alive) continue;
      ball.trailX[ball.trailHead] = ball.x;
      ball.trailY[ball.trailHead] = ball.y;
      ball.trailHead = (ball.trailHead + 1) % this.config.trailPoints;
      ball.trailCount = Math.min(ball.trailCount + 1, this.config.trailPoints);
      const remaining = Math.hypot(ball.targetX - ball.x, ball.targetY - ball.y);
      const stepLength = Math.hypot(ball.vx, ball.vy) * dtS;
      if (stepLength >= remaining) {
        ball.alive = false;
        this.onArrive(ball.targetX, ball.targetY);
      } else {
        ball.x += ball.vx * dtS;
        ball.y += ball.vy * dtS;
      }
    }
  }

  /** Vrai tant qu'une boule vole. */
  get active(): boolean {
    for (const ball of this.balls) if (ball.alive) return true;
    return false;
  }

  /** Dessine l'état courant sur `g` (déjà effacé par l'appelant). */
  draw(g: Phaser.GameObjects.Graphics): void {
    const { trailPoints, radius, trailTaper } = this.config;
    for (const ball of this.balls) {
      if (!ball.alive) continue;
      for (let i = 0; i < ball.trailCount; i++) {
        const index = (ball.trailHead - ball.trailCount + i + trailPoints) % trailPoints;
        const t = (i + 1) / (ball.trailCount + 1);
        g.fillStyle(i % 2 === 0 ? this.config.outerColor : this.config.midColor, this.config.trailAlphaMin + this.config.trailAlphaGain * t);
        g.fillCircle(ball.trailX[index], ball.trailY[index], radius * (trailTaper + (1 - trailTaper) * t));
      }
      g.fillStyle(this.config.outerColor, this.config.outerAlpha);
      g.fillCircle(ball.x, ball.y, radius);
      g.fillStyle(this.config.midColor, 1);
      g.fillCircle(ball.x, ball.y, radius * this.config.midRadiusShare);
      g.fillStyle(this.config.coreColor, 1);
      g.fillCircle(ball.x, ball.y, radius * this.config.coreRadiusShare);
    }
  }
}
