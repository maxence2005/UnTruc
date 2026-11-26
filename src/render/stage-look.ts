import type { SkillsPresentation } from '../core/presentation-config';
import type { ArenaWaveLook, ScratchLook } from '../core/stage-presentation';

/**
 * Choix purs du rendu des compétences à déclenchement (story 005), testés sans Phaser : nom par stade,
 * griffures par forme, tremblement d'écran et mouvement réduit.
 */

/** Nom et couleur du bandeau d'un stade : ceux du stade, sinon ceux de la compétence, sinon l'identifiant du stade en blanc. */
export function stageBanner(skills: SkillsPresentation, skill: string, stage: string): { name: string; color: number } {
  const look = skills.byId[skill];
  const stageLook = look?.stages?.[stage];
  if (stageLook !== undefined) return { name: stageLook.name, color: stageLook.color };
  return look === undefined ? { name: stage, color: 0xffffff } : { name: look.name, color: look.color };
}

/** Griffures par forme (`hit.form` = id du stade), lues dans les stades de toutes les compétences. */
export function scratchLooksByForm(skills: SkillsPresentation): Map<string, ScratchLook> {
  const byForm = new Map<string, ScratchLook>();
  for (const look of Object.values(skills.byId)) {
    for (const [stage, stageLook] of Object.entries(look.stages ?? {})) if (stageLook.scratches !== undefined) byForm.set(stage, stageLook.scratches);
  }
  return byForm;
}

/** Vrai si un coup laisse des griffures : porté sous une forme qui en a, ni paré, ni mortel. */
export function leavesScratches(hit: { form?: string; parried: boolean; hpLeft: number }, byForm: ReadonlyMap<string, ScratchLook>): boolean {
  return hit.form !== undefined && !hit.parried && hit.hpLeft > 0 && byForm.has(hit.form);
}

/** Lit la préférence système « réduire les animations » ; faux sans `matchMedia` (tests, vieux navigateurs). */
export function readReducedMotion(host: { matchMedia?: (query: string) => { matches: boolean } } | undefined): boolean {
  return host?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** Tremblement d'écran d'un stade (durée et intensité de caméra), ou `null` : pas d'effet d'arène, ou mouvement réduit. */
export function arenaShake(arena: { intensity: number; durationMs: number } | undefined, look: ArenaWaveLook | undefined, reducedMotion: boolean): { durationMs: number; intensity: number } | null {
  if (arena === undefined || look === undefined || reducedMotion || look.shakeIntensity <= 0) return null;
  return { durationMs: arena.durationMs, intensity: look.shakeIntensity * arena.intensity };
}
