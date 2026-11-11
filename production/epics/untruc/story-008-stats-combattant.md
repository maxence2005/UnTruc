# Story 008: Stats du combattant

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Logic
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-11

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 1

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 1, In your words), scoped to this story. Liste des stats donnée par Maxence le 2026-11-10 :*

- [ ] Chaque combattant a neuf stats en données : PV, puissance physique, puissance magique, endurance (énergie), mana, agilité, vitesse, poids, intelligence.
- [ ] Les valeurs des stats vivent dans `src/content/`, jamais en dur dans la logique ; ajouter ou régler un combattant ne touche pas au moteur.
- [ ] PV : le combattant encaisse jusqu'à 0 PV, puis KO (remplace la valeur fixe de la story 001).
- [ ] Puissance physique : les dégâts d'un coup en dépendent ; la formule et ses coefficients sont dans la config.
- [ ] Poids : il change la masse du corps dans la physique ; un combattant lourd est visiblement moins déplacé par un coup qu'un léger.
- [ ] Poids et étourdissement : la durée de l'étourdissement dépend de la force du coup rapportée au poids de celui qui le reçoit ; un lourd est moins longtemps sonné qu'un léger par le même coup. Bornes et coefficients dans la config.
- [ ] Endurance et mana sont des réserves qui se dépensent et se lisent dans l'état du combattant ; l'endurance est consommée par les actions (story 009), le mana par les compétences magiques (story 004).
- [ ] Agilité, vitesse, puissance magique et intelligence existent dans les données et l'état, prêtes à être lues par les stories 009 et 004.
- [ ] Deux combattants identiques sauf une stat branchée ici (PV, puissance physique ou poids) donnent un duel différent, et le duel reste rejouable à seed fixe.
- [ ] Les formules vivent dans `src/core/`, sans Phaser.

---

## Implementation Notes

- Effets prévus hors de cette story, pour dimensionner les données :
  - agilité : esquive, parade, contre-attaque, enchaînements (story 009) ;
  - vitesse : délai plus court entre deux actions (story 009 ; remise dans la liste par Maxence le 2026-11-10) ;
  - endurance : chaque action coûte de l'énergie ; à sec, plus d'enchaînement ni d'esquive (story 009) ;
  - mana : coût des compétences magiques ; puissance magique : leurs dégâts (story 004) ;
  - intelligence : meilleure utilisation des compétences. Exemple de Maxence : un point d'intelligence permet de jeter son arme quand l'adversaire passe sous 50 % de PV (story 004).
- Système de niveaux (expérience, puis choix entre compétences, armes, capacités ou stats, en nombre limité) : prévu, hors de cette story. Les stats doivent pouvoir être augmentées plus tard sans changer leur format.
- Affichage des stats sur l'écran de gestion : à décider (story 006).

---

## Out of Scope

- Story 009 : esquive, parade, contre-attaque, enchaînements, dépense d'endurance.
- Story 004 : compétences, dépense de mana, effets de l'intelligence.
- Système de niveaux et d'expérience.

---

## Files

- src/content/duel-config.ts
- src/content/fighters.ts
- src/content/README.md
- src/core/duel-config.ts
- src/core/duel.ts
- src/core/fighter-spec.ts
- src/core/fighter.ts
- src/core/stats.ts
- src/debug/duel-debug-hook.ts
- src/physics/matter-duel-world.ts
- src/physics/ragdoll.ts
- src/ui/duel-hud.ts
- tests/unit/duel/duel.test.ts
- tests/unit/stats.test.ts

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: standard` (depuis le 2026-11-11) un test unitaire est requis pour une story Logic.*

**Story Type**: Logic
**Required evidence**: `tests/unit/stats.test.ts` (Vitest, `npm test`).

**Status**: [x] Created — `tests/unit/stats.test.ts`

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`
- Unlocks: `production/epics/untruc/story-009-rythme-reactions-combat.md`, `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-004-competences-lisibles.md`

---

## Completion Notes
**Completed**: 2026-11-11
**Criteria**: 10/10 passing (none deferred)
**Deviations**: None
**Test Evidence**: `tests/unit/stats.test.ts` (15 tests), `tests/unit/duel/duel.test.ts` (6 tests) ; captures dans `production/qa/evidence/story-008-stats-combattant/`
**Reviewed by**: `/code-review` run in this session (APPROVED WITH SUGGESTIONS, suggestions applied) ; engine review by lead-programmer

## Calls beyond the design
- Stats de départ provisoires : 100 PV, puissance physique 10, puissance magique 10, endurance 100, mana 50, agilité 10, vitesse 10, poids 70, intelligence 0 (`src/content/fighters.ts`) ; les vraies valeurs viendront du choix du personnage (story 012) · kept 2026-11-11
- Références 10 (puissance physique) et 70 (poids) qui redonnent les dégâts et la masse d'avant (`src/content/duel-config.ts`) · kept 2026-11-11
- Masse du corps bornée entre 0,5 et 3 fois la normale (`src/content/duel-config.ts`) · kept 2026-11-11
- Étourdissement de 100 à 600 ms, selon la force du coup et le poids de la victime, sans hasard (`src/core/stats.ts`, `src/content/duel-config.ts`) · kept 2026-11-11
