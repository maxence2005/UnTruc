// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import { RagdollArena } from './ragdoll/arena';
import { createGame } from './shared/ui';

// Piste 1 : ragdoll physique actif, formes brutes, presque aucun effet.
class Piste1 extends RagdollArena {
  constructor() {
    super({ fx: false, dressed: false }, 'piste1');
  }
}

createGame(Piste1, true);
