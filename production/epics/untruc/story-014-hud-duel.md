# Story 014: HUD de combat

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: UI
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Demande de Maxence du 2026-11-17 (lisibilité du duel, liée à la feature 3 du brief)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [ ] Sous la barre de vie de chaque combattant, deux barres plus fines : énergie (`stamina`, story 008) et mana. Elles suivent en direct les dépenses et la récupération.
- [ ] On voit quand un combattant n'a plus assez d'énergie pour esquiver, parer, contre-attaquer ou enchaîner, ou plus assez de mana pour une compétence : la barre change d'aspect sous le coût de l'action.
- [ ] La place sous les barres est prévue pour les icônes de statut de la story 013, qui ne se superposent pas aux barres.
- [ ] **Traînée de dégâts** : la part de vie perdue s'efface avec un temps de retard, avec un flash sur un gros coup. *(Maxence, 2026-11-17)*
- [ ] **Icônes de compétences** : les compétences du combattant (story 004) en petites icônes dessinées, qui s'allument au lancement et se grisent pendant la recharge ou faute de mana. *(Maxence, 2026-11-17)*
- [ ] **Bandeaux de compétence dans l'arène** : le nom affiché au lancement (story 004) prend un look moins classique, avec la même icône que dans le HUD. Il fait partie des variantes à choisir. *(Maxence, 2026-11-17)*
- [ ] **Annonces** : « Combat ! » au départ, puis un bandeau KO et victoire à la fin, avec les textes dans `presentation.ts`. *(Maxence, 2026-11-17)*
- [ ] Le HUD est soigné et cohérent avec l'art bible (`design/art/art-bible.md`). Sa forme est choisie par Maxence parmi 2 ou 3 variantes prototypées, comme pour l'écran de gestion. *(Maxence, 2026-11-17 : « une HUD qui serait stylée et belle »)*
- [ ] Les couleurs, tailles et positions sont en données (`presentation.ts`) ; le HUD lit l'état du duel et ses événements, il ne change jamais le duel.

---

## Implementation Notes

- Portraits expressifs retirés par Maxence pendant `/ux-design hud` (2026-11-17).
- Spec UX : `design/ux/hud.md`.
- Démarche choisie par Maxence (2026-11-17) : `/ux-design` écrit d'abord la spec du HUD (dans `design/ux/`), puis on prototype 2 ou 3 variantes visuelles, Maxence en choisit une, et seulement ensuite `/dev-story`.
- Maxence, 2026-11-17 : l'énergie existe (stamina, stories 008 et 009) mais ne s'affiche pas ; le HUD (`src/ui/duel-hud.ts`) n'affiche que le nom et la barre de vie.

---

## Out of Scope

- Story 013 : les icônes de statut elles-mêmes.
- Story 006 : l'écran de gestion du personnage.

---

## Files

- src/ui/duel-hud.ts
- src/content/presentation.ts

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: une capture d'écran conservée du HUD en duel dans `production/qa/evidence/`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-004-competences-lisibles.md` (mana dépensé par les compétences)
- Unlocks: None
