// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import Phaser from 'phaser';
import type { CharacterSpec } from '../shared/character';
import type { WeaponDef } from './weapons';

// ---------------------------------------------------------------------------
// Ragdoll physique actif (pistes 1 et 4).
// Un pantin Matter.js : 10 corps reliés par des articulations.
// Des « muscles » (régulateurs PD) poussent chaque membre vers un angle cible.
// On n'anime jamais un membre directement : on change la cible, la physique fait le reste.
// ---------------------------------------------------------------------------

export type PartName = 'torso' | 'head' | 'uarmF' | 'farmF' | 'uarmB' | 'farmB' | 'thighF' | 'shinF' | 'thighB' | 'shinB';

export interface RPose {
  lean: number;
  head: number;
  sF: number;
  eF: number;
  sB: number;
  eB: number;
  hF: number;
  kF: number;
  hB: number;
  kB: number;
  crouch: number; // abaisse le bassin (px)
  wpn: number; // angle de l'arme par rapport à l'avant-bras
}

export const R_STANCE: RPose = {
  lean: 0.12, head: -0.1,
  sF: -1.0, eF: -1.7, sB: -0.5, eB: -1.9,
  hF: -0.35, kF: 0.5, hB: 0.3, kB: 0.3,
  crouch: 6,
  wpn: 0,
};

const wrap = (a: number) => Phaser.Math.Angle.Wrap(a);

export class Ragdoll {
  parts = {} as Record<PartName, MatterJS.BodyType>;
  bodies: MatterJS.BodyType[] = [];
  target: RPose = { ...R_STANCE };
  facing: 1 | -1;
  /** 0 = pantin mou, 1 = muscles à fond */
  strength = 1;
  /** maintien debout (« ficelle » invisible sur le bassin) */
  support = 1;
  alive = true;
  airborne = false;
  moveVx = 0;
  standY: number;
  walkPhase = 0;
  private M: any;
  group = 0;
  private t = 0;
  weapon: { body: MatterJS.BodyType; def: WeaponDef; scale: number } | null = null;
  tail: MatterJS.BodyType[] = [];

  constructor(private scene: Phaser.Scene, public spec: CharacterSpec, x: number, public groundY: number, facing: 1 | -1, public index: number) {
    this.facing = facing;
    const s = spec;
    const f = facing;
    const M = (this.M = (scene.matter as any).body); // module Matter.Body
    const group = (this.group = scene.matter.world.nextGroup(true));
    const hipH = s.thigh - s.legW + (s.shin - s.legW / 2);
    const hipY = groundY - hipH;
    // hauteur réelle du bassin en garde (jambes un peu fléchies)
    const legH = (h: number, k: number) => (s.thigh - s.legW) * Math.cos(h) + (s.shin - s.legW / 2) * Math.cos(h + k);
    const guardHipH = (legH(R_STANCE.hF, R_STANCE.kF) + legH(R_STANCE.hB, R_STANCE.kB)) / 2;
    const opts = (extra: object = {}) => ({
      collisionFilter: { group },
      friction: 0.6,
      frictionAir: 0.02,
      restitution: 0.05,
      ...extra,
    });
    const add = this.scene.matter.add;

    // torse : l'articulation de la hanche est 5 px au-dessus du bas
    const torsoCY = hipY - (s.torsoH / 2 - 5);
    this.standY = groundY - guardHipH - (s.torsoH / 2 - 5) - 2;
    const torso = add.rectangle(x, torsoCY, s.torsoW, s.torsoH, opts({ chamfer: { radius: 10 }, density: 0.0022 }));
    const head = add.circle(x + f * s.torsoW * 0.06, torsoCY - s.torsoH / 2 + 4 - s.headR * 0.8, s.headR, opts({ density: 0.0008 }));

    const limb = (cx: number, top: number, w: number, len: number, density = 0.0012) =>
      add.rectangle(cx, top + len / 2 - w / 2, w, len, opts({ chamfer: { radius: w / 2 - 0.5 }, density }));

    const shoulderY = torsoCY - s.torsoH / 2 + 10;
    const sxF = f * s.torsoW * 0.12;
    const sxB = -f * s.torsoW * 0.12;
    const uarmF = limb(x + sxF, shoulderY, s.armW, s.upperArm);
    const farmF = limb(x + sxF, shoulderY + s.upperArm - s.armW, s.armW, s.foreArm);
    const uarmB = limb(x + sxB, shoulderY, s.armW, s.upperArm);
    const farmB = limb(x + sxB, shoulderY + s.upperArm - s.armW, s.armW, s.foreArm);
    const thighF = limb(x + f * 3, hipY, s.legW, s.thigh, 0.0016);
    const shinF = limb(x + f * 3, hipY + s.thigh - s.legW, s.legW, s.shin, 0.0016);
    const thighB = limb(x - f * 3, hipY, s.legW, s.thigh, 0.0016);
    const shinB = limb(x - f * 3, hipY + s.thigh - s.legW, s.legW, s.shin, 0.0016);

    this.parts = { torso, head, uarmF, farmF, uarmB, farmB, thighF, shinF, thighB, shinB };
    this.bodies = Object.values(this.parts);
    for (const [name, b] of Object.entries(this.parts)) (b as any).rag = { owner: this, part: name };

    const pin = (a: MatterJS.BodyType, ax: number, ay: number, b: MatterJS.BodyType, bx: number, by: number) =>
      add.constraint(a, b, 0, 1, { pointA: { x: ax, y: ay }, pointB: { x: bx, y: by } });
    const endOff = (w: number, len: number) => len / 2 - w / 2;

    pin(torso, f * s.torsoW * 0.06, -s.torsoH / 2 + 4, head, 0, s.headR * 0.8);
    pin(torso, sxF, -s.torsoH / 2 + 10, uarmF, 0, -endOff(s.armW, s.upperArm));
    pin(uarmF, 0, endOff(s.armW, s.upperArm), farmF, 0, -endOff(s.armW, s.foreArm));
    pin(torso, sxB, -s.torsoH / 2 + 10, uarmB, 0, -endOff(s.armW, s.upperArm));
    pin(uarmB, 0, endOff(s.armW, s.upperArm), farmB, 0, -endOff(s.armW, s.foreArm));
    pin(torso, f * 3, s.torsoH / 2 - 5, thighF, 0, -endOff(s.legW, s.thigh));
    pin(thighF, 0, endOff(s.legW, s.thigh), shinF, 0, -endOff(s.legW, s.shin));
    pin(torso, -f * 3, s.torsoH / 2 - 5, thighB, 0, -endOff(s.legW, s.thigh));
    pin(thighB, 0, endOff(s.legW, s.thigh), shinB, 0, -endOff(s.legW, s.shin));
    void M;
  }

  get x() {
    return this.parts.torso.position.x;
  }
  get y() {
    return this.parts.torso.position.y;
  }

  feetOnGround() {
    const s = this.spec;
    const lowest = Math.max(this.parts.shinF.position.y, this.parts.shinB.position.y);
    return lowest + s.shin / 2 > this.groundY - 26;
  }

  setVel(b: MatterJS.BodyType, vx: number, vy: number) {
    this.M.setVelocity(b, { x: vx, y: vy });
  }
  addVel(b: MatterJS.BodyType, vx: number, vy: number) {
    this.M.setVelocity(b, { x: b.velocity.x + vx, y: b.velocity.y + vy });
  }
  /** pousse tout le corps */
  shove(vx: number, vy: number) {
    for (const b of this.bodies) this.addVel(b, vx, vy);
  }

  /** Un pas de simulation des muscles (appelé avant chaque pas physique) */
  step() {
    const M = this.M;
    const p = this.parts;
    const t = this.target;
    const f = this.facing;
    const k = this.strength;

    // cycle de marche procédural
    let legs = { hF: t.hF, kF: t.kF, hB: t.hB, kB: t.kB };
    if (Math.abs(this.moveVx) > 0.3 && !this.airborne) {
      this.walkPhase += 0.32 * Math.min(2, Math.abs(this.moveVx) / 3);
      const ph = this.walkPhase;
      const d = Math.sign(this.moveVx) * f;
      legs = {
        hF: Math.sin(ph) * 0.7 * d - 0.15,
        kF: 0.25 + 0.9 * Math.max(0, Math.sin(ph + 1.4 * d)),
        hB: -Math.sin(ph) * 0.7 * d - 0.15,
        kB: 0.25 + 0.9 * Math.max(0, -Math.sin(ph + 1.4 * d)),
      };
    }

    const drive = (b: MatterJS.BodyType, targetAbs: number, kp: number, kd: number) => {
      if (k <= 0) return;
      const err = wrap(targetAbs - b.angle);
      const av = b.angularVelocity;
      const want = err * kp;
      M.setAngularVelocity(b, av + (want - av) * kd * k);
    };

    drive(p.torso, f * t.lean, 0.32, 0.45);
    drive(p.head, p.torso.angle + f * t.head, 0.3, 0.35);
    drive(p.uarmF, p.torso.angle + f * t.sF, 0.38, 0.5);
    drive(p.farmF, p.uarmF.angle + f * t.eF, 0.38, 0.5);
    drive(p.uarmB, p.torso.angle + f * t.sB, 0.38, 0.5);
    drive(p.farmB, p.uarmB.angle + f * t.eB, 0.38, 0.5);
    drive(p.thighF, f * legs.hF, 0.35, 0.5);
    drive(p.shinF, p.thighF.angle + f * legs.kF, 0.35, 0.5);
    drive(p.thighB, f * legs.hB, 0.35, 0.5);
    drive(p.shinB, p.thighB.angle + f * legs.kB, 0.35, 0.5);
    if (this.weapon) drive(this.weapon.body, p.farmF.angle + f * t.wpn, 0.3, 0.45);
    // queue : chaque segment est attiré vers une position « relevée vers l'arrière »
    if (this.tail.length && k > 0) {
      let prev = this.tail[0].position;
      const gap = Math.hypot(this.tail[1].position.x - prev.x, this.tail[1].position.y - prev.y) || 10;
      for (let i = 1; i < this.tail.length; i++) {
        const b = this.tail[i];
        // angle au-dessus de l'horizontale, vers l'arrière, avec un léger remuement
        const beta = 0.35 + i * 0.12 + Math.sin(this.t * 7 + i * 0.8) * 0.15;
        const tx = prev.x - f * Math.cos(beta) * gap;
        const ty = prev.y - Math.sin(beta) * gap;
        M.setVelocity(b, { x: b.velocity.x + (tx - b.position.x) * 0.08 * k, y: b.velocity.y + (ty - b.position.y) * 0.08 * k });
        prev = b.position;
      }
    }
    this.t += 1 / 60;

    // maintien debout + déplacement (uniquement pieds au sol)
    const torso = p.torso;
    if (this.support > 0 && !this.airborne && this.feetOnGround()) {
      const ty = this.standY + t.crouch;
      const dy = ty - torso.position.y;
      if (dy < 6) {
        const vy = torso.velocity.y;
        const want = Phaser.Math.Clamp(dy * 0.3, -9, 4) - 0.9;
        M.setVelocity(torso, { x: torso.velocity.x, y: vy + (want - vy) * 0.5 * this.support });
      }
      const vx = torso.velocity.x;
      M.setVelocity(torso, { x: vx + (this.moveVx - vx) * 0.2 * this.support, y: torso.velocity.y });
    }
    if (this.airborne && this.feetOnGround() && torso.velocity.y >= 0) this.airborne = false;
  }

  /** Bout de l'avant-bras (la main), en coordonnées monde */
  handOf(fore: MatterJS.BodyType) {
    const off = this.spec.foreArm / 2 - this.spec.armW / 2;
    return { x: fore.position.x - Math.sin(fore.angle) * off, y: fore.position.y + Math.cos(fore.angle) * off };
  }

  /**
   * Arme physique : un corps accroché à la main par une articulation au point de prise.
   * Arme à deux mains : la seconde main s'accroche plus loin sur le manche (articulation souple).
   * Axe de l'arme = +y local, du manche vers la tête.
   */
  attachWeapon(def: WeaponDef, scale: number) {
    const add = this.scene.matter.add;
    const L = def.length * scale;
    const w = def.width * scale;
    const p = this.parts;
    const hand = this.handOf(p.farmF);
    const gripY = -L / 2 + def.grip * scale;
    const body = add.rectangle(hand.x, hand.y - gripY, w, L, {
      collisionFilter: { group: this.group },
      density: def.density,
      friction: 0.4,
      frictionAir: 0.02,
      chamfer: { radius: w / 2 - 0.5 },
    } as any);
    (body as any).rag = { owner: this, part: 'weapon' };
    const off = this.spec.foreArm / 2 - this.spec.armW / 2;
    add.constraint(p.farmF, body, 0, 1, { pointA: { x: 0, y: off }, pointB: { x: 0, y: gripY } });
    if (def.hands === 2 && def.grip2 !== undefined) {
      add.constraint(p.farmB, body, 0, 0.25, { pointA: { x: 0, y: off }, pointB: { x: 0, y: -L / 2 + def.grip2 * scale } });
    }
    this.weapon = { body, def, scale };
    this.bodies.push(body);
  }

  /** Queue physique : une chaîne de petits segments qui ballotte (loup-garou) */
  addTail(scale: number, segments = 5) {
    const add = this.scene.matter.add;
    const t = this.parts.torso;
    const f = this.facing;
    const s = this.spec;
    const r = 5 * scale;
    const gap = 10 * scale;
    let prev: MatterJS.BodyType = t;
    let prevPoint = { x: -f * (s.torsoW / 2 - 4), y: s.torsoH / 2 - 14 };
    for (let i = 0; i < segments; i++) {
      const b = add.circle(t.position.x + prevPoint.x - f * gap * (i + 1), t.position.y + prevPoint.y - gap * i, r * (1 - i * 0.08), {
        isSensor: true,
        density: 0.0004,
        frictionAir: 0.06,
        collisionFilter: { group: this.group },
      } as any);
      (b as any).rag = { owner: this, part: 'tail' };
      add.constraint(prev, b, i === 0 ? 0 : gap, 0.9, { pointA: prevPoint, pointB: { x: 0, y: 0 } });
      prev = b;
      prevPoint = { x: 0, y: 0 };
      this.tail.push(b);
      this.bodies.push(b);
    }
  }

  goLimp() {
    this.strength = 0;
    this.support = 0;
    this.alive = false;
    this.moveVx = 0;
  }
}
