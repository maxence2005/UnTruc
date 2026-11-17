import type * as Phaser from 'phaser';
import type { SkillMarkerLook } from '../core/presentation-config';

interface Mark {
  active: boolean;
  x: number;
  y: number;
  color: number;
}

/**
 * Cible d'un saut, lisible dès le lancement : ellipse au sol sur l'endroit visé et arc pointillé du
 * lanceur jusqu'à elle. L'arc suit le lanceur tant que la marque est là ; elle disparaît quand un
 * effet de compétence le demande (`CueEffect.hideMarker`), à la fin de la compétence ou au KO.
 */
export class SkillMarker {
  private readonly marks: Mark[];

  constructor(
    fighters: number,
    private readonly look: SkillMarkerLook,
  ) {
    this.marks = Array.from({ length: fighters }, () => ({ active: false, x: 0, y: 0, color: 0xffffff }));
  }

  /** Marque la cible (`x`, `y` au sol) du combattant. */
  show(fighter: number, x: number, y: number, color: number): void {
    const mark = this.marks[fighter];
    mark.active = true;
    mark.x = x;
    mark.y = y;
    mark.color = color;
  }

  /** Efface la marque du combattant. */
  hide(fighter: number): void {
    this.marks[fighter].active = false;
  }

  /** Vrai tant qu'une marque est visible. */
  get active(): boolean {
    for (let i = 0; i < this.marks.length; i += 1) if (this.marks[i].active) return true;
    return false;
  }

  /** Dessine les marques sur `g` (déjà effacé) ; `from(fighter)` : le point de départ de l'arc, suivi image par image. */
  draw(g: Phaser.GameObjects.Graphics, from: (fighter: number) => { x: number; y: number }): void {
    const { look } = this;
    for (let fighter = 0; fighter < this.marks.length; fighter += 1) {
      const mark = this.marks[fighter];
      if (!mark.active) continue;
      g.lineStyle(look.ringWidth, mark.color, look.alpha);
      g.strokeEllipse(mark.x, mark.y, look.ringRadius * 2, look.ringRadius * 2 * look.ringSquash);
      const start = from(fighter);
      const startX = start.x;
      const startY = start.y;
      g.lineStyle(look.lineWidth, mark.color, look.alpha);
      let px = startX;
      let py = startY;
      let length = 0;
      for (let i = 1; i <= look.arcSegments; i += 1) {
        const t = i / look.arcSegments;
        const x = startX + (mark.x - startX) * t;
        const y = startY + (mark.y - startY) * t - look.arcHeight * 4 * t * (1 - t);
        if (length % (look.dashLength + look.gapLength) < look.dashLength) g.lineBetween(px, py, x, y);
        length += Math.hypot(x - px, y - py);
        px = x;
        py = y;
      }
    }
  }
}
