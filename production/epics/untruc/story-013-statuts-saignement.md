# Story 013: Statuts de combat (saignement)

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Demande de Maxence du 2026-11-17 (pas encore une feature du brief)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [ ] Un statut est une donnée (id, durée, cumul possible ou non, effets par seconde et effets sur les stats), pas une fonction écrite à la main. Ajouter un statut revient à ajouter un fichier de données.
- [ ] Un statut est appliqué par une compétence ou une attaque, via un événement de la logique, et il expire tout seul.
- [ ] **Saignement** : il inflige des dégâts dans la durée et se cumule (chaque nouvelle application ajoute une charge, jusqu'à un maximum fixé en données). *(Maxence, 2026-11-17)*
- [ ] Le saignement fait aussi perdre du poids à la victime, parce qu'elle perd du sang. Le poids baisse avec les charges et ne descend jamais sous un plancher fixé en données. Cette baisse change la physique, comme le poids de la story 008 : masse, recul et étourdissement. *(Maxence, 2026-11-17 : « quelque chose d'un peu réaliste »)*
- [ ] Les statuts actifs s'affichent aussi dans le HUD, sous la barre de vie du combattant : une petite icône dessinée par statut, avec son nombre de charges. *(Maxence, 2026-11-17)*
- [ ] Le statut se voit sur le combattant (gouttes de sang dessinées, nombre de charges lisible) et chaque perte de PV due au statut se lit, avec des effets au niveau de la story 003.
- [ ] Toutes les valeurs (dégâts par seconde, charges max, perte de poids, durée) sont en données ; le duel reste déterministe à seed fixe.

---

## Implementation Notes

- Premier client : la compétence Transformation (story 005), dont les griffes font saigner.
- Décisions de Maxence (2026-11-17) :
  - Chaque charge de saignement a sa propre durée. Une nouvelle charge ne relance pas les charges déjà là.
  - Chaque charge retire une quantité fixe de poids (en données), qui revient quand cette charge expire.
  - Le saignement peut mettre KO.
  - Le statut et chaque perte de PV qu'il cause ont leurs effets visuels.

---

## Out of Scope

- Autres statuts (brûlure, poison, gel…) : le format doit les permettre, mais ils ne sont pas faits ici.
- Story 005 : la compétence qui applique le saignement.

---

## Files

- src/core/ (statuts : application, cumul, expiration, effets sur les stats)
- src/content/statuses/ (saignement)
- src/render/ (affichage du statut)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: tests unitaires dans `tests/unit/statuses/` (cumul, expiration, plancher de poids, déterminisme), et une capture d'écran conservée dans `production/qa/evidence/` pour le rendu du statut

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-008-stats-combattant.md`
- Unlocks: `production/epics/untruc/story-005-competence-transformation.md`
