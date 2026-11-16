# Story 002: Armes physiques en données

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-16

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
- [ ] L'arme est un corps physique accroché à la main au point de prise ; à deux mains, la seconde main se pose plus loin sur le manche et le suit, sans y être attachée. *(Maxence, 2026-11-16 : un second lien physique arrachait l'arme de la main avant)*
- [ ] Chaque arme a sa propre attaque décrite en données : pose d'armement, pose de frappe, impulsion, moulinet éventuel.
- [ ] Le poids de l'arme change le geste sans animation dédiée : une arme lourde entraîne visiblement les bras.
- [ ] Au moins deux armes de poids nettement différents (par exemple épée et marteau) sont jouables en duel.
- [ ] Les dégâts d'un coup d'arme viennent de la config de l'arme, jamais d'une valeur en dur dans la logique.
- [ ] Chaque arme peut déclarer sa garde de parade (posture et angle de l'arme) ; une arme sans garde ne permet pas de parer, son porteur peut seulement esquiver (le marteau, trop lourd). La parade reste décidée par la logique. *(Maxence, 2026-11-16)*

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

- package.json
- src/content/duel-config.ts
- src/content/README.md
- src/content/weapons/colors.ts
- src/content/weapons/hammer.ts
- src/content/weapons/index.ts
- src/content/weapons/README.md
- src/content/weapons/sword.ts
- src/core/duel-config.ts
- src/core/duel-world.ts
- src/core/duel.ts
- src/core/equipment.ts
- src/core/events.ts
- src/core/facing.ts
- src/core/fighter-spec.ts
- src/core/fighter.ts
- src/core/pose.ts
- src/core/reactions.ts
- src/core/registry.ts
- src/core/stun.ts
- src/core/weapon-spec.ts
- src/debug/duel-debug-hook.ts
- src/debug/weapon-probe.ts
- src/main.ts
- src/physics/matter-duel-world.ts
- src/physics/muscles.ts
- src/physics/ragdoll.ts
- src/physics/reaction.ts
- src/physics/weapon-body.ts
- src/render/fighter-view.ts
- src/scenes/duel-scene.ts
- tests/unit/duel/fake-duel-world.ts
- tests/unit/facing.test.ts
- tests/unit/reach.test.ts
- tests/unit/reaction.test.ts
- tests/unit/weapons.test.ts
- tools/weapon-check.mjs

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: standard` (depuis le 2026-11-11), un test est requis pour une story Integration.*

**Story Type**: Integration
**Required evidence**: `tests/unit/weapons.test.ts`, `tests/unit/reach.test.ts`, `tests/unit/facing.test.ts`, `tests/unit/reaction.test.ts` ; le duel armé est joué et observé (`npm run check:weapons`, captures dans `production/qa/evidence/story-002-armes-physiques/`).

**Status**: [x] Created

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`, `production/epics/untruc/story-008-stats-combattant.md`, `production/epics/untruc/story-009-rythme-reactions-combat.md`
- Unlocks: `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-006-ecran-gestion-personnage.md`

---

## Completion Notes
**Completed**: 2026-11-16
**Criteria**: 7/7 passing (none deferred)
**Deviations**: Hors périmètre de la liste `## Files` d'origine (trois dossiers), 37 fichiers touchés : rendu, scène, regard, sonde de debug, `tools/weapon-check.mjs`, `package.json`, `src/main.ts` ; chaque ajout répond à une demande de la session. Critère 2 réécrit à la demande de Maxence (2026-11-16) : la seconde main suit le manche au lieu d'y être attachée.
**Test Evidence**: `tests/unit/weapons.test.ts`, `reach.test.ts`, `facing.test.ts`, `reaction.test.ts` ; captures `production/qa/evidence/story-002-armes-physiques/01` à `06` et `duel-arme.md`
**Reviewed by**: `/code-review` run in this session (APPROVED WITH SUGGESTIONS, suggestions 1 à 4 applied) on the state before the second hand following the shaft, the per-weapon guard, the debug probe, `?armes=` and `check:weapons` ; these later additions were not re-reviewed by a second agent ; engine review by lead-programmer

## Calls beyond the design
- Épée (79 de long, poids 0,9, 14 dégâts, une main, armement 230 ms, frappe 210 ms) et marteau (74 de long, poids 6,4, 24 dégâts, deux mains, armement 380 ms, frappe 360 ms) (`src/content/weapons/sword.ts`, `hammer.ts`) · kept 2026-11-16
- Garde de l'épée : bras levé, lame relevée ; le marteau n'a pas de garde, donc ne pare pas, il esquive (`sword.ts`, `hammer.ts`) · kept 2026-11-16
- Avec une arme, seule l'arme inflige des dégâts ; les armes ne se heurtent jamais entre elles ; les combattants par défaut restent aux poings (`src/physics/weapon-body.ts`, `src/content/fighters.ts`) · kept 2026-11-16
- Regard : les combattants se retournent vers l'adversaire, marge 20 px, délai 150 ms, pas de demi-tour pendant une attaque (`src/content/duel-config.ts`, `src/core/facing.ts`) · kept 2026-11-16
- Plafond de vitesse et de rotation de l'arme (épée 16, marteau 14) ; le poignet rend sa poussée au porteur (`src/physics/weapon-body.ts`, `src/physics/reaction.ts`) · kept 2026-11-16
- Armes dessinées devant les deux combattants ; couleurs jaune arme et gris acier (`src/render/fighter-view.ts`, `src/content/weapons/colors.ts`) · kept 2026-11-16
- Seconde main qui suit le manche, sans lien physique (`src/physics/muscles.ts`, `src/physics/weapon-body.ts`) · kept 2026-11-16
- Outils de debug : `?armes=sword,hammer` dans l'adresse (`src/main.ts`) et `npm run check:weapons`, seuil 3 px (`tools/weapon-check.mjs`) · kept 2026-11-16
