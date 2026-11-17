import type * as Phaser from 'phaser';
import type { StatusBadgeLook, StatusGlyph, StatusLook } from '../core/status-presentation';
import { fillTeardrop } from './fx/blood';
import { badgeParts, type BadgeParts } from './status-badge-layout';

/** Dessine le pictogramme d'un statut, centré selon `parts`, dans la couleur courante de `g`. */
function drawGlyph(g: Phaser.GameObjects.Graphics, glyph: StatusGlyph, parts: BadgeParts): void {
  switch (glyph) {
    case 'drop':
      fillTeardrop(g, parts.glyphX, parts.glyphY, parts.glyphRadius);
      return;
  }
}

/**
 * Pastille d'un statut (story 013) : carré arrondi de la couleur du statut, cerné d'encre, son
 * pictogramme dessiné (une goutte pour le saignement) et son nombre de charges en chiffre. La couleur
 * n'est jamais seule : la forme et le chiffre portent l'information. Composant réutilisable : la
 * HUD le place sous la barre de vie (`DuelHud.statusRow`) ; la story 014 en reprendra le style.
 * Objets Phaser créés une fois ; le dessin n'est refait que si le statut change, le texte que si
 * les charges changent.
 *
 * @example
 * const badge = new StatusBadge(scene, look.badge, depth);
 * badge.show('bleed', look.byId.bleed, 3);
 * badge.setPosition(x, y);
 */
export class StatusBadge {
  private readonly shape: Phaser.GameObjects.Graphics;
  private readonly count: Phaser.GameObjects.Text;
  private readonly parts: BadgeParts;
  private shownStatus = '';
  private shownCharges = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly look: StatusBadgeLook,
    depth: number,
  ) {
    this.parts = badgeParts(look);
    this.shape = scene.add.graphics().setDepth(depth).setVisible(false);
    this.count = scene.add
      .text(this.parts.countX, this.parts.countY, '', { font: look.countFont, color: look.countColor })
      .setStroke(look.countStrokeColor, look.countStrokeWidth)
      .setOrigin(0.5)
      .setDepth(depth + 0.1)
      .setVisible(false);
  }

  /** Affiche le statut `status` (dessiné d'après `statusLook`) avec `charges` charges. */
  show(status: string, statusLook: StatusLook, charges: number): void {
    if (status !== this.shownStatus) {
      this.redraw(statusLook);
      this.shownStatus = status;
    }
    if (charges !== this.shownCharges) {
      this.count.setText(String(charges));
      this.shownCharges = charges;
    }
    this.shape.setVisible(true);
    this.count.setVisible(true);
  }

  /** Cache la pastille (le statut a expiré). */
  hide(): void {
    this.shape.setVisible(false);
    this.count.setVisible(false);
  }

  /** Place le centre de la pastille en (`x`, `y`). */
  setPosition(x: number, y: number): void {
    this.shape.setPosition(x, y);
    this.count.setPosition(x + this.parts.countX, y + this.parts.countY);
  }

  private redraw(statusLook: StatusLook): void {
    const { look, parts, shape } = this;
    shape.clear();
    shape.fillStyle(statusLook.color, 1);
    shape.fillRoundedRect(parts.boxX, parts.boxY, parts.boxSize, parts.boxSize, look.radius);
    shape.lineStyle(look.borderWidth, look.borderColor, 1);
    shape.strokeRoundedRect(parts.boxX, parts.boxY, parts.boxSize, parts.boxSize, look.radius);
    shape.fillStyle(look.glyphColor, 1);
    drawGlyph(shape, statusLook.glyph, parts);
  }
}
