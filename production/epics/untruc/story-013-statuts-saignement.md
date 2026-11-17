# Story 013: Statuts de combat (saignement)

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-17

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Demande de Maxence du 2026-11-17 (pas encore une feature du brief)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [ ] Un statut est une donnée (id, durée, cumul possible ou non, effets par seconde et effets sur les stats), pas une fonction écrite à la main. Ajouter un statut revient à ajouter un fichier de données.
- [ ] Un statut est appliqué par une compétence ou une attaque, via un événement de la logique, et il expire tout seul.
- [ ] **Saignement** : il inflige des dégâts dans la durée et se cumule (chaque nouvelle application ajoute une charge, jusqu'à un maximum fixé en données). *(Maxence, 2026-11-17)*
- [ ] Le saignement fait aussi perdre du poids à la victime, parce qu'elle perd du sang. Le poids baisse avec les charges et ne descend jamais sous un plancher fixé en données. Cette baisse change la physique, comme le poids de la story 008 : masse, recul et étourdissement. *(Maxence, 2026-11-17 : « quelque chose d'un peu réaliste »)*
- [ ] Les statuts actifs s'affichent aussi dans le HUD, sous la barre de vie du combattant : une petite icône dessinée par statut, avec son nombre de charges. *(Maxence, 2026-11-17)*
- [ ] Le statut se voit sur le combattant (gouttes de sang dessinées, nombre de charges lisible) et chaque perte de PV due au statut se lit, avec des effets au niveau de la story 003.
- [ ] Toutes les valeurs (dégâts par seconde, charges max, perte de poids, durée) sont en données ; le duel reste déterministe à seed fixe.

---

## Implementation Notes

- Premier client : la compétence Transformation (story 005), dont les griffes font saigner.
- Décisions de Maxence (2026-11-17) :
  - Chaque charge de saignement a sa propre durée. Une nouvelle charge ne relance pas les charges déjà là.
  - Chaque charge retire une quantité fixe de poids (en données), qui revient quand cette charge expire.
  - Le saignement peut mettre KO.
  - Le statut et chaque perte de PV qu'il cause ont leurs effets visuels.

---

## Out of Scope

- Autres statuts (brûlure, poison, gel…) : le format doit les permettre, mais ils ne sont pas faits ici.
- Story 005 : la compétence qui applique le saignement.

---

## Files

src/core/status-spec.ts
src/core/status-system.ts
src/core/status-presentation.ts
src/core/events.ts
src/core/hit.ts
src/core/skill-spec.ts
src/core/skill-system.ts
src/core/fighter.ts
src/core/stun.ts
src/core/duel.ts
src/core/duel-world.ts
src/core/presentation-config.ts
src/content/statuses/bleed.ts
src/content/statuses/index.ts
src/content/statuses/README.md
src/content/presentation.ts
src/physics/matter-duel-world.ts
src/debug/duel-debug-hook.ts
src/debug/status-demo.ts
src/main.ts
src/scenes/duel-scene.ts
src/render/status-fx.ts
src/render/status-badge.ts
src/render/status-badge-layout.ts
src/ui/duel-hud.ts
src/render/status-board.ts
src/render/status-damage.ts
src/render/fx/blood.ts
src/render/fx/drip-clock.ts
src/render/fx/flash-limiter.ts
tests/unit/statuses/status-fixtures.ts
tests/unit/statuses/status-spec.test.ts
tests/unit/statuses/statuses.test.ts
tests/unit/fx/status-render.test.ts
tests/unit/duel/fake-duel-world.ts

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: tests unitaires dans `tests/unit/statuses/` (cumul, expiration, plancher de poids, déterminisme), et une capture d'écran conservée dans `production/qa/evidence/` pour le rendu du statut

**Status**: [x] Created: `tests/unit/statuses/` (33 tests), `tests/unit/fx/status-render.test.ts` (rendu), 5 captures dans `production/qa/evidence/story-013-statuts-saignement/` (démo `?seed=3&statut=saignement`).

---

## Dependencies

- Depends on: `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-008-stats-combattant.md`
- Unlocks: `production/epics/untruc/story-005-competence-transformation.md`

## Completion Notes
**Completed**: 2026-11-17
**Criteria**: 7/7 passing
**Deviations**: None bloquant. Conseils notés : jamais plus d'une charge vue à l'écran (cadence par charge vérifiée par les tests seulement) ; limite de 3 flashs par seconde non partagée avec les flashs des coups et des compétences (story 015) ; mouvement réduit absent (story 015) ; flash rouge peu visible sur le combattant rouge ; plantage de `endIfKo` corrigé, le même cas avec une boule de feu non vérifié
**Test Evidence**: `tests/unit/statuses/`, `tests/unit/fx/status-render.test.ts` ; 5 captures dans `production/qa/evidence/story-013-statuts-saignement/` ; 220 tests sur 220 ; empreintes de référence inchangées (1a46eb7a, d1973395, a09e13b0)
**Reviewed by**: `/code-review` lancé par Maxence dans cette session (APPROVED WITH SUGGESTIONS, suggestions appliquées), vérification moteur par `lead-programmer` ; gates de revue ignorés en mode lean

## Calls beyond the design
- Saignement : 4 s par charge, 5 charges, 1 PV par seconde par charge, 3 de poids par charge, plancher 80 % (`src/content/statuses/bleed.ts`) · kept 2026-11-17
- Au plafond, la nouvelle charge remplace la plus ancienne ; dégâts du tick avant l'expiration ; statut posé avant l'étourdissement ; à la fin du duel gouttes et icônes s'arrêtent (`src/core/status-system.ts`, `src/core/duel.ts`, `src/render/status-fx.ts`) · kept 2026-11-17
- Rendu : icône 28 px sous la barre de vie, « -N » rouge 20 px, gouttes de 600 ms à 120 ms (64 au plus), éclaboussure de 4 gouttes, flash rouge, limite de 3 flashs par seconde pour les statuts seuls (`src/content/presentation.ts`) · kept 2026-11-17
- Correction hors story : `endIfKo` ne transitionne plus un vainqueur déjà au repos (`src/core/duel.ts`) · kept 2026-11-17
- Démo `?statut=saignement` (`src/debug/status-demo.ts`, `src/main.ts`) · kept 2026-11-17
- Seules les compétences appliquent un statut ; un coup paré n'en applique pas (décisions de Maxence) · kept 2026-11-17
