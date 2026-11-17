import type { SkillsConfig } from './duel-config';
import type { Rng } from './rng';
import type { SkillSpec } from './skill-spec';

/** Ce que le choix d'une compétence lit d'un combattant et de la situation. */
export interface SkillContext {
  /** Distance entre bassins, en px. */
  distance: number;
  stamina: number;
  mana: number;
  hp: number;
  maxHp: number;
  /** Recharge restante par identifiant de compétence, en ticks (absent ou 0 = prête). */
  cooldowns: Readonly<Record<string, number>>;
}

/** Vrai si la compétence peut partir maintenant : recharge finie, de quoi payer, distance et PV dans les conditions. */
export function canLaunch(skill: SkillSpec, context: SkillContext): boolean {
  const { conditions, cost } = skill;
  return (
    (context.cooldowns[skill.id] ?? 0) <= 0 &&
    context.stamina >= cost.stamina &&
    context.mana >= cost.mana &&
    context.distance >= conditions.minDistance &&
    context.distance <= conditions.maxDistance &&
    context.hp <= conditions.maxOwnHpShare * context.maxHp
  );
}

/** Chance de tenter une compétence plutôt qu'un coup simple : `base + perIntelligence × intelligence`, bornée entre 0 et `max`. */
export function skillUseChance(config: SkillsConfig, intelligence: number): number {
  const { base, perIntelligence, max } = config.useChance;
  return Math.min(max, Math.max(0, base + perIntelligence * intelligence));
}

/**
 * Choisit la compétence à lancer, ou `null` pour un coup simple. Sans compétence possible,
 * aucun tirage n'est fait (un duel sans compétences garde le même déroulement). Sinon un
 * tirage décide de tenter une compétence, un second la choisit selon son poids.
 */
export function chooseSkill(
  skills: readonly SkillSpec[],
  context: SkillContext,
  intelligence: number,
  config: SkillsConfig,
  rng: Rng,
): SkillSpec | null {
  const possible = skills.filter((skill) => canLaunch(skill, context));
  if (possible.length === 0) return null;
  if (rng.next() >= skillUseChance(config, intelligence)) return null;
  const total = possible.reduce((sum, skill) => sum + skill.weight, 0);
  let roll = rng.range(0, total);
  for (const skill of possible) {
    roll -= skill.weight;
    if (roll < 0) return skill;
  }
  return possible[possible.length - 1];
}

/** Fait baisser d'un tick la recharge de chaque compétence de la liste, une seule fois par identifiant, sans allouer. */
export function tickCooldowns(skills: readonly SkillSpec[], cooldowns: Record<string, number>): void {
  for (let index = 0; index < skills.length; index += 1) {
    const { id } = skills[index];
    const left = cooldowns[id];
    if (left === undefined || left <= 0 || listedBefore(skills, index)) continue;
    cooldowns[id] = left - 1;
  }
}

/** Vrai si une compétence de même identifiant précède `index` dans la liste. */
function listedBefore(skills: readonly SkillSpec[], index: number): boolean {
  for (let before = 0; before < index; before += 1) {
    if (skills[before].id === skills[index].id) return true;
  }
  return false;
}
