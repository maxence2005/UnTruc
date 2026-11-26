# Story 012: Choix du personnage au début

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 9

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1 | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 9), scoped to this story. Demandé par Maxence le 2026-11-11 :*

- [ ] Au début du jeu, le joueur choisit son personnage parmi plusieurs.
- [ ] Chaque personnage a ses propres stats de départ (format de la story 008) : certains misent sur une stat, au moins un est équilibré.
- [ ] L'écran de choix montre les stats de chaque personnage, pour comparer avant de choisir.
- [ ] Les personnages et leurs stats sont des données dans `src/content/` ; en ajouter un ne touche pas au moteur.
- [ ] Le personnage choisi est celui qui se bat ensuite ; ses stats de départ sont celles que le système de niveaux (story 011) fait monter.
- [ ] Un test vérifie que chaque personnage déclaré a les neuf stats et des valeurs valides.

---

## Implementation Notes

- Maxence, 2026-11-11 : « au début du jeu, on devra choisir un personnage. Et ce personnage, ses choix auront à chaque fois des stats différentes de départ. Donc on pourra se focaliser par exemple sur une stat ou bien essayer de prendre chaque stat de manière équilibrée. »
- Les valeurs de la story 008 (100 PV, puissance 10, poids 70, intelligence 0…) sont des valeurs de base provisoires ; les vraies valeurs de départ viennent de cette story.
- À décider avec Maxence : le nombre de personnages, leurs noms, leurs stats, et si le look change d'un personnage à l'autre.
- Intelligence : 0 de base ; chaque point débloque un comportement (story 004).
- Maxence, 2026-11-26 (story 006) : les cosmétiques (coiffure, barbe, couleurs) se choisissent **une seule fois au début, dans cette étape**, pas dans l'écran de gestion (qui ne règle que l'arme et les compétences). Cette story doit donc aussi proposer ce choix de look au joueur, avant son premier duel. Les critères ci-dessus ne le disent pas encore : à ajouter au début de cette story.

---

## Out of Scope

- Story 011 : la montée de niveau et les récompenses.
- Story 006 : l'écran de gestion du personnage.
- Équilibrage fin entre les personnages.
- Sauvegarde du choix sur un serveur (comptes : later).

---

## Files

- src/content/ (personnages de départ et leurs stats)
- src/ui/ (écran de choix du personnage)
- src/main.ts
- tests/unit/characters.test.ts

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: capture de l'écran de choix dans `production/qa/evidence/story-012-choix-personnage/` ; `tests/unit/characters.test.ts` pour la validation des données.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-008-stats-combattant.md`
- Unlocks: `production/epics/untruc/story-011-systeme-niveaux.md`
