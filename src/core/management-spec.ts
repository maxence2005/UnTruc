import type { SkillCategory } from './skill-spec';
import type { FighterStats } from './stats';

/** Identifiant d'une des dix stats du combattant. */
export type StatId = keyof FighterStats;

/** Les dix stats, dans l'ordre d'affichage de l'écran. */
export const STAT_IDS: readonly StatId[] = ['hp', 'physicalPower', 'magicPower', 'stamina', 'recovery', 'mana', 'agility', 'speed', 'weight', 'intelligence'];

/** Forme de la pastille : rond = arme, carré arrondi = compétence (art bible, section 3). */
export type IconShape = 'round' | 'rounded-square';

/** Famille de la pastille : `weapon` (jaune arme) ou la catégorie de la compétence. */
export type IconBadge = 'weapon' | SkillCategory;

/** Une arme ou une compétence proposée sur l'écran de gestion. */
export interface ManagedItem {
  /** Identifiant de l'entrée (`fists` pour les poings, sinon l'id du registre). */
  id: string;
  /** Identifiant dans le registre des armes ; `null` pour les poings. Absent pour une compétence. */
  weaponId?: string | null;
  name: string;
  /** Effet en une phrase. */
  effect: string;
  iconShape: IconShape;
  iconBadge: IconBadge;
  /** Stats que le moteur lit pour cet élément. */
  usesStats: readonly StatId[];
}

/** Texte d'une stat. Les `{valeurs}` des `lines` sont remplies par `describeStat`. */
export interface StatEntry {
  id: StatId;
  label: string;
  unit: string;
  /** Ce que la stat change dans le duel, en une ou deux phrases. */
  effect: string;
  /** Qui la lit aujourd'hui (limites incluses). */
  scope: string;
  /** Faux : le duel ne lit pas encore cette stat ; l'écran le dit (`notWiredText`). */
  wired: boolean;
  /** Phrases avec `{valeurs}` calculées par les formules du moteur. */
  lines: readonly string[];
}

/** Chiffres de référence des exemples (dégât d'un coup, de la boule de feu, son coût), tirés des données de jeu. */
export interface StatExamples {
  physicalBaseDamage: number;
  magicBaseDamage: number;
  magicManaCost: number;
}

/** Libellés de l'écran avec `{valeurs}`. */
export interface ManagementLabels {
  notWiredText: string;
  points: string;
  staminaCost: string;
  manaCost: string;
  usesStats: string;
  triggered: string;
  weaponFacts: string;
  hands: Readonly<Record<'1' | '2', string>>;
  noWeaponHands: string;
  slotEmpty: string;
  fight: string;
}

/** Toutes les données de l'écran de gestion. */
export interface ManagementData {
  maxSkillSlots: number;
  weapons: readonly ManagedItem[];
  skills: readonly ManagedItem[];
  stats: readonly StatEntry[];
  statExamples: StatExamples;
  labels: ManagementLabels;
}

function fail(message: string): never {
  throw new Error(`Données de l'écran de gestion : ${message}`);
}

function assertItem(item: ManagedItem, kind: 'weapon' | 'skill', known: (id: string) => boolean): void {
  const where = `${kind} ${item.id}`;
  if (item.name.trim() === '' || item.effect.trim() === '') fail(`${where} : nom ou effet vide`);
  if (item.iconShape !== (kind === 'weapon' ? 'round' : 'rounded-square')) fail(`${where} : forme d'icône incohérente`);
  if ((item.iconBadge === 'weapon') !== (kind === 'weapon')) fail(`${where} : famille d'icône incohérente`);
  if (item.usesStats.length === 0) fail(`${where} : usesStats vide`);
  for (const id of item.usesStats) if (!STAT_IDS.includes(id)) fail(`${where} : stat inconnue (${String(id)})`);
  if (new Set(item.usesStats).size !== item.usesStats.length) fail(`${where} : stat en double`);
  if (kind === 'weapon' ? item.weaponId === undefined : !known(item.id)) fail(`${where} : identifiant absent du registre`);
  if (kind === 'weapon' && item.weaponId !== null && !known(item.weaponId!)) fail(`${where} : arme absente du registre`);
}

/** Vérifie les données au chargement : ids connus, formes, stats existantes, dix stats exactement, emplacements. */
export function assertManagementData(data: ManagementData, hasWeapon: (id: string) => boolean, hasSkill: (id: string) => boolean): void {
  if (!Number.isInteger(data.maxSkillSlots) || data.maxSkillSlots < 1) fail('maxSkillSlots doit être un entier d\'au moins 1');
  data.weapons.forEach((item) => assertItem(item, 'weapon', hasWeapon));
  data.skills.forEach((item) => assertItem(item, 'skill', hasSkill));
  const ids = [...data.weapons, ...data.skills].map((item) => item.id);
  if (new Set(ids).size !== ids.length) fail('identifiant d\'élément en double');
  const statIds = data.stats.map((entry) => entry.id);
  if (statIds.length !== STAT_IDS.length || STAT_IDS.some((id) => !statIds.includes(id))) fail('il faut exactement une entrée par stat');
  for (const entry of data.stats) if (entry.label.trim() === '' || entry.effect.trim() === '' || entry.lines.length === 0) fail(`stat ${entry.id} : texte vide`);
}
