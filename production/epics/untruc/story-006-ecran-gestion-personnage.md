# Story 006: Écran de gestion du personnage

> **Epic**: UnTruc (MVP)
> **Status**: In Progress
> **Layer**: N/A (minimal)
> **Type**: UI
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-11-26

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 4

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: Web 8.3.7 (Vite) + Phaser 4.2.1 | **Risk**: HIGH (Vite 8 and Phaser 4 are post-cutoff, `docs/engine-reference/web/VERSION.md`)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Features 4, In your words, References), scoped to this story:*

- [ ] L'écran suit la variante choisie par Maxence : mise en page « Fiche » (armes à gauche, compétences à droite, combattant au centre), style « Vestiaire », compétences en pictogrammes sportifs (`prototypes/ecran-gestion-perso/`, 2026-11-09). Fond : sans image pour l'instant, casiers verts, plaques et ruban adhésif dessinés en code *(Maxence, 2026-11-26)*.
- [ ] Le combattant est visible sur l'écran, avec son arme et ses cosmétiques actuels (il les porte, sans les modifier ici).
- [ ] Chaque compétence est représentée par une petite icône reconnaissable ; son nom et son effet s'affichent au survol ou au toucher.
- [ ] Chaque arme est représentée de façon reconnaissable d'un coup d'œil.
- [ ] Le joueur choisit l'arme et les compétences avant chaque duel, à la souris ou au toucher. **Les cosmétiques (coiffure, barbe, couleurs) ne se choisissent pas ici** : ils se choisissent une seule fois au début, dans le choix du personnage (story 012). *(Maxence, 2026-11-26 : « dans le menu juste arme et compétence, et une seule fois au début »)*
- [ ] Le choix fait ici est celui utilisé par le duel suivant : un bouton « Combattre » lance le duel avec l'arme et les compétences choisies, et le duel fini ramène à cet écran.
- [ ] **Les stats du combattant sont affichées**, de la façon la plus parlante possible : au survol (ou au toucher) d'une stat, on lit ce qu'elle change ; quand on survole une arme ou une compétence, les stats qu'elle utilise sont mises en évidence. *(Maxence, 2026-11-26 : « on les montre avec le plus intéressant possible, au survol on peut voir ce que ça fait avec (pour le stat du perso) et pour les stats que les armes utilisent on peut bien voir ce qui est utilisé »)*
- [ ] L'écran lit l'état du combattant sans contenir de logique de combat.
- [ ] Jouable à la souris, au toucher et au clavier seul (focus visible), 14 px au minimum, contraste AA (`design/accessibility-requirements.md`, art bible section 7).

---

## Implementation Notes

- Référence : La Brute, pour les armes et compétences lisibles en icônes.
- Stats du combattant : dans le MVP depuis le 2026-11-09 (story des stats) ; affichées sur l'écran depuis la décision de Maxence du 2026-11-26 (voir les critères).
- Décisions de Maxence (2026-11-26) : pas d'image de fond pour l'instant ; l'arme et les compétences se changent avant chaque duel, les cosmétiques une seule fois au début (story 012) ; polices libres embarquées par npm (une condensée, une « feutre »).
- Le jeu a trois armes de départ (poings, épée, marteau) et quatre compétences (saut, charge, boule de feu, transformation) : l'écran montre celles-là, pas les dix du prototype.
- Les pictogrammes sont dessinés en code (comme le prototype), pas en fichiers image : les données sont dans `src/content/`, le dessin générique dans `src/ui/` et `src/render/`.
- Le jeu s'ouvre sur cet écran quand l'URL n'a aucun paramètre de démo (`seed`, `armes`, `competences`, `statut`, `fx`, `duel`) ; avec l'un d'eux, il part directement dans le duel comme avant (les empreintes de référence en dépendent). La story 015 mettra l'accueil devant.

---

## Out of Scope

- Story 007 : l'enchaînement des duels du tournoi.

---

## Files

- src/ui/ (écran de gestion)
- assets/ (icônes de compétences et d'armes)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: a retained screenshot of each screen touched, in `production/qa/evidence/`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/untruc/story-002-armes-physiques.md`, `production/epics/untruc/story-004-competences-lisibles.md`, the UI prototypes verdict (`prototypes/index.md`)
- Unlocks: `production/epics/untruc/story-007-tournoi-solo.md`
