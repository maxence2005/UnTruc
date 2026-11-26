import type { SkillPhase } from './skill-spec';
import { assertStatusApplications, type StatusApplication } from './status-spec';

/** Bonus de stats (additifs) donnés par un stade de déclenchement, tant que dure le duel. */
export interface StatBonus {
  speed: number;
  agility: number;
}

/** Ce qu'un stade fait à l'adversaire à l'instant où il se déclenche : jamais esquivable ni parable. */
export interface TriggerStrike {
  /** Dégâts fixes (PV). */
  damage: number;
  /** Durée de l'étourdissement (ms) : passe outre `stats.maxStunMs` et `stats.maxStunSeriesMs`. */
  stunMs: number;
}

/** Effet sur toute l'arène (onde, tremblement d'écran) : lu par le rendu via l'événement `skillTrigger`. */
export interface TriggerArena {
  /** Force de l'effet, de 0 (rien) à 1 (maximum) ; le rendu la convertit. */
  intensity: number;
  durationMs: number;
}

/**
 * Un stade d'une compétence à déclenchement : se joue une seule fois par duel, quand les PV du
 * combattant passent sous `hpShare`. Pendant `timeline` (sans coup), le combattant est immobile.
 */
export interface TriggerStage {
  id: string;
  /** Part des PV max (entre 0 et 1, exclus) sous laquelle le stade part (PV <= part × PV max). */
  hpShare: number;
  timeline: readonly SkillPhase[];
  /** Effet immédiat sur l'adversaire. */
  strike?: TriggerStrike;
  arena?: TriggerArena;
  /** Bonus de stats permanents jusqu'à la fin du duel (même si le combattant se soigne ensuite). */
  statBonus?: StatBonus;
  /** Statuts que chaque coup du combattant applique ensuite (`PendingHit.applies`), ex. le saignement des griffes. */
  hitApplies?: readonly StatusApplication[];
}

/** Déclenchement d'une compétence : des stades, du plus haut seuil de PV au plus bas. Une compétence à déclenchement ne se tire jamais. */
export interface SkillTrigger {
  stages: readonly TriggerStage[];
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

/** Vérifie les effets d'un stade : coup à l'adversaire, arène, bonus, statuts. */
function assertEffects(id: string, stage: TriggerStage): void {
  const where = `stade ${stage.id}`;
  if (stage.strike !== undefined) {
    positive(id, `${where} : strike.damage`, stage.strike.damage);
    positive(id, `${where} : strike.stunMs`, stage.strike.stunMs);
  }
  if (stage.arena !== undefined) {
    if (!(stage.arena.intensity > 0 && stage.arena.intensity <= 1)) fail(id, `${where} : arena.intensity doit être dans ]0, 1]`);
    positive(id, `${where} : arena.durationMs`, stage.arena.durationMs);
  }
  if (stage.statBonus !== undefined) {
    nonNegative(id, `${where} : statBonus.speed`, stage.statBonus.speed);
    nonNegative(id, `${where} : statBonus.agility`, stage.statBonus.agility);
  }
  if (stage.hitApplies !== undefined) assertStatusApplications(`Compétence ${id}, ${where}`, stage.hitApplies);
}

/** Vérifie un stade : seuil, timeline d'immobilité (durées positives), effets. */
function assertStage(id: string, stage: TriggerStage, previousShare: number): void {
  if (stage.id.trim() === '') fail(id, 'stade sans identifiant');
  if (!(stage.hpShare > 0 && stage.hpShare < 1)) fail(id, `stade ${stage.id} : hpShare doit être dans ]0, 1[ (reçu ${stage.hpShare})`);
  if (!(stage.hpShare < previousShare)) fail(id, `stade ${stage.id} : les stades doivent aller du seuil de PV le plus haut au plus bas`);
  if (stage.timeline.length === 0) fail(id, `stade ${stage.id} : timeline vide`);
  for (const phase of stage.timeline) {
    positive(id, `stade ${stage.id} : durationMs de la phase ${phase.name}`, phase.durationMs);
    if (phase.strikeWindow === true || phase.projectile !== undefined || phase.impulse !== undefined) fail(id, `stade ${stage.id} : la phase ${phase.name} ne peut ni frapper ni bouger (le combattant est immobile)`);
  }
  assertEffects(id, stage);
}

/** Vérifie le déclenchement d'une compétence ; lève une erreur qui nomme la compétence et le stade fautif. */
export function assertTrigger(id: string, trigger: SkillTrigger): void {
  if (trigger.stages.length === 0) fail(id, 'trigger sans stade');
  let previousShare = 1;
  const seen = new Set<string>();
  for (const stage of trigger.stages) {
    if (seen.has(stage.id)) fail(id, `stade ${stage.id} en double`);
    seen.add(stage.id);
    assertStage(id, stage, previousShare);
    previousShare = stage.hpShare;
  }
}
