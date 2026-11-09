// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import Phaser from 'phaser';
import {
  CharacterSpec, LIMB_PAD_X, OUTLINE, SIZE, SKILL_LABEL, Skill,
  buildCharacterTextures, makeCharacter, shade,
} from '../shared/character';
import { banner, dust, ensureFxTextures, fireTrail, popText, ring, sparks } from '../shared/fx';
import { Rng, randomSeed } from '../shared/rng';
import { H, Hud, W, bindPageButtons, drawArena, winnerText } from '../shared/ui';
import { PartName, R_STANCE, RPose, Ragdoll } from './ragdoll';
import { WEAPONS, WeaponDef } from './weapons';

// ---------------------------------------------------------------------------
// Arène ragdoll, partagée par la piste 1 (formes brutes) et la piste 4 (habillée + effets).
// ---------------------------------------------------------------------------

const GROUND = 470;
const STEP_MS = 1000 / 60;
const COLORS = [0xff7a45, 0x3fc6b4];
const DRAW_ORDER: PartName[] = ['uarmB', 'farmB', 'thighB', 'shinB', 'torso', 'thighF', 'shinF', 'head', 'uarmF', 'farmF'];

type Kind = 'melee' | 'launch' | 'push' | 'crush' | 'heavy' | 'fire' | 'claw';

interface Phase {
  ms: number;
  pose?: Partial<RPose>;
  start?: () => void;
  active?: (PartName | 'weapon')[];
  power?: number;
  kind?: Kind;
  onLand?: () => void;
}

interface Fighter {
  rag: Ragdoll;
  spec: CharacterSpec;
  idx: number;
  hp: number;
  skills: Skill[];
  next: Skill | null;
  action: { phases: Phase[]; i: number; t: number; hit: boolean; landed: boolean } | null;
  cooldown: number;
  stunT: number;
  recoverT: number;
  images: Partial<Record<PartName | 'weapon', Phaser.GameObjects.Image>>;
  flashUntil: number;
  wolf: boolean;
  stance: RPose;
}

const REACH: Record<Skill, number> = {
  griffes: 88, poing: 92, combo: 92, pied: 118, uppercut: 84, charge: 250, saut: 250, arme: 125, lancer: 400, boule: 9999,
};

export class RagdollArena extends Phaser.Scene {
  private f: Fighter[] = [];
  private hud!: Hud;
  private rng = new Rng(1);
  private speed = 1;
  private acc = 0;
  private slowT = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private over = false;
  private fightObjs: Phaser.GameObjects.GameObject[] = [];
  private fireballs: { body: MatterJS.BodyType; owner: Fighter; orb: Phaser.GameObjects.Arc; trail: Phaser.GameObjects.Particles.ParticleEmitter }[] = [];
  private celebrateT = 0;
  private firstFight = true;
  private get fx() {
    return this.opts.fx;
  }

  constructor(private opts: { fx: boolean; dressed: boolean }, key: string) {
    super(key);
  }

  create() {
    ensureFxTextures(this);
    drawArena(this, GROUND, this.fx);
    this.matter.world.setBounds(0, -600, W, GROUND + 600, 80, true, true, false, true);
    this.matter.world.autoUpdate = false;
    this.gfx = this.add.graphics().setDepth(10);
    this.matter.world.on('collisionstart', (ev: any) => {
      for (const pair of ev.pairs) this.onContact(pair.bodyA, pair.bodyB);
    });
    if (this.fx) {
      try {
        (this.cameras.main as any).filters.external.addVignette(0.5, 0.5, 1.0, 0.18);
      } catch {
        /* filtre indisponible : tant pis */
      }
    }
    bindPageButtons(this, () => this.newFight(), (s) => (this.speed = s));
    this.newFight();
  }

  // --- mise en place ---------------------------------------------------------
  private newFight(seed = randomSeed()) {
    for (const x of this.f) {
      for (const b of x.rag.bodies) this.matter.world.remove(b);
      Object.values(x.images).forEach((i) => i?.destroy());
    }
    for (const c of (this.matter.world.localWorld as any).constraints.slice()) this.matter.world.removeConstraint(c);
    for (const fb of this.fireballs) this.killFireball(fb);
    this.fightObjs.forEach((o) => o.destroy());
    this.fightObjs = [];
    this.children.list.filter((c: any) => c.depth >= 40).forEach((c) => c.destroy());
    this.over = false;
    this.slowT = 0;
    this.celebrateT = 0;
    this.matter.world.engine.timing.timeScale = 1;

    this.rng = new Rng(seed);
    const specs = [0, 1].map(() => makeCharacter(this.rng.int(1, 1e9), { allowFire: this.fx }));
    // Piste 5 : archétypes (loup-garou ou arme physique). ?a=loup&b=marteau force un choix pour les tests.
    const params = new URLSearchParams(location.search);
    const custom = this.fx && !this.opts.dressed;
    const looks = specs.map((spec, i) => {
      if (!custom) return { wolf: false, weapon: null as WeaponDef | null };
      const forced = this.firstFight ? params.get(i === 0 ? 'a' : 'b') : null;
      const wolf = forced ? forced === 'loup' : this.rng.chance(0.35);
      const ids = Object.keys(WEAPONS) as WeaponDef['id'][];
      const wid = forced && forced in WEAPONS ? (forced as WeaponDef['id']) : !wolf && this.rng.chance(0.8) ? this.rng.pick(ids) : null;
      if (forced === 'mains') return { wolf: false, weapon: null };
      spec.weapon = wid ?? 'aucune';
      if (wolf) {
        spec.vitesse += 3;
        spec.agilite += 2;
      }
      return { wolf, weapon: wid ? WEAPONS[wid] : null };
    });
    this.firstFight = false;
    this.f = specs.map((spec, i) => {
      const rag = new Ragdoll(this, spec, i === 0 ? 260 : 700, GROUND, i === 0 ? 1 : -1, i);
      const look = looks[i];
      let skills = spec.skills.filter((s) => s !== 'lancer' && s !== 'arme' && (this.fx || s !== 'griffes'));
      if (look.weapon) {
        rag.attachWeapon(look.weapon, SIZE);
        skills = ['arme', ...skills];
      } else if (this.opts.dressed && spec.weapon !== 'aucune' && spec.skills.includes('arme')) {
        skills = ['arme', ...skills];
      }
      if (look.wolf) {
        rag.addTail(SIZE);
        skills = ['griffes', ...skills.filter((s) => s !== 'boule')];
      }
      if (!skills.length) skills = ['poing'];
      const stance: RPose = { ...R_STANCE, ...(look.weapon ? { wpn: look.weapon.stanceWpn, ...(look.weapon.stance ?? {}) } : {}) };
      if (look.wolf) Object.assign(stance, { lean: 0.35, sF: -0.6, eF: -1.2, sB: -0.3, eB: -1.3, crouch: 14, head: 0.1 });
      rag.target = { ...stance };
      const fi: Fighter = { rag, spec, idx: i, hp: spec.hp, skills, next: null, action: null, cooldown: 600 + i * 300, stunT: 0, recoverT: 0, images: {}, flashUntil: 0, wolf: look.wolf, stance };
      if (this.opts.dressed) this.dress(fi);
      return fi;
    });
    this.f.forEach((fi) => {
      if (fi.wolf) this.time.delayedCall(300, () => popText(this, fi.rag.x, fi.rag.y - 120, 'AOUUUH !', '#ffd36b', 26));
    });
    this.hud = new Hud(this, specs, COLORS);
    specs.forEach((s, i) => {
      const t = this.add
        .text(i === 0 ? 24 : W - 24, 92, (this.f[i].wolf ? 'Loup-garou · ' : '') + this.f[i].skills.map((k) => this.skillLabel(this.f[i], k)).join(' · '), {
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
      this.fightObjs.push(t);
    });
  }

  /** Piste 4 : habille le ragdoll avec les pièces générées de la piste 2 */
  private dress(fi: Fighter) {
    const k = buildCharacterTextures(this, fi.spec);
    const map: Record<PartName, string> = {
      torso: k.torso, head: k.head, uarmF: k.uarm, farmF: k.farm, uarmB: k.uarm, farmB: k.farm,
      thighF: k.thigh, shinF: k.shin, thighB: k.thigh, shinB: k.shin,
    };
    DRAW_ORDER.forEach((part, n) => {
      const img = this.add.image(0, 0, map[part]).setDepth(10 + fi.idx * 0.1 + n * 0.001);
      img.setFlipX(fi.rag.facing < 0);
      if (part.endsWith('B')) img.setTint(0xb9b4c8);
      fi.images[part] = img;
    });
    if (k.weapon) {
      const w = this.add.image(0, 0, k.weapon).setScale(SIZE).setDepth(10 + fi.idx * 0.1 + 0.0095);
      w.setFlipX(fi.rag.facing < 0).setOrigin(fi.rag.facing > 0 ? 10 / 90 : 1 - 10 / 90, 0.5);
      fi.images.weapon = w;
    }
    void LIMB_PAD_X;
  }

  // --- compétences -----------------------------------------------------------
  private plan(a: Fighter, e: Fighter, skill: Skill): Phase[] {
    const r = a.rag;
    const p = r.parts;
    const f = r.facing;
    const toward = (b: MatterJS.BodyType, target: MatterJS.BodyType, speed: number, lift = 0) => {
      const dx = target.position.x - b.position.x;
      const dy = target.position.y - b.position.y;
      const d = Math.hypot(dx, dy) || 1;
      r.setVel(b, (dx / d) * speed, (dy / d) * speed + lift);
    };
    const E = e.rag.parts;
    const punch = (front: boolean): Phase[] => [
      { ms: 120, pose: front ? { sF: -0.4, eF: -2.4, lean: 0 } : { sB: -0.4, eB: -2.4, lean: 0 } },
      {
        ms: 170,
        pose: front ? { sF: -1.55, eF: -0.05, lean: 0.4 } : { sB: -1.55, eB: -0.05, lean: 0.45 },
        start: () => toward(front ? p.farmF : p.farmB, E.head, 17),
        active: front ? ['farmF'] : ['farmB'],
        power: front ? 1 : 0.7,
      },
    ];
    switch (skill) {
      case 'poing':
        return [...punch(true), { ms: 220 }];
      case 'combo':
        return [...punch(true), ...punch(false), ...punch(true), { ms: 260 }];
      case 'pied':
        return [
          { ms: 150, pose: { hF: -0.6, kF: 1.7, lean: -0.1, sB: 0.5 } },
          {
            ms: 230,
            pose: { hF: -1.65, kF: 0, lean: -0.45, sF: -0.3, sB: 0.4 },
            start: () => toward(p.shinF, E.torso, 18, -3),
            active: ['shinF', 'thighF'],
            power: 1.2,
          },
          { ms: 260 },
        ];
      case 'uppercut':
        return [
          { ms: 200, pose: { crouch: 32, lean: 0.45, sF: 0.4, eF: -1.1, hF: -0.8, kF: 1.2 } },
          {
            ms: 260,
            pose: { crouch: -6, lean: -0.15, sF: -2.9, eF: -0.4, head: -0.3 },
            start: () => {
              r.setVel(p.farmF, f * 8, -22);
              r.addVel(p.torso, f * 2, -6);
            },
            active: ['farmF', 'uarmF'],
            power: 1.3,
            kind: 'launch',
          },
          { ms: 300 },
        ];
      case 'charge':
        return [
          { ms: 200, pose: { lean: 0.85, head: -0.4, sF: 0.6, eF: -1.0, sB: 0.8, crouch: 16 } },
          {
            ms: 340,
            pose: { lean: 0.85, head: -0.4, sF: 0.6, eF: -1.0, sB: 0.8, crouch: 16 },
            start: () => {
              r.moveVx = f * 13;
              r.addVel(p.torso, f * 10, 0);
            },
            active: ['torso', 'head', 'uarmF', 'uarmB'],
            power: 1.1,
            kind: 'push',
          },
          { ms: 260, start: () => (r.moveVx = 0) },
        ];
      case 'saut':
        return [
          { ms: 220, pose: { crouch: 36, sF: 0.5, sB: 0.6, hF: -0.9, kF: 1.5, hB: 0.6, kB: 1.4 } },
          {
            ms: 320,
            pose: { crouch: 0, sF: -2.9, eF: -0.4, sB: -2.8, eB: -0.4, hF: -0.6, kF: 1.3, hB: 0.3, kB: 1.3, lean: -0.2 },
            start: () => {
              r.airborne = true;
              const vx = Phaser.Math.Clamp((e.rag.x - r.x - f * 50) * 0.028, -9, 9);
              r.shove(vx, -19);
            },
          },
          {
            ms: 520,
            pose: { lean: 0.6, sF: -1.1, eF: -0.2, sB: -1.0, eB: -0.2, hF: -0.3, kF: 0.3, hB: 0.2, kB: 0.3 },
            active: ['farmF', 'farmB', 'shinF', 'shinB', 'torso'],
            power: 1.4,
            kind: 'crush',
            onLand: () => this.shockwave(a, e),
          },
          { ms: 260 },
        ];
      case 'arme': {
        const wp = r.weapon;
        if (wp) {
          const at = wp.def.attack;
          const wb = wp.body;
          return [
            { ms: at.windupMs, pose: { ...a.stance, ...at.windup } },
            {
              ms: at.strikeMs,
              pose: { ...a.stance, ...at.strike },
              start: () => {
                r.addVel(wb, f * at.impulse[0], at.impulse[1]);
                if (at.spin) this.matter.body.setAngularVelocity(wb, f * at.spin);
              },
              active: ['weapon', 'farmF'],
              power: at.power,
              kind: at.heavy ? 'heavy' : 'melee',
            },
            { ms: 320 },
          ];
        }
        return [
          { ms: 230, pose: { sF: -3.0, eF: -0.7, lean: -0.25, hF: -0.6, kF: 0.6 } },
          {
            ms: 200,
            pose: { sF: -0.9, eF: -0.1, lean: 0.55 },
            start: () => r.setVel(p.farmF, f * 16, 12),
            active: ['farmF'],
            power: 1.6,
            kind: 'heavy',
          },
          { ms: 280 },
        ];
      }
      case 'griffes': {
        const claw = (front: boolean): Phase[] => [
          { ms: 90, pose: front ? { sF: -2.7, eF: -0.9, lean: 0.2 } : { sB: -2.7, eB: -0.9, lean: 0.25 } },
          {
            ms: 140,
            pose: front ? { sF: -0.6, eF: -0.4, lean: 0.6 } : { sB: -0.6, eB: -0.4, lean: 0.65 },
            start: () => toward(front ? p.farmF : p.farmB, E.torso, 19, 6),
            active: front ? ['farmF'] : ['farmB'],
            power: 0.75,
            kind: 'claw',
          },
        ];
        return [...claw(true), ...claw(false), ...claw(true), { ms: 260 }];
      }
      case 'boule':
        return [
          { ms: 300, pose: { sF: -1.0, eF: -2.2, sB: -0.9, eB: -2.3, lean: -0.2, crouch: 14 } },
          { ms: 220, pose: { sF: -1.55, eF: -0.1, sB: -1.45, eB: -0.15, lean: 0.35 }, start: () => this.launchFireball(a) },
          { ms: 280 },
        ];
      default:
        return [{ ms: 200 }];
    }
  }

  private skillLabel(a: Fighter, k: Skill) {
    if (k === 'arme' && a.rag.weapon) return a.rag.weapon.def.attack.label;
    return SKILL_LABEL[k];
  }

  /** Trois traces de griffes à l'impact */
  private clawMarks(x: number, y: number, f: number) {
    const g = this.add.graphics().setDepth(48);
    const o = { t: 0 };
    this.tweens.add({
      targets: o,
      t: 1,
      duration: 320,
      onUpdate: () => {
        g.clear();
        const grow = Math.min(1, o.t * 3);
        g.lineStyle(5 * (1 - o.t) + 1, 0xffffff, 1 - o.t);
        for (let i = -1; i <= 1; i++) {
          const ox = i * 12;
          g.lineBetween(x + ox - f * 22, y - 30 + i * 4, x + ox - f * 22 + f * 44 * grow, y - 30 + i * 4 + 60 * grow);
        }
      },
      onComplete: () => g.destroy(),
    });
  }

  private launchFireball(a: Fighter) {
    const hand = a.rag.parts.farmF.position;
    const f = a.rag.facing;
    const group = (a.rag.parts.torso as any).collisionFilter.group;
    const body = this.matter.add.circle(hand.x + f * 30, hand.y, 13, {
      isSensor: true,
      ignoreGravity: true,
      collisionFilter: { group },
      frictionAir: 0,
    } as any);
    (body as any).fireball = true;
    this.matter.body.setVelocity(body, { x: f * 10, y: 0 });
    const orb = this.add.circle(body.position.x, body.position.y, 13, 0xfff1b0).setDepth(46);
    try {
      orb.enableFilters();
      (orb as any).filters.internal.addGlow(0xff8a3c, 8, 0, 1);
    } catch {
      /* pas de glow */
    }
    const trail = fireTrail(this, orb);
    const fb = { body, owner: a, orb, trail };
    (body as any).fb = fb;
    this.fireballs.push(fb);
  }

  private killFireball(fb: (typeof this.fireballs)[number]) {
    this.matter.world.remove(fb.body);
    fb.orb.destroy();
    fb.trail.stop();
    this.time.delayedCall(500, () => fb.trail.destroy());
    this.fireballs = this.fireballs.filter((x) => x !== fb);
  }

  private shockwave(a: Fighter, e: Fighter) {
    const x = a.rag.x;
    if (this.fx) {
      ring(this, x, GROUND, 0xffe28a, 170, 10, true);
      dust(this, x, GROUND, 20);
      this.cameras.main.shake(220, 0.01);
    } else {
      ring(this, x, GROUND, 0xffffff, 140, 4, true);
    }
    const act = a.action;
    if (act && !act.hit && Math.abs(e.rag.x - x) < 150 && e.hp > 0) {
      act.hit = true;
      this.hit(a, e, e.rag.parts.torso, 1.4, 'crush');
    }
  }

  // --- collisions / dégâts ---------------------------------------------------
  private onContact(A: MatterJS.BodyType, B: MatterJS.BodyType) {
    const fbA = (A as any).fb, fbB = (B as any).fb;
    if (fbA || fbB) {
      const fb = fbA || fbB;
      const other = fbA ? B : A;
      const rag = (other as any).rag;
      if (rag && rag.owner === fb.owner.rag) return;
      if (!this.fireballs.includes(fb)) return;
      const pos = { x: fb.body.position.x, y: fb.body.position.y };
      this.killFireball(fb);
      sparks(this, pos.x, pos.y, 0xff8a3c, 26, 1.2);
      ring(this, pos.x, pos.y, 0xffb070, 90, 8);
      if (rag) {
        const def = this.f.find((x) => x.rag === rag.owner)!;
        if (def.hp > 0) this.hit(fb.owner, def, other, 1.3, 'fire');
      }
      return;
    }
    const ra = (A as any).rag, rb = (B as any).rag;
    if (!ra || !rb || ra.owner === rb.owner) return;
    for (const [mine, theirs, theirBody] of [[ra, rb, B], [rb, ra, A]] as const) {
      const att = this.f.find((x) => x.rag === mine.owner)!;
      const def = this.f.find((x) => x.rag === theirs.owner)!;
      const act = att.action;
      if (!act || act.hit || def.hp <= 0 || att.hp <= 0) continue;
      const ph = act.phases[act.i];
      if (!ph.active || !ph.active.includes(mine.part)) continue;
      act.hit = true;
      this.hit(att, def, theirBody, ph.power ?? 1, ph.kind ?? 'melee');
    }
  }

  private hit(att: Fighter, def: Fighter, body: MatterJS.BodyType, power: number, kind: Kind) {
    const f = att.rag.facing;
    const dmg = Math.max(1, Math.round(att.spec.force * power * 1.7 * this.rng.range(0.85, 1.25)));
    def.hp = Math.max(0, def.hp - dmg);
    this.hud.setHp(def.idx, def.hp / def.spec.hp);
    const pos = body.position;
    const col = kind === 'fire' ? 0xff8a3c : kind === 'heavy' || kind === 'crush' ? 0xffe28a : 0xffd36b;
    if (this.fx) {
      sparks(this, pos.x, pos.y, col, kind === 'heavy' ? 24 : 16, power, f > 0 ? 0 : 180);
      if (power >= 1.2) ring(this, pos.x, pos.y, col, 60 + power * 25);
      this.cameras.main.shake(100 + power * 60, 0.0035 * power);
      this.slow(power >= 1.3 ? 160 : 70, 0.15);
      this.flash(def);
    } else {
      sparks(this, pos.x, pos.y, 0xffffff, 6, 0.6);
    }
    if (kind === 'claw' && this.fx) this.clawMarks(pos.x, pos.y, f);
    popText(this, pos.x, pos.y - 30, '-' + dmg, kind === 'fire' ? '#ffb070' : '#ffffff', 20 + power * 8);

    // réaction physique : pas d'animation, juste des impulsions
    const r = def.rag;
    r.moveVx = 0;
    def.action = null;
    r.addVel(body, f * 8 * power, -3 * power);
    if (kind === 'launch') r.shove(f * 3, -16);
    else if (kind === 'push') r.shove(f * 9, -5);
    else if (kind === 'crush') r.shove(0, 4);
    else if (kind === 'fire') r.shove(f * 6, -7);
    else r.shove(f * 3.5 * power, -2 * power);
    def.stunT = 260 + power * 260 + (kind === 'launch' || kind === 'crush' ? 400 : 0);
    r.airborne = kind === 'launch' || kind === 'push';

    if (def.hp <= 0) this.ko(def, att);
  }

  private flash(fi: Fighter) {
    fi.flashUntil = this.time.now + 80;
    for (const [k, img] of Object.entries(fi.images)) {
      if (!img) continue;
      img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.time.delayedCall(70, () => {
        img.setTintMode(Phaser.TintModes.MULTIPLY);
        img.setTint(k.endsWith('B') ? 0xb9b4c8 : 0xffffff);
      });
    }
  }

  private slow(ms: number, scale: number) {
    this.slowT = Math.max(this.slowT, ms);
    this.matter.world.engine.timing.timeScale = scale;
    this.tweens.timeScale = Math.max(scale, 0.3);
  }

  private ko(loser: Fighter, winner: Fighter) {
    this.over = true;
    loser.rag.goLimp();
    loser.rag.shove(winner.rag.facing * 4, -8);
    loser.action = null;
    winner.action = null;
    winner.rag.moveVx = 0;
    this.slow(this.fx ? 900 : 300, this.fx ? 0.18 : 0.4);
    banner(this, 'K.O. !', '#ff7a45');
    this.time.delayedCall(900, () => winnerText(this, winner.spec.name).forEach((t) => this.fightObjs.push(t)));
  }

  // --- boucle -----------------------------------------------------------------
  private think(a: Fighter, e: Fighter, dt: number) {
    const r = a.rag;
    if (!r.alive) return;
    if (a.stunT > 0) {
      a.stunT -= dt;
      r.strength = 0.12;
      r.support = 0;
      if (a.stunT <= 0) a.recoverT = 450;
      return;
    }
    if (a.recoverT > 0) {
      a.recoverT -= dt;
      r.strength = Math.min(1, 1 - a.recoverT / 450 + 0.2);
      r.support = 1;
      r.target = { ...a.stance };
      return;
    }
    r.strength = 1;
    r.support = 1;

    if (this.over) {
      // célébration du vainqueur
      this.celebrateT += dt;
      const up = Math.sin(this.celebrateT / 140) > 0;
      r.target = { ...a.stance, sF: up ? -2.9 : -2.5, eF: -0.3, sB: up ? -2.8 : -2.4, eB: -0.3, lean: -0.1, head: -0.35 };
      r.moveVx = 0;
      if (this.celebrateT % 900 < dt && r.feetOnGround()) r.shove(0, -9);
      return;
    }

    // anti-empilement : si l'un finit debout sur l'autre, ou s'ils se sont croisés
    const dx = e.rag.x - r.x;
    if (Math.abs(dx) < 80 && r.y < e.rag.y - 50) {
      r.shove((dx > 0 ? -1 : 1) * 5, -3);
      r.airborne = true;
    } else if (dx * r.facing < -20 && r.feetOnGround() && !a.action) {
      r.shove(-r.facing * 5, -12);
      r.airborne = true;
    }

    const act = a.action;
    if (act) {
      act.t += dt;
      const ph = act.phases[act.i];
      if (ph.onLand && !act.landed && act.t > 120 && !r.airborne) {
        act.landed = true;
        ph.onLand();
      }
      if (act.t >= ph.ms) {
        act.i++;
        act.t = 0;
        if (act.i >= act.phases.length) {
          a.action = null;
          r.target = { ...a.stance };
          a.cooldown = 420 - a.spec.vitesse * 25 + this.rng.range(0, 320);
          a.next = null;
          return;
        }
        this.enterPhase(a, e);
      }
      return;
    }

    a.cooldown -= dt;
    if (!a.next) {
      if (a.skills.includes('arme') && a.rag.weapon && this.rng.chance(0.45)) a.next = 'arme';
      else if (a.wolf && this.rng.chance(0.45)) a.next = 'griffes';
      else a.next = this.rng.pick(a.skills);
    }
    const dist = Math.abs(e.rag.x - r.x);
    const reach = REACH[a.next] * SIZE * 0.75;
    const f = r.facing;
    const pace = 2.4 + a.spec.vitesse * 0.22;
    if (a.next === 'boule' && dist < 220) a.next = this.rng.pick(a.skills.filter((s) => s !== 'boule').concat('poing'));
    if (dist > reach) {
      r.moveVx = f * pace;
    } else if (dist < reach * 0.5 && a.next !== 'charge' && a.next !== 'saut') {
      r.moveVx = -f * pace * 0.7;
    } else {
      r.moveVx = 0;
      if (a.cooldown <= 0 && e.hp > 0) this.startAction(a, e, a.next);
    }
  }

  private startAction(a: Fighter, e: Fighter, skill: Skill) {
    a.action = { phases: this.plan(a, e, skill), i: 0, t: 0, hit: false, landed: false };
    a.rag.moveVx = skill === 'charge' ? a.rag.moveVx : 0;
    banner(this, this.skillLabel(a, skill), a.idx === 0 ? '#ffb38f' : '#9ff0e4', a.idx === 0 ? W * 0.27 : W * 0.73);
    this.enterPhase(a, e);
  }

  private enterPhase(a: Fighter, e: Fighter) {
    const act = a.action!;
    const ph = act.phases[act.i];
    a.rag.target = { ...a.stance, ...(ph.pose ?? {}) };
    if (ph.active) act.hit = false;
    ph.start?.();
    // l'adversaire tente une esquive au moment où le coup part
    if (ph.active && e.stunT <= 0 && !e.action && e.hp > 0) {
      const chance = Phaser.Math.Clamp(0.05 + e.spec.agilite * 0.022 - a.spec.agilite * 0.008, 0.04, 0.26);
      if (this.rng.chance(chance)) {
        e.rag.shove(a.rag.facing * 7, -7);
        e.rag.airborne = true;
        e.rag.target = { ...e.stance, lean: -0.5, head: -0.4, sF: -2.2, sB: -2.0 };
        e.cooldown = 350;
        popText(this, e.rag.x, e.rag.y - 90, 'Esquive !', '#9ff0e4', 20);
      }
    }
  }

  update(_t: number, _dt: number) {
    // vitesse x2 = 2 pas physiques par image ; x0,5 = un pas toutes les deux images
    this.acc += this.speed;
    while (this.acc >= 1) {
      this.acc -= 1;
      const ts = this.matter.world.engine.timing.timeScale;
      const dt = STEP_MS * ts;
      const [a, b] = this.f;
      if (a && b) {
        this.think(a, b, dt);
        this.think(b, a, dt);
        a.rag.step();
        b.rag.step();
      }
      this.matter.world.step(STEP_MS);
      if (this.slowT > 0) {
        this.slowT -= STEP_MS;
        if (this.slowT <= 0) {
          this.matter.world.engine.timing.timeScale = 1;
          this.tweens.timeScale = 1;
        }
      }
    }
    for (const fb of this.fireballs) {
      fb.orb.setPosition(fb.body.position.x, fb.body.position.y);
      if (fb.body.position.x < 10 || fb.body.position.x > W - 10) this.killFireball(fb);
    }
    this.render();
  }

  // --- rendu --------------------------------------------------------------------
  private render() {
    const g = this.gfx;
    g.clear();
    for (const fi of this.f) {
      const p = fi.rag.parts;
      // ombre
      g.fillStyle(0x000000, 0.25);
      const h = Math.max(0, GROUND - (fi.rag.y + 120));
      g.fillEllipse(fi.rag.x, GROUND + 2, Math.max(30, 110 - h * 0.3), 14);
      if (this.opts.dressed) {
        for (const part of DRAW_ORDER) {
          const img = fi.images[part]!;
          img.setPosition(p[part].position.x, p[part].position.y).setRotation(p[part].angle);
        }
        const w = fi.images.weapon;
        if (w) {
          const fa = p.farmF;
          const off = fi.spec.foreArm / 2 - fi.spec.armW / 2;
          const f = fi.rag.facing;
          w.setPosition(fa.position.x - Math.sin(fa.angle) * off, fa.position.y + Math.cos(fa.angle) * off);
          w.setRotation(fa.angle + f * 1.1);
        }
      }
    }
    if (this.opts.dressed) return;
    // Pistes 1 et 5 : formes simples dessinées à partir des polygones physiques
    const now = this.time.now;
    for (const fi of this.f) {
      const base = COLORS[fi.idx];
      const f = fi.rag.facing;
      const white = this.fx && now < fi.flashUntil;
      const fill = (c: number) => g.fillStyle(white ? 0xffffff : c, 1);
      const poly = (b: MatterJS.BodyType) => {
        const v = b.vertices!;
        g.beginPath();
        g.moveTo(v[0].x, v[0].y);
        for (let i = 1; i < v.length; i++) g.lineTo(v[i].x, v[i].y);
        g.closePath();
        g.fillPath();
        g.strokePath();
      };
      if (fi.rag.tail.length) this.drawTail(fi, white);
      for (const part of DRAW_ORDER) {
        const b = fi.rag.parts[part];
        const back = part.endsWith('B');
        g.lineStyle(3, OUTLINE, 1);
        if (part === 'head') {
          this.drawHead(fi, b, base, white);
        } else {
          fill(part === 'torso' ? base : shade(base, back ? 0.62 : 0.85));
          poly(b);
          if (fi.wolf && (part === 'farmF' || part === 'farmB')) this.drawClaws(fi, b, white);
          if (part === 'farmF' && fi.rag.weapon) this.drawWeapon(fi, white);
          else if (part === 'farmF' && this.fx && !fi.rag.weapon && fi.spec.weapon !== 'aucune' && fi.skills.includes('arme')) this.drawHeldWeapon(fi, b, f, white);
        }
      }
    }
    void H;
  }

  /** Arme physique (piste 5) : dessinée le long de son corps physique */
  private drawWeapon(fi: Fighter, white: boolean) {
    const g = this.gfx;
    const wp = fi.rag.weapon!;
    const b = wp.body;
    const S = wp.scale;
    const L = wp.def.length * S;
    const f = fi.rag.facing;
    const dx = -Math.sin(b.angle), dy = Math.cos(b.angle); // axe manche -> tête
    const nx = -dy * f, ny = dx * f; // côté « tranchant », miroir selon le sens
    const x0 = b.position.x - dx * L / 2, y0 = b.position.y - dy * L / 2;
    const at = (d: number, side: number) => ({ x: x0 + dx * d + nx * side, y: y0 + dy * d + ny * side });
    const shape = (pts: { x: number; y: number }[], col: number) => {
      g.fillStyle(white ? 0xffffff : col, 1);
      g.fillPoints(pts as any, true);
      g.strokePoints(pts as any, true);
    };
    const bar = (a: number, z: number, w1: number, w2: number, col: number) => shape([at(a, w1), at(z, w2), at(z, -w2), at(a, -w1)], col);
    g.lineStyle(3, OUTLINE, 1);
    switch (wp.def.id) {
      case 'epee':
        bar(0, 14 * S, 2.5 * S, 2.5 * S, 0x7a5232);
        bar(13 * S, 17 * S, 9 * S, 9 * S, 0xf2c14e);
        bar(17 * S, L, 4.5 * S, 0.5, 0xe9edf5);
        break;
      case 'marteau':
        bar(0, L - 14 * S, 3 * S, 3 * S, 0x7a5232);
        bar(L - 24 * S, L, 13 * S, 13 * S, 0x8f99ad);
        bar(L - 24 * S, L - 19 * S, 13 * S, 13 * S, 0x6b7385);
        break;
      case 'hache':
        bar(0, L, 2.8 * S, 2.8 * S, 0x7a5232);
        shape([at(L - 24 * S, 2 * S), at(L - 4 * S, 2 * S), at(L + 2 * S, 17 * S), at(L - 30 * S, 15 * S)], 0xd6dce8);
        break;
      case 'baton':
        bar(0, L, 3.2 * S, 3.2 * S, 0xb58450);
        bar(L * 0.3, L * 0.34, 3.6 * S, 3.6 * S, 0x6b4a2b);
        bar(L * 0.66, L * 0.7, 3.6 * S, 3.6 * S, 0x6b4a2b);
        break;
    }
  }

  /** Griffes : trois petites pointes au bout de la main */
  private drawClaws(fi: Fighter, fa: MatterJS.BodyType, white: boolean) {
    const g = this.gfx;
    const h = fi.rag.handOf(fa);
    const dx = -Math.sin(fa.angle), dy = Math.cos(fa.angle);
    const nx = -dy, ny = dx;
    const r = fi.spec.armW * 0.6;
    g.fillStyle(white ? 0xffffff : 0xf3ede2, 1);
    g.lineStyle(2, OUTLINE, 1);
    for (let i = -1; i <= 1; i++) {
      const bx = h.x + dx * r * 0.6 + nx * i * r * 0.7;
      const by = h.y + dy * r * 0.6 + ny * i * r * 0.7;
      const tx = bx + dx * r * 1.6 + nx * i * r * 0.3;
      const ty = by + dy * r * 1.6 + ny * i * r * 0.3;
      g.fillTriangle(bx - nx * 3, by - ny * 3, bx + nx * 3, by + ny * 3, tx, ty);
      g.strokeTriangle(bx - nx * 3, by - ny * 3, bx + nx * 3, by + ny * 3, tx, ty);
    }
  }

  /** Queue physique : un trait épais qui passe par les segments */
  private drawTail(fi: Fighter, white: boolean) {
    const g = this.gfx;
    const t = fi.rag.tail;
    const pts = t.map((b) => ({ x: b.position.x, y: b.position.y }));
    const S = SIZE;
    const fur = shade(COLORS[fi.idx], 0.55);
    for (const [w, c] of [[12 * S, OUTLINE], [7 * S, white ? 0xffffff : fur]] as const) {
      g.lineStyle(w, c, 1);
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
      g.fillStyle(c, 1);
      pts.forEach((p) => g.fillCircle(p.x, p.y, w / 2));
    }
    const tip = pts[pts.length - 1];
    g.fillStyle(white ? 0xffffff : 0xf3ede2, 1);
    g.fillCircle(tip.x, tip.y, 4 * S);
  }

  /** Arme dessinée seulement (sans physique), tenue au bout de l'avant-bras */
  private drawHeldWeapon(fi: Fighter, fa: MatterJS.BodyType, f: number, white: boolean) {
    const g = this.gfx;
    const off = fi.spec.foreArm / 2 - fi.spec.armW / 2;
    const hx = fa.position.x - Math.sin(fa.angle) * off;
    const hy = fa.position.y + Math.cos(fa.angle) * off;
    const th = fa.angle + f * 1.1;
    const dx = f * Math.cos(th), dy = f * Math.sin(th);
    const nx = -dy, ny = dx;
    const quad = (a: number, b: number, w1: number, w2: number, col: number) => {
      g.fillStyle(white ? 0xffffff : col, 1);
      g.beginPath();
      g.moveTo(hx + dx * a + nx * w1, hy + dy * a + ny * w1);
      g.lineTo(hx + dx * b + nx * w2, hy + dy * b + ny * w2);
      g.lineTo(hx + dx * b - nx * w2, hy + dy * b - ny * w2);
      g.lineTo(hx + dx * a - nx * w1, hy + dy * a - ny * w1);
      g.closePath();
      g.fillPath();
      g.strokePath();
    };
    const S = SIZE;
    g.lineStyle(3, OUTLINE, 1);
    switch (fi.spec.weapon) {
      case 'epee':
        quad(-8 * S, 14 * S, 3 * S, 3 * S, 0x7a5232);
        quad(12 * S, 16 * S, 10 * S, 10 * S, 0xf2c14e);
        quad(16 * S, 78 * S, 5 * S, 0.5, 0xe9edf5);
        break;
      case 'marteau':
        quad(-8 * S, 62 * S, 3 * S, 3 * S, 0x7a5232);
        quad(52 * S, 76 * S, 15 * S, 15 * S, 0x8f99ad);
        break;
      case 'hache':
        quad(-8 * S, 66 * S, 3 * S, 3 * S, 0x7a5232);
        quad(46 * S, 66 * S, 4 * S, 18 * S, 0xd6dce8);
        break;
      default:
        quad(-30 * S, 70 * S, 4 * S, 4 * S, 0xa0703f);
    }
  }

  /** Tête de loup-garou : oreilles, museau, yeux jaunes */
  private drawWolfHead(fi: Fighter, P: (x: number, y: number) => { x: number; y: number }, r: number, white: boolean) {
    const g = this.gfx;
    const fur = white ? 0xffffff : 0x8d8799;
    const dark = white ? 0xffffff : 0x5d576b;
    const poly = (pts: { x: number; y: number }[], col: number) => {
      g.fillStyle(col, 1);
      g.fillPoints(pts as any, true);
      g.strokePoints(pts as any, true);
    };
    g.lineStyle(3, OUTLINE, 1);
    // oreilles (derrière)
    poly([P(-r * 0.55, -r * 0.6), P(-r * 0.45, -r * 1.55), P(-r * 0.05, -r * 0.85)], dark);
    poly([P(-r * 0.05, -r * 0.8), P(r * 0.2, -r * 1.6), P(r * 0.5, -r * 0.7)], fur);
    // crâne
    const c = P(0, 0);
    g.fillStyle(fur, 1);
    g.fillCircle(c.x, c.y, r);
    g.strokeCircle(c.x, c.y, r);
    // museau
    poly([P(r * 0.45, -r * 0.05), P(r * 1.4, r * 0.1), P(r * 1.35, r * 0.5), P(r * 0.4, r * 0.62)], fur);
    const nose = P(r * 1.36, r * 0.18);
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(nose.x, nose.y, r * 0.14);
    // crocs
    g.fillStyle(0xffffff, 1);
    g.lineStyle(2, OUTLINE, 1);
    for (const fx of [0.8, 1.1]) {
      const a = P(r * fx, r * 0.52), b2 = P(r * (fx + 0.12), r * 0.52), tip = P(r * (fx + 0.06), r * 0.78);
      g.fillTriangle(a.x, a.y, b2.x, b2.y, tip.x, tip.y);
      g.strokeTriangle(a.x, a.y, b2.x, b2.y, tip.x, tip.y);
    }
    // œil
    const e = P(r * 0.4, -r * 0.2);
    g.lineStyle(3, OUTLINE, 1);
    if (fi.hp <= 0) {
      const s = r * 0.15;
      const a1 = P(r * 0.4 - s, -r * 0.2 - s), a2 = P(r * 0.4 + s, -r * 0.2 + s);
      const b1 = P(r * 0.4 - s, -r * 0.2 + s), b2 = P(r * 0.4 + s, -r * 0.2 - s);
      g.lineBetween(a1.x, a1.y, a2.x, a2.y);
      g.lineBetween(b1.x, b1.y, b2.x, b2.y);
      return;
    }
    g.fillStyle(0xffd36b, 1);
    g.fillCircle(e.x, e.y, r * 0.2);
    g.strokeCircle(e.x, e.y, r * 0.2);
    const pu = P(r * 0.46, -r * 0.2);
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(pu.x, pu.y, r * 0.08);
    const b1 = P(r * 0.12, -r * 0.5), b2 = P(r * 0.66, -r * 0.34);
    g.lineBetween(b1.x, b1.y, b2.x, b2.y);
  }

  /** Tête : un rond, des yeux expressifs et un accessoire simple selon le perso */
  private drawHead(fi: Fighter, b: MatterJS.BodyType, base: number, white: boolean) {
    const g = this.gfx;
    const r = fi.spec.headR;
    const f = fi.rag.facing;
    const a = b.angle;
    const cx = b.position.x, cy = b.position.y;
    // repère local de la tête : (lx, ly) -> monde
    const P = (lx: number, ly: number) => ({ x: cx + lx * f * Math.cos(a) - ly * Math.sin(a), y: cy + lx * f * Math.sin(a) + ly * Math.cos(a) });
    const acc = shade(base, 0.55);
    g.lineStyle(3, OUTLINE, 1);

    if (this.fx && !fi.wolf) {
      // accessoires derrière la tête
      const style = fi.spec.hairStyle;
      g.fillStyle(white ? 0xffffff : acc, 1);
      if (style === 'chignon' || style === 'longs') {
        const q = P(-r * 0.95, style === 'longs' ? r * 0.2 : -r * 0.75);
        g.fillCircle(q.x, q.y, r * (style === 'longs' ? 0.45 : 0.38));
        g.strokeCircle(q.x, q.y, r * (style === 'longs' ? 0.45 : 0.38));
      }
    }

    if (fi.wolf) {
      this.drawWolfHead(fi, P, r, white);
      return;
    }
    g.fillStyle(white ? 0xffffff : 0xf3ede2, 1);
    g.fillCircle(cx, cy, r);
    g.strokeCircle(cx, cy, r);

    if (this.fx) {
      const style = fi.spec.hairStyle;
      g.fillStyle(white ? 0xffffff : acc, 1);
      if (style === 'pics') {
        for (let i = 0; i < 3; i++) {
          const ang = -Math.PI / 2 + (i - 1) * 0.55;
          const b1 = P(Math.cos(ang - 0.22) * r * 0.92, Math.sin(ang - 0.22) * r * 0.92);
          const b2 = P(Math.cos(ang + 0.22) * r * 0.92, Math.sin(ang + 0.22) * r * 0.92);
          const tip = P(Math.cos(ang) * r * 1.5, Math.sin(ang) * r * 1.5);
          g.fillTriangle(b1.x, b1.y, b2.x, b2.y, tip.x, tip.y);
          g.strokeTriangle(b1.x, b1.y, b2.x, b2.y, tip.x, tip.y);
        }
      } else if (style === 'iroquoise') {
        const pts = [P(-r * 0.25, -r * 0.85), P(-r * 0.3, -r * 1.45), P(r * 0.35, -r * 1.35), P(r * 0.3, -r * 0.85)];
        g.fillPoints(pts as any, true);
        g.strokePoints(pts as any, true);
      } else if (style === 'bol') {
        // bandeau
        const pts = [P(-r * 0.98, -r * 0.2), P(-r * 0.9, -r * 0.5), P(r * 0.9, -r * 0.5), P(r * 0.98, -r * 0.2)];
        g.fillPoints(pts as any, true);
        g.strokePoints(pts as any, true);
      } else if (style === 'chauve') {
        // petit casque rond
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= 12; i++) {
          const t = Math.PI + (i / 12) * Math.PI;
          pts.push(P(Math.cos(t) * r * 1.02, Math.sin(t) * r * 1.02 - r * 0.15));
        }
        g.fillPoints(pts as any, true);
        g.strokePoints(pts as any, true);
      }
    }

    // yeux
    const ko = fi.hp <= 0;
    const stunned = fi.stunT > 0;
    const angry = !!fi.action;
    const e = P(r * 0.45, -r * 0.12);
    g.fillStyle(OUTLINE, 1);
    g.lineStyle(3, OUTLINE, 1);
    if (!this.fx) {
      g.fillCircle(e.x, e.y, r * 0.13);
      return;
    }
    if (ko) {
      const s = r * 0.16;
      const a1 = P(r * 0.45 - s, -r * 0.12 - s), a2 = P(r * 0.45 + s, -r * 0.12 + s);
      const b1 = P(r * 0.45 - s, -r * 0.12 + s), b2 = P(r * 0.45 + s, -r * 0.12 - s);
      g.lineBetween(a1.x, a1.y, a2.x, a2.y);
      g.lineBetween(b1.x, b1.y, b2.x, b2.y);
    } else if (stunned) {
      const a1 = P(r * 0.3, -r * 0.1), a2 = P(r * 0.6, -r * 0.1);
      g.lineBetween(a1.x, a1.y, a2.x, a2.y);
    } else {
      g.fillCircle(e.x, e.y, r * 0.14);
      if (angry) {
        const a1 = P(r * 0.22, -r * 0.42), a2 = P(r * 0.66, -r * 0.26);
        g.lineBetween(a1.x, a1.y, a2.x, a2.y);
      }
    }
    // bouche
    const m1 = P(r * 0.42, r * 0.38), m2 = P(r * 0.72, r * 0.32);
    if (ko || stunned) {
      const o = P(r * 0.55, r * 0.4);
      g.strokeCircle(o.x, o.y, r * 0.09);
    } else if (angry) {
      g.lineBetween(m1.x, m1.y, m2.x, m2.y);
    }
  }
}
