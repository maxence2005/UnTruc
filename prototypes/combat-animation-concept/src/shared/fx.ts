// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import Phaser from 'phaser';

// Effets visuels partagés : étincelles, onde de choc, poussière, textes.

export function ensureFxTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('fx-dot')) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // point doux
  for (let i = 8; i > 0; i--) {
    g.fillStyle(0xffffff, 0.14 + (8 - i) * 0.1);
    g.fillCircle(16, 16, i * 2);
  }
  g.generateTexture('fx-dot', 32, 32);
  g.clear();
  // étincelle allongée
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(16, 4, 30, 6);
  g.generateTexture('fx-spark', 32, 8);
  g.clear();
  // poussière
  g.fillStyle(0xffffff, 1);
  g.fillCircle(12, 12, 11);
  g.generateTexture('fx-puff', 24, 24);
  g.destroy();
}

function burst(scene: Phaser.Scene, x: number, y: number, key: string, n: number, cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) {
  const life = (typeof cfg.lifespan === 'number' ? cfg.lifespan : 600) + 200;
  const em = scene.add.particles(x, y, key, { ...cfg, emitting: false });
  em.setDepth(50);
  em.explode(n);
  scene.time.delayedCall(life, () => em.destroy());
  return em;
}

export function sparks(scene: Phaser.Scene, x: number, y: number, color = 0xffd36b, n = 14, power = 1, dir?: number) {
  const a = dir === undefined ? { min: 0, max: 360 } : { min: dir - 55, max: dir + 55 };
  burst(scene, x, y, 'fx-spark', n, {
    speed: { min: 180 * power, max: 520 * power },
    angle: a,
    rotate: 0,
    lifespan: 380,
    scale: { start: 0.9, end: 0.1 },
    alpha: { start: 1, end: 0 },
    tint: color,
    blendMode: 'ADD',
    gravityY: 400,
  });
  burst(scene, x, y, 'fx-dot', 1, {
    speed: 0,
    lifespan: 180,
    scale: { start: 1.6 * power, end: 3 * power },
    alpha: { start: 0.9, end: 0 },
    tint: color,
    blendMode: 'ADD',
  });
}

export function ring(scene: Phaser.Scene, x: number, y: number, color = 0xffffff, radius = 70, width = 6, flat = false) {
  const g = scene.add.graphics().setDepth(49);
  const o = { t: 0 };
  scene.tweens.add({
    targets: o,
    t: 1,
    duration: 380,
    ease: 'Cubic.easeOut',
    onUpdate: () => {
      g.clear();
      g.lineStyle(width * (1 - o.t) + 1, color, 1 - o.t);
      if (flat) g.strokeEllipse(x, y, radius * 2 * o.t, radius * 0.6 * o.t);
      else g.strokeCircle(x, y, radius * o.t);
    },
    onComplete: () => g.destroy(),
  });
}

export function dust(scene: Phaser.Scene, x: number, y: number, n = 8, color = 0xcbb89a) {
  burst(scene, x, y, 'fx-puff', n, {
    speed: { min: 30, max: 140 },
    angle: { min: 180, max: 360 },
    lifespan: 550,
    scale: { start: 0.6, end: 1.4 },
    alpha: { start: 0.55, end: 0 },
    tint: color,
    gravityY: -40,
  });
}

export function fireTrail(scene: Phaser.Scene, follow: { x: number; y: number }) {
  const em = scene.add.particles(0, 0, 'fx-dot', {
    speed: { min: 10, max: 60 },
    lifespan: 380,
    scale: { start: 1.3, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: [0xffe08a, 0xff9a3c, 0xff4d2e],
    blendMode: 'ADD',
    frequency: 12,
    follow,
  });
  em.setDepth(45);
  return em;
}

export function popText(scene: Phaser.Scene, x: number, y: number, text: string, color = '#ffffff', size = 26) {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: size + 'px',
      fontStyle: '900',
      color,
      stroke: '#1d1a26',
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(60)
    .setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 450, duration: 450, onComplete: () => t.destroy() });
  return t;
}

// Bandeau du nom de la compétence, façon La Brute
export function banner(scene: Phaser.Scene, text: string, color = '#ffd36b', x?: number) {
  const { width } = scene.scale;
  const t = scene.add
    .text(x ?? width / 2, 150, text.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '30px',
      fontStyle: '900',
      color,
      stroke: '#1d1a26',
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setDepth(70)
    .setScrollFactor(0)
    .setAlpha(0)
    .setScale(1.6);
  scene.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 160, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: t, alpha: 0, y: 138, delay: 900, duration: 300, onComplete: () => t.destroy() });
}
