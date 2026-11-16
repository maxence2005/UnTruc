# Story 003: Effets d'impact

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Visual/Feel
> **Estimate**: S
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-16

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

- src/content/presentation.ts
- src/content/README.md
- src/core/presentation-config.ts
- src/main.ts
- src/render/fighter-view.ts
- src/render/fx/fireball.ts
- src/render/fx/flash.ts
- src/render/fx/hit-impact.ts
- src/render/fx/impact-fx.ts
- src/render/fx/shockwave.ts
- src/render/fx/sparks.ts
- src/render/fx/time-scale.ts
- src/scenes/duel-scene.ts
- tests/unit/fx/hit-impact.test.ts
- tests/unit/fx/time-scale.test.ts

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/story-003-effets-impact-evidence.md` (nom lu par `/story-done`)

**Status**: [x] Created — captures dans `production/qa/evidence/story-003-effets-impact/`, accord dans `production/qa/evidence/story-003-effets-impact-evidence.md`

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`
- Unlocks: `production/epics/untruc/story-004-competences-lisibles.md`

---

## Completion Notes
**Completed**: 2026-11-16
**Criteria**: 6/6 passing (none deferred)
**Deviations**: Hors de la liste `## Files` d'origine (`src/render/fx/`, `src/core/`) : la scène, `main.ts`, la vue des combattants, la config de présentation et le README de `content/` sont touchés pour brancher les effets. Désaturation du décor non faite : un voile sombre la remplace pendant le ralenti.
**Test Evidence**: `tests/unit/fx/hit-impact.test.ts`, `tests/unit/fx/time-scale.test.ts` ; captures `production/qa/evidence/story-003-effets-impact/01` à `07` ; accord de Maxence dans `production/qa/evidence/story-003-effets-impact-evidence.md`
**Reviewed by**: `/code-review` run in this session on the final state (APPROVED WITH SUGGESTIONS, suggestions 1 à 4 applied) ; engine review by lead-programmer

## Calls beyond the design
- Seuils : ralenti si un coup enlève 15 % des PV de la victime, onde de choc à 30 % ; les poings ne déclenchent ni l'un ni l'autre, les armes déclenchent le ralenti (`src/content/presentation.ts`, `fx.thresholds`) · kept 2026-11-16
- Ralenti 0,18 pendant 900 ms, retour en 250 ms ; au KO : 1 400 ms avec une onde de choc de 150 px et un flash (`fx.slowmo`, `src/render/fx/impact-fx.ts`) · kept 2026-11-16
- Coup paré : petites étincelles seulement, sans ralenti, onde ni flash (`src/render/fx/impact-fx.ts`) · kept 2026-11-16
- Effets ralentis avec le monde ; voile sombre derrière les combattants au lieu de désaturer le décor (`src/render/fx/impact-fx.ts`) · kept 2026-11-16
- Effets dessinés devant les corps et derrière les armes (`FX_DEPTH`, `src/render/fighter-view.ts`) · kept 2026-11-16
- Étincelles : 10, ou 18 sur un gros coup, jaune à orange ; onde de 110 px ; flash blanc de 140 ms (`fx.sparks`, `fx.shockwave`, `fx.flash`) · kept 2026-11-16
- Boule de feu : 450 px/s, rayon 22, déclenchée à la main par la touche F ou `?fx=fireball`, sans dégâts (`fx.fireball`, `src/main.ts`, `src/scenes/duel-scene.ts`) · kept 2026-11-16
- Point d'impact décalé de 35 % vers la victime (`fx.impactPullToVictim`) · kept 2026-11-16
