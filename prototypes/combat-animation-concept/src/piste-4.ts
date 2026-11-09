// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import { RagdollArena } from './ragdoll/arena';
import { createGame } from './shared/ui';

// Piste 4 : même moteur que la piste 1, habillé avec les persos de la piste 2 + effets.
class Piste4 extends RagdollArena {
  constructor() {
    super({ fx: true, dressed: true }, 'piste4');
  }
}

createGame(Piste4, true);
