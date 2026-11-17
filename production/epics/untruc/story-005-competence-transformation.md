# Story 005: Compétence Transformation (loup-garou)

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 5

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 5, In your words), scoped to this story:*

- [ ] La Transformation est une compétence comme les autres (une donnée), pas un type de combattant.
- [ ] En cours de duel, la compétence transforme le combattant en loup-garou : oreilles, museau, griffes et queue physique (petite chaîne) apparaissent sur le même corps.
- [ ] Une fois transformé, le combattant attaque avec ses griffes, qui laissent des traces visibles à l'impact.
- [ ] Le moment de la transformation se voit et se lit (nom ou icône de la compétence, effet visuel).
- [ ] Les attributs du loup-garou sont des cosmétiques accrochés aux parties du corps, réutilisables.
- [ ] Comme toute compétence, la Transformation a ses effets visuels au niveau de ceux de la story 003 (la règle est posée dans la story 004). *(Maxence, 2026-11-16)*
- [ ] La compétence est de catégorie `transformation` et a un coût en points plus élevé qu'une compétence simple (champs posés par la story 004). *(Maxence, 2026-11-17)*
- [ ] **Grognement, à 50 % des PV** : le combattant grogne ; l'adversaire subit quelques dégâts et est étourdi environ 2 s. Le seuil, les dégâts et la durée sont en données. *(Maxence, 2026-11-17)*
- [ ] **Transformation, à 30 % des PV** : le combattant devient loup-garou ; sa vitesse et son agilité augmentent fortement (bonus en données). *(Maxence, 2026-11-17)*
- [ ] **Griffes qui font saigner** : une fois transformé, chaque attaque qui touche applique le statut Saignement à l'adversaire (statut défini par la story 013). *(Maxence, 2026-11-17)*

---

## Implementation Notes

- Le prototype a montré griffes et queue physique (`prototypes/combat-animation-concept/`) ; dans le jeu, c'est une compétence de transformation, pas un archétype (correction de Maxence, 2026-11-09).
- Durée et éventuel retour à la forme normale : non décidés ; à trancher au début de la story.
- Décisions de Maxence (2026-11-17) :
  - L'étourdissement du grognement passe outre les plafonds des coups (`stats.maxStunMs`, `stats.maxStunSeriesMs`) : une compétence peut dépasser ces plafonds. La durée propre à la compétence est dans ses données.
  - Le grognement et la transformation ont lieu une seule fois par duel chacun.
  - Une fois transformé, le combattant reste loup-garou jusqu'à la fin du duel, même s'il se soigne ensuite au-dessus de 30 % (se transformer puis se soigner à 100 % est voulu, et très fort).
  - Le grognement ne peut être ni esquivé ni paré. Pendant le grognement, le loup-garou reste lui-même immobile un moment (durée en données).
  - Si un seul coup fait passer de plus de 50 % à moins de 30 % des PV, le combattant se transforme sans grogner. C'est un contre possible au loup-garou.
  - Le grognement (un hurlement) a son effet sur toute l'arène : une onde qui traverse le terrain et un tremblement d'écran, avec l'intensité et la durée en données.
  - Si le coup le met KO, rien ne se déclenche : il meurt sans se transformer.
  - Le grognement, la transformation et les griffes ont tous leurs effets visuels.

---

## Out of Scope

- Story 006 : choisir la compétence dans l'écran de gestion.

---

## Files

- src/content/skills/ (transformation)
- src/content/cosmetics/ (oreilles, museau, griffes, queue)
- src/render/

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/untruc-transformation-evidence.md`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-004-competences-lisibles.md`, `production/epics/untruc/story-013-statuts-saignement.md`
- Unlocks: None
