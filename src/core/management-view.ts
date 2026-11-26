import type { DuelConfig } from './duel-config';
import type { FighterSpec } from './fighter-spec';
import { loadoutPoints, skillAddStatus, validateLoadout, type Loadout, type LoadoutCatalog, type LoadoutIssue, type SkillAddStatus } from './loadout';
import type { ManagedItem, ManagementData, StatId } from './management-spec';
import { describeStat, fillTemplate, formatNumber, highlightedStats, type StatDescription } from './stat-description';

/** Ce que le joueur survole ou touche : une arme, une compétence ou une stat. */
export interface HoverTarget {
  kind: 'weapon' | 'skill' | 'stat';
  id: string;
}

/** L'état de l'écran : un objet que la scène remplace à chaque action (aucun état caché ici). */
export interface ManagementState {
  loadout: Loadout;
  hovered: HoverTarget | null;
}

/** Ce que la vue lit : réglages du duel, données de l'écran, registres, combattant de base (corps, stats, poings). */
export interface ManagementEnv {
  config: DuelConfig;
  data: ManagementData;
  catalog: LoadoutCatalog;
  baseSpec: FighterSpec;
}

/** Une stat à dessiner. */
export interface StatView extends StatDescription {
  /** Vraie quand l'élément survolé utilise cette stat. */
  highlighted: boolean;
}

/** Une arme ou une compétence à dessiner. */
export interface ItemView {
  item: ManagedItem;
  equipped: boolean;
  /** Emplacement de la compétence équipée (0 = premier) ; `null` sinon, et pour les armes. */
  slot: number | null;
  /** Compétence non équipée : peut-on l'ajouter (`ok`) ou faut-il d'abord en retirer une (`full`). */
  addStatus: SkillAddStatus | null;
  /** Vrai quand la stat survolée est utilisée par cet élément. */
  highlighted: boolean;
}

/** L'info-bulle courante. */
export interface TooltipView {
  title: string;
  lines: readonly string[];
}

/** Tout ce que la scène dessine. */
export interface ManagementViewModel {
  stats: readonly StatView[];
  weapons: readonly ItemView[];
  skills: readonly ItemView[];
  /** Un élément par emplacement : id de la compétence équipée, ou `null` (vide). */
  slots: readonly (string | null)[];
  tooltip: TooltipView | null;
  /** Total des points des compétences équipées. */
  points: number;
  issues: readonly LoadoutIssue[];
  /** Le bouton « Combattre » est actif quand l'équipement est valide. */
  canFight: boolean;
}

function findItem(data: ManagementData, target: HoverTarget): ManagedItem | null {
  const list = target.kind === 'weapon' ? data.weapons : target.kind === 'skill' ? data.skills : [];
  return list.find((item) => item.id === target.id) ?? null;
}

function statNames(item: ManagedItem, data: ManagementData): string {
  return highlightedStats(item).map((id) => data.stats.find((entry) => entry.id === id)!.label).join(', ');
}

function weaponFacts(env: ManagementEnv, item: ManagedItem): string[] {
  const { data, catalog, baseSpec } = env;
  const weapon = item.weaponId === null || item.weaponId === undefined ? null : catalog.weapons.get(item.weaponId);
  const attack = weapon?.attack ?? baseSpec.attack;
  const facts = fillTemplate(data.labels.weaponFacts, { damage: formatNumber(attack.damage), reach: formatNumber(attack.reach) });
  return [facts, weapon === null ? data.labels.noWeaponHands : data.labels.hands[String(weapon.hands) as '1' | '2']];
}

function skillFacts(env: ManagementEnv, item: ManagedItem): string[] {
  const skill = env.catalog.skills.get(item.id);
  const { labels } = env.data;
  const lines = [fillTemplate(labels.points, { points: formatNumber(skill.points) })];
  if (skill.trigger !== undefined) return [...lines, labels.triggered];
  if (skill.cost.stamina > 0) lines.push(fillTemplate(labels.staminaCost, { stamina: formatNumber(skill.cost.stamina) }));
  if (skill.cost.mana > 0) lines.push(fillTemplate(labels.manaCost, { mana: formatNumber(skill.cost.mana) }));
  return lines;
}

function itemTooltip(env: ManagementEnv, item: ManagedItem, kind: 'weapon' | 'skill'): TooltipView {
  const facts = kind === 'weapon' ? weaponFacts(env, item) : skillFacts(env, item);
  const uses = fillTemplate(env.data.labels.usesStats, { stats: statNames(item, env.data) });
  return { title: item.name, lines: [item.effect, ...facts, uses] };
}

function tooltipOf(env: ManagementEnv, hovered: HoverTarget | null, stats: readonly StatView[]): TooltipView | null {
  if (hovered === null) return null;
  if (hovered.kind === 'stat') {
    const stat = stats.find((candidate) => candidate.id === hovered.id);
    return stat === undefined ? null : { title: stat.label, lines: [stat.effect, ...stat.lines, stat.scope] };
  }
  const item = findItem(env.data, hovered);
  return item === null ? null : itemTooltip(env, item, hovered.kind);
}

function slotsOf(loadout: Loadout, size: number): (string | null)[] {
  return Array.from({ length: size }, (_unused, index) => loadout.skillIds[index] ?? null);
}

/**
 * Compose le modèle de vue de l'écran de gestion : fonction pure de (données, état), même sortie pour les mêmes entrées.
 * Le survol d'une arme ou d'une compétence met en évidence ses stats ; le survol d'une stat met en évidence ce qui l'utilise.
 */
export function buildManagementView(env: ManagementEnv, state: ManagementState): ManagementViewModel {
  const { config, data, catalog, baseSpec } = env;
  const { loadout, hovered } = state;
  const hoveredItem = hovered === null ? null : findItem(data, hovered);
  const lit = new Set<StatId>(hovered?.kind === 'stat' ? [hovered.id as StatId] : highlightedStats(hoveredItem));
  const rules = { maxSkills: data.maxSkillSlots };
  const stats = data.stats.map((entry) => ({ ...describeStat(config, baseSpec.stats, entry.id, data), highlighted: lit.has(entry.id) }));
  const usesLit = (item: ManagedItem): boolean => hovered?.kind === 'stat' && item.usesStats.includes(hovered.id as StatId);
  const weapons = data.weapons.map((item) => ({ item, equipped: (item.weaponId ?? null) === loadout.weaponId, slot: null, addStatus: null, highlighted: usesLit(item) }));
  const skills = data.skills.map((item) => {
    const slot = loadout.skillIds.indexOf(item.id);
    const addStatus = slot >= 0 ? null : skillAddStatus(loadout, rules, catalog, item.id);
    return { item, equipped: slot >= 0, slot: slot >= 0 ? slot : null, addStatus, highlighted: usesLit(item) };
  });
  const issues = validateLoadout(loadout, rules, catalog);
  return {
    stats,
    weapons,
    skills,
    slots: slotsOf(loadout, data.maxSkillSlots),
    tooltip: tooltipOf(env, hovered, stats),
    points: issues.length === 0 ? loadoutPoints(loadout, catalog) : 0,
    issues,
    canFight: issues.length === 0,
  };
}
