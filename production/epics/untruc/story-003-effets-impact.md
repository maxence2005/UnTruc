# Story 003: Effets d'impact

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

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1 | **Risk**: HIGH (Phaser 4 replaces FX and pipelines with filters, `docs/engine-reference/web/phaser.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 7, Look and references), scoped to this story:*

- [ ] Un coup qui touche produit des étincelles au point d'impact.
- [ ] Un gros coup déclenche un ralenti court ; sa vitesse et sa durée sont dans la config.
- [ ] Un coup très fort produit une onde de choc visible.
- [ ] La boule de feu existe comme effet (projectile lumineux avec traînée), prête à être utilisée par une compétence.
- [ ] Le combattant touché flashe brièvement.
- [ ] Les effets s'abonnent aux événements du combat (`hit`, `ko`...) ; la logique de combat ne les appelle jamais directement.

---

## Implementation Notes

- Valeurs de départ du prototype : ralenti 0,18 pendant 900 ms (`REPORT.md`).
- Le style reste en formes simples : pas d'emoji, chaque effet est dessiné.

---

## Out of Scope

- Story 004 : la compétence qui lance la boule de feu.

---

## Files

- src/render/fx/
- src/core/ (bus d'événements typé, si absent)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/untruc-effets-impact-evidence.md`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`
- Unlocks: `production/epics/untruc/story-004-competences-lisibles.md`
