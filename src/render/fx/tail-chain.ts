import type { CosmeticChain } from '../../core/cosmetic-spec';

/** Nombre de pas fixes joués au plus par image : au-delà (onglet en arrière-plan), le retard est oublié. */
const MAX_STEPS_PER_FRAME = 8;

/**
 * Queue simulée côté rendu (story 005) : une chaîne de points à pas fixe (Verlet), avec inertie (`damping`),
 * gravité et rappel vers une direction de repos, puis chaque segment remis à sa longueur exacte depuis
 * l'attache. Aucun corps Matter : la queue ne touche jamais le duel ni son empreinte. Tableaux créés une
 * fois : rien n'est alloué par image.
 *
 * @example
 * chain.reset(ax, ay, dx, dy);         // à la pose
 * chain.update(dtMs, ax, ay, dx, dy);  // chaque image : attache et direction de repos dans le monde
 */
export class TailChain {
  /** Points de la chaîne (0 = attache), en px monde. */
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  private readonly prevXs: Float64Array;
  private readonly prevYs: Float64Array;
  private accumulatorMs = 0;

  constructor(private readonly spec: CosmeticChain) {
    const count = spec.segments + 1;
    this.xs = new Float64Array(count);
    this.ys = new Float64Array(count);
    this.prevXs = new Float64Array(count);
    this.prevYs = new Float64Array(count);
  }

  /** Pose la chaîne droite depuis (`ax`, `ay`) dans la direction (`dx`, `dy`), au repos. */
  reset(ax: number, ay: number, dx: number, dy: number): void {
    const length = Math.hypot(dx, dy) || 1;
    for (let i = 0; i < this.xs.length; i += 1) {
      this.xs[i] = this.prevXs[i] = ax + (dx / length) * this.spec.segmentLength * i;
      this.ys[i] = this.prevYs[i] = ay + (dy / length) * this.spec.segmentLength * i;
    }
    this.accumulatorMs = 0;
  }

  /** Avance de `dtMs` (temps d'effet) par pas fixes ; (`ax`, `ay`) : l'attache, (`dx`, `dy`) : la direction de repos. */
  update(dtMs: number, ax: number, ay: number, dx: number, dy: number): void {
    this.accumulatorMs = Math.min(this.accumulatorMs + dtMs, this.spec.stepMs * MAX_STEPS_PER_FRAME);
    const length = Math.hypot(dx, dy) || 1;
    while (this.accumulatorMs >= this.spec.stepMs) {
      this.step(ax, ay, dx / length, dy / length);
      this.accumulatorMs -= this.spec.stepMs;
    }
  }

  /** Un pas fixe : inertie et gravité, rappel vers le repos, puis longueur de chaque segment rétablie. */
  private step(ax: number, ay: number, ux: number, uy: number): void {
    const { segmentLength, damping, stiffness, gravity, stepMs } = this.spec;
    const seconds = stepMs / 1000;
    this.xs[0] = this.prevXs[0] = ax;
    this.ys[0] = this.prevYs[0] = ay;
    for (let i = 1; i < this.xs.length; i += 1) {
      const vx = (this.xs[i] - this.prevXs[i]) * damping;
      const vy = (this.ys[i] - this.prevYs[i]) * damping;
      this.prevXs[i] = this.xs[i];
      this.prevYs[i] = this.ys[i];
      let x = this.xs[i] + vx;
      let y = this.ys[i] + vy + gravity * seconds * seconds;
      x += (this.xs[i - 1] + ux * segmentLength - x) * stiffness;
      y += (this.ys[i - 1] + uy * segmentLength - y) * stiffness;
      const gapX = x - this.xs[i - 1];
      const gapY = y - this.ys[i - 1];
      const gap = Math.hypot(gapX, gapY) || 1;
      this.xs[i] = this.xs[i - 1] + (gapX / gap) * segmentLength;
      this.ys[i] = this.ys[i - 1] + (gapY / gap) * segmentLength;
    }
  }
}

/** Point du repère d'une partie (`+x` avant) vers le monde : retourné selon `facing`, tourné de `angle`, posé sur la partie. */
export function partToWorld(part: { x: number; y: number; angle: number }, facing: number, lx: number, ly: number, out: { x: number; y: number }): { x: number; y: number } {
  const x = lx * facing;
  const cos = Math.cos(part.angle);
  const sin = Math.sin(part.angle);
  out.x = part.x + x * cos - ly * sin;
  out.y = part.y + x * sin + ly * cos;
  return out;
}
