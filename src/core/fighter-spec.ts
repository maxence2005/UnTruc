import type { ContactPartName } from './duel-world';
import type { FighterState } from './fighter-state';
import type { Pose } from './pose';
import type { FighterStats } from './stats';
import type { WeaponSpec } from './weapon-spec';

/**
 * Dimensions et matière du corps, en pixels. Les longueurs de membres vont
 * d'une articulation à l'autre ; l'épaisseur s'ajoute aux deux bouts arrondis.
 */
export interface BodySpec {
  torsoWidth: number;
  torsoHeight: number;
  /** Distance entre le haut du torse et l'épaule. */
  shoulderInset: number;
  /** Distance entre le bas du torse et la hanche. */
  hipInset: number;
  /** Écart horizontal des épaules (devant/derrière) par rapport à l'axe du torse. */
  shoulderOffsetX: number;
  /** Écart horizontal des hanches (devant/derrière) par rapport à l'axe du torse. */
  hipOffsetX: number;
  headRadius: number;
  /** Recouvrement de la tête sur le torse, au niveau du cou. */
  neckOverlap: number;
  upperArm: number;
  foreArm: number;
  armWidth: number;
  thigh: number;
  shin: number;
  legWidth: number;
  torsoDensity: number;
  headDensity: number;
  armDensity: number;
  legDensity: number;
  friction: number;
  frictionAir: number;
  restitution: number;
  /** Rayon d'arrondi des coins du torse. */
  torsoCornerRadius: number;
}

/**
 * Réglage d'un groupe de muscles PD : kp = raideur, kd = réactivité (0..1 par pas).
 * `pivotAtJoint` : l'os tourne autour de son articulation (gestes amples et
 * rapides, bras) plutôt qu'autour de son centre (plus stable au sol, jambes).
 */
export interface MuscleGain {
  kp: number;
  kd: number;
  pivotAtJoint: boolean;
  /**
   * Le muscle rend sa poussée au reste du corps : la quantité de mouvement qu'il donne à
   * l'os est retirée à parts égales de vitesse à tout le combattant, qui ne se déplace pas
   * par ce muscle seul. Indispensable pour une pièce lourde (le marteau pèse près de la
   * moitié du porteur) : sans ça, son muscle propulse le combattant en l'air. Absent = faux.
   */
  reaction?: boolean;
}

/** Muscles par groupe d'articulations. */
export interface MuscleSpec {
  torso: MuscleGain;
  head: MuscleGain;
  arm: MuscleGain;
  leg: MuscleGain;
}

/** Cycle de marche : amplitudes en radians, durée d'un cycle en millisecondes, vitesse en px par pas. */
export interface WalkSpec {
  speed: number;
  cycleMs: number;
  hipSwing: number;
  kneeBend: number;
  kneeBendPhase: number;
}

/**
 * Attaque : trois phases (armement, frappe, récupération) qui interpolent des poses.
 * Un coup compte quand une des `strikingParts` touche l'adversaire pendant la phase de frappe.
 */
export interface AttackSpec {
  /** Distance entre bassins à partir de laquelle l'attaque se déclenche. */
  reach: number;
  windupMs: number;
  strikeMs: number;
  recoveryMs: number;
  windupPose: Pose;
  strikePose: Pose;
  /** Vitesse d'élan vers l'avant pendant la frappe (px par pas). */
  lungeSpeed: number;
  /** Multiplicateur de force des bras pendant la frappe. */
  strikeArmBoost: number;
  /** Dégât de base d'un coup, avant le facteur de vitesse d'impact (`DamageConfig`). */
  damage: number;
  strikingParts: readonly ContactPartName[];
}

/** Force des muscles et du maintien debout selon l'état du combattant. */
export interface StateTuning {
  strength: number;
  support: number;
}

/** Couleurs du combattant (0xRRGGBB). */
export interface FighterColors {
  body: number;
  limbBack: number;
  /** Peau : tête (et nez). */
  head: number;
  /** Peau à l'ombre : oreille. */
  headShade: number;
  hair: number;
  /** Encre : contour de la tête et du corps, pupille, sourcil, bouche. */
  outline: number;
  eyeWhite: number;
  cheek: number;
}

/** Couleur d'une pièce du visage, par rôle (résolu dans `FighterColors`). */
export type FaceColorRole = 'skin' | 'shade' | 'hair' | 'ink' | 'white' | 'cheek';

/** Variantes d'yeux : rond, fâché (sourcil penché), fin (fente). */
export type EyeStyle = 'round' | 'angry' | 'thin';
/** Variantes de bouche : grr (trait), sourire, o, dents. */
export type MouthStyle = 'grr' | 'smile' | 'o' | 'teeth';
/** Coiffures du prototype : chauve, pics, bol, iroquoise, longs, chignon. */
export type HairStyle = 'bald' | 'spikes' | 'bowl' | 'mohawk' | 'long' | 'bun';

/**
 * Une pièce dessinée du visage. Coordonnées en rayon de tête, origine au centre
 * de la tête, `+x` vers l'avant (le rendu retourne pour qui regarde à gauche) ;
 * angles en radians, `y` vers le bas. `outlined` : cerne la pièce de l'encre
 * (cercle, rectangle et pointe seulement).
 */
export type FacePiece = {
  color: FaceColorRole;
  alpha?: number;
} & (
  | { shape: 'circle'; x: number; y: number; r: number; outlined?: boolean }
  | { shape: 'ellipse'; x: number; y: number; width: number; height: number }
  | { shape: 'rect'; x: number; y: number; width: number; height: number; radius: number; outlined?: boolean }
  | { shape: 'cap'; x: number; y: number; r: number; from: number; to: number }
  | { shape: 'spike'; x: number; y: number; tipX: number; tipY: number; halfBase: number; outlined?: boolean }
  | { shape: 'line'; x1: number; y1: number; x2: number; y2: number; width: number }
  | { shape: 'arc'; x: number; y: number; r: number; from: number; to: number; width: number }
);

/** Cheveux : pièces derrière la tête (longs, chignon) et devant (frange, pics). */
export interface HairKit {
  back: readonly FacePiece[];
  front: readonly FacePiece[];
}

/** Catalogue des pièces du visage, partagé par les combattants : le rendu ne connaît aucune forme. */
export interface FaceKit {
  /** Crâne, nez, oreille, joue : dessinés dans cet ordre, sous le reste. */
  base: readonly FacePiece[];
  beard: readonly FacePiece[];
  eyes: Readonly<Record<EyeStyle, readonly FacePiece[]>>;
  mouths: Readonly<Record<MouthStyle, readonly FacePiece[]>>;
  hair: Readonly<Record<HairStyle, HairKit>>;
}

/** Apparence d'un combattant : variantes choisies parmi le catalogue, et épaisseur du contour. */
export interface FighterLook {
  eyes: EyeStyle;
  mouth: MouthStyle;
  hair: HairStyle;
  beard: boolean;
  /** Épaisseur du contour de la tête et du corps, en pixels. */
  outlineWidth: number;
  kit: FaceKit;
}

/** Définition complète d'un combattant : de la donnée, lue par un moteur générique. */
export interface FighterSpec {
  id: string;
  name: string;
  colors: FighterColors;
  look: FighterLook;
  stats: FighterStats;
  body: BodySpec;
  muscles: MuscleSpec;
  stance: Pose;
  slump: Pose;
  /** Geste d'esquive : pose tenue pendant que le coup adverse passe. */
  dodgePose: Pose;
  /** Garde de parade : pose tenue pendant que le coup adverse arrive. */
  parryPose: Pose;
  walk: WalkSpec;
  /** Attaque à mains nues ; remplacée par celle de `weapon` quand il en tient une (voir `resolveAttack`). */
  attack: AttackSpec;
  /** Arme tenue, retrouvée dans le registre des armes ; absent = poings. */
  weapon?: WeaponSpec;
  /** Étourdissement de base d'un coup d'impact de référence sur un poids de référence, avant bornes (voir `StatsConfig`). */
  stunMs: number;
  stateTuning: Readonly<Record<FighterState, StateTuning>>;
}
