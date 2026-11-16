import type { AttackSpec, FighterSpec } from './fighter-spec';
import { applyPatch, type Pose } from './pose';

/**
 * Attaque réellement jouée : celle de l'arme tenue (poses retouchées à partir
 * de la posture du combattant), sinon l'attaque à mains nues de la spec, rendue
 * telle quelle. Implémente la feature 2 de `design/game-brief.md` (story 002).
 */
export function resolveAttack(spec: FighterSpec): AttackSpec {
  const { weapon } = spec;
  if (weapon === undefined) return spec.attack;
  const stance = resolveStance(spec);
  const { windupPose, strikePose, ...rest } = weapon.attack;
  return { ...rest, windupPose: applyPatch(stance, windupPose), strikePose: applyPatch(stance, strikePose) };
}

/**
 * Posture de parade : la garde à mains nues sans arme ; avec une arme, sa garde
 * (`guard.pose`) appliquée à la posture au repos armée ; `null` si l'arme tenue n'a pas
 * de garde, et le combattant ne pare pas.
 */
export function resolveParry(spec: FighterSpec): Pose | null {
  const { weapon } = spec;
  if (weapon === undefined) return spec.parryPose;
  if (weapon.guard === undefined) return null;
  return applyPatch(resolveStance(spec), weapon.guard.pose);
}

/** Posture au repos : celle du combattant, retouchée par l'arme tenue. */
export function resolveStance(spec: FighterSpec): Pose {
  return spec.weapon === undefined ? spec.stance : applyPatch(spec.stance, spec.weapon.stancePose);
}
