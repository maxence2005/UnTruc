// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import type { RPose } from './ragdoll';

// ---------------------------------------------------------------------------
// Armes physiques, décrites en DONNÉES.
// Chaque arme = un corps physique + une prise en main (1 ou 2 mains) + sa propre attaque.
// Ajouter une arme = ajouter une entrée ici, sans toucher au moteur.
// Longueurs en px avant mise à l'échelle (SIZE).
// ---------------------------------------------------------------------------

export interface WeaponAttack {
  label: string;
  windup: Partial<RPose>;
  windupMs: number;
  strike: Partial<RPose>;
  strikeMs: number;
  /** impulsion donnée à l'arme au début du coup : [vers l'avant, vers le bas] */
  impulse: [number, number];
  /** rotation donnée à l'arme (moulinet) */
  spin?: number;
  power: number;
  heavy?: boolean;
}

export interface WeaponDef {
  id: 'epee' | 'marteau' | 'hache' | 'baton';
  hands: 1 | 2;
  length: number;
  width: number;
  density: number;
  /** distance de la main principale depuis le bout du manche */
  grip: number;
  /** distance de la seconde main (armes à deux mains) */
  grip2?: number;
  /** angle de l'arme par rapport à l'avant-bras, en garde */
  stanceWpn: number;
  /** pose de garde propre à l'arme (ex. marteau tenu à deux mains) */
  stance?: Partial<RPose>;
  attack: WeaponAttack;
}

export const WEAPONS: Record<WeaponDef['id'], WeaponDef> = {
  epee: {
    id: 'epee',
    hands: 1,
    length: 60,
    width: 6,
    density: 0.0012,
    grip: 7,
    stanceWpn: -0.6,
    attack: {
      label: "Taille à l'épée",
      windup: { sF: -3.0, eF: -0.9, lean: -0.25, wpn: -0.4 },
      windupMs: 200,
      strike: { sF: -0.7, eF: -0.1, lean: 0.5, wpn: -0.3 },
      strikeMs: 220,
      impulse: [16, 12],
      power: 1.4,
    },
  },
  marteau: {
    id: 'marteau',
    hands: 2,
    length: 62,
    width: 7,
    density: 0.0035,
    grip: 7,
    grip2: 20,
    stanceWpn: -1.5, // tête du marteau posée vers l'arrière, sur l'épaule
    stance: { sF: -0.9, eF: -1.3, sB: -0.7, eB: -1.4, lean: 0.15 },
    attack: {
      label: 'Coup de marteau à deux mains',
      windup: { sF: -3.3, eF: -0.4, sB: -3.2, eB: -0.4, lean: -0.35, wpn: -1.45 },
      windupMs: 340,
      strike: { sF: -0.6, eF: -0.1, sB: -0.6, eB: -0.1, lean: 0.75, crouch: 22, wpn: -1.15 },
      strikeMs: 280,
      impulse: [10, 24],
      power: 1.9,
      heavy: true,
    },
  },
  hache: {
    id: 'hache',
    hands: 1,
    length: 54,
    width: 6,
    density: 0.0022,
    grip: 7,
    stanceWpn: -1.3,
    attack: {
      label: 'Balayage à la hache',
      windup: { sF: 0.9, eF: -0.4, lean: -0.35, wpn: -1.5, hF: -0.6, kF: 0.6 },
      windupMs: 230,
      strike: { sF: -1.8, eF: -0.1, lean: 0.45, wpn: -1.5 },
      strikeMs: 220,
      impulse: [22, -2],
      power: 1.6,
    },
  },
  baton: {
    id: 'baton',
    hands: 2,
    length: 100,
    width: 6,
    density: 0.001,
    grip: 38,
    grip2: 62,
    stanceWpn: 0.9,
    stance: { sF: -1.1, eF: -1.0, sB: -1.3, eB: -0.9, lean: 0.1 },
    attack: {
      label: 'Estoc et moulinet au bâton',
      windup: { sF: -0.4, eF: -2.3, sB: -0.5, eB: -2.2, lean: -0.25, wpn: 1.5 },
      windupMs: 200,
      strike: { sF: -1.55, eF: -0.05, sB: -1.45, eB: -0.1, lean: 0.45, wpn: 1.5 },
      strikeMs: 260,
      impulse: [24, 0],
      spin: 0.5,
      power: 1.3,
    },
  },
};
