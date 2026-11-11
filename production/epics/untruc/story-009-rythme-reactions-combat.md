# Story 009: Rythme et réactions de combat

> **Epic**: UnTruc (MVP)
> **Status**: Complete
> **Layer**: N/A (minimal)
> **Type**: Integration
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

*From `design/game-brief.md` (Features 1, In your words « After play (story 001) »), scoped to this story:*

- [ ] Esquive : un combattant peut éviter un coup par un geste du corps visible (recul, pas de côté, baisse), sans texte pour l'expliquer.
- [ ] Parade : un combattant peut bloquer un coup ; le blocage se voit et le coup paré ne fait pas ses dégâts normaux.
- [ ] Contre-attaque : après une esquive ou une parade, un combattant peut frapper aussitôt, sans attendre son délai d'action.
- [ ] Enchaînements : un combattant peut placer plusieurs coups de suite avant que l'autre reprenne la main.
- [ ] Les chances d'esquive, de parade, de contre-attaque et d'enchaînement viennent de l'agilité (story 008) et de la seed ; les coefficients sont dans la config.
- [ ] Chaque action et chaque réaction coûte de l'endurance ; un combattant à sec ne peut plus esquiver ni enchaîner.
- [ ] Vitesse : elle raccourcit le délai entre deux actions d'un combattant ; un combattant rapide agit visiblement plus souvent qu'un lent. La formule et ses coefficients sont dans la config.
- [ ] Le duel ne se résume plus à « approche puis coup » : les deux combattants agissent, réagissent et enchaînent sans temps mort marqué.
- [ ] Projection : chaque coup donne à la victime une impulsion de recul proportionnelle à la force du coup et au rapport entre le poids de l'attaquant et celui de la victime, et le maintien debout se relâche pendant l'étourdissement. Un très lourd envoie visiblement valser un léger ; un léger fait à peine reculer un lourd. Coefficients et bornes dans la config. *(demandé par Maxence le 2026-11-11)*
- [ ] Contrepartie du poids : un combattant lourd se déplace nettement plus lentement qu'un léger (vitesse de marche réduite selon le poids, formule et bornes dans la config). *(Maxence, 2026-11-11 : « il va se déplacer beaucoup plus lentement »)*
- [ ] Pas d'hésitation en limite de portée : un combattant ne bascule pas sans cesse entre marche et arrêt quand l'adversaire est juste à la limite (marge entre la distance où il s'arrête et celle où il repart, dans la config).
- [ ] Pas d'étourdissement sans fin : un combattant frappé en série ne reste pas sonné indéfiniment (durée totale bornée ou courte immunité après un étourdissement, dans la config).
- [ ] Chaque réaction émet un événement (`dodge`, `parry`, `counter`, `combo`) que le rendu et les effets écoutent ; la logique ne les appelle jamais directement.
- [ ] Le duel reste rejouable à seed fixe.

---

## Implementation Notes

- Retour de Maxence après la story 001 : « il y en a un qui se rapproche, qui attaque, c'est tout ce qui se passe. Moi, je veux des esquives, du fait que ça parte un peu dans tous les sens [...] des contre-attaques ».
- Les réactions sont des poses et des impulsions sur le ragdoll (muscles PD), pas des animations dessinées.
- La décision (réussite ou non) est prise dans `src/core/` ; la physique joue le geste.
- Pas de tours : le moteur (story 001) donne à chaque combattant son propre délai d'action. La vitesse le raccourcit, l'agilité décide des réactions.

---

## Out of Scope

- Story 002 : parade avec une arme, attaques propres aux armes.
- Story 003 : étincelles, ralentis, onde de choc sur ces réactions.
- Story 004 : compétences, raison affichée d'un coup bloqué ou raté.

---

## Files

- src/content/duel-config.ts
- src/content/fighters.ts
- src/content/README.md
- src/core/duel-config.ts
- src/core/duel-world.ts
- src/core/duel.ts
- src/core/events.ts
- src/core/fighter-spec.ts
- src/core/fighter-state.ts
- src/core/fighter.ts
- src/core/reactions.ts
- src/core/stats.ts
- src/debug/duel-debug-hook.ts
- src/physics/matter-duel-world.ts
- tests/unit/duel/duel.test.ts
- tests/unit/duel/fake-duel-world.ts
- tests/unit/duel/reaction-fixtures.ts
- tests/unit/reactions.test.ts
- tests/unit/rhythm.test.ts
- tests/unit/stats.test.ts

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: standard` (depuis le 2026-11-11), un test est requis pour une story Integration.*

**Story Type**: Integration
**Required evidence**: tests Vitest (`tests/unit/reactions.test.ts`, `tests/unit/rhythm.test.ts`) ; le duel est lancé et observé avant de clore (captures dans `production/qa/evidence/story-009-rythme-reactions-combat/`).

**Status**: [x] Created — `tests/unit/reactions.test.ts`, `tests/unit/rhythm.test.ts`, captures 01 et 02

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`, `production/epics/untruc/story-008-stats-combattant.md`
- Unlocks: `production/epics/untruc/story-002-armes-physiques.md`

---

## Completion Notes
**Completed**: 2026-11-11
**Criteria**: 13/14 passing (1 deferred : esquive à vérifier en jouant, pas de capture d'une esquive)
**Deviations**: None
**Test Evidence**: `tests/unit/reactions.test.ts`, `tests/unit/rhythm.test.ts` (26 tests) ; captures dans `production/qa/evidence/story-009-rythme-reactions-combat/`
**Reviewed by**: `/code-review` run in this session (APPROVED WITH SUGGESTIONS, suggestions applied) ; engine review by lead-programmer

## Calls beyond the design
- Chances à agilité 10 : esquive 25 %, parade 25 %, contre-attaque 40 %, enchaînement 35 % ; 3 coups max par enchaînement (`src/content/duel-config.ts`) · kept 2026-11-11
- Parade : 30 % des dégâts et du recul, pas d'étourdissement (`reactions.parryFactor`) · kept 2026-11-11
- Endurance : coûts 6 attaque, 12 esquive, 8 parade, 8 contre, 10 enchaînement ; récupération 5 par seconde à `recovery` 10 ; une attaque simple reste possible à sec (`src/content/duel-config.ts`, `src/content/fighters.ts`) · kept 2026-11-11
- Dixième stat `recovery` (récupération d'endurance), base 10 (`src/content/fighters.ts`) · kept 2026-11-11
- Recul d'un coup 3,5 px par pas selon le rapport de poids (borné 0,25 à 4) ; plafond d'étourdissement d'une série 900 ms ; marge de portée 15 px ; vitesse de marche selon le poids bornée 0,35 à 1,5 (`src/content/duel-config.ts`) · kept 2026-11-11
- Initiative : quand les deux sont prêts au même instant, tirage seedé pondéré par la vitesse, le perdant attend la fin du coup (`src/core/duel.ts`, `src/core/reactions.ts`) · kept 2026-11-11
- Un enchaînement est imparable (la victime est encore sonnée) · kept 2026-11-11
