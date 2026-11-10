# Story 001: Moteur de duel ragdoll

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-10

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
- [ ] Pas de tour par tour : chaque combattant a son propre délai avant d'agir et attaque dès qu'il est écoulé et qu'il est à portée, sans attendre l'autre. Les deux peuvent attaquer en même temps, et un même combattant peut frapper plusieurs fois de suite, jusqu'au KO. *(corrigé le 2026-11-10 : le « tour par tour » venait du README, pas de Maxence ; modèle de la piste 5)*
- [ ] Un coup qui touche retire des PV ; un combattant à 0 PV est KO et le duel s'arrête avec un vainqueur affiché.
- [ ] La simulation avance à pas fixe, indépendamment du framerate.
- [ ] Même seed et mêmes combattants donnent le même déroulé de duel (aucun `Math.random()` dans la logique ou la physique).
- [ ] Les règles du combat (délais d'action, PV, dégâts, état du combattant) vivent hors des scènes Phaser ; le rendu lit l'état sans le modifier.
- [ ] Le code est réécrit dans `src/` : rien n'est importé de `prototypes/`.

---

## Implementation Notes

- Reprise du 2026-11-10 : remplacer la boucle « tour par tour » de `src/core/duel.ts` par un délai d'action par combattant (délai de base et part aléatoire dans la config, tirée de la seed). Référence de comportement : `think()` dans `prototypes/combat-animation-concept/src/ragdoll/arena.ts`. Ragdolls, PV, KO et seed ne changent pas.
- Valeurs décidées avec Maxence le 2026-11-10 :
  - 100 PV de base : gardé (montera avec le système de niveaux) ;
  - dégâts : plus de tirage au hasard. Dégât de base fixe par attaque, multiplié par la vitesse réelle de l'impact dans la physique, entre deux bornes ; base et bornes dans la config ;
  - étourdissement : gardé mais court, 250 à 300 ms au départ (700 ms était réglé pour des tours) ; un coup reçu interrompt l'action en cours ;
  - message de fin après 2,5 s : gardé.
  - double KO (les deux à 0 PV sur le même pas) : égalité, pas de vainqueur ; message « Égalité ! ». Ce qu'une égalité vaut dans le tournoi est à décider (story 007).
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

- index.html
- package.json (scripts only)
- prototypes/combat-animation-concept/README.md (one line: npm run proto:combat)
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
- src/core/presentation-config.ts
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
- tsconfig.json
- vite.config.ts

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
- Unlocks: `production/epics/untruc/story-008-stats-combattant.md`, `production/epics/untruc/story-009-rythme-reactions-combat.md`, `production/epics/untruc/story-010-look-combattants-piste-5.md`, `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-003-effets-impact.md`, `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-007-tournoi-solo.md`

## Completion Notes
**Completed**: 2026-11-10
**Criteria**: 7/7 passing (aucun reporté)
**Deviations**: aucune ; `src/core/presentation-config.ts` ajouté à la liste des fichiers. Suggestions de la relecture consignées en dette technique (TD-001 à TD-003).
**Test Evidence**: waived at qa.level minimal ; captures conservées dans `production/qa/evidence/story-001-moteur-duel-ragdoll/` (01-duel-en-cours.png, 03-ko-et-vainqueur.png), tampon `stamp.txt`
**Reviewed by**: `/code-review` du 2026-11-10, moteur relu par un agent `lead-programmer` indépendant : approuvé avec suggestions (deux défauts corrigés : vitesse d'impact relevée après la collision, empreinte de debug trop faible). Aucune relecture formelle des gates (mode solo).
**Run result**: OBSERVED — duel de la seed 1 en temps réel : KO de Bleu, « Rouge remporte le duel ! », tick 1032, même empreinte `ff947b54` sur deux lancements.

## Calls beyond the design
- Délai entre deux coups : 400 ms plus 0 à 300 ms tirés de la seed ; premier coup à 600 ms, 900 ms pour le second combattant (`src/content/duel-config.ts`) · kept 2026-11-10
- Dégât de base 11 par coup, facteur de vitesse d'impact de référence 8, borné entre 0,5 et 1,5 (`src/content/duel-config.ts`, `src/content/fighters.ts`) · kept 2026-11-10
- Étourdissement de 280 ms, relancé à chaque coup reçu (`src/content/fighters.ts`) · kept 2026-11-10
- Plus de délai maximum d'approche ; un combattant n'attaque qu'à portée (`src/core/duel.ts`) · kept 2026-11-10
- Double KO : égalité, message « Égalité ! » (`src/core/duel.ts`, `src/content/presentation.ts`) · kept 2026-11-10
- Combattants Rouge et Bleu, fond sombre, une seule attaque (coup de poing) commune aux deux (`src/content/fighters.ts`, `src/content/presentation.ts`) · kept 2026-11-10
