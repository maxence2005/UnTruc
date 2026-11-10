# Story 009: Rythme et réactions de combat

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

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

- src/core/ (décision des réactions, enchaînements, endurance, événements)
- src/content/duel-config.ts (chances, coûts, durées)
- src/physics/ (poses et impulsions d'esquive, de parade, de contre)
- src/scenes/duel-scene.ts
- tests/unit/reactions.test.ts (optional at qa.level minimal)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: minimal` tests are waived (advisory).*

**Story Type**: Integration
**Required evidence**: waived at qa.level minimal; a playtest note is welcome. Le duel est lancé et observé avant de clore (capture dans `production/qa/evidence/`).

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`, `production/epics/untruc/story-008-stats-combattant.md`
- Unlocks: `production/epics/untruc/story-002-armes-physiques.md`
