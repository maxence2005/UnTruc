import type { DuelConfig } from './duel-config';
import type { ManagedItem, ManagementData, StatExamples, StatId } from './management-spec';
import { STAT_IDS } from './management-spec';
import { reactionChance } from './reactions';
import { skillUseChance } from './skill-choice';
import { skillDamage } from './skill-spec';
import { actionDelayScale, hitDamage, massScale, staminaRegenPerTick, walkSpeedScale, type FighterStats } from './stats';

/** Ce que l'écran affiche pour une stat : libellé, valeur, effet, et les chiffres que la valeur donne vraiment. */
export interface StatDescription {
  id: StatId;
  label: string;
  unit: string;
  value: number;
  effect: string;
  scope: string;
  /** Faux si le duel ne lit pas encore la stat ; `lines` contient alors le texte honnête. */
  wired: boolean;
  lines: readonly string[];
}

/** Nombre au format français : virgule décimale, `decimals` chiffres. */
export function formatNumber(value: number, decimals = 0): string {
  return value.toFixed(decimals).replace('.', ',');
}

/** Pourcentage entier au format français : `0.25` donne `25 %`. */
export function formatPercent(ratio: number): string {
  return `${formatNumber(ratio * 100)} %`;
}

/** Remplace chaque `{nom}` par sa valeur ; lève une erreur si `values` n'a pas le nom (un texte de données mal écrit). */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`Texte « ${template} » : valeur inconnue {${name}}`);
    return value;
  });
}

/** Les données dont `describeStat` a besoin : `ManagementData` convient. */
export type StatTexts = Pick<ManagementData, 'stats' | 'statExamples'> & { labels: Pick<ManagementData['labels'], 'notWiredText'> };

interface Context {
  config: DuelConfig;
  stats: FighterStats;
  examples: StatExamples;
}

type Values = Record<string, string>;

const f = formatNumber;

function chancePercent(chance: DuelConfig['reactions']['dodgeChance'], agility: number): string {
  return formatPercent(reactionChance(chance, agility));
}

function physicalPowerValues({ config, stats, examples }: Context): Values {
  const base = examples.physicalBaseDamage;
  return { ratio: f(stats.physicalPower / config.stats.referencePhysicalPower, 2), base: f(base), damage: f(hitDamage(config, base, config.damage.referenceSpeed, stats)) };
}

function magicPowerValues({ config, stats, examples }: Context): Values {
  const hit = { damage: examples.magicBaseDamage, scaling: 'magic' as const, strikingParts: [] };
  return { ratio: f(stats.magicPower / config.skills.referenceMagicPower, 2), base: f(hit.damage), damage: f(skillDamage(config, hit, stats, 0)) };
}

function staminaValues({ config, stats }: Context): Values {
  const { dodge, parry, attack } = config.reactions.staminaCost;
  return { dodgeCost: f(dodge), dodges: f(Math.floor(stats.stamina / dodge)), parryCost: f(parry), attackCost: f(attack), attacks: f(Math.floor(stats.stamina / attack)) };
}

function recoveryValues({ config, stats }: Context): Values {
  return { perSecond: f(staminaRegenPerTick(config, stats) * config.stepHz, 1) };
}

function manaValues({ stats, examples }: Context): Values {
  return { cost: f(examples.magicManaCost), casts: f(Math.floor(stats.mana / examples.magicManaCost)) };
}

function agilityValues({ config, stats }: Context): Values {
  const { dodgeChance, parryChance, counterChance, comboChance } = config.reactions;
  const a = stats.agility;
  return { dodge: chancePercent(dodgeChance, a), parry: chancePercent(parryChance, a), counter: chancePercent(counterChance, a), combo: chancePercent(comboChance, a) };
}

function speedValues({ config, stats }: Context): Values {
  const { delayBaseMs, delayRandomMs } = config.action;
  const scale = actionDelayScale(config, stats);
  return { scale: f(scale, 2), delayMs: f((delayBaseMs + delayRandomMs / 2) * scale) };
}

function weightValues({ config, stats }: Context): Values {
  const mass = massScale(config, stats);
  return { walk: f(walkSpeedScale(config, stats), 2), stun: f(1 / mass, 2), mass: f(mass, 2) };
}

function intelligenceValues({ config, stats }: Context): Values {
  return { chance: formatPercent(skillUseChance(config.skills, stats.intelligence)) };
}

const VALUES: Record<StatId, (context: Context) => Values> = {
  hp: () => ({}),
  physicalPower: physicalPowerValues,
  magicPower: magicPowerValues,
  stamina: staminaValues,
  recovery: recoveryValues,
  mana: manaValues,
  agility: agilityValues,
  speed: speedValues,
  weight: weightValues,
  intelligence: intelligenceValues,
};

/**
 * Décrit une stat pour l'écran : ses textes, et les chiffres que sa valeur actuelle donne avec les formules
 * du moteur (`stats.ts`, `reactions.ts`, `skill-choice.ts`). `{value}` vaut la valeur de la stat.
 * Une stat que le duel ne lit pas (`wired` faux) ne reçoit aucun chiffre : le texte le dit.
 *
 * @example describeStat(DUEL_CONFIG, stats, 'weight', MANAGEMENT)
 */
export function describeStat(config: DuelConfig, stats: FighterStats, id: StatId, data: StatTexts): StatDescription {
  const { stats: entries, statExamples: examples, labels } = data;
  const entry = entries.find((candidate) => candidate.id === id);
  if (entry === undefined) throw new Error(`Stat sans texte : ${id}`);
  const values = { value: f(stats[id]), ...VALUES[id]({ config, stats, examples }) };
  const lines = entry.wired ? entry.lines.map((line) => fillTemplate(line, values)) : [labels.notWiredText];
  return { id, label: entry.label, unit: entry.unit, value: stats[id], effect: entry.effect, scope: entry.scope, wired: entry.wired, lines };
}

/** Les stats à mettre en évidence quand `item` est survolé ou touché, dans l'ordre d'affichage. */
export function highlightedStats(item: ManagedItem | null): readonly StatId[] {
  if (item === null) return [];
  return STAT_IDS.filter((id) => item.usesStats.includes(id));
}
