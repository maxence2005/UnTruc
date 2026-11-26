import type * as Phaser from 'phaser';
import type { ArenaWaveLook } from '../../core/stage-presentation';

/**
 * Onde du grognement (story 005) : `rings` anneaux partis du grogneur qui grandissent jusqu'à couvrir toute
 * l'arène en `durationMs` (durée de l'événement), plus des arcs de voix devant sa bouche. Une seule onde à
 * la fois (une nouvelle remplace l'ancienne) ; l'état est un seul objet réutilisé.
 */
export class GrowlWave {
  private alive = false;
  private x = 0;
  private y = 0;
  private fighter = 0;
  private facing = 1;
  private intensity = 0;
  private durationMs = 0;
  private ageMs = 0;
  private look: ArenaWaveLook | null = null;

  /** Rayon qui couvre toute l'arène depuis n'importe quel point : la diagonale. */
  constructor(private readonly maxRadius: number) {}

  /** Lance l'onde depuis (`x`, `y`) ; `fighter` et `facing` placent les arcs de voix. */
  emit(look: ArenaWaveLook, fighter: number, facing: number, x: number, y: number, intensity: number, durationMs: number): void {
    Object.assign(this, { alive: true, look, fighter, facing, x, y, intensity, durationMs, ageMs: 0 });
  }

  /** Fait avancer l'onde de `dtMs` (temps d'effet). */
  update(dtMs: number): void {
    if (!this.alive || this.look === null) return;
    this.ageMs += dtMs;
    const total = this.durationMs + (this.look.rings - 1) * this.look.ringDelayMs;
    if (this.ageMs >= Math.max(total, this.look.mouthMs)) this.alive = false;
  }

  /** Vrai tant que l'onde ou les arcs se voient. */
  get active(): boolean {
    return this.alive;
  }

  /** Rayon de l'anneau `ring` (0 = le premier) et sa progression de 0 à 1 ; progression hors de [0, 1[ : anneau caché. */
  ringProgress(ring: number): number {
    if (this.look === null) return -1;
    return (this.ageMs - ring * this.look.ringDelayMs) / this.durationMs;
  }

  /** Dessine anneaux et arcs ; `headOf` lit la tête du grogneur. */
  draw(g: Phaser.GameObjects.Graphics, headOf: (fighter: number) => { x: number; y: number }): void {
    const look = this.look;
    if (!this.alive || look === null) return;
    for (let ring = 0; ring < look.rings; ring += 1) {
      const t = this.ringProgress(ring);
      if (t < 0 || t >= 1) continue;
      const eased = 1 - (1 - t) ** 2;
      g.lineStyle(look.lineWidth * this.intensity * (1 - t) + 1, look.color, look.alpha * this.intensity * (1 - t));
      g.strokeCircle(this.x, this.y, this.maxRadius * eased);
    }
    if (this.ageMs < look.mouthMs) this.drawMouth(g, look, headOf(this.fighter));
  }

  /** Arcs « ))) » devant la bouche, qui partent en boucle vers l'avant. */
  private drawMouth(g: Phaser.GameObjects.Graphics, look: ArenaWaveLook, head: { x: number; y: number }): void {
    const center = this.facing > 0 ? 0 : Math.PI;
    const half = (look.mouthSpreadDeg * Math.PI) / 360;
    const period = look.mouthMs / 2;
    for (let arc = 0; arc < look.mouthArcs; arc += 1) {
      const phase = (this.ageMs / period + arc / look.mouthArcs) % 1;
      g.lineStyle(look.lineWidth * 0.5, look.color, 1 - phase);
      g.beginPath();
      g.arc(head.x, head.y, look.mouthRadius * (0.5 + phase), center - half, center + half);
      g.strokePath();
    }
  }
}
