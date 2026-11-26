import type { DuelWorld } from './duel-world';
import { emitHit, type PendingHit } from './hit';
import type { Fighter } from './fighter';
import { SkillRun } from './skill-run';
import type { SkillHost } from './skill-system';
import type { SkillSpec } from './skill-spec';
import type { TriggerStage } from './skill-trigger-spec';
import { forceStun } from './stun';

/** Ce que le déclenchement lit du duel qui le porte. */
export type TriggerHost = Pick<SkillHost, 'config' | 'events' | 'fighters' | 'tick' | 'endIfKo'>;

/** Écart de numéro entre deux compétences dans l'empreinte : une compétence a moins de stades que ça. */
const STAGE_SLOTS = 100;

/** Clé d'un stade dans `Fighter.firedStages`. */
function stageKey(skill: SkillSpec, stage: TriggerStage): string {
  return `${skill.id}/${stage.id}`;
}

/**
 * Compétences à déclenchement (story 005) : à chaque tick, un combattant dont les PV sont sous le seuil d'un
 * stade non joué le joue, une fois par duel. Ce code ne connaît aucune compétence : un stade est une donnée
 * (`TriggerStage`).
 *
 * Règles (décidées avec Maxence le 2026-11-17, sauf mention) :
 * - seuil atteint = PV <= part × PV max ; un combattant à 0 PV (KO) ne déclenche rien ;
 * - plusieurs stades atteints d'un coup : seul le plus bas se joue, les autres sont consommés sans effet
 *   (un seul coup de plus de 50 % à moins de 30 % : transformation sans grognement) ;
 * - le combattant déclenche seulement à l'arrêt ou en approche : sonné, en attaque, en compétence, en
 *   récupération ou en réaction, le stade attend ; un étourdi libéré déclenche sur le tick même de sa
 *   libération, avant d'agir (`SkillSystem.tick`). Choix de l'implémentation ;
 * - un seul combattant déclenche par tick (Rouge d'abord, Bleu au tick suivant) : déterministe, sans tirage ;
 * - l'adversaire subit les dégâts et l'étourdissement du stade sans réaction possible (`forceStun`).
 */
export class TriggerSystem {
  private readonly keys = new Map<TriggerStage, string>();

  constructor(private readonly host: TriggerHost) {}

  /** Un tick : le premier combattant (par index) qui peut déclencher un stade le joue. */
  tick(world: DuelWorld): void {
    for (const fighter of this.host.fighters) {
      if (this.tryFire(fighter, world)) return;
    }
  }

  /** Nombres décrivant les stades joués, pour l'empreinte ; vide tant qu'aucun stade n'a été joué. */
  snapshot(): number[] {
    const values: number[] = [];
    for (const fighter of this.host.fighters) {
      if (fighter.firedStages.length > 0) {
        values.push(fighter.index, fighter.firedStages.length, fighter.effectiveStats.speed, fighter.effectiveStats.agility, fighter.formApplies.length);
        for (const key of fighter.firedStages) values.push(this.stageNumber(fighter, key));
      }
    }
    return values;
  }

  /**
   * Joue le stade dû le plus bas d'une compétence à déclenchement, et consomme les autres stades dus (les
   * stades sont rangés du seuil le plus haut au plus bas). Sans allocation tant que rien n'est dû.
   */
  private tryFire(fighter: Fighter, world: DuelWorld): boolean {
    if (fighter.hp === 0 || (fighter.state !== 'idle' && fighter.state !== 'approach')) return false;
    for (const skill of fighter.skills) {
      const stages = skill.trigger?.stages;
      if (stages === undefined) continue;
      let lowest: TriggerStage | null = null;
      for (const stage of stages) if (this.isDue(fighter, skill, stage)) lowest = stage;
      if (lowest === null) continue;
      for (const stage of stages) if (this.isDue(fighter, skill, stage)) fighter.firedStages.push(this.keyOf(skill, stage));
      this.fire(fighter, skill, lowest, world);
      return true;
    }
    return false;
  }

  /** Vrai si les PV sont sous le seuil du stade et qu'il n'a pas encore été joué. */
  private isDue(fighter: Fighter, skill: SkillSpec, stage: TriggerStage): boolean {
    return fighter.hp <= stage.hpShare * fighter.spec.stats.hp && !fighter.firedStages.includes(this.keyOf(skill, stage));
  }

  /**
   * Numéro d'un stade joué, pour l'empreinte : `rang de la compétence × STAGE_SLOTS + rang du stade` chez ce
   * combattant. Deux stades différents ont deux numéros différents ; -1 si la clé ne correspond à aucun stade.
   */
  private stageNumber(fighter: Fighter, key: string): number {
    for (let skillIndex = 0; skillIndex < fighter.skills.length; skillIndex += 1) {
      const skill = fighter.skills[skillIndex];
      const stages = skill.trigger?.stages ?? [];
      for (let stageIndex = 0; stageIndex < stages.length; stageIndex += 1) {
        if (this.keyOf(skill, stages[stageIndex]) === key) return skillIndex * STAGE_SLOTS + stageIndex;
      }
    }
    return -1;
  }

  /** Clé du stade, construite une fois par stade puis réutilisée (pas de chaîne neuve à chaque tick). */
  private keyOf(skill: SkillSpec, stage: TriggerStage): string {
    let key = this.keys.get(stage);
    if (key === undefined) {
      key = stageKey(skill, stage);
      this.keys.set(stage, key);
    }
    return key;
  }

  /** Joue le stade : immobilité du combattant, forme, coup à l'adversaire, événements. */
  private fire(fighter: Fighter, skill: SkillSpec, stage: TriggerStage, world: DuelWorld): void {
    const { config, events } = this.host;
    const opponent = this.host.fighters[1 - fighter.index];
    const target = { x: world.fighterX(opponent.index), y: config.arena.height - config.arena.groundHeight };
    fighter.skillRun = new SkillRun({ ...skill, timeline: stage.timeline }, config.stepHz, target);
    fighter.machine.transition('skill');
    const at = world.readPart(fighter.index, 'torso');
    const tick = this.host.tick();
    events.emit('skillStart', { tick, fighter: fighter.index, skill: skill.id, target });
    events.emit('skillTrigger', { tick, fighter: fighter.index, skill: skill.id, stage: stage.id, x: at.x, y: at.y, ...(stage.arena === undefined ? {} : { arena: stage.arena }) });
    if (stage.statBonus !== undefined || stage.hitApplies !== undefined) {
      fighter.grantForm(config, stage.id, stage.statBonus ?? { speed: 0, agility: 0 }, stage.hitApplies ?? []);
    }
    if (stage.strike !== undefined) this.strike(fighter, opponent, skill, stage, world);
  }

  /** Dégâts fixes puis étourdissement de l'adversaire ; un KO passe par `endIfKo` et ne l'étourdit pas. */
  private strike(fighter: Fighter, opponent: Fighter, skill: SkillSpec, stage: TriggerStage, world: DuelWorld): void {
    const { config, events } = this.host;
    const { damage, stunMs } = stage.strike!;
    const point = world.readPart(opponent.index, 'torso');
    const hit: PendingHit = { attacker: fighter, part: fighter.attack.strikingParts[0], impactSpeed: 0, damage, skill: skill.id, point, parryable: false };
    opponent.hp = Math.max(0, opponent.hp - damage);
    emitHit(events, this.host.tick(), hit, opponent, damage, false);
    if (opponent.hp === 0) {
      this.host.endIfKo();
      return;
    }
    forceStun(config, opponent, stunMs);
  }
}
