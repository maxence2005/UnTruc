# Story 008: Stats du combattant

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Logic
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

- src/core/ (types des stats, formules, état du combattant)
- src/content/fighters.ts (valeurs des stats)
- src/content/duel-config.ts (coefficients des formules)
- src/physics/ (masse du corps selon le poids)
- tests/unit/stats.test.ts (optional at qa.level minimal)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*At `qa.level: minimal` tests are waived (advisory).*

**Story Type**: Logic
**Required evidence**: waived at qa.level minimal; `tests/unit/stats.test.ts` recommended.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-001-moteur-duel-ragdoll.md`
- Unlocks: `production/epics/untruc/story-009-rythme-reactions-combat.md`, `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-004-competences-lisibles.md`
