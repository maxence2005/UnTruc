# Story 007: Tournoi solo

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 6

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1 | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 6, Goal & fail state, Challenge, Core loop), scoped to this story:*

- [ ] Un tournoi enchaîne des duels contre des adversaires générés à partir d'une seed, jusqu'à la finale.
- [ ] La difficulté monte : le premier adversaire sérieux arrive au deuxième ou troisième duel.
- [ ] Gagner un duel donne une récompense utilisable dans l'écran de gestion avant le duel suivant.
- [ ] Le tournoi s'arrête sur la première défaite ; le combattant et son équipement sont conservés pour réessayer.
- [ ] Gagner la finale termine le tournoi en victoire, affichée au joueur.
- [ ] Le nombre de duels, la courbe de difficulté et les récompenses sont dans la config, jamais en dur.

---

## Implementation Notes

- Logique pure dans `src/core/` (sans Phaser), testable.
- Pas de sauvegarde serveur : comptes et base de données sont later (brief, Out of scope).

---

## Out of Scope

- Ligue en ligne, classement, comptes (later).

---

## Files

- src/core/tournament/
- src/content/ (config du tournoi)
- tests/unit/tournament.test.ts (optional at qa.level minimal)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: minimal` tests are waived (advisory).*

**Story Type**: Logic
**Required evidence**: waived at qa.level minimal; `tests/unit/tournament.test.ts` recommended.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`, `production/epics/untruc/story-006-ecran-gestion-personnage.md`
- Unlocks: None
