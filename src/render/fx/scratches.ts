import type * as Phaser from 'phaser';
import type { ScratchLook } from '../../core/stage-presentation';

interface Scratch {
  alive: boolean;
  victim: number;
  /** Écart au centre du torse de la victime au moment du coup : la griffure suit la victime. */
  dx: number;
  dy: number;
  angle: number;
  ageMs: number;
}

/** Angle des griffures (radians, écran) : de haut en bas, dans le sens où passe la main de l'attaquant. */
export function scratchAngle(attackerX: number, victimX: number, angleDeg: number): number {
  const radians = (angleDeg * Math.PI) / 180;
  return victimX >= attackerX ? radians : Math.PI - radians;
}

/**
 * Griffures laissées par les coups d'une forme (story 005, critère 3) : `lines` traits parallèles tracés en
 * `drawMs`, puis effacés jusqu'à `lifeMs`. Pool de taille fixe (`maxShown`) : plein, la plus ancienne est
 * réutilisée. Rien n'est alloué pendant le jeu.
 */
export class ScratchPool {
  readonly items: Scratch[];

  constructor(private readonly look: ScratchLook) {
    this.items = Array.from({ length: look.maxShown }, () => ({ alive: false, victim: 0, dx: 0, dy: 0, angle: 0, ageMs: 0 }));
  }

  /** Pose une griffure sur `victim`, à (`dx`, `dy`) du centre de son torse. */
  emit(victim: number, dx: number, dy: number, angle: number): void {
    let slot = this.items[0];
    for (const item of this.items) {
      if (!item.alive) {
        slot = item;
        break;
      }
      if (item.ageMs > slot.ageMs) slot = item;
    }
    slot.alive = true;
    slot.victim = victim;
    slot.dx = dx;
    slot.dy = dy;
    slot.angle = angle;
    slot.ageMs = 0;
  }

  /** Fait vieillir les griffures de `dtMs` (temps d'effet). */
  update(dtMs: number): void {
    for (const item of this.items) {
      if (!item.alive) continue;
      item.ageMs += dtMs;
      if (item.ageMs >= this.look.lifeMs) item.alive = false;
    }
  }

  /** Nombre de griffures visibles. */
  get count(): number {
    let alive = 0;
    for (const item of this.items) if (item.alive) alive += 1;
    return alive;
  }

  /** Dessine les griffures ; `torsoOf` lit le torse de la victime (objet de sortie réutilisé). */
  draw(g: Phaser.GameObjects.Graphics, torsoOf: (fighter: number) => { x: number; y: number }): void {
    const { look } = this;
    for (const item of this.items) {
      if (!item.alive) continue;
      const torso = torsoOf(item.victim);
      const reveal = Math.min(1, item.ageMs / look.drawMs);
      const alpha = 1 - Math.max(0, (item.ageMs - look.drawMs) / (look.lifeMs - look.drawMs));
      const ux = Math.cos(item.angle);
      const uy = Math.sin(item.angle);
      for (let pass = 0; pass < 2; pass += 1) {
        g.lineStyle(pass === 0 ? look.width + look.outlineWidth * 2 : look.width, pass === 0 ? look.outlineColor : look.color, alpha);
        for (let line = 0; line < look.lines; line += 1) {
          const shift = (line - (look.lines - 1) / 2) * look.spacing;
          const cx = torso.x + item.dx - uy * shift;
          const cy = torso.y + item.dy + ux * shift;
          const half = look.length / 2;
          g.lineBetween(cx - ux * half, cy - uy * half, cx + ux * (look.length * reveal - half), cy + uy * (look.length * reveal - half));
        }
      }
    }
  }
}
