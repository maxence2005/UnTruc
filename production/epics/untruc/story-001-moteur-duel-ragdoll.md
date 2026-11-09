# Story 001: Moteur de duel ragdoll

> **Epic**: UnTruc (MVP)
> **Status**: In Progress
> **Layer**: N/A (minimal)
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-09

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

*From `design/game-brief.md` (Features 1, Goal & fail state), scoped to this story:*

- [ ] Deux combattants ragdoll (formes simples, muscles PD) s'affrontent dans une arène 2D vue de côté, sans aucune entrée du joueur pendant le duel.
- [ ] Le duel avance au tour par tour : un combattant agit, puis l'autre, jusqu'au KO.
- [ ] Un coup qui touche retire des PV ; un combattant à 0 PV est KO et le duel s'arrête avec un vainqueur affiché.
- [ ] La simulation avance à pas fixe, indépendamment du framerate.
- [ ] Même seed et mêmes combattants donnent le même déroulé de duel (aucun `Math.random()` dans la logique ou la physique).
- [ ] Les règles du combat (tours, PV, dégâts, état du combattant) vivent hors des scènes Phaser ; le rendu lit l'état sans le modifier.
- [ ] Le code est réécrit dans `src/` : rien n'est importé de `prototypes/`.

---

## Implementation Notes

- Repartir des enseignements du prototype (`prototypes/combat-animation-concept/REPORT.md`), pas de son code.
- Couches proposées par `docs/architecture/principes-code.md` (brouillon, modifiable) : `core/` sans Phaser, `physics/` adaptateur Matter.js, `render/` Phaser.
- Lire `docs/engine-reference/web/` avant tout appel Phaser 4 ou config Vite 8.

---

## Out of Scope

- Story 002 : les armes physiques (ici, coups à mains nues suffisent).
- Story 003 : étincelles, ralentis, onde de choc.
- Story 004 : compétences.

---

## Files

- src/content/duel-config.ts
- src/content/fighters.ts
- src/content/presentation.ts
- src/content/README.md
- src/core/duel-config.ts
- src/core/duel-world.ts
- src/core/duel.ts
- src/core/events.ts
- src/core/fighter-spec.ts
- src/core/fighter-state.ts
- src/core/fighter.ts
- src/core/pose.ts
- src/core/rng.ts
- src/core/state-hash.ts
- src/debug/duel-debug-hook.ts
- src/main.ts
- src/physics/matter-duel-world.ts
- src/physics/muscles.ts
- src/physics/ragdoll.ts
- src/render/arena-view.ts
- src/render/fighter-view.ts
- src/scenes/duel-scene.ts
- src/ui/duel-hud.ts
- index.html
- vite.config.ts
- tsconfig.json
- package.json (scripts only)
- prototypes/combat-animation-concept/README.md (one line: npm run proto:combat)

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: minimal` tests are waived (advisory).*

**Story Type**: Integration
**Required evidence**: waived at qa.level minimal; a playtest note is welcome.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-003-effets-impact.md`, `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-007-tournoi-solo.md`
