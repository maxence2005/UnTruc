# Story 005: Compétence Transformation (loup-garou)

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

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

---

## Implementation Notes

- Le prototype a montré griffes et queue physique (`prototypes/combat-animation-concept/`) ; dans le jeu, c'est une compétence de transformation, pas un archétype (correction de Maxence, 2026-11-09).
- Durée et éventuel retour à la forme normale : non décidés ; à trancher au début de la story.

---

## Out of Scope

- Story 006 : choisir la compétence dans l'écran de gestion.

---

## Files

- src/content/skills/ (transformation)
- src/content/cosmetics/ (oreilles, museau, griffes, queue)
- src/render/

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/untruc-transformation-evidence.md`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-004-competences-lisibles.md`
- Unlocks: None
