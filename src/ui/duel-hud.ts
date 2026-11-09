import * as Phaser from 'phaser';
import type { Duel } from '../core/duel';
import type { ArenaConfig } from '../core/duel-config';
import { PRESENTATION } from '../content/presentation';

const HUD_DEPTH = 100;

/**
 * Barres de PV, noms et annonce du vainqueur. Lit le duel (PV, événements),
 * ne le modifie jamais.
 */
export class DuelHud {
  private readonly bars: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly duel: Duel,
    private readonly arena: ArenaConfig,
  ) {
    const { hud } = PRESENTATION;
    this.bars = scene.add.graphics().setDepth(HUD_DEPTH);
    duel.fighters.forEach((fighter, index) => {
      const x = this.barX(index);
      const align = index === 0 ? 0 : 1;
      scene.add
        .text(index === 0 ? x : x + hud.barWidth, hud.margin - 8, fighter.spec.name, { font: hud.nameFont, color: hud.textColor })
        .setOrigin(align, 1)
        .setDepth(HUD_DEPTH);
    });
    duel.events.on('duelEnd', ({ winner }) => this.showWinner(duel.fighters[winner].spec.name));
  }

  /** Redessine les barres d'après les PV courants. */
  update(): void {
    const { hud } = PRESENTATION;
    this.bars.clear();
    this.duel.fighters.forEach((fighter, index) => {
      const x = this.barX(index);
      const ratio = fighter.hp / fighter.spec.maxHp;
      const filled = hud.barWidth * ratio;
      this.bars.fillStyle(hud.barBackColor, 1);
      this.bars.fillRect(x, hud.margin, hud.barWidth, hud.barHeight);
      this.bars.fillStyle(fighter.spec.colors.body, 1);
      this.bars.fillRect(index === 0 ? x : x + hud.barWidth - filled, hud.margin, filled, hud.barHeight);
      this.bars.lineStyle(hud.barBorderThickness, hud.barBorderColor, 1);
      this.bars.strokeRect(x, hud.margin, hud.barWidth, hud.barHeight);
    });
  }

  private barX(index: number): number {
    const { hud } = PRESENTATION;
    return index === 0 ? hud.margin : this.arena.width - hud.margin - hud.barWidth;
  }

  private showWinner(name: string): void {
    const { hud } = PRESENTATION;
    this.scene.add
      .text(this.arena.width / 2, hud.winnerY, hud.winnerText.replace('{name}', name), {
        font: hud.winnerFont,
        color: hud.textColor,
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH);
  }
}
