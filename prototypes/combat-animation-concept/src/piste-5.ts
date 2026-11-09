// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import { RagdollArena } from './ragdoll/arena';
import { createGame } from './shared/ui';

// Piste 5 : look de la piste 1 (formes simples) + animations et effets de la piste 4.
class Piste5 extends RagdollArena {
  constructor() {
    super({ fx: true, dressed: false }, 'piste5');
  }
}

createGame(Piste5, true);
