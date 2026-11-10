import type { BodyPartName } from './duel-world';
import type { FighterState } from './fighter-state';
import type { Pose } from './pose';

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
  strikingParts: readonly BodyPartName[];
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
  head: number;
  eye: number;
}

/** Définition complète d'un combattant : de la donnée, lue par un moteur générique. */
export interface FighterSpec {
  id: string;
  name: string;
  colors: FighterColors;
  maxHp: number;
  body: BodySpec;
  muscles: MuscleSpec;
  stance: Pose;
  slump: Pose;
  walk: WalkSpec;
  attack: AttackSpec;
  stunMs: number;
  stateTuning: Readonly<Record<FighterState, StateTuning>>;
}
