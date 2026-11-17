# Story 004: Compétences lisibles

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Visual/Feel
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-17

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
- [ ] Chaque compétence a ses effets visuels, au niveau de ceux de la story 003 (étincelles, onde de choc, flash, traînée, ralenti selon sa force) : une compétence sans effet n'est pas finie. Ses effets s'abonnent aux événements de la compétence, la logique ne les appelle jamais. *(Maxence, 2026-11-16 : « à chaque fois qu'on mettra en place une compétence, il faudra faire des effets comme ça »)*
- [ ] Chaque compétence a une catégorie (`attack`, `magic`, `transformation`, liste extensible) et un coût en `points` pour l'ajouter au personnage : une compétence forte coûte plus cher. Ce sont seulement des données ici ; le budget de points viendra avec les stories 006 et 011. *(Maxence, 2026-11-17)*
- [ ] La boule de feu se lance à distance : un combattant ne la lance pas au corps à corps, seulement quand l'adversaire est au-delà d'une distance minimale fixée dans la config. *(Maxence, 2026-11-16)*

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

src/content/duel-config.ts
src/content/fighters.ts
src/content/presentation.ts
src/content/README.md
src/content/skills/charge.ts
src/content/skills/fireball.ts
src/content/skills/index.ts
src/content/skills/jump.ts
src/content/skills/README.md
src/core/ballistics.ts
src/core/duel-config.ts
src/core/duel-world.ts
src/core/duel.ts
src/core/events.ts
src/core/facing.ts
src/core/fighter-spec.ts
src/core/fighter-state.ts
src/core/fighter.ts
src/core/hit.ts
src/core/presentation-config.ts
src/core/projectile.ts
src/core/reactions.ts
src/core/skill-choice.ts
src/core/skill-run.ts
src/core/skill-spec.ts
src/core/skill-system.ts
src/debug/duel-debug-hook.ts
src/main.ts
src/physics/matter-duel-world.ts
src/render/banner-layout.ts
src/render/fx/fireball.ts
src/render/fx/impact-fx.ts
src/render/fx/sample-clock.ts
src/render/fx/trail.ts
src/render/skill-fx.ts
src/render/skill-labels.ts
src/render/skill-marker.ts
src/scenes/duel-scene.ts
tests/unit/duel/duel.test.ts
tests/unit/duel/fake-duel-world.ts
tests/unit/duel/plain-fighters.ts
tests/unit/duel/reaction-fixtures.ts
tests/unit/duel/skill-fixtures.ts
tests/unit/facing.test.ts
tests/unit/fx/banner-layout.test.ts
tests/unit/fx/fireball.test.ts
tests/unit/fx/skill-marker.test.ts
tests/unit/fx/trail.test.ts
tests/unit/reactions.test.ts
tests/unit/rhythm.test.ts
tests/unit/skill-outcomes.test.ts
tests/unit/skill-run.test.ts
tests/unit/skill-system.test.ts
tests/unit/skills.test.ts
tests/unit/stats.test.ts
tests/unit/weapons.test.ts

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/story-004-competences-lisibles-evidence.md`

**Status**: [x] Created: 7 screenshots in `production/qa/evidence/story-004-competences-lisibles/`, sign-off in `production/qa/evidence/story-004-competences-lisibles-evidence.md` (Maxence, 2026-11-17). Tests: `tests/unit/skills.test.ts`, `skill-system.test.ts`, `skill-outcomes.test.ts`, `skill-run.test.ts`, `tests/unit/fx/`.

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`, `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-003-effets-impact.md`, `production/epics/untruc/story-008-stats-combattant.md` (mana, puissance magique, intelligence)
- Unlocks: `production/epics/untruc/story-005-competence-transformation.md`, `production/epics/untruc/story-006-ecran-gestion-personnage.md`

---

## Completion Notes
**Completed**: 2026-11-17
**Criteria**: 9/9 passing (« Raté » vu dans le journal du duel et les tests, pas sur une capture)
**Deviations**: None. Points d'attention notés, non bloquants : charge rare (140 à 260 px) ; onde d'atterrissage chronométrée, pas au contact du sol ; `frictionAir` non validé au chargement ; commentaire de `jump.ts` (280 px annoncé, portée 260) ; `readPart` et `strokeEllipse` allouent à chaque image.
**Test Evidence**: `production/qa/evidence/story-004-competences-lisibles/` (7 captures) et `production/qa/evidence/story-004-competences-lisibles-evidence.md` ; 164 tests sur 164
**Reviewed by**: `/code-review` lancé par Maxence dans cette session (CHANGES REQUIRED puis APPROVED WITH SUGGESTIONS, suggestions appliquées), vérification moteur par `lead-programmer` ; gates de revue ignorés en mode lean

## Calls beyond the design
- Troisième compétence = Charge (`src/content/skills/charge.ts`) · kept 2026-11-17
- Points : saut 2, charge 2, boule de feu 3 (`src/content/skills/*.ts`) · kept 2026-11-17
- Chance de lancer une compétence : 0,6 + 0,02 × intelligence, au plus 0,9 (`src/content/duel-config.ts`) · kept 2026-11-17
- Le mana ne remonte pas pendant le duel · kept 2026-11-17
- Rouge : saut et charge ; Bleu : saut et boule de feu (`src/content/fighters.ts`) · kept 2026-11-17
- Un coup simple paré affiche aussi « Bloqué » (`src/core/duel.ts`) · kept 2026-11-17
- Pas d'icône, le nom seul ; nouveau look du bandeau reporté en story 014 · kept 2026-11-17
- Textes, couleurs et durées des raisons et des bandeaux (`src/content/presentation.ts`) · kept 2026-11-17
- Coup de boule de feu ne compte pas comme coup touché pour le lanceur (`src/core/hit.ts`, `duel.ts`) · kept 2026-11-17
- Un KO en pleine compétence émet `skillEnd` avant `ko`, dans le même tick (`src/core/skill-system.ts`) · kept 2026-11-17
- Pool de boules de feu plein : la nouvelle n'est pas dessinée (`src/render/fx/fireball.ts`) · kept 2026-11-17
- Saut aux données physiques invalides : retombe sur place (`src/core/ballistics.ts`) · kept 2026-11-17
- Règle de garde cassée : un coup non parable ou non esquivable fait ses dégâts pleins, casse la garde ou l'esquive, sans étourdissement (décision de Maxence) · kept 2026-11-17
- Saut visé pile sur la marque, ralenti à 30 % des PV et 0,7 s, bandeaux écartés de 12 px (décisions de Maxence) · kept 2026-11-17
