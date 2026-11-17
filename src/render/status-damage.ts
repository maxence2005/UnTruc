import type * as Phaser from 'phaser';
import type { StatusDamageLook } from '../core/status-presentation';

interface Floater {
  text: Phaser.GameObjects.Text;
  x: number;
  y: number;
  ageMs: number;
  active: boolean;
}

/**
 * Texte d'une perte de PV due à un statut, d'après `StatusDamageLook.text` (`{damage}` remplacé).
 * Fonction pure.
 *
 * @example statusDamageText('-{damage}', 2) // '-2'
 */
export function statusDamageText(template: string, damage: number): string {
  return template.replace('{damage}', String(damage));
}

/**
 * Petits chiffres des PV perdus à cause d'un statut (story 013) : ils naissent à côté du torse,
 * montent et s'effacent. Plus petits et plus brefs que les raisons des coups (`SkillLabels`). Textes
 * créés une fois, réutilisés ; au plein, le plus ancien emplacement repart.
 *
 * @example numbers.show(x, y, 1); numbers.update(dtMs);
 */
export class StatusDamageNumbers {
  private readonly floaters: Floater[];
  private next = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly look: StatusDamageLook,
    depth: number,
  ) {
    this.floaters = Array.from({ length: look.maxShown }, () => ({
      text: scene.add.text(0, 0, '', { font: look.font, color: look.color }).setStroke(look.strokeColor, look.strokeWidth).setOrigin(0.5).setDepth(depth).setVisible(false),
      x: 0,
      y: 0,
      ageMs: 0,
      active: false,
    }));
  }

  /** Affiche `damage` PV perdus à côté du torse en (`torsoX`, `torsoY`). */
  show(torsoX: number, torsoY: number, damage: number): void {
    const floater = this.floaters[this.next];
    this.next = (this.next + 1) % this.floaters.length;
    floater.text.setText(statusDamageText(this.look.text, damage));
    floater.x = torsoX + this.look.offsetX;
    floater.y = torsoY - this.look.lift;
    floater.ageMs = 0;
    floater.active = true;
  }

  /** Fait monter et s'effacer les chiffres affichés de `dtMs` (temps d'effet). */
  update(dtMs: number): void {
    const { durationMs, riseDistance } = this.look;
    for (const floater of this.floaters) {
      if (floater.active) floater.ageMs += dtMs;
      if (floater.ageMs >= durationMs) floater.active = false;
      floater.text.setVisible(floater.active);
      if (!floater.active) continue;
      const t = floater.ageMs / durationMs;
      floater.text.setPosition(floater.x, floater.y - riseDistance * t).setAlpha(1 - t * t);
    }
  }
}
