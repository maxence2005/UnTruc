# Story 005: Compétence Transformation (loup-garou)

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-26

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 5

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 5, In your words), scoped to this story:*

- [ ] La Transformation est une compétence comme les autres (une donnée), pas un type de combattant.
- [ ] En cours de duel, la compétence transforme le combattant en loup-garou : oreilles, museau, griffes et queue physique (petite chaîne) apparaissent sur le même corps.
- [ ] Une fois transformé, le combattant attaque avec ses griffes, qui laissent des traces visibles à l'impact.
- [ ] Le moment de la transformation se voit et se lit (nom ou icône de la compétence, effet visuel).
- [ ] Les attributs du loup-garou sont des cosmétiques accrochés aux parties du corps, réutilisables.
- [ ] Comme toute compétence, la Transformation a ses effets visuels au niveau de ceux de la story 003 (la règle est posée dans la story 004). *(Maxence, 2026-11-16)*
- [ ] La compétence est de catégorie `transformation` et a un coût en points plus élevé qu'une compétence simple (champs posés par la story 004). *(Maxence, 2026-11-17)*
- [ ] **Grognement, à 50 % des PV** : le combattant grogne ; l'adversaire subit quelques dégâts et est étourdi environ 2 s. Le seuil, les dégâts et la durée sont en données. *(Maxence, 2026-11-17)*
- [ ] **Transformation, à 30 % des PV** : le combattant devient loup-garou ; sa vitesse et son agilité augmentent fortement (bonus en données). *(Maxence, 2026-11-17)*
- [ ] **Griffes qui font saigner** : une fois transformé, chaque attaque qui touche applique le statut Saignement à l'adversaire (statut défini par la story 013). *(Maxence, 2026-11-17)*

---

## Implementation Notes

- Le prototype a montré griffes et queue physique (`prototypes/combat-animation-concept/`) ; dans le jeu, c'est une compétence de transformation, pas un archétype (correction de Maxence, 2026-11-09).
- Durée et éventuel retour à la forme normale : non décidés ; à trancher au début de la story.
- Décisions de Maxence (2026-11-17) :
  - L'étourdissement du grognement passe outre les plafonds des coups (`stats.maxStunMs`, `stats.maxStunSeriesMs`) : une compétence peut dépasser ces plafonds. La durée propre à la compétence est dans ses données.
  - Le grognement et la transformation ont lieu une seule fois par duel chacun.
  - Une fois transformé, le combattant reste loup-garou jusqu'à la fin du duel, même s'il se soigne ensuite au-dessus de 30 % (se transformer puis se soigner à 100 % est voulu, et très fort).
  - Le grognement ne peut être ni esquivé ni paré. Pendant le grognement, le loup-garou reste lui-même immobile un moment (durée en données).
  - Si un seul coup fait passer de plus de 50 % à moins de 30 % des PV, le combattant se transforme sans grogner. C'est un contre possible au loup-garou.
  - Le grognement (un hurlement) a son effet sur toute l'arène : une onde qui traverse le terrain et un tremblement d'écran, avec l'intensité et la durée en données.
  - Si le coup le met KO, rien ne se déclenche : il meurt sans se transformer.
  - Le grognement, la transformation et les griffes ont tous leurs effets visuels.

---

## Out of Scope

- Story 006 : choisir la compétence dans l'écran de gestion.

---

## Files

src/content/presentation.ts
src/content/skills/README.md
src/content/skills/index.ts
src/core/duel.ts
src/core/events.ts
src/core/fighter.ts
src/core/hit.ts
src/core/presentation-config.ts
src/core/reactions.ts
src/core/skill-choice.ts
src/core/skill-spec.ts
src/core/skill-system.ts
src/core/stun.ts
src/main.ts
src/render/fighter-view.ts
src/render/skill-fx.ts
src/scenes/duel-scene.ts
tests/unit/duel/duel.test.ts
tests/unit/skills.test.ts
src/content/cosmetics/README.md
src/content/cosmetics/werewolf.ts
src/content/skills/transformation.ts
src/core/cosmetic-spec.ts
src/core/skill-trigger-spec.ts
src/core/skill-trigger.ts
src/core/stage-presentation.ts
src/debug/transformation-demo.ts
src/render/cosmetic-view.ts
src/render/fx/growl-wave.ts
src/render/fx/scratches.ts
src/render/fx/tail-chain.ts
src/render/stage-look.ts
src/render/transformation-fx.ts
tests/unit/fx/transformation-render.test.ts
tests/unit/transformation/transformation.test.ts

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/story-005-competence-transformation-evidence.md`

**Status**: [x] Created: 5 screenshots in `production/qa/evidence/story-005-competence-transformation/`, sign-off in `production/qa/evidence/story-005-competence-transformation-evidence.md` (Maxence, 2026-11-26). Tests: `tests/unit/transformation/`, `tests/unit/fx/transformation-render.test.ts`.

---

## Dependencies

- Depends on: `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-013-statuts-saignement.md`
- Unlocks: None

## Completion Notes
**Completed**: 2026-11-26
**Criteria**: 10/10 passing (rendu validé par Maxence ; le loup-garou tourné vers la gauche n'a jamais été vu)
**Deviations**: None bloquant. Conseils notés : loup-garou tourné à gauche non vu (`setScale(-1, 1)` sur un `Graphics`) ; mouvement réduit : seul le tremblement d'écran est coupé (réglage complet en story 015) ; limite de 3 flashs par seconde non partagée avec les flashs des coups et des compétences (story 015) ; `projectileEnd` non émis quand un KO vide les projectiles (existant avant la story, non vérifié côté rendu) ; captures 01 à 04 prises avant les corrections de la revue
**Test Evidence**: `tests/unit/transformation/`, `tests/unit/fx/transformation-render.test.ts` ; 5 captures dans `production/qa/evidence/story-005-competence-transformation/` et `production/qa/evidence/story-005-competence-transformation-evidence.md` ; 271 tests sur 271 ; empreintes de référence inchangées (1a46eb7a, d1973395, a09e13b0)
**Reviewed by**: `/code-review` lancé par Maxence dans cette session, deux fois (CHANGES REQUIRED corrigé, puis APPROVED WITH SUGGESTIONS, suggestions appliquées), vérification moteur par `lead-programmer` ; gates de revue ignorés en mode lean

## Calls beyond the design
- Transformation : 4 points ; grognement 5 dégâts, 2 s d'étourdissement, grogneur immobile 1,2 s, onde 0,8 s ; transformation immobile 0,5 s, vitesse et agilité +10 ; griffes sans bonus de dégâts, 1 charge de saignement sur les coups de corps seulement (`src/content/skills/transformation.ts`) · kept 2026-11-26
- Le stade attend que le combattant soit libre (frappé sans arrêt, il ne se transforme pas) ; seul le plus bas seuil se joue ; un déclenchement par tick, Rouge d'abord ; un étourdi libéré déclenche avant d'agir ; un coup reçu ne raccourcit plus un étourdissement forcé (`src/core/skill-trigger.ts`, `src/core/skill-system.ts`, `src/core/stun.ts`) · kept 2026-11-26
- Correction du KO causé par un stade : le vainqueur n'agit plus sur le même tick (`src/core/duel.ts`) · kept 2026-11-26
- Look : vert 0x6fb04a au lieu du violet, anneaux crème, tremblement 0,012 coupé en mouvement réduit, éclair de 28 particules avec ralenti, fourrure gris-brun, oreilles sur les cheveux, queue de 6 segments simulée à l'affichage, 3 griffures rouges de 34 px pendant 0,9 s, limite de 3 flashs par seconde pour les stades (`src/content/presentation.ts`, `src/content/cosmetics/werewolf.ts`) · kept 2026-11-26
- Démo `?competences=loup` (`src/debug/transformation-demo.ts`, `src/main.ts`) · kept 2026-11-26
- Chemin de la validation : `story-005-competence-transformation-evidence.md` au lieu de `untruc-transformation-evidence.md` · kept 2026-11-26
