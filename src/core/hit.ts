import type { DuelConfig } from './duel-config';
import type { ContactPartName, ContactReport, DuelWorld } from './duel-world';
import type { EventBus } from './events';
import type { Fighter } from './fighter';
import { skillDamage } from './skill-spec';
import { hitDamage } from './stats';
import type { StatusApplication } from './status-spec';

/** Un coup repéré pendant un tick, avant d'être appliqué (contact de corps, ou projectile). */
export interface PendingHit {
  attacker: Fighter;
  part: ContactPartName;
  /** Vitesse d'impact (px par pas) : recul et étourdissement. */
  impactSpeed: number;
  /** Dégâts avant l'effet d'une parade. */
  damage: number;
  /** Compétence qui a porté le coup. */
  skill?: string;
  /** Point d'impact ; absent = entre la partie qui frappe et la victime. */
  point?: { x: number; y: number };
  /** Faux : la garde de la victime ne réduit pas ce coup. Absent = vrai. */
  parryable?: boolean;
  /**
   * Vrai : coup d'un projectile, détaché du geste en cours de son lanceur. Il ne marque pas ce
   * geste comme ayant touché (`Fighter.hasHit`) : un coup simple lancé pendant le vol garde son
   * propre contact, son « Raté » et son enchaînement.
   */
  ranged?: boolean;
  /**
   * Statuts que le coup applique à la victime (story 013), s'il n'est pas paré et ne la met pas KO.
   * Point d'entrée unique : rempli depuis `SkillSpec.hit.applies` ; la story 005 le remplira pour les griffes.
   */
  applies?: readonly StatusApplication[];
}

/** Émet `hit` : les dégâts réellement infligés (après une parade) et les PV restants de la victime. */
export function emitHit(events: EventBus, tick: number, hit: PendingHit, victim: Fighter, damage: number, parried: boolean): void {
  const { attacker, part, skill, point } = hit;
  events.emit('hit', {
    tick,
    attacker: attacker.index,
    victim: victim.index,
    part,
    damage,
    hpLeft: victim.hp,
    parried,
    ...(skill === undefined ? {} : { skill }),
    ...(point === undefined ? {} : { point }),
  });
}

/** Pourquoi un coup ne fait pas (tous) ses dégâts. */
export type NoDamageReason = 'blocked' | 'dodged' | 'missed';

/** Émet `noDamage` : la raison, au point où le spectateur doit la lire. */
export function emitNoDamage(
  events: EventBus,
  world: DuelWorld,
  tick: number,
  attacker: Fighter,
  victim: Fighter,
  reason: NoDamageReason,
  skill: string | null,
  at?: { x: number; y: number },
): void {
  const place = at ?? readReasonPoint(world, attacker, victim, reason);
  events.emit('noDamage', { tick, attacker: attacker.index, victim: victim.index, reason, skill, x: place.x, y: place.y });
}

/** Esquivé ou bloqué : sur la victime ; raté : là où le coup est tombé (la partie qui frappe). */
function readReasonPoint(world: DuelWorld, attacker: Fighter, victim: Fighter, reason: NoDamageReason): { x: number; y: number } {
  if (reason === 'missed') return world.readPart(attacker.index, attacker.strikingParts[0] ?? 'torso');
  return world.readPart(victim.index, 'torso');
}

/** Partie de `attacker` qui frappe dans ce contact, ou `null` si ce n'en est pas une. */
export function strikingPartOf(contact: ContactReport, attacker: Fighter): ContactPartName | null {
  const strikingParts = attacker.strikingParts;
  if (contact.fighterA === attacker.index && strikingParts.includes(contact.partA)) return contact.partA;
  if (contact.fighterB === attacker.index && strikingParts.includes(contact.partB)) return contact.partB;
  return null;
}

/** Coup de corps : les dégâts de la compétence en cours, sinon ceux de l'attaque. */
export function contactHit(config: DuelConfig, attacker: Fighter, part: ContactPartName, impactSpeed: number): PendingHit {
  const { stats } = attacker.spec;
  const run = attacker.state === 'skill' ? attacker.skillRun : null;
  if (run !== null) {
    const { skill } = run;
    const damage = skillDamage(config, skill.hit, stats, impactSpeed);
    return { attacker, part, impactSpeed, damage, skill: skill.id, parryable: skill.reactions.parryable, ...(skill.hit.applies === undefined ? {} : { applies: skill.hit.applies }) };
  }
  return { attacker, part, impactSpeed, damage: hitDamage(config, attacker.attack.damage, impactSpeed, stats) };
}

/** Un coup simple qui n'a rien touché : esquivé si l'adversaire est en pleine esquive, sinon raté. */
export function reportMissedAttack(events: EventBus, world: DuelWorld, tick: number, attacker: Fighter, victim: Fighter): void {
  emitNoDamage(events, world, tick, attacker, victim, victim.state === 'dodge' ? 'dodged' : 'missed', null);
}
