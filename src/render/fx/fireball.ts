import type * as Phaser from 'phaser';
import type { FxFireball } from '../../core/presentation-config';
import { SampleClock } from './sample-clock';

interface Point {
  x: number;
  y: number;
}

/** Emplacement libre : aucun projectile du duel n'y est posé. */
const FREE = -1;

interface Ball {
  alive: boolean;
  /** Posée par `place` (suit un projectile du duel) : elle ne se déplace pas seule. */
  tracked: boolean;
  /** Id du projectile du duel posé sur cette boule (`place`), `FREE` sinon. */
  projectileId: number;
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
 * Boule de feu : tête lumineuse à trois couches et traînée qui s'affine. `launch` la fait voler
 * seule (démo, touche F) ; `place` la pose chaque image sur un projectile du duel (compétence boule de feu, story 004).
 * La traînée s'échantillonne au temps d'effet (`trailSampleMs`), comme `TrailFx` : même longueur à
 * toutes les fréquences d'image, étirée par le ralenti. Pool fixe de `maxFireballs` boules, rien
 * n'est alloué pendant le jeu.
 */
export class FireballFx {
  private readonly balls: Ball[];
  private readonly clock: SampleClock;

  constructor(
    private readonly config: FxFireball,
    private readonly onArrive: (x: number, y: number) => void,
  ) {
    this.clock = new SampleClock(config.trailSampleMs, 'fx.fireball.trailSampleMs');
    this.balls = Array.from({ length: config.maxFireballs }, () => ({
      alive: false,
      tracked: false,
      projectileId: FREE,
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
    Object.assign(ball, { alive: true, tracked: false, projectileId: FREE, x: from.x, y: from.y, targetX: to.x, targetY: to.y, trailCount: 0, trailHead: 0 });
    ball.vx = ((to.x - from.x) / distance) * this.config.speed;
    ball.vy = ((to.y - from.y) / distance) * this.config.speed;
  }

  /**
   * Pose la boule du projectile `id` en (`x`, `y`). À la première pose, le projectile prend une
   * boule libre et la garde jusqu'à `release(id)`. Pool plein (plus de `maxFireballs` boules à
   * l'écran) : le nouveau projectile n'est pas dessiné, les boules déjà posées restent intactes.
   */
  place(id: number, x: number, y: number): void {
    const ball = this.ballOf(id) ?? this.claim(id);
    if (ball === undefined) return;
    ball.x = x;
    ball.y = y;
  }

  /** Éteint la boule du projectile `id` et libère sa place ; sans effet si `id` n'a pas de boule. */
  release(id: number): void {
    const ball = this.ballOf(id);
    if (ball === undefined) return;
    ball.alive = false;
    ball.projectileId = FREE;
  }

  /** Fait avancer les boules de `dtMs` (temps d'effet) : traînée échantillonnée, puis vol des boules de `launch`. */
  update(dtMs: number): void {
    for (let due = this.clock.advance(dtMs); due > 0; due -= 1) this.sampleTrails();
    const dtS = dtMs / 1000;
    for (const ball of this.balls) {
      if (!ball.alive || ball.tracked) continue;
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

  /** Boule posée pour le projectile `id`, s'il en a une. */
  private ballOf(id: number): Ball | undefined {
    for (const ball of this.balls) if (ball.tracked && ball.alive && ball.projectileId === id) return ball;
    return undefined;
  }

  /** Donne une boule libre au projectile `id` ; `undefined` si toutes volent. */
  private claim(id: number): Ball | undefined {
    for (const ball of this.balls) {
      if (ball.alive) continue;
      Object.assign(ball, { alive: true, tracked: true, projectileId: id, trailCount: 0, trailHead: 0 });
      return ball;
    }
    return undefined;
  }

  /** Un échantillon : la position de chaque boule vivante entre dans sa traînée. */
  private sampleTrails(): void {
    const { trailPoints } = this.config;
    for (const ball of this.balls) {
      if (!ball.alive) continue;
      ball.trailX[ball.trailHead] = ball.x;
      ball.trailY[ball.trailHead] = ball.y;
      ball.trailHead = (ball.trailHead + 1) % trailPoints;
      ball.trailCount = Math.min(ball.trailCount + 1, trailPoints);
    }
  }
}
