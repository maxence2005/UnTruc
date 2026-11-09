# Story 006: Écran de gestion du personnage

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: UI
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 4

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1 | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 4, In your words, References), scoped to this story:*

- [ ] L'écran suit la variante choisie par Maxence : mise en page « Fiche » (armes à gauche, compétences à droite, combattant au centre, cosmétiques en bas), style « Vestiaire », compétences en pictogrammes sportifs (`prototypes/ecran-gestion-perso/`, 2026-11-09). Fond : image de vestiaire ou non, à décider.
- [ ] Le combattant est visible sur l'écran, avec son arme et ses cosmétiques.
- [ ] Chaque compétence est représentée par une petite icône reconnaissable ; son nom et son effet s'affichent au survol ou au toucher.
- [ ] Chaque arme est représentée de façon reconnaissable d'un coup d'œil.
- [ ] Le joueur choisit l'arme, les compétences et les cosmétiques avant un duel, à la souris ou au toucher.
- [ ] Le choix fait ici est celui utilisé par le duel suivant.
- [ ] L'écran lit l'état du combattant sans contenir de logique de combat.

---

## Implementation Notes

- Référence : La Brute, pour les armes et compétences lisibles en icônes.
- Stats du combattant : dans le MVP depuis le 2026-11-09 (story des stats) ; leur affichage sur l'écran est à décider.

---

## Out of Scope

- Story 007 : l'enchaînement des duels du tournoi.

---

## Files

- src/ui/ (écran de gestion)
- assets/ (icônes de compétences et d'armes)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: a retained screenshot of each screen touched, in `production/qa/evidence/`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-004-competences-lisibles.md`, the UI prototypes verdict (`prototypes/index.md`)
- Unlocks: `production/epics/untruc/story-007-tournoi-solo.md`
