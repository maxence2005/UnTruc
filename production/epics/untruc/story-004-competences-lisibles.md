# Story 004: Compétences lisibles

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Visual/Feel
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 3

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 3, Question, Avoid, Kill condition), scoped to this story:*

- [ ] Une compétence est une donnée : une timeline de phases (pose cible, impulsions, fenêtre de coup, effets), pas une fonction écrite à la main.
- [ ] Au lancement d'une compétence, son nom ou son icône s'affiche, pour qu'on sache laquelle vient de partir.
- [ ] L'attaque sautée vise la cible : elle retombe sur l'adversaire, ou rate pour une raison visible.
- [ ] Quand un coup ne fait pas de dégâts, la raison s'affiche (bloqué, esquivé, raté).
- [ ] Au moins trois compétences sont jouables, dont le saut et la boule de feu.
- [ ] Un spectateur qui ne connaît pas le code comprend, sur un duel, pourquoi chaque coup a touché ou non (vérifié par Maxence à la sign-off).

---

## Implementation Notes

- C'est le point le moins prouvé du prototype : le saut y ratait sa cible sans raison visible (`prototypes/combat-animation-concept/REPORT.md`).
- Kill condition du brief : si après deux passes les compétences restent incompréhensibles sans explication.

---

## Out of Scope

- Story 005 : la compétence Transformation (loup-garou).
- Story 006 : le choix des compétences par le joueur.

---

## Files

- src/content/skills/ (données + README « comment ajouter une compétence »)
- src/core/ (timelines de compétences)
- src/render/ (retour visuel : nom ou icône, raison du coup raté)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/untruc-competences-lisibles-evidence.md`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`, `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-003-effets-impact.md`
- Unlocks: `production/epics/untruc/story-005-competence-transformation.md`, `production/epics/untruc/story-006-ecran-gestion-personnage.md`
