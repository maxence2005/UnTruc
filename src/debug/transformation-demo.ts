import type { FighterSpec } from '../core/fighter-spec';
import type { Registry } from '../core/registry';
import type { SkillSpec } from '../core/skill-spec';

/** Valeurs acceptées par `?competences=` pour la démo de la Transformation (story 005). */
const DEMO_NAMES: readonly string[] = ['loup', 'loup-garou', 'transformation'];

/** Vrai si `?competences=` demande la Transformation. */
export function wantsTransformationDemo(raw: string | null): boolean {
  return raw !== null && DEMO_NAMES.includes(raw);
}

/**
 * Démo de la Transformation (story 005) : Rouge reçoit la compétence en plus des siennes. Rend des
 * copies ; `FIGHTERS` et `SKILLS` ne changent pas. Sans le paramètre, la scène n'appelle pas cette
 * fonction : le duel et ses empreintes de référence ne bougent pas.
 *
 * @example const fighters = withTransformation(FIGHTERS, SKILLS);
 */
export function withTransformation(fighters: readonly [FighterSpec, FighterSpec], skills: Registry<SkillSpec>): readonly [FighterSpec, FighterSpec] {
  const [red, blue] = fighters;
  return [{ ...red, skills: [...(red.skills ?? []), skills.get('transformation')] }, blue];
}
