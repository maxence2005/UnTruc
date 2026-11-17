import * as Phaser from 'phaser';
import type { NoDamageReason } from '../core/hit';
import type { SkillBannerLook, SkillReasonsLook } from '../core/presentation-config';
import { separateBanners } from './banner-layout';

/**
 * Couche des textes : devant les effets (`FX_DEPTH`), derrière le HUD (100). C'est un ordre de
 * dessin entre couches du rendu, comme `FX_DEPTH` et `VEIL_DEPTH`, pas un réglage d'affichage :
 * il reste en code, à côté des autres profondeurs.
 */
const LABEL_DEPTH = 60;

interface Banner {
  back: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  ageMs: number;
  active: boolean;
  /** Largeur du fond, et position de l'image en cours (après écartement). */
  width: number;
  x: number;
  y: number;
}

interface Floater {
  text: Phaser.GameObjects.Text;
  x: number;
  y: number;
  ageMs: number;
  active: boolean;
}

/**
 * Textes que le spectateur lit : le nom de la compétence au lancement (bandeau dessiné au-dessus
 * du lanceur) et la raison d'un coup sans dégâts (« Esquivé », « Bloqué », « Raté », au point
 * d'impact). Textes, couleurs et durées viennent de la présentation ; objets créés une fois,
 * réutilisés. Les noms n'ont jamais d'émoji (art bible).
 */
export class SkillLabels {
  private readonly banners: Banner[];
  private readonly floaters: Floater[];

  constructor(
    scene: Phaser.Scene,
    fighters: number,
    private readonly banner: SkillBannerLook,
    private readonly reasons: SkillReasonsLook,
    private readonly headOf: (fighter: number) => { x: number; y: number },
  ) {
    this.banners = Array.from({ length: fighters }, () => ({
      back: scene.add.graphics().setDepth(LABEL_DEPTH).setVisible(false),
      text: scene.add.text(0, 0, '', { font: banner.font, color: banner.textColor }).setOrigin(0.5).setDepth(LABEL_DEPTH + 0.1).setVisible(false),
      ageMs: 0,
      active: false,
      width: 0,
      x: 0,
      y: 0,
    }));
    this.floaters = Array.from({ length: reasons.maxShown }, () => ({
      text: scene.add.text(0, 0, '', { font: reasons.font }).setOrigin(0.5).setDepth(LABEL_DEPTH).setVisible(false),
      x: 0,
      y: 0,
      ageMs: 0,
      active: false,
    }));
  }

  /** Affiche le nom d'une compétence au-dessus du lanceur, dans la couleur de la compétence. */
  showName(fighter: number, name: string, color: number): void {
    const { banner } = this;
    const item = this.banners[fighter];
    item.text.setText(name);
    const width = item.text.width + banner.paddingX * 2;
    const height = item.text.height + banner.paddingY * 2;
    item.back.clear();
    item.back.fillStyle(banner.backColor, banner.backAlpha);
    item.back.fillRoundedRect(-width / 2, -height / 2, width, height, banner.radius);
    item.back.lineStyle(banner.borderWidth, color, 1);
    item.back.strokeRoundedRect(-width / 2, -height / 2, width, height, banner.radius);
    item.width = width;
    item.ageMs = 0;
    item.active = true;
  }

  /** Affiche la raison d'un coup sans dégâts en (`x`, `y`). */
  showReason(reason: NoDamageReason, x: number, y: number): void {
    const floater = this.floaters.find((candidate) => !candidate.active) ?? this.floaters[0];
    const look = this.reasons.byReason[reason];
    floater.text.setText(look.text).setColor(look.color).setStroke(this.reasons.strokeColor, this.reasons.strokeWidth);
    Object.assign(floater, { x, y, ageMs: 0, active: true });
  }

  /** Une image : avance les textes de `dtMs` (temps d'effet) et les recale. */
  update(dtMs: number): void {
    this.ageBanners(dtMs);
    separateBanners(this.banners[0], this.banners[1], this.banner.gap);
    this.placeBanners();
    this.updateFloaters(dtMs);
  }

  /** Vieillit les bandeaux, cache ceux qui ont fait leur temps, place les autres au-dessus de la tête (avant écartement). */
  private ageBanners(dtMs: number): void {
    const { banner } = this;
    for (let fighter = 0; fighter < this.banners.length; fighter += 1) {
      const item = this.banners[fighter];
      if (item.active) item.ageMs += dtMs;
      if (item.ageMs >= banner.durationMs) item.active = false;
      item.back.setVisible(item.active);
      item.text.setVisible(item.active);
      if (!item.active) continue;
      const head = this.headOf(fighter);
      item.x = head.x;
      item.y = head.y - banner.offsetY - banner.riseDistance * Math.min(1, item.ageMs / banner.durationMs);
    }
  }

  /** Recale fond et texte des bandeaux affichés (après écartement), avec leur fondu de fin. */
  private placeBanners(): void {
    const { banner } = this;
    for (const item of this.banners) {
      if (!item.active) continue;
      const alpha = Phaser.Math.Clamp((banner.durationMs - item.ageMs) / banner.fadeMs, 0, 1);
      item.back.setPosition(item.x, item.y).setAlpha(alpha);
      item.text.setPosition(item.x, item.y).setAlpha(alpha);
    }
  }

  /** Fait monter et s'effacer les raisons affichées. */
  private updateFloaters(dtMs: number): void {
    const { reasons } = this;
    for (const floater of this.floaters) {
      if (floater.active) floater.ageMs += dtMs;
      if (floater.ageMs >= reasons.durationMs) floater.active = false;
      floater.text.setVisible(floater.active);
      if (!floater.active) continue;
      const t = floater.ageMs / reasons.durationMs;
      floater.text.setPosition(floater.x, floater.y - reasons.riseDistance * t).setAlpha(1 - t * t);
    }
  }
}
