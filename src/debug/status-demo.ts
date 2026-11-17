import type { FighterSpec } from '../core/fighter-spec';
import type { Registry } from '../core/registry';
import type { StatusSpec } from '../core/status-spec';

/** Noms acceptés par `?statut=` en plus des identifiants du registre (`?statut=bleed`). */
const STATUS_ALIASES: Readonly<Record<string, string>> = { saignement: 'bleed' };

/**
 * Statut de démonstration demandé par `?statut=` (nom français ou identifiant), `null` sans
 * paramètre ou pour un nom inconnu. Debug seulement : aucune compétence du jeu n'applique encore
 * de statut (story 005).
 *
 * @example readDemoStatus('saignement', STATUSES) // BLEED
 */
export function readDemoStatus(raw: string | null, statuses: Registry<StatusSpec>): StatusSpec | null {
  if (raw === null) return null;
  const id = STATUS_ALIASES[raw] ?? raw;
  return statuses.has(id) ? statuses.get(id) : null;
}

/**
 * Démo du rendu des statuts (story 013) : chaque compétence des combattants applique une charge de
 * `status` à chaque coup qui passe. Rend des copies ; les données (`FIGHTERS`, `SKILLS`) ne
 * changent pas. Sans `?statut=`, la scène n'appelle pas cette fonction : le duel et ses empreintes
 * de référence ne bougent pas.
 *
 * @example const fighters = withDemoStatus(FIGHTERS, BLEED);
 */
export function withDemoStatus(fighters: readonly [FighterSpec, FighterSpec], status: StatusSpec): readonly [FighterSpec, FighterSpec] {
  const arm = (spec: FighterSpec): FighterSpec =>
    spec.skills === undefined ? spec : { ...spec, skills: spec.skills.map((skill) => ({ ...skill, hit: { ...skill.hit, applies: [{ status, charges: 1 }] } })) };
  return [arm(fighters[0]), arm(fighters[1])];
}
