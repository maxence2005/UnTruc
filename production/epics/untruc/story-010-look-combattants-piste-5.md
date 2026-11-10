# Story 010: Look des combattants de la piste 5

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Visual/Feel
> **Estimate**: S
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 7

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1 | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 7, Look and references, In your words « les bonhommes, ils ont un peu changé, notamment sa tête »), scoped to this story:*

- [ ] La tête reprend celle de la piste 5 du prototype : œil blanc avec pupille, sourcil, bouche, nez, oreille, joue.
- [ ] Les variantes d'yeux (rond, fâché, fin) et de bouche (grr, sourire, o, dents) sont des données du combattant, pas du code de rendu.
- [ ] Cheveux et barbe du prototype sont disponibles comme données du combattant.
- [ ] Tête et corps ont un contour épais ; le combattant se lit en silhouette (art bible, section 3).
- [ ] Le visage suit le sens dans lequel le combattant regarde et reste lisible quand la tête tourne avec le ragdoll.
- [ ] Le rendu lit l'état du combattant sans le modifier ; rien n'est importé de `prototypes/`.

---

## Implementation Notes

- Petite story (Maxence, 2026-11-10) : ne pas casser le code actuel. Étendre `src/render/fighter-view.ts` et les données d'apparence ; ne toucher ni à la physique ni à la logique du duel.
- Référence visuelle : `prototypes/combat-animation-concept/src/shared/character.ts` (dessin de la tête) et les vidéos de `prototypes/combat-animation-concept/evidence/`. Réécrire, ne pas copier.
- Règles de forme et palette : `design/art/art-bible.md`.
- Aucun emoji : chaque trait est dessiné.

---

## Out of Scope

- Story 003 : effets d'impact.
- Story 006 : choix des cosmétiques par le joueur.
- Expressions qui changent pendant le duel (touché, KO) : non demandées.

---

## Files

- src/render/fighter-view.ts
- src/render/ (dessin de la tête)
- src/core/fighter-spec.ts (apparence en données)
- src/content/fighters.ts, src/content/presentation.ts

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/`, plus Maxence's sign-off

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`
- Unlocks: None
