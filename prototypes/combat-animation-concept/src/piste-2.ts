// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import Phaser from 'phaser';
import { CharacterSpec, SIZE, SKILL_LABEL, Skill, makeCharacter } from './shared/character';
import { banner, dust, ensureFxTextures, fireTrail, popText, ring, sparks } from './shared/fx';
import { Rng, randomSeed } from './shared/rng';
import { H, Hud, W, bindPageButtons, createGame, drawArena, winnerText } from './shared/ui';
import { Puppet, STANCE } from './puppet/puppet';

// ---------------------------------------------------------------------------
// Piste 2 : persos modulaires + animations décrites en poses clés.
// Chaque compétence = un petit script async lisible.
// ---------------------------------------------------------------------------

const GROUND = 455;
const HOME = [220, 740];
const COLORS = [0xff7a45, 0x3fc6b4];

interface Fighter {
  p: Puppet;
  spec: CharacterSpec;
  hp: number;
  idx: number;
  skills: Skill[];
}

class Piste2 extends Phaser.Scene {
  private f: Fighter[] = [];
  private hud!: Hud;
  private rng = new Rng(1);
  private speed = 1;
  private running = false;
  private fightId = 0;
  private props: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('piste2');
  }

  create() {
    ensureFxTextures(this);
    drawArena(this, GROUND, true);
    bindPageButtons(
      this,
      () => this.newFight(),
      (s) => this.setSpeed(s),
    );
    this.newFight();
  }

  private setSpeed(s: number) {
    this.speed = s;
    this.tweens.timeScale = s;
    this.time.timeScale = s;
  }

  private newFight(seed = randomSeed()) {
    this.fightId++;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.setSpeed(this.speed);
    this.f.forEach((x) => x.p.destroy());
    this.children.list.filter((c: any) => c.depth >= 40 || this.props.includes(c)).forEach((c) => c.destroy());
    this.props = [];
    this.rng = new Rng(seed);
    const specs = [makeCharacter(this.rng.int(1, 1e9), { allowFire: true }), makeCharacter(this.rng.int(1, 1e9), { allowFire: true })];
    this.f = specs.map((spec, i) => {
      const p = new Puppet(this, spec, HOME[i], GROUND, i === 0 ? 1 : -1);
      p.root.setDepth(10 + i);
      return { p, spec, hp: spec.hp, idx: i, skills: [...spec.skills] };
    });
    this.hud = new Hud(this, specs, COLORS);
    specs.forEach((s, i) => {
      const t = this.add
        .text(i === 0 ? 24 : W - 24, 92, s.skills.map((k) => SKILL_LABEL[k]).join(' · '), {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#f3ede2',
          stroke: '#1d1a26',
          strokeThickness: 3,
          wordWrap: { width: 380 },
          align: i === 0 ? 'left' : 'right',
        })
        .setOrigin(i === 0 ? 0 : 1, 0)
        .setDepth(81);
      this.props.push(t);
    });
    this.loop(this.fightId);
  }

  // --- boucle de combat -----------------------------------------------------
  private async loop(id: number) {
    this.running = true;
    await this.wait(700);
    while (id === this.fightId && this.f.every((x) => x.hp > 0)) {
      const [a, b] = this.f;
      const first = this.rng.chance(a.spec.vitesse / (a.spec.vitesse + b.spec.vitesse)) ? a : b;
      const att = first;
      const def = first === a ? b : a;
      const usable = att.skills.filter((s) => (s === 'arme' || s === 'lancer' ? att.p.hasWeapon : true));
      const skill = this.rng.pick(usable);
      banner(this, SKILL_LABEL[skill], att.idx === 0 ? '#ffb38f' : '#9ff0e4');
      await this.perform(skill, att, def);
      if (id !== this.fightId) return;
      if (def.hp <= 0) break;
      await Promise.all([att.p.runTo(HOME[att.idx], 600), def.p.runTo(HOME[def.idx], 320)]);
      await Promise.all([att.p.stance(), def.p.stance()]);
      await this.wait(260);
    }
    if (id !== this.fightId) return;
    const loser = this.f.find((x) => x.hp <= 0)!;
    const winner = this.f.find((x) => x !== loser)!;
    await this.ko(loser, winner);
  }

  private wait(ms: number) {
    return new Promise<void>((res) => this.time.delayedCall(ms, res));
  }

  private hitstop(ms: number) {
    this.tweens.timeScale = 0.04;
    setTimeout(() => (this.tweens.timeScale = this.speed), ms / this.speed);
  }

  // --- résolution d'un coup -------------------------------------------------
  private async contact(att: Fighter, def: Fighter, power: number, kind: 'melee' | 'push' | 'launch' | 'crush' | 'heavy' | 'ranged' | 'fire') {
    const dodge = Phaser.Math.Clamp(0.06 + def.spec.agilite * 0.025 - att.spec.agilite * 0.01, 0.05, 0.3);
    const block = kind === 'melee' || kind === 'heavy' ? 0.12 : 0;
    const roll = this.rng.next();
    const dir = att.p.facing;
    const c = def.p.chest();
    if (roll < dodge) {
      popText(this, c.x, c.y - 40, 'Esquive !', '#9ff0e4', 22);
      await def.p.to({ lean: -0.55, head: -0.4, y: 0, x: 0 }, 90, 'Quad.easeOut');
      await def.p.hop(this.clampX(def.p.x + dir * 70), 26, 260);
      return 'dodge';
    }
    if (roll < dodge + block) {
      popText(this, c.x, c.y - 40, 'Parade !', '#ffffff', 22);
      sparks(this, c.x - dir * 14, c.y, 0x8fd3ff, 10, 0.7, dir > 0 ? 180 : 0);
      def.p.to({ sF: -1.7, eF: -2.5, sB: -1.5, eB: -2.6, lean: -0.1, head: 0.2 }, 60);
      await this.slide(def, dir * 18, 120);
      return 'block';
    }
    const dmg = Math.max(1, Math.round(att.spec.force * power * 1.6 * this.rng.range(0.85, 1.25)));
    def.hp -= dmg;
    this.hud.setHp(def.idx, def.hp / def.spec.hp);
    def.p.flash();
    const col = kind === 'fire' ? 0xff8a3c : kind === 'heavy' || kind === 'crush' ? 0xffe28a : 0xffd36b;
    sparks(this, c.x - dir * 10, c.y, col, kind === 'heavy' ? 22 : 14, power, dir > 0 ? 0 : 180);
    if (power >= 1.2) ring(this, c.x, c.y, col, 60 + power * 20);
    popText(this, c.x, c.y - 30, '-' + dmg, kind === 'fire' ? '#ffb070' : '#ffffff', 22 + power * 8);
    this.hitstop(40 + power * 50);
    this.cameras.main.shake(90 + power * 60, 0.003 * power);

    if (kind === 'launch') {
      def.p.mode = 'still';
      def.p.to({ rot: -1.1, lean: -0.3, head: -0.4, sF: -2.4, sB: -2.2, hF: -0.8, kF: 0.6, hB: -0.3, kB: 0.9 }, 300);
      await def.p.hop(this.clampX(def.p.x + dir * 110), 120, 620);
      await this.fall(def);
    } else if (kind === 'crush') {
      await def.p.to({ sy: 0.62, sx: 1.25, y: 16 }, 70, 'Quad.easeOut');
      await this.wait(160);
      await def.p.to({ sy: 1, sx: 1, y: 5 }, 260, 'Back.easeOut');
    } else {
      def.p.mode = 'still';
      const flinch = def.p.to({ lean: -0.45, head: -0.6, sF: -0.4, eF: -0.6, sB: 0.1, x: 0 }, 70, 'Quad.easeOut');
      const kb = kind === 'push' ? 120 : kind === 'heavy' ? 60 : 26 * power;
      if (kind === 'push') {
        def.p.to({ rot: -0.35 }, 120);
        for (let i = 0; i < 4; i++) this.time.delayedCall(i * 60, () => dust(this, def.p.x, GROUND, 3));
      }
      await Promise.all([flinch, this.slide(def, dir * kb, kind === 'push' ? 320 : 180)]);
      if (kind === 'push') await def.p.to({ rot: 0 }, 160);
    }
    return 'hit';
  }

  private clampX(x: number) {
    return Phaser.Math.Clamp(x, 70, W - 70);
  }
  private slide(f: Fighter, dx: number, ms: number) {
    return new Promise<void>((res) =>
      this.tweens.add({ targets: f.p.root, x: this.clampX(f.p.x + dx), duration: ms, ease: 'Cubic.easeOut', onComplete: () => res() }),
    );
  }
  private async fall(f: Fighter) {
    const lie = f.p.hipH - f.spec.torsoW / 2 + 2;
    dust(this, f.p.x, GROUND, 10);
    this.cameras.main.shake(120, 0.004);
    await f.p.to({ rot: -1.5, y: lie, lean: -0.1, head: 0.2, sF: -2.6, eF: -0.4, sB: -2.4, hF: -0.2, kF: 0.4, hB: 0.1, kB: 0.2 }, 160, 'Quad.easeIn');
    await this.wait(320);
    if (f.hp > 0) await f.p.to({ ...STANCE }, 360, 'Back.easeOut');
  }

  // --- les compétences ------------------------------------------------------
  private async perform(skill: Skill, att: Fighter, def: Fighter) {
    const A = att.p;
    const d = A.facing;
    const near = (gap: number) => this.clampX(def.p.x - d * gap * SIZE);

    switch (skill) {
      case 'poing': {
        await A.runTo(near(70));
        await A.to({ sF: -0.5, eF: -2.4, lean: -0.05 }, 110);
        await A.to({ sF: -1.55, eF: -0.05, lean: 0.35, x: 8 }, 60, 'Quad.easeOut');
        await this.contact(att, def, 1, 'melee');
        await A.stance(160);
        break;
      }
      case 'combo': {
        await A.runTo(near(66));
        for (let i = 0; i < 3; i++) {
          const front = i % 2 === 0;
          await A.to(front ? { sF: -0.6, eF: -2.3, sB: -1.2, eB: -1.8 } : { sB: -0.6, eB: -2.3, sF: -1.1, eF: -1.9 }, 70);
          await A.to(front ? { sF: -1.6, eF: 0, lean: 0.35, x: 6 } : { sB: -1.6, eB: 0, lean: 0.4, x: 8 }, 50, 'Quad.easeOut');
          const r = await this.contact(att, def, 0.55, 'melee');
          if (def.hp <= 0 || r === 'dodge') return;
          await A.runTo(near(66), 900);
        }
        await A.to({ hF: -0.2, kF: 1.7, lean: -0.2 }, 90);
        await A.to({ hF: -1.6, kF: 0.05, lean: -0.35, sF: -0.4, sB: 0.4 }, 70, 'Quad.easeOut');
        await this.contact(att, def, 0.9, 'melee');
        await A.stance(200);
        break;
      }
      case 'pied': {
        await A.runTo(near(170));
        await A.to({ y: 14, hF: -0.8, kF: 1.3, hB: 0.6, kB: 1.1, sF: -1.4, sB: 0.5 }, 100);
        const air = A.hop(near(62), 75, 420);
        await A.to({ y: 0, hF: -0.4, kF: 1.8, hB: 0.2, kB: 1.6 }, 160);
        await A.to({ hF: -1.65, kF: 0.02, hB: 0.5, kB: 1.4, lean: -0.4, sF: -0.3, sB: -2.4 }, 80, 'Quad.easeOut');
        await this.contact(att, def, 1.2, 'melee');
        await air;
        dust(this, A.x, GROUND, 6);
        await A.stance(180);
        break;
      }
      case 'uppercut': {
        await A.runTo(near(64));
        await A.to({ y: 18, lean: 0.4, sF: 0.4, eF: -1.2, hF: -0.9, kF: 1.3, hB: 0.6, kB: 1.0 }, 160);
        await A.to({ y: -14, lean: -0.15, sF: -2.9, eF: -0.5, hF: -0.2, kF: 0.1, hB: 0.2, kB: 0.1, head: -0.3 }, 90, 'Quad.easeOut');
        await this.contact(att, def, 1.3, 'launch');
        await A.stance(200);
        break;
      }
      case 'charge': {
        await A.runTo(near(220), 500);
        await A.to({ lean: 0.75, head: -0.3, sF: 0.5, eF: -1.0, sB: 0.8, y: 10 }, 100);
        const dash = new Promise<void>((res) =>
          this.tweens.add({ targets: A.root, x: near(48), duration: 170, ease: 'Quad.easeIn', onComplete: () => res() }),
        );
        for (let i = 0; i < 3; i++) this.time.delayedCall(i * 50, () => dust(this, A.x, GROUND, 3));
        await dash;
        await this.contact(att, def, 1.1, 'push');
        await A.stance(220);
        break;
      }
      case 'saut': {
        await A.runTo(near(200));
        await A.to({ y: 22, sx: 1.15, sy: 0.85, hF: -1, kF: 1.6, hB: 0.7, kB: 1.4, sF: 0.6, sB: 0.7 }, 140);
        const air = A.hop(near(36), 190, 640);
        await A.to({ y: 0, sx: 0.9, sy: 1.12, sF: -2.95, eF: -0.4, sB: -2.85, eB: -0.4, hF: -0.5, kF: 1.2, hB: 0.3, kB: 1.3, lean: -0.25 }, 260);
        await A.to({ sx: 1, sy: 1, lean: 0.55, sF: -1.1, eF: -0.2, sB: -1.0, eB: -0.2 }, 170, 'Quad.easeIn');
        await air;
        ring(this, A.x + d * 30, GROUND, 0xffe28a, 140, 8, true);
        dust(this, A.x + d * 30, GROUND, 16);
        this.cameras.main.shake(200, 0.008);
        await A.to({ y: 20, sx: 1.2, sy: 0.8 }, 60);
        await this.contact(att, def, 1.4, 'crush');
        await A.stance(260);
        break;
      }
      case 'arme': {
        await A.runTo(near(95));
        await A.to({ sF: -3.0, eF: -0.7, wpn: -0.1, lean: -0.25, head: -0.1, hF: -0.6, kF: 0.6 }, 180);
        await A.to({ sF: -0.9, eF: -0.1, wpn: 1.3, lean: 0.55, x: 10 }, 75, 'Quad.easeIn');
        await this.contact(att, def, 1.6, 'heavy');
        await A.stance(260);
        break;
      }
      case 'lancer': {
        const key = A.weaponKey();
        await A.to({ sF: -2.7, eF: -1.1, lean: -0.3, hF: -0.7, kF: 0.5 }, 200);
        await A.to({ sF: -1.0, eF: -0.2, lean: 0.4 }, 70, 'Quad.easeOut');
        const h = A.handWorld();
        A.dropWeapon();
        att.skills = att.skills.filter((s) => s !== 'arme' && s !== 'lancer');
        if (!att.skills.length) att.skills = ['poing'];
        const proj = this.add.image(h.x, h.y, key!).setDepth(30).setOrigin(0.5).setFlipX(d < 0).setScale(SIZE);
        this.props.push(proj);
        const target = def.p.chest();
        const o = { t: 0 };
        await new Promise<void>((res) =>
          this.tweens.add({
            targets: o,
            t: 1,
            duration: 420,
            onUpdate: () => {
              proj.x = h.x + (target.x - h.x) * o.t;
              proj.y = h.y + (target.y - h.y) * o.t - Math.sin(o.t * Math.PI) * 60;
              proj.rotation = o.t * 14 * d;
            },
            onComplete: () => res(),
          }),
        );
        const r = await this.contact(att, def, 1.3, 'ranged');
        // l'arme retombe au sol et y reste
        this.tweens.add({ targets: proj, y: GROUND - 6, x: proj.x + d * (r === 'dodge' ? 120 : -30), rotation: d * 0.1, duration: 380, ease: 'Bounce.easeOut' });
        await A.stance(200);
        break;
      }
      case 'boule': {
        await A.to({ sF: -1.0, eF: -2.2, sB: -0.9, eB: -2.3, lean: -0.2, y: 10 }, 220);
        const h0 = A.handWorld();
        const orb = this.add.circle(h0.x, h0.y, 4, 0xfff1b0).setDepth(46);
        const trail = fireTrail(this, orb);
        this.props.push(orb, trail);
        await new Promise<void>((res) => this.tweens.add({ targets: orb, radius: 13, duration: 260, onComplete: () => res() }));
        await A.to({ sF: -1.55, eF: -0.1, sB: -1.45, eB: -0.15, lean: 0.35, y: 4 }, 70, 'Quad.easeOut');
        const t = def.p.chest();
        await new Promise<void>((res) =>
          this.tweens.add({ targets: orb, x: t.x, y: t.y, duration: Math.abs(t.x - orb.x) * 1.2, ease: 'Quad.easeIn', onComplete: () => res() }),
        );
        trail.stop();
        orb.destroy();
        await this.contact(att, def, 1.3, 'fire');
        await A.stance(200);
        break;
      }
    }
  }

  private async ko(loser: Fighter, winner: Fighter) {
    loser.p.mode = 'still';
    this.tweens.timeScale = 0.35 * this.speed;
    const lie = loser.p.hipH - loser.spec.torsoW / 2 + 2;
    await loser.p.to({ rot: -1.52, y: lie, lean: -0.1, head: 0.4, sF: -2.6, eF: -0.3, sB: -2.4, eB: -0.2, hF: -0.1, kF: 0.3, hB: 0.15, kB: 0.1 }, 420, 'Bounce.easeOut');
    dust(this, loser.p.x, GROUND, 18);
    this.cameras.main.shake(220, 0.006);
    const hp = loser.p.headPos();
    for (let i = 0; i < 3; i++) popText(this, hp.x + (i - 1) * 18 - loser.p.facing * 40, GROUND - 40 - i * 6, '★', '#ffd36b', 22);
    this.tweens.timeScale = this.speed;
    winnerText(this, winner.spec.name).forEach((t) => this.props.push(t));
    // célébration en boucle
    const id = this.fightId;
    while (id === this.fightId) {
      await winner.p.to({ y: -26, sF: -2.9, eF: -0.3, sB: -2.8, eB: -0.3, lean: -0.1, head: -0.35, hF: -0.2, kF: 0.6, hB: 0.2, kB: 0.6 }, 180, 'Quad.easeOut');
      await winner.p.to({ y: 4 }, 180, 'Quad.easeIn');
      await this.wait(120);
    }
  }

  update(_t: number, dt: number) {
    const s = this.tweens.timeScale;
    for (const f of this.f) f.p.update(dt * s);
    void H;
  }
}

createGame(Piste2);
