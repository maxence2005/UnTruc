// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import Phaser from 'phaser';
import { CharacterSpec, LIMB_PAD_Y, SIZE, buildCharacterTextures, headTexSize } from '../shared/character';

// ---------------------------------------------------------------------------
// Pantin 2D à squelette (piste 2).
// Une pose = une poignée d'angles. Une animation = une suite de poses + easing.
// Toutes les compétences de tous les persos réutilisent ce même squelette.
// ---------------------------------------------------------------------------

export interface Pose {
  x: number; // décalage du bassin
  y: number;
  rot: number; // rotation du corps entier (sauts, KO)
  sx: number; // écrasement / étirement
  sy: number;
  lean: number; // buste (+ = vers l'avant)
  head: number;
  sF: number; // épaule avant
  eF: number; // coude avant
  sB: number; // épaule arrière
  eB: number;
  hF: number; // hanche avant
  kF: number; // genou avant
  hB: number;
  kB: number;
  wpn: number; // rotation de l'arme dans la main
}

export const STANCE: Pose = {
  x: 0, y: 5, rot: 0, sx: 1, sy: 1,
  lean: 0.12, head: -0.05,
  sF: -1.0, eF: -1.7, sB: -0.5, eB: -1.9,
  hF: -0.4, kF: 0.5, hB: 0.35, kB: 0.3,
  wpn: 1.1,
};

type Mode = 'idle' | 'run' | 'still';

export class Puppet {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  pose: Pose = { ...STANCE };
  mode: Mode = 'idle';
  facing: 1 | -1;
  hipH: number;
  private torso: Phaser.GameObjects.Container;
  private headC: Phaser.GameObjects.Container;
  private j: Record<'sF' | 'eF' | 'sB' | 'eB' | 'hF' | 'kF' | 'hB' | 'kB', Phaser.GameObjects.Container>;
  private weaponImg: Phaser.GameObjects.Image | null = null;
  private images: Phaser.GameObjects.Image[] = [];
  private backImgs = new Set<Phaser.GameObjects.Image>();
  private shadow: Phaser.GameObjects.Ellipse;
  private phase = 0;
  private t = Math.random() * 10;
  hasWeapon: boolean;

  constructor(private scene: Phaser.Scene, public spec: CharacterSpec, x: number, groundY: number, facing: 1 | -1) {
    this.facing = facing;
    const k = buildCharacterTextures(scene, spec);
    const s = spec;
    this.hipH = s.thigh - s.legW + (s.shin - s.legW / 2);

    const limbImg = (key: string, w: number, len: number, back: boolean) => {
      const img = scene.add.image(0, 0, key);
      img.setOrigin(0.5, (LIMB_PAD_Y + w / 2) / (len + LIMB_PAD_Y * 2));
      if (back) {
        img.setTint(0xb9b4c8);
        this.backImgs.add(img);
      }
      this.images.push(img);
      return img;
    };
    const joint = (x: number, y: number, ...children: Phaser.GameObjects.GameObject[]) =>
      scene.add.container(x, y, children);

    // jambes
    const leg = (back: boolean) => {
      const shin = limbImg(k.shin, s.legW, s.shin, back);
      const knee = joint(0, s.thigh - s.legW, shin);
      const thigh = limbImg(k.thigh, s.legW, s.thigh, back);
      const hip = joint(back ? -3 : 3, 0, thigh, knee);
      return { hip, knee };
    };
    const legB = leg(true);
    const legF = leg(false);

    // bras
    const arm = (back: boolean, withWeapon: boolean) => {
      const fore = limbImg(k.farm, s.armW, s.foreArm, back);
      const elbowKids: Phaser.GameObjects.GameObject[] = [];
      if (withWeapon && k.weapon) {
        const w = scene.add.image(0, s.foreArm - s.armW / 2, k.weapon).setOrigin(10 / 90, 0.5).setScale(SIZE);
        this.weaponImg = w;
        this.images.push(w);
        elbowKids.push(w);
      }
      elbowKids.push(fore);
      const elbow = joint(0, s.upperArm - s.armW, ...elbowKids);
      const upper = limbImg(k.uarm, s.armW, s.upperArm, back);
      const shoulder = joint(back ? -s.torsoW * 0.12 : s.torsoW * 0.12, -s.torsoH + 10, upper, elbow);
      return { shoulder, elbow };
    };
    const armB = arm(true, false);
    const armF = arm(false, true);

    // torse + tête
    const torsoImg = scene.add.image(0, 0, k.torso);
    torsoImg.setOrigin(0.5, (LIMB_PAD_Y + s.torsoH - 5) / (s.torsoH + LIMB_PAD_Y * 2));
    this.images.push(torsoImg);
    const headImg = scene.add.image(0, -s.headR * 0.8, k.head);
    void headTexSize;
    this.images.push(headImg);
    this.headC = joint(s.torsoW * 0.06, -s.torsoH + 4, headImg);
    this.torso = joint(0, 0, armB.shoulder, torsoImg, this.headC, armF.shoulder);

    this.body = joint(0, -this.hipH, legB.hip, legF.hip, this.torso);
    this.shadow = scene.add.ellipse(0, 0, 100, 16, 0x000000, 0.3);
    this.root = joint(x, groundY, this.shadow, this.body);
    this.root.setScale(facing, 1);

    this.j = {
      sF: armF.shoulder, eF: armF.elbow, sB: armB.shoulder, eB: armB.elbow,
      hF: legF.hip, kF: legF.knee, hB: legB.hip, kB: legB.knee,
    };
    this.hasWeapon = !!k.weapon;
    this.apply();
  }

  get x() { return this.root.x; }
  get groundY() { return this.root.y; }
  /** Point d'impact approximatif (poitrine), en coordonnées monde */
  chest() {
    return { x: this.root.x + this.facing * 4, y: this.root.y - this.hipH - this.spec.torsoH * 0.6 + this.pose.y };
  }
  headPos() {
    return { x: this.root.x, y: this.root.y - this.hipH - this.spec.torsoH - this.spec.headR + this.pose.y };
  }

  set(p: Partial<Pose>) {
    Object.assign(this.pose, p);
    this.apply();
  }

  /** Va vers une pose en `ms`, renvoie une promesse */
  to(p: Partial<Pose>, ms: number, ease = 'Sine.easeInOut'): Promise<void> {
    this.scene.tweens.killTweensOf(this.pose);
    return new Promise((res) => {
      this.scene.tweens.add({
        targets: this.pose,
        ...p,
        duration: ms,
        ease,
        onComplete: () => res(),
      });
    });
  }

  /** Enchaîne des poses : [[pose, durée, easing?], ...] */
  async seq(steps: [Partial<Pose>, number, string?][]) {
    for (const [p, ms, e] of steps) await this.to(p, ms, e);
  }

  stance(ms = 220) {
    this.mode = 'idle';
    return this.to(STANCE, ms);
  }

  /** Court jusqu'à x (px/s) avec un cycle de course procédural */
  runTo(x: number, speed = 520): Promise<void> {
    const dist = Math.abs(x - this.root.x);
    if (dist < 2) return Promise.resolve();
    this.mode = 'run';
    this.scene.tweens.killTweensOf(this.pose);
    this.pose.rot = 0;
    this.pose.sx = this.pose.sy = 1;
    const dir = Math.sign(x - this.root.x);
    return new Promise((res) => {
      this.scene.tweens.add({
        targets: this.root,
        x,
        duration: (dist / speed) * 1000,
        ease: 'Linear',
        onUpdate: () => {
          this.root.setScale(this.facing, 1);
          this.runDir = dir * this.facing;
        },
        onComplete: () => {
          this.mode = 'still';
          res();
        },
      });
    });
  }
  private runDir = 1;

  /** Saut en cloche vers x (le corps garde la pose courante) */
  hop(x: number, height: number, ms: number): Promise<void> {
    const startY = this.root.y;
    const startX = this.root.x;
    const o = { t: 0 };
    return new Promise((res) => {
      this.scene.tweens.add({
        targets: o,
        t: 1,
        duration: ms,
        ease: 'Linear',
        onUpdate: () => {
          this.root.x = startX + (x - startX) * o.t;
          this.lift = -Math.sin(o.t * Math.PI) * height;
        },
        onComplete: () => {
          this.lift = 0;
          this.root.y = startY;
          res();
        },
      });
    });
  }
  lift = 0;

  flash() {
    for (const img of this.images) img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(70, () => {
      for (const img of this.images) {
        img.setTintMode(Phaser.TintModes.MULTIPLY);
        img.setTint(this.backImgs.has(img) ? 0xb9b4c8 : 0xffffff);
      }
    });
  }

  dropWeapon() {
    if (this.weaponImg) this.weaponImg.setVisible(false);
    this.hasWeapon = false;
  }
  weaponKey() {
    return this.weaponImg?.texture.key ?? null;
  }
  handWorld() {
    const m = this.j.eF.getWorldTransformMatrix();
    return { x: m.tx + (this.spec.foreArm - this.spec.armW / 2) * m.c, y: m.ty + (this.spec.foreArm - this.spec.armW / 2) * m.d };
  }

  update(dtMs: number) {
    const dt = dtMs / 1000;
    this.t += dt;
    if (this.mode === 'run') {
      this.phase += dt * 16;
      const ph = this.phase;
      const d = this.runDir; // 1 = avance, -1 = recule
      Object.assign(this.pose, {
        x: 0,
        y: -Math.abs(Math.sin(ph)) * 7 + 4,
        lean: d > 0 ? 0.3 : -0.05,
        head: d > 0 ? -0.2 : 0.05,
        hF: Math.sin(ph) * 0.85 * d - 0.15,
        kF: 0.2 + 0.9 * Math.max(0, Math.sin(ph + 1.4 * d)),
        hB: -Math.sin(ph) * 0.85 * d - 0.15,
        kB: 0.2 + 0.9 * Math.max(0, -Math.sin(ph + 1.4 * d)),
        sF: -Math.sin(ph) * 0.9 - 0.4,
        eF: -1.5,
        sB: Math.sin(ph) * 0.9 - 0.4,
        eB: -1.5,
      });
    }
    this.apply();
  }

  private apply() {
    const p = this.pose;
    const bob = this.mode === 'idle' ? Math.sin(this.t * 3.2) * 1.6 : 0;
    const breathe = this.mode === 'idle' ? Math.sin(this.t * 3.2 + 0.6) * 0.04 : 0;
    this.body.setPosition(p.x, -this.hipH + p.y + bob + this.lift);
    this.body.rotation = p.rot;
    this.body.setScale(p.sx, p.sy);
    this.torso.rotation = p.lean + breathe * 0.3;
    this.headC.rotation = p.head - breathe * 0.4;
    this.j.sF.rotation = p.sF + breathe;
    this.j.eF.rotation = p.eF;
    this.j.sB.rotation = p.sB - breathe;
    this.j.eB.rotation = p.eB;
    this.j.hF.rotation = p.hF;
    this.j.kF.rotation = p.kF;
    this.j.hB.rotation = p.hB;
    this.j.kB.rotation = p.kB;
    if (this.weaponImg) this.weaponImg.rotation = p.wpn;
    // l'ombre rétrécit quand on saute
    const air = Math.max(0, -(p.y + this.lift)) / 160;
    this.shadow.setScale(1 - Math.min(0.6, air), 1 - Math.min(0.6, air));
    this.shadow.x = p.x;
  }

  destroy() {
    this.root.destroy();
  }
}
