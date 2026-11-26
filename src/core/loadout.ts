import type { FighterSpec } from './fighter-spec';
import type { Registry } from './registry';
import type { SkillSpec } from './skill-spec';
import type { WeaponSpec } from './weapon-spec';

/**
 * Équipement du joueur avant un duel (story 006) : une arme (`null` = les poings) et des compétences,
 * dans l'ordre des emplacements. Immuable : chaque fonction rend un nouvel équipement.
 */
export interface Loadout {
  readonly weaponId: string | null;
  readonly skillIds: readonly string[];
}

/** Règles d'équipement, venues des données (`src/content/management/`). */
export interface LoadoutRules {
  /** Nombre d'emplacements de compétence. */
  maxSkills: number;
}

/** Ce qui peut être équipé : les registres du jeu, injectés pour garder ce module sans contenu. */
export interface LoadoutCatalog {
  weapons: Registry<WeaponSpec>;
  skills: Registry<SkillSpec>;
}

/** Un défaut d'équipement ; `id` est l'identifiant en cause, s'il y en a un. */
export interface LoadoutIssue {
  kind: 'unknown-weapon' | 'unknown-skill' | 'duplicate-skill' | 'too-many-skills';
  id?: string;
}

/** Pourquoi une compétence peut, ou non, être ajoutée. */
export type SkillAddStatus = 'ok' | 'full' | 'duplicate' | 'unknown';

/** Équipement d'un combattant tel que le jeu le lui donne : son arme et ses compétences actuelles. */
export function loadoutOf(spec: FighterSpec): Loadout {
  return { weaponId: spec.weapon?.id ?? null, skillIds: (spec.skills ?? []).map((skill) => skill.id) };
}

/** Liste les défauts d'un équipement : emplacements dépassés, doublons, identifiants inconnus. Vide = valide. */
export function validateLoadout(loadout: Loadout, rules: LoadoutRules, catalog: LoadoutCatalog): LoadoutIssue[] {
  const issues: LoadoutIssue[] = [];
  if (loadout.weaponId !== null && !catalog.weapons.has(loadout.weaponId)) issues.push({ kind: 'unknown-weapon', id: loadout.weaponId });
  const seen = new Set<string>();
  for (const id of loadout.skillIds) {
    if (!catalog.skills.has(id)) issues.push({ kind: 'unknown-skill', id });
    else if (seen.has(id)) issues.push({ kind: 'duplicate-skill', id });
    seen.add(id);
  }
  if (loadout.skillIds.length > rules.maxSkills) issues.push({ kind: 'too-many-skills' });
  return issues;
}

/** Choisit l'arme (`null` = poings). Un identifiant inconnu laisse l'équipement tel quel. */
export function setWeapon(loadout: Loadout, weaponId: string | null, catalog: LoadoutCatalog): Loadout {
  if (weaponId !== null && !catalog.weapons.has(weaponId)) return loadout;
  return { ...loadout, weaponId };
}

/** Dit si `skillId` peut être ajouté tel quel (emplacement libre, connu, pas déjà équipé). */
export function skillAddStatus(loadout: Loadout, rules: LoadoutRules, catalog: LoadoutCatalog, skillId: string): SkillAddStatus {
  if (!catalog.skills.has(skillId)) return 'unknown';
  if (loadout.skillIds.includes(skillId)) return 'duplicate';
  return loadout.skillIds.length >= rules.maxSkills ? 'full' : 'ok';
}

/** Ajoute une compétence au premier emplacement libre ; inchangé si `skillAddStatus` n'est pas `ok`. */
export function addSkill(loadout: Loadout, rules: LoadoutRules, catalog: LoadoutCatalog, skillId: string): Loadout {
  if (skillAddStatus(loadout, rules, catalog, skillId) !== 'ok') return loadout;
  return { ...loadout, skillIds: [...loadout.skillIds, skillId] };
}

/** Retire une compétence ; les suivantes remontent d'un emplacement. Inchangé si elle n'est pas équipée. */
export function removeSkill(loadout: Loadout, skillId: string): Loadout {
  if (!loadout.skillIds.includes(skillId)) return loadout;
  return { ...loadout, skillIds: loadout.skillIds.filter((id) => id !== skillId) };
}

/** Remplace `oldId` par `newId` dans le même emplacement. Inchangé si `oldId` n'est pas équipée, si `newId` est inconnue ou déjà équipée. */
export function replaceSkill(loadout: Loadout, catalog: LoadoutCatalog, oldId: string, newId: string): Loadout {
  const slot = loadout.skillIds.indexOf(oldId);
  if (slot < 0 || !catalog.skills.has(newId) || loadout.skillIds.includes(newId)) return loadout;
  return { ...loadout, skillIds: loadout.skillIds.map((id, index) => (index === slot ? newId : id)) };
}

/** Total des points des compétences équipées (affiché ; aucun budget ici, voir la story 011). */
export function loadoutPoints(loadout: Loadout, catalog: LoadoutCatalog): number {
  return loadout.skillIds.reduce((sum, id) => sum + catalog.skills.get(id).points, 0);
}

/**
 * Le combattant du duel avec cet équipement : une copie de `spec`, jamais modifiée sur place.
 * Sans arme, la copie n'a pas de `weapon` (poings). Une compétence à déclenchement reste telle quelle.
 * Lève une erreur sur un identifiant inconnu : valider d'abord avec `validateLoadout`.
 */
export function applyLoadout(spec: FighterSpec, loadout: Loadout, catalog: LoadoutCatalog): FighterSpec {
  const { weapon: _unused, ...unarmed } = spec;
  const skills = loadout.skillIds.map((id) => catalog.skills.get(id));
  if (loadout.weaponId === null) return { ...unarmed, skills };
  return { ...unarmed, weapon: catalog.weapons.get(loadout.weaponId), skills };
}

/** Garde l'équipement entre l'écran de gestion et le duel, en mémoire de session. */
export interface LoadoutStore {
  get(): Loadout;
  set(loadout: Loadout): void;
  /** Revient à l'équipement de départ. */
  reset(): void;
}

/** Crée un stockage en mémoire ; chaque appel donne son propre stockage (aucun état global). */
export function createLoadoutStore(initial: Loadout): LoadoutStore {
  const copy = (loadout: Loadout): Loadout => ({ weaponId: loadout.weaponId, skillIds: [...loadout.skillIds] });
  let current = copy(initial);
  return {
    get: () => copy(current),
    set: (loadout) => {
      current = copy(loadout);
    },
    reset: () => {
      current = copy(initial);
    },
  };
}
