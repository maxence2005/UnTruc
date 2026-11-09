// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import Phaser from 'phaser';
import { Rng } from './rng';

// ---------------------------------------------------------------------------
// Génération procédurale d'un combattant : apparence + stats + compétences.
// Tout est dessiné par code (Graphics -> textures), donc style 100 % cohérent
// et combinaisons quasi infinies, sans aucune image générée par IA.
// ---------------------------------------------------------------------------

export const OUTLINE = 0x1d1a26;
/** Échelle globale des persos */
export const SIZE = 1.45;

const SKINS = [0xffd9b8, 0xf2c09a, 0xe0a477, 0xc17f53, 0x9a5f3a, 0x6e4128, 0xb8e0a0, 0xa9c8ff];
const HAIRS = [0x2b1d14, 0x5a3a22, 0xc9862f, 0xf2d16b, 0xe8e2d4, 0xd8462f, 0x3c6fd8, 0xff6fae, 0x1f1f1f];
const SHIRTS = [0xff7a45, 0x3fc6b4, 0xf2c14e, 0x8a6cf0, 0xe9566c, 0x4fa3f7, 0x7ccf63, 0xf3ede2];
const PANTS = [0x2f3a5c, 0x4a3b2f, 0x2c2c34, 0x5b2f4f, 0x38523c, 0x6b6f7a];

export type HairStyle = 'chauve' | 'pics' | 'bol' | 'iroquoise' | 'longs' | 'chignon';
export type Outfit = 'tshirt' | 'debardeur' | 'torse' | 'armure';
export type Weapon = 'aucune' | 'epee' | 'marteau' | 'baton' | 'hache';
export type Skill =
  | 'poing'
  | 'combo'
  | 'pied'
  | 'uppercut'
  | 'charge'
  | 'saut'
  | 'arme'
  | 'lancer'
  | 'boule'
  | 'griffes';

export const SKILL_LABEL: Record<Skill, string> = {
  poing: 'Coup de poing',
  combo: 'Enchaînement',
  pied: 'Coup de pied sauté',
  uppercut: 'Uppercut',
  charge: "Charge d'épaule",
  saut: 'Saut écrasant',
  arme: "Coup d'arme",
  lancer: "Lancer d'arme",
  boule: 'Boule de feu',
  griffes: 'Griffes',
};

export interface CharacterSpec {
  id: string;
  seed: number;
  name: string;
  skin: number;
  hair: number;
  hairStyle: HairStyle;
  beard: boolean;
  shirt: number;
  pants: number;
  outfit: Outfit;
  weapon: Weapon;
  eyes: 'rond' | 'fache' | 'fin';
  mouth: 'grr' | 'sourire' | 'o' | 'dents';
  // proportions
  headR: number;
  torsoW: number;
  torsoH: number;
  armW: number;
  upperArm: number;
  foreArm: number;
  legW: number;
  thigh: number;
  shin: number;
  // stats façon La Brute
  hp: number;
  force: number;
  agilite: number;
  vitesse: number;
  skills: Skill[];
}

const SYL_A = ['Bru', 'Gro', 'Ka', 'Mo', 'Ta', 'Zu', 'Ro', 'Pa', 'Fi', 'Lu', 'Do', 'Ga', 'Vi', 'Bo', 'Ne'];
const SYL_B = ['tus', 'mak', 'rine', 'zor', 'pin', 'dor', 'lette', 'gnar', 'bul', 'ka', 'mi', 'rax', 'lou', 'ton'];

export function makeCharacter(seed: number, opts: { allowFire?: boolean } = {}): CharacterSpec {
  const r = new Rng(seed);
  const bw = r.range(0.85, 1.3); // carrure
  const bh = r.range(0.92, 1.12); // taille
  const hs = r.range(0.92, 1.2); // grosse tête
  const weapon = r.pick<Weapon>(['aucune', 'aucune', 'epee', 'marteau', 'baton', 'hache']);
  const pool: Skill[] = ['poing', 'combo', 'pied', 'uppercut', 'charge', 'saut'];
  if (weapon !== 'aucune') pool.push('arme', 'arme', 'lancer');
  if (opts.allowFire && r.chance(0.6)) pool.push('boule', 'boule');
  const skills = Array.from(new Set(Array.from({ length: 5 }, () => r.pick(pool))));
  if (!skills.includes('poing')) skills.push('poing');

  return {
    id: 'c' + seed.toString(36),
    seed,
    name: r.pick(SYL_A) + r.pick(SYL_B),
    skin: r.pick(SKINS),
    hair: r.pick(HAIRS),
    hairStyle: r.pick<HairStyle>(['chauve', 'pics', 'bol', 'iroquoise', 'longs', 'chignon']),
    beard: r.chance(0.3),
    shirt: r.pick(SHIRTS),
    pants: r.pick(PANTS),
    outfit: r.pick<Outfit>(['tshirt', 'tshirt', 'debardeur', 'torse', 'armure']),
    weapon,
    eyes: r.pick(['rond', 'fache', 'fin'] as const),
    mouth: r.pick(['grr', 'sourire', 'o', 'dents'] as const),
    headR: Math.round((19 * hs) * SIZE),
    torsoW: Math.round((32 * bw) * SIZE),
    torsoH: Math.round((46 * bh) * SIZE),
    armW: Math.round(11 * Math.sqrt(bw) * SIZE),
    upperArm: Math.round((26 * bh) * SIZE),
    foreArm: Math.round((26 * bh) * SIZE),
    legW: Math.round(14 * Math.sqrt(bw) * SIZE),
    thigh: Math.round((28 * bh) * SIZE),
    shin: Math.round((30 * bh) * SIZE),
    hp: Math.round(60 + bw * 30 + r.range(0, 20)),
    force: Math.round(3 + bw * 4 + r.range(0, 3)),
    agilite: Math.round(3 + (1.3 - bw) * 8 + r.range(0, 3)),
    vitesse: Math.round(3 + r.range(0, 6)),
    skills,
  };
}

// --- couleurs utilitaires -------------------------------------------------
export function shade(c: number, f: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((c & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

// --- textures ---------------------------------------------------------------
// Toutes les pièces de membre sont dessinées verticalement, articulation en haut.
// Padding symétrique : le centre de la texture = le centre du membre.
export const LIMB_PAD_X = 14;
export const LIMB_PAD_Y = 12;
const LW = 3; // épaisseur du contour

export interface PartKeys {
  head: string;
  torso: string;
  uarm: string;
  farm: string;
  thigh: string;
  shin: string;
  weapon: string | null;
}

export function partKeys(spec: CharacterSpec): PartKeys {
  const p = spec.id;
  return {
    head: p + '-head',
    torso: p + '-torso',
    uarm: p + '-uarm',
    farm: p + '-farm',
    thigh: p + '-thigh',
    shin: p + '-shin',
    weapon: spec.weapon === 'aucune' ? null : p + '-weapon',
  };
}

export function headTexSize(spec: CharacterSpec) {
  return (spec.headR + 16) * 2;
}

export function buildCharacterTextures(scene: Phaser.Scene, spec: CharacterSpec): PartKeys {
  const keys = partKeys(spec);
  for (const k of Object.values(keys)) if (k && scene.textures.exists(k)) scene.textures.remove(k);

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const sleeve = spec.outfit === 'tshirt' ? spec.shirt : spec.outfit === 'armure' ? 0x9aa3b5 : spec.skin;

  // --- bras / jambes ---
  const limb = (key: string, w: number, len: number, draw: (cx: number, top: number, bot: number) => void) => {
    g.clear();
    const W = w + LIMB_PAD_X * 2;
    const H = len + LIMB_PAD_Y * 2;
    const cx = W / 2;
    const top = LIMB_PAD_Y;
    draw(cx, top, top + len);
    g.generateTexture(key, W, H);
  };

  const capsule = (cx: number, top: number, w: number, len: number, color: number) => {
    g.fillStyle(OUTLINE, 1);
    g.fillRoundedRect(cx - w / 2 - LW, top - LW, w + LW * 2, len + LW * 2, (w + LW * 2) / 2);
    g.fillStyle(color, 1);
    g.fillRoundedRect(cx - w / 2, top, w, len, w / 2);
  };

  limb(keys.uarm, spec.armW, spec.upperArm, (cx, top) => {
    capsule(cx, top, spec.armW, spec.upperArm, spec.skin);
    if (sleeve !== spec.skin) {
      g.fillStyle(sleeve, 1);
      g.fillRoundedRect(cx - spec.armW / 2, top, spec.armW, spec.upperArm * 0.55, { tl: spec.armW / 2, tr: spec.armW / 2, bl: 2, br: 2 });
    }
  });

  limb(keys.farm, spec.armW, spec.foreArm, (cx, top, bot) => {
    capsule(cx, top, spec.armW, spec.foreArm, spec.skin);
    if (spec.outfit === 'armure') {
      g.fillStyle(0x9aa3b5, 1);
      g.fillRect(cx - spec.armW / 2, top + spec.foreArm * 0.35, spec.armW, spec.foreArm * 0.3);
    }
    // poing
    const hr = spec.armW * 0.72;
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(cx, bot - spec.armW / 2, hr + LW);
    g.fillStyle(spec.skin, 1);
    g.fillCircle(cx, bot - spec.armW / 2, hr);
    g.fillStyle(shade(spec.skin, 0.8), 1);
    g.fillCircle(cx + hr * 0.3, bot - spec.armW / 2 + hr * 0.25, hr * 0.45);
  });

  limb(keys.thigh, spec.legW, spec.thigh, (cx, top) => {
    capsule(cx, top, spec.legW, spec.thigh, spec.pants);
  });

  limb(keys.shin, spec.legW, spec.shin, (cx, top, bot) => {
    capsule(cx, top, spec.legW * 0.9, spec.shin, spec.pants);
    // chaussure orientée vers l'avant (+x)
    const sw = spec.legW * 1.7;
    const sh = spec.legW * 0.75;
    const sy = bot - sh * 0.9;
    g.fillStyle(OUTLINE, 1);
    g.fillRoundedRect(cx - spec.legW * 0.5 - LW, sy - LW, sw + LW * 2, sh + LW * 2, sh / 2 + LW);
    g.fillStyle(0x3b2a22, 1);
    g.fillRoundedRect(cx - spec.legW * 0.5, sy, sw, sh, sh / 2);
    g.fillStyle(0xf3ede2, 1);
    g.fillRect(cx - spec.legW * 0.5 + 2, sy + sh - 4, sw - 4, 3);
  });

  // --- torse ---
  {
    g.clear();
    const tw = spec.torsoW;
    const th = spec.torsoH;
    const W = tw + LIMB_PAD_X * 2;
    const H = th + LIMB_PAD_Y * 2;
    const x = LIMB_PAD_X;
    const y = LIMB_PAD_Y;
    const body = spec.outfit === 'torse' ? spec.skin : spec.outfit === 'armure' ? 0x8f99ad : spec.shirt;
    g.fillStyle(OUTLINE, 1);
    g.fillRoundedRect(x - LW, y - LW, tw + LW * 2, th + LW * 2, 12);
    g.fillStyle(body, 1);
    g.fillRoundedRect(x, y, tw, th, 10);
    // ombrage côté dos
    g.fillStyle(shade(body, 0.85), 1);
    g.fillRoundedRect(x, y, tw * 0.28, th, { tl: 10, bl: 10, tr: 0, br: 0 });
    if (spec.outfit === 'debardeur') {
      g.fillStyle(spec.skin, 1);
      g.fillRoundedRect(x + tw * 0.3, y, tw * 0.4, th * 0.22, { tl: 0, tr: 0, bl: 8, br: 8 });
    } else if (spec.outfit === 'torse') {
      g.lineStyle(2, shade(spec.skin, 0.7), 1);
      g.beginPath();
      g.arc(x + tw * 0.62, y + th * 0.3, tw * 0.18, 0.2, Math.PI - 0.2);
      g.strokePath();
      g.beginPath();
      g.moveTo(x + tw * 0.6, y + th * 0.55);
      g.lineTo(x + tw * 0.6, y + th * 0.75);
      g.strokePath();
    } else if (spec.outfit === 'armure') {
      g.fillStyle(0xc3cad8, 1);
      g.fillRoundedRect(x + tw * 0.15, y + 6, tw * 0.7, th * 0.4, 6);
      g.fillStyle(0xe7c35a, 1);
      g.fillCircle(x + tw * 0.5, y + th * 0.26, 4);
    } else {
      g.fillStyle(shade(spec.shirt, 1.2), 1);
      g.fillCircle(x + tw * 0.62, y + th * 0.35, Math.max(4, tw * 0.13));
    }
    // ceinture
    g.fillStyle(OUTLINE, 1);
    g.fillRect(x, y + th - 11, tw, 9);
    g.fillStyle(0x6b4a2b, 1);
    g.fillRect(x, y + th - 10, tw, 7);
    g.fillStyle(0xe7c35a, 1);
    g.fillRect(x + tw * 0.55, y + th - 11, 7, 9);
    g.generateTexture(keys.torso, W, H);
  }

  // --- tête (regarde vers +x) ---
  {
    g.clear();
    const S = headTexSize(spec);
    const c = S / 2;
    const r = spec.headR;
    const hairBack = () => {
      if (spec.hairStyle === 'longs') {
        g.fillStyle(OUTLINE, 1);
        g.fillRoundedRect(c - r - 4 - LW, c - r * 0.6 - LW, r * 1.2 + LW * 2, r * 1.9 + LW * 2, 10);
        g.fillStyle(spec.hair, 1);
        g.fillRoundedRect(c - r - 4, c - r * 0.6, r * 1.2, r * 1.9, 9);
      }
      if (spec.hairStyle === 'chignon') {
        g.fillStyle(OUTLINE, 1);
        g.fillCircle(c - r * 0.85, c - r * 0.75, r * 0.45 + LW);
        g.fillStyle(spec.hair, 1);
        g.fillCircle(c - r * 0.85, c - r * 0.75, r * 0.45);
      }
    };
    hairBack();
    // oreille + crâne
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(c, c, r + LW);
    g.fillStyle(spec.skin, 1);
    g.fillCircle(c, c, r);
    // nez
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(c + r * 0.95, c + r * 0.05, r * 0.24 + LW);
    g.fillStyle(spec.skin, 1);
    g.fillCircle(c + r * 0.95, c + r * 0.05, r * 0.24);
    g.fillCircle(c + r * 0.7, c + r * 0.05, r * 0.25);
    // oreille
    g.fillStyle(shade(spec.skin, 0.82), 1);
    g.fillCircle(c - r * 0.2, c + r * 0.1, r * 0.22);
    // joue
    g.fillStyle(0xff8a80, 0.35);
    g.fillCircle(c + r * 0.45, c + r * 0.35, r * 0.2);
    // barbe
    if (spec.beard) {
      g.fillStyle(spec.hair, 1);
      g.slice(c + r * 0.1, c + r * 0.1, r * 0.98, 0.15, Math.PI * 0.85, false);
      g.fillPath();
    }
    // yeux
    const ex = c + r * 0.45;
    const ey = c - r * 0.18;
    if (spec.eyes === 'fin') {
      g.fillStyle(OUTLINE, 1);
      g.fillRect(ex - r * 0.18, ey - 1, r * 0.36, 3);
    } else {
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(ex, ey, r * 0.38, r * 0.46);
      g.fillStyle(OUTLINE, 1);
      g.fillCircle(ex + r * 0.07, ey + 1, r * 0.11);
    }
    // sourcil
    g.lineStyle(3, OUTLINE, 1);
    g.beginPath();
    if (spec.eyes === 'fache') {
      g.moveTo(ex - r * 0.22, ey - r * 0.38);
      g.lineTo(ex + r * 0.24, ey - r * 0.22);
    } else {
      g.moveTo(ex - r * 0.2, ey - r * 0.33);
      g.lineTo(ex + r * 0.22, ey - r * 0.35);
    }
    g.strokePath();
    // bouche
    const mx = c + r * 0.55;
    const my = c + r * 0.48;
    g.fillStyle(OUTLINE, 1);
    if (spec.mouth === 'o') g.fillCircle(mx, my, r * 0.12);
    else if (spec.mouth === 'sourire') {
      g.lineStyle(3, OUTLINE, 1);
      g.beginPath();
      g.arc(mx - r * 0.05, my - r * 0.12, r * 0.22, 0.3, Math.PI - 0.6);
      g.strokePath();
    } else if (spec.mouth === 'dents') {
      g.fillRoundedRect(mx - r * 0.25, my - r * 0.1, r * 0.45, r * 0.22, 3);
      g.fillStyle(0xffffff, 1);
      g.fillRect(mx - r * 0.2, my - r * 0.07, r * 0.35, r * 0.08);
    } else {
      g.fillRect(mx - r * 0.22, my - 1, r * 0.4, 3);
    }
    // cheveux devant
    g.fillStyle(spec.hair, 1);
    switch (spec.hairStyle) {
      case 'pics':
        for (let i = 0; i < 5; i++) {
          const a = Math.PI + 0.25 + i * 0.5;
          const bx = c + Math.cos(a) * r * 0.85;
          const by = c + Math.sin(a) * r * 0.85;
          const tx = c + Math.cos(a) * r * 1.45;
          const ty = c + Math.sin(a) * r * 1.45;
          g.fillStyle(OUTLINE, 1);
          g.fillTriangle(bx - 7, by + 2, bx + 7, by + 2, tx, ty - 2);
          g.fillStyle(spec.hair, 1);
          g.fillTriangle(bx - 5, by + 2, bx + 5, by + 2, tx, ty);
        }
        g.slice(c, c, r, Math.PI, Math.PI * 2, false);
        g.fillPath();
        break;
      case 'bol':
        g.slice(c, c - r * 0.36, r * 0.98, Math.PI * 0.98, Math.PI * 2.02, false);
        g.fillPath();
        g.fillRoundedRect(c - r * 1.02, c - r * 0.5, r * 0.55, r * 0.75, 6);
        break;
      case 'iroquoise':
        g.fillStyle(OUTLINE, 1);
        g.fillRoundedRect(c - r * 0.35 - LW, c - r * 1.45 - LW, r * 0.7 + LW * 2, r * 0.9, 6);
        g.fillStyle(spec.hair, 1);
        g.fillRoundedRect(c - r * 0.35, c - r * 1.45, r * 0.7, r * 0.9, 6);
        break;
      case 'longs':
      case 'chignon':
        g.slice(c, c, r * 1.02, Math.PI * 0.9, Math.PI * 1.9, false);
        g.fillPath();
        break;
      default:
        g.fillStyle(0xffffff, 0.35);
        g.fillEllipse(c + r * 0.1, c - r * 0.6, r * 0.6, r * 0.25);
    }
    g.generateTexture(keys.head, S, S);
  }

  // --- arme : poignée à gauche (x = 8), lame vers +x ---
  if (keys.weapon) {
    g.clear();
    const W = 90;
    const H = 40;
    const cy = H / 2;
    const grip = (len: number) => {
      g.fillStyle(OUTLINE, 1);
      g.fillRoundedRect(2, cy - 5, len + 4, 10, 4);
      g.fillStyle(0x7a5232, 1);
      g.fillRoundedRect(4, cy - 3, len, 6, 3);
    };
    switch (spec.weapon) {
      case 'epee':
        grip(16);
        g.fillStyle(OUTLINE, 1);
        g.fillRect(18, cy - 11, 8, 22);
        g.fillTriangle(24, cy - 7, 24, cy + 7, 86, cy);
        g.fillStyle(0xe7c35a, 1);
        g.fillRect(20, cy - 9, 4, 18);
        g.fillStyle(0xdfe6f2, 1);
        g.fillTriangle(26, cy - 5, 26, cy + 5, 82, cy);
        break;
      case 'marteau':
        grip(52);
        g.fillStyle(OUTLINE, 1);
        g.fillRoundedRect(52, cy - 17, 30, 34, 5);
        g.fillStyle(0x8f99ad, 1);
        g.fillRoundedRect(55, cy - 14, 24, 28, 4);
        break;
      case 'hache':
        grip(56);
        g.fillStyle(OUTLINE, 1);
        g.slice(60, cy, 20, -Math.PI * 0.95, -Math.PI * 0.05, false);
        g.fillPath();
        g.fillStyle(0xc3cad8, 1);
        g.slice(60, cy, 16, -Math.PI * 0.9, -Math.PI * 0.1, false);
        g.fillPath();
        break;
      case 'baton':
        g.fillStyle(OUTLINE, 1);
        g.fillRoundedRect(2, cy - 6, 84, 12, 6);
        g.fillStyle(0xa0703f, 1);
        g.fillRoundedRect(4, cy - 4, 80, 8, 4);
        g.fillStyle(0x6b4a2b, 1);
        g.fillRect(30, cy - 4, 4, 8);
        g.fillRect(56, cy - 4, 4, 8);
        break;
    }
    g.generateTexture(keys.weapon, W, H);
  }

  g.destroy();
  return keys;
}
