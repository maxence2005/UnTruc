# Story 015: Écran d'accueil et options

> **Epic**: UnTruc (MVP)
> **Status**: Ready
> **Layer**: N/A (minimal)
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Demande de Maxence du 2026-11-17 ; engagements de `design/accessibility-requirements.md` (Basic + 4 ajouts)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1, Matter.js | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

- [ ] **Parcours du jeu** : écran d'accueil → vestiaire (écran de gestion, story 006) → combat. Tant que la story 006 n'est pas faite, l'accueil mène directement au combat. *(Maxence, 2026-11-17)*
- [ ] **Écran d'accueil** : titre du jeu, bouton pour jouer, bouton « Options ». Jouable au clavier seul (focus visible) et au toucher.
- [ ] **Options sur l'accueil** : réduction des flashs (oui / non) et mouvement réduit (suit le système par défaut, peut être forcé oui / non). *(design/accessibility-requirements.md)*
- [ ] **Avertissement photosensible** : affiché sur l'écran d'accueil au premier lancement, avec un lien vers les options ; il ne bloque pas les visites suivantes.
- [ ] **Vitesse du duel réglable pendant le combat** : ×0,5, ×0,75, ×1, changée directement dans le duel, sans passer par les options. Elle change seulement la vitesse d'affichage : même seed, même duel, même vainqueur. *(Maxence, 2026-11-17)*
- [ ] **Le contrôle de vitesse ne gêne pas le HUD** : petit, discret, hors des zones du HUD (`design/ux/hud.md`), jamais sur les combattants ; accessible au clavier (une touche) et au toucher. *(Maxence, 2026-11-17 : « faut pas que ça gêne le HUD »)*
- [ ] **Réglages gardés** : la vitesse choisie et les options sont gardées d'un combat à l'autre et d'une visite à l'autre (stockage du navigateur ; pas de compte, pas de serveur). *(Maxence, 2026-11-17)*
- [ ] Les textes, tailles et couleurs sont en données ; l'écran suit l'art bible (Vestiaire : plaques, ruban adhésif) et le niveau d'accessibilité (14 px minimum, contraste AA).

---

## Implementation Notes

- Maxence, 2026-11-17 : « un écran d'accueil, ensuite un vestiaire et ensuite un écran de combat. Dans cet écran d'accueil tu peux changer les options. Et pour tout ce qui est vitesse du jeu, ça ce serait quelque chose qu'on pourrait changer directement dans le combat, et qui serait gardé entre tous les combats. Faut pas que ça gêne le HUD. »
- La vitesse d'affichage s'applique comme le ralenti (story 003) : elle multiplie le temps de la scène, le duel garde son pas fixe et sa seed.
- Le HUD (`design/ux/hud.md`) est « en lecture seule » : le contrôle de vitesse est le seul élément interactif du combat. Proposition de place : coin bas, sous la ligne du sol, loin des coins hauts du HUD. À trancher avec les variantes du HUD (story 014).
- Une spec UX de l'accueil (`/ux-design accueil`) est possible avant `/dev-story`, mais pas obligatoire au niveau minimal.

---

## Out of Scope

- Story 006 : le vestiaire (écran de gestion) lui-même.
- Story 014 : le HUD de combat.
- Comptes, sauvegarde sur un serveur (« later » dans le brief).
- Réglages du son (pas de son pour l'instant).

---

## Files

- src/scenes/ (accueil, options)
- src/ui/ (contrôle de vitesse)
- src/content/presentation.ts

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: une capture conservée de l'accueil, des options et du contrôle de vitesse en combat dans `production/qa/evidence/story-015-accueil-options/`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-003-effets-impact.md` (flashs, ralenti)
- Unlocks: None (la story 006 se branchera entre l'accueil et le combat)
