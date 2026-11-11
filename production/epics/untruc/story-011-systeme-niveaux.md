# Story 011: Système de niveaux

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 8

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1 | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 8, In your words, Core loop), scoped to this story:*

- [ ] Un duel donne de l'expérience au combattant ; assez d'expérience fait monter d'un niveau.
- [ ] À chaque niveau, le joueur choisit une récompense parmi plusieurs propositions : une compétence, une arme, une capacité ou une hausse de stat.
- [ ] Le nombre de propositions par niveau est limité, et il est dans la config.
- [ ] Les propositions sont tirées à partir d'une seed : même seed, mêmes propositions.
- [ ] Le choix s'applique au combattant : une stat monte (format de la story 008), une arme ou une compétence devient disponible sur l'écran de gestion.
- [ ] L'expérience par duel, les seuils de niveau et la table des récompenses sont en données, jamais en dur.
- [ ] La logique vit dans `src/core/`, sans Phaser.

---

## Implementation Notes

- Maxence, 2026-11-10 : « de la prise d'expérience et après des choix entre différentes compétences, armes, capacités ou stats qu'on pourra après remettre sur le personnage. Bien sûr, il aura un nombre limité. »
- À confirmer avec Maxence : « nombre limité » est lu ici comme le nombre de propositions par niveau. Autre lecture possible : un nombre limité d'armes et de compétences portées par le combattant.
- C'est la récompense entre les duels du tournoi (story 007) : le tournoi appelle ce système, il ne le contient pas.
- Pas de sauvegarde serveur ; comptes et base de données sont later.

---

## Out of Scope

- Story 007 : l'enchaînement des duels.
- Story 006 : l'écran de gestion lui-même (ici, seul l'écran de choix de récompense).
- Équilibrage fin des récompenses.

---

## Files

- src/core/progression/ (expérience, niveaux, tirage des propositions)
- src/content/ (seuils, table des récompenses)
- src/ui/ (écran de choix de récompense)
- tests/unit/progression.test.ts (optional at qa.level minimal)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: minimal` tests are waived (advisory).*

**Story Type**: Logic
**Required evidence**: waived at qa.level minimal; `tests/unit/progression.test.ts` recommended. L'écran de choix est capturé dans `production/qa/evidence/`.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-008-stats-combattant.md`, `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-006-ecran-gestion-personnage.md`, `production/epics/untruc/story-012-choix-personnage.md`
- Unlocks: `production/epics/untruc/story-007-tournoi-solo.md`
