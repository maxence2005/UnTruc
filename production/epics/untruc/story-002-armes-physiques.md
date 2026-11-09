# Story 002: Armes physiques en données

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 2

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 2, Hooks), scoped to this story:*

- [ ] Une arme est une entrée de données (forme, poids, point de prise, une ou deux mains, attaque) dans un registre ; ajouter une arme ne touche pas au moteur.
- [ ] L'arme est un corps physique accroché à la main au point de prise ; une arme à deux mains ajoute une seconde articulation, plus souple, plus loin sur le manche.
- [ ] Chaque arme a sa propre attaque décrite en données : pose d'armement, pose de frappe, impulsion, moulinet éventuel.
- [ ] Le poids de l'arme change le geste sans animation dédiée : une arme lourde entraîne visiblement les bras.
- [ ] Au moins deux armes de poids nettement différents (par exemple épée et marteau) sont jouables en duel.
- [ ] Les dégâts d'un coup d'arme viennent de la config de l'arme, jamais d'une valeur en dur dans la logique.

---

## Implementation Notes

- Le prototype a validé le principe (`prototypes/combat-animation-concept/src/ragdoll/weapons.ts`) ; réécrire, ne pas copier.
- Registre par identifiant (`docs/architecture/principes-code.md`, brouillon).

---

## Out of Scope

- Story 004 : compétences.
- Story 006 : choix de l'arme par le joueur.

---

## Files

- src/content/weapons/ (données des armes + README « comment ajouter une arme »)
- src/core/ (registre, types)
- src/physics/ (accroche à la main, articulations)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: minimal` tests are waived (advisory).*

**Story Type**: Integration
**Required evidence**: waived at qa.level minimal.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`
- Unlocks: `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-006-ecran-gestion-personnage.md`
