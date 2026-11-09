// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import Phaser from 'phaser';
import type { CharacterSpec } from './character';

export const W = 960;
export const H = 540;

export function createGame(scene: Phaser.Types.Scenes.SceneType, matter = false): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#15131c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene,
    ...(matter
      ? {
          physics: {
            default: 'matter',
            matter: {
              gravity: { x: 0, y: 1.2 },
              positionIterations: 10,
              velocityIterations: 8,
              constraintIterations: 4,
              debug: false,
            },
          },
        }
      : {}),
  };
  const game = new Phaser.Game(config);
  (window as any).__game = game;
  return game;
}

// Relie les boutons de la page (Nouveau combat / Vitesse) à la scène.
export function bindPageButtons(scene: Phaser.Scene, onNew: () => void, onSpeed: (s: number) => void) {
  const speeds = [1, 2, 0.5];
  let i = 0;
  const bNew = document.getElementById('btn-new');
  const bSpeed = document.getElementById('btn-speed');
  const newH = () => onNew();
  const speedH = () => {
    i = (i + 1) % speeds.length;
    if (bSpeed) bSpeed.textContent = 'Vitesse ×' + String(speeds[i]).replace('.', ',');
    onSpeed(speeds[i]);
  };
  bNew?.addEventListener('click', newH);
  bSpeed?.addEventListener('click', speedH);
  scene.input.keyboard?.on('keydown-R', newH);
  scene.events.once('shutdown', () => {
    bNew?.removeEventListener('click', newH);
    bSpeed?.removeEventListener('click', speedH);
  });
}

// Barres de vie + fiches des deux combattants
export class Hud {
  private bars: { fill: Phaser.GameObjects.Rectangle; lag: Phaser.GameObjects.Rectangle; w: number; side: number }[] = [];
  constructor(private scene: Phaser.Scene, specs: CharacterSpec[], colors: number[]) {
    specs.forEach((s, i) => {
      const side = i === 0 ? -1 : 1;
      const w = 360;
      const x = i === 0 ? 24 : W - 24 - w;
      const y = 22;
      const box = scene.add.rectangle(x - 6, y - 8, w + 12, 62, 0x15131c, 0.65).setOrigin(0).setDepth(80);
      box.setStrokeStyle(1, 0x34304a);
      const name = scene.add
        .text(i === 0 ? x : x + w, y - 4, s.name, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: '800',
          color: '#f3ede2',
        })
        .setOrigin(i === 0 ? 0 : 1, 0)
        .setDepth(81);
      const stats = `FOR ${s.force} · AGI ${s.agilite} · VIT ${s.vitesse} · PV ${s.hp}`;
      scene.add
        .text(i === 0 ? x + w : x, y, stats, { fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#a49eb3' })
        .setOrigin(i === 0 ? 1 : 0, 0)
        .setDepth(81);
      void name;
      const by = y + 22;
      scene.add.rectangle(x, by, w, 16, 0x2c2840).setOrigin(0).setDepth(81).setStrokeStyle(2, 0x1d1a26);
      const lag = scene.add.rectangle(i === 0 ? x : x + w, by, w, 16, 0xffffff).setOrigin(i === 0 ? 0 : 1, 0).setDepth(82);
      const fill = scene.add
        .rectangle(i === 0 ? x : x + w, by, w, 16, colors[i])
        .setOrigin(i === 0 ? 0 : 1, 0)
        .setDepth(83);
      this.bars.push({ fill, lag, w, side });
    });
  }
  setHp(i: number, ratio: number) {
    const b = this.bars[i];
    const r = Phaser.Math.Clamp(ratio, 0, 1);
    b.fill.width = b.w * r;
    this.scene.tweens.add({ targets: b.lag, width: b.w * r, delay: 250, duration: 400, ease: 'Cubic.easeOut' });
  }
}

export function winnerText(scene: Phaser.Scene, name: string) {
  const t = scene.add
    .text(W / 2, H / 2 - 40, `${name} gagne !`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '54px',
      fontStyle: '900',
      color: '#ffd36b',
      stroke: '#1d1a26',
      strokeThickness: 10,
    })
    .setOrigin(0.5)
    .setDepth(90)
    .setScrollFactor(0)
    .setScale(0.2);
  scene.tweens.add({ targets: t, scale: 1, duration: 420, ease: 'Back.easeOut' });
  const sub = scene.add
    .text(W / 2, H / 2 + 14, 'R ou « Nouveau combat » pour relancer', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#f3ede2',
      stroke: '#1d1a26',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(90)
    .setScrollFactor(0);
  return [t, sub];
}

// Décor commun : ciel en dégradé, collines, sol
export function drawArena(scene: Phaser.Scene, groundY: number, fancy: boolean) {
  const g = scene.add.graphics().setDepth(-10);
  const top = fancy ? 0x2a2550 : 0x221f30;
  const bottom = fancy ? 0xf08a5d : 0x3a3550;
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(top),
      Phaser.Display.Color.ValueToColor(bottom),
      steps - 1,
      i,
    );
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, (groundY / steps) * i, W, groundY / steps + 1);
    void t;
  }
  if (fancy) {
    g.fillStyle(0xffd36b, 0.9);
    g.fillCircle(W / 2, groundY - 250, 40);
    g.fillStyle(0x3b2f5c, 1);
    for (let x = -40; x < W + 80; x += 120) g.fillEllipse(x, groundY + 10, 260, 150);
    g.fillStyle(0x2c2447, 1);
    for (let x = 20; x < W + 80; x += 160) g.fillEllipse(x, groundY + 20, 220, 90);
  } else {
    g.fillStyle(0x2b2840, 1);
    for (let x = -40; x < W + 80; x += 140) g.fillEllipse(x, groundY + 10, 240, 110);
  }
  // sol
  g.fillStyle(fancy ? 0x5b4636 : 0x3a3448, 1);
  g.fillRect(0, groundY, W, H - groundY);
  g.fillStyle(fancy ? 0x7ccf63 : 0x4b4560, 1);
  g.fillRect(0, groundY, W, 8);
  g.fillStyle(0x000000, 0.18);
  g.fillRect(0, groundY + 8, W, 6);
  return g;
}
