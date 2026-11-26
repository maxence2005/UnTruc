import type { DuelConfig } from './duel-config';
import type { BodyPartName, ContactPartName } from './duel-world';
import type { PosePatch } from './pose';
import { hitDamage, type FighterStats } from './stats';
import { assertTrigger, type SkillTrigger } from './skill-trigger-spec';
import { assertStatusApplications, type StatusApplication } from './status-spec';

export type { SkillTrigger, TriggerStage } from './skill-trigger-spec';

/** Catégories de compétences, dans l'ordre d'affichage. Pour en ajouter une : l'ajouter ici, puis ses libellés dans `content/presentation.ts`. */
export const SKILL_CATEGORIES = ['attack', 'magic', 'transformation'] as const;

/** Catégorie d'une compétence : `attack` (mêlée physique), `magic` (coûte du mana), `transformation` (story 005). */
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/** Stat qui fait les dégâts d'une compétence : la force physique (comme un coup) ou la puissance magique. */
export type SkillScaling = 'physical' | 'magic';

/** Ce que coûte une compétence : de l'endurance et/ou du mana, payés au lancement. */
export interface SkillCost {
  stamina: number;
  mana: number;
}

/**
 * Quand une compétence peut partir. Distances entre bassins, en px (`maxDistance` peut valoir
 * `Infinity`). `maxOwnHpShare` : part de PV max au plus (1 = toujours), pour une compétence de dernier recours.
 */
export interface SkillConditions {
  minDistance: number;
  maxDistance: number;
  maxOwnHpShare: number;
}

/** Réactions que l'adversaire peut jouer contre la compétence (tirées comme pour un coup, voir `rollReaction`). */
export interface SkillReactions {
  dodgeable: boolean;
  parryable: boolean;
}

/** Dégâts de la compétence et parties du corps qui frappent pendant la fenêtre de coup. */
export interface SkillHit {
  /** Dégât de base : multiplié par la vitesse d'impact et la puissance physique, ou par la puissance magique (`skillDamage`). */
  damage: number;
  scaling: SkillScaling;
  /** Parties dont le contact compte comme un coup pendant une phase à `strikeWindow` ; vide pour un projectile seul. */
  strikingParts: readonly ContactPartName[];
  /** Statuts appliqués à la victime par un coup qui passe (story 013), ex. `[{ status: BLEED, charges: 1 }]`. */
  applies?: readonly StatusApplication[];
}

/**
 * Élan d'un saut : le moteur calcule la vitesse initiale qui retombe sur la cible visée au
 * lancement (`aimLaunch`), après le temps de vol de la phase et des phases `airborne` qui la suivent.
 */
export interface SkillImpulse {
  /** Vitesses maximales (px par pas) : une cible trop loin n'est pas atteinte, le saut retombe court. */
  maxSpeedX: number;
  maxSpeedY: number;
  /** Distance (px) avant la cible où le combattant vise retomber, pour que son poing l'atteigne. */
  standoff: number;
}

/** Projectile lancé à l'entrée d'une phase : balistique simple, aucun corps physique. */
export interface SkillProjectile {
  /** Vitesse en px par pas ; sert aussi de vitesse d'impact. */
  speed: number;
  /** Partie du lanceur d'où il part. */
  spawnPart: ContactPartName;
  /** Distance (px) à une des `hitParts` de la cible qui compte comme touché. */
  hitRadius: number;
  hitParts: readonly BodyPartName[];
  /** Durée de vie maximale, en ms. */
  maxFlightMs: number;
}

/**
 * Une phase de la timeline : une pose visée (retouche de la posture, interpolée depuis la phase
 * précédente sur `durationMs`), et ce qui se passe quand elle commence ou pendant qu'elle dure.
 */
export interface SkillPhase {
  name: string;
  durationMs: number;
  pose: PosePatch;
  /** En l'air : le maintien debout est coupé. Obligatoire pour la phase d'un `impulse`. */
  airborne?: boolean;
  /** Vitesse de marche voulue pendant la phase (px par pas, vers l'adversaire). */
  walkSpeed?: number;
  /** Multiplicateur de force des bras pendant la phase. */
  armBoost?: number;
  /** Un contact de `hit.strikingParts` compte comme un coup pendant cette phase. */
  strikeWindow?: boolean;
  /** La phase s'arrête dès que le coup touche (une ruée ne traverse pas sa cible). */
  endOnHit?: boolean;
  impulse?: SkillImpulse;
  projectile?: SkillProjectile;
  /** Nom d'événement de rendu (`skillCue`) émis à l'entrée de la phase ; le rendu s'y abonne, la logique ne l'appelle jamais. */
  cue?: string;
}

/** Définition d'une compétence : de la donnée, lue par le moteur générique (`SkillSystem`). */
export interface SkillSpec {
  id: string;
  category: SkillCategory;
  /** Coût (entier, 1 au moins) pour ajouter la compétence au personnage : une compétence forte coûte plus. Aucun budget n'est appliqué dans le duel. */
  points: number;
  cost: SkillCost;
  /** Délai avant de pouvoir la relancer, en ms. */
  cooldownMs: number;
  /** Poids du tirage parmi les compétences possibles. */
  weight: number;
  conditions: SkillConditions;
  reactions: SkillReactions;
  hit: SkillHit;
  timeline: readonly SkillPhase[];
  /**
   * Compétence à déclenchement (story 005) : elle ne se tire jamais ; chaque stade part tout seul
   * quand les PV passent sous son seuil (`SkillSystem`). `conditions`, `reactions`, `hit`, `cooldownMs`,
   * `weight` et `timeline` sont alors ignorés (valeurs neutres) : le jeu lit `trigger.stages`.
   */
  trigger?: SkillTrigger;
}

/** Dégâts d'une compétence : physique = comme un coup ; magique = dégât de base × puissance magique / référence. */
export function skillDamage(config: DuelConfig, hit: SkillHit, attacker: FighterStats, impactSpeed: number): number {
  if (hit.scaling === 'physical') return hitDamage(config, hit.damage, impactSpeed, attacker);
  return Math.round((hit.damage * attacker.magicPower) / config.skills.referenceMagicPower);
}

function fail(id: string, message: string): never {
  throw new Error(`Compétence ${id} : ${message}`);
}

function positive(id: string, what: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) fail(id, `${what} doit être un nombre positif (reçu ${value})`);
}

function nonNegative(id: string, what: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) fail(id, `${what} doit être un nombre positif ou nul (reçu ${value})`);
}

/** Vérifie le projectile d'une phase : vitesse, rayon, durée de vie, parties visées. */
function assertProjectile(id: string, projectile: SkillProjectile): void {
  positive(id, 'projectile.speed', projectile.speed);
  positive(id, 'projectile.hitRadius', projectile.hitRadius);
  positive(id, 'projectile.maxFlightMs', projectile.maxFlightMs);
  if (projectile.hitParts.length === 0) fail(id, 'projectile.hitParts est vide');
}

/** Vérifie l'impulsion d'une phase : elle doit être en l'air, aux vitesses positives. */
function assertImpulse(id: string, phase: SkillPhase, impulse: SkillImpulse): void {
  if (phase.airborne !== true) fail(id, `la phase ${phase.name} donne une impulsion : elle doit être airborne`);
  positive(id, 'impulse.maxSpeedX', impulse.maxSpeedX);
  positive(id, 'impulse.maxSpeedY', impulse.maxSpeedY);
  nonNegative(id, 'impulse.standoff', impulse.standoff);
}

/** Vérifie une phase de la timeline : durée, `endOnHit`, impulsion, projectile. */
function assertPhase(id: string, phase: SkillPhase): void {
  positive(id, `durationMs de la phase ${phase.name}`, phase.durationMs);
  if (phase.endOnHit === true && phase.strikeWindow !== true) fail(id, `la phase ${phase.name} a endOnHit sans strikeWindow`);
  if (phase.impulse !== undefined) assertImpulse(id, phase, phase.impulse);
  if (phase.projectile !== undefined) assertProjectile(id, phase.projectile);
}

/** Vérifie les nombres hors timeline : points, poids, recharge, coûts, dégâts, conditions. */
function assertNumbers(spec: SkillSpec): void {
  const { id, conditions } = spec;
  if (!Number.isInteger(spec.points) || spec.points < 1) fail(id, `points doit être un entier d'au moins 1 (reçu ${spec.points})`);
  positive(id, 'weight', spec.weight);
  nonNegative(id, 'cooldownMs', spec.cooldownMs);
  nonNegative(id, 'cost.stamina', spec.cost.stamina);
  nonNegative(id, 'cost.mana', spec.cost.mana);
  positive(id, 'hit.damage', spec.hit.damage);
  nonNegative(id, 'conditions.minDistance', conditions.minDistance);
  if (!(conditions.maxDistance > conditions.minDistance)) fail(id, 'conditions.maxDistance doit dépasser minDistance');
  if (!(conditions.maxOwnHpShare > 0 && conditions.maxOwnHpShare <= 1)) fail(id, 'conditions.maxOwnHpShare doit être dans ]0, 1]');
}

/** Vérifie une compétence ; lève une erreur qui nomme la compétence et la valeur fautive. Appelée pour chaque entrée du registre. */
export function assertSkillSpec(spec: SkillSpec): void {
  const { id, timeline, hit } = spec;
  if (id.trim() === '') throw new Error('Compétence sans identifiant');
  if (spec.trigger !== undefined) {
    if (!SKILL_CATEGORIES.includes(spec.category)) fail(id, `catégorie inconnue (${String(spec.category)})`);
    if (!Number.isInteger(spec.points) || spec.points < 1) fail(id, `points doit être un entier d'au moins 1 (reçu ${spec.points})`);
    assertTrigger(id, spec.trigger);
    return;
  }
  if (timeline.length === 0) fail(id, 'timeline vide');
  if (!SKILL_CATEGORIES.includes(spec.category)) fail(id, `catégorie inconnue (${String(spec.category)})`);
  assertNumbers(spec);
  for (const phase of timeline) assertPhase(id, phase);
  const strikes = timeline.some((phase) => phase.strikeWindow === true);
  const projectiles = timeline.filter((phase) => phase.projectile !== undefined).length;
  if (!strikes && projectiles === 0) fail(id, 'aucune fenêtre de coup ni projectile : elle ne touche jamais');
  if (strikes && hit.strikingParts.length === 0) fail(id, 'hit.strikingParts est vide alors qu\'une phase frappe');
  if (projectiles > 1) fail(id, 'un seul projectile par compétence');
  if (hit.applies !== undefined) assertStatusApplications(`Compétence ${id}`, hit.applies);
}
