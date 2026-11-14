# Story 010: Look des combattants de la piste 5

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Visual/Feel
> **Estimate**: S
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-14

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

- src/content/face-kit.ts
- src/content/fighters.ts
- src/content/presentation.ts
- src/content/README.md
- src/core/fighter-spec.ts
- src/core/presentation-config.ts
- src/render/face-drawing.ts
- src/render/fighter-view.ts
- src/scenes/duel-scene.ts

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/`, plus Maxence's sign-off

**Status**: [x] Created — captures dans `production/qa/evidence/story-010-look-combattants-piste-5/`, accord dans `production/qa/evidence/story-010-look-combattants-piste-5-evidence.md`

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-11-14
**Criteria**: 6/6 passing (none deferred)
**Deviations**: None
**Test Evidence**: captures `production/qa/evidence/story-010-look-combattants-piste-5/01` à `03` ; accord de Maxence dans `production/qa/evidence/story-010-look-combattants-piste-5-evidence.md`
**Reviewed by**: `/code-review` run in this session (APPROVED WITH SUGGESTIONS, suggestions 1 à 4 applied, 5 logged as TD-004) ; engine review by lead-programmer

## Calls beyond the design
- Rouge : yeux fâchés, bouche à dents, pics blonds, sans barbe ; Bleu : yeux ronds, sourire, coupe au bol rousse, barbe (`src/content/fighters.ts`) · kept 2026-11-14
- Contour de 3 px, couleur encre de l'art bible `0x22302a` (`src/content/fighters.ts`) · kept 2026-11-14
- Yeux plus gros et plus bas que dans le prototype, joue rose à 35 % d'opacité (`src/content/face-kit.ts`) · kept 2026-11-14
- Six coiffures au catalogue : chauve, pics, bol, crête, longs, chignon, dont quatre pas encore vues à l'écran (`src/content/face-kit.ts`) · kept 2026-11-14
