<!-- PROTOTYPE - NOT FOR PRODUCTION
     Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation ?
     Date: 2026-11-09 -->

# Concept Prototype Report: animation des combats

> **Date**: 2026-11-09
> **Prototype Path**: Engine (Vite + TypeScript + Phaser 4, Matter.js)
> **Concept File**: aucun (ni `design/gdd/game-concept.md` ni `design/game-brief.md` à cette date)

---

## Hypothesis

Question de départ : quelle technique d'animation rend des combats d'auto-battler 2D beaux et variés sans dessiner chaque animation (ragdoll physique, squelette modulaire animé par code, ou combo des deux) ?

Hypothèse retenue après les essais : **un ragdoll physique actif (muscles PD), avec des persos en formes simples et des effets, donne des combats beaux et variés sans aucune animation dessinée.** Signal attendu : deux combats avec les mêmes persos ne se ressemblent pas, et chaque arme se lit à son mouvement.

---

## Riskiest Assumption Tested

Que la physique seule, pilotée par des poses cibles, suffise à produire des coups lisibles et marquants sans animation dessinée. Elle a tenu pour les attaques d'armes. Elle ne tient pas encore pour les compétences (voir Result).

---

## Approach

Quatre pistes sur la même stack :

| Piste | Principe | Issue |
|---|---|---|
| 1 | Ragdoll actif, formes brutes, presque aucun effet | Base du moteur retenu |
| 2 | Persos modulaires générés par code, squelette 2D, compétences en poses clés | Écartée |
| 4 | Moteur de la piste 1 + habillage de la piste 2 + effets | Écartée |
| 5 | Moteur de la piste 1, formes simples, effets de la piste 4 | **Retenue** |

Les pistes 1 et 5 partagent le même moteur (`src/ragdoll/arena.ts`, drapeau `fx`). Une attaque est une donnée : pose d'armement, pose de frappe, impulsion, moulinet éventuel (`src/ragdoll/weapons.ts`). Les muscles tirent le corps vers la pose cible, la physique produit le reste.

**Path chosen:** Engine
**Reason for path:** la question porte sur le rendu et la sensation de la physique, qu'un croquis papier ou HTML simplifié ne montre pas.

**Shortcuts taken (intentional):**
- Valeurs en dur, aucune architecture, `arena.ts` d'environ 1 000 lignes.
- Pas de menus, pas d'écran de fin, pas de son.
- Compétences (saut, boule de feu, griffes) branchées vite, sans conception.

---

## Result

Observations du joueur (Maxence), piste 5 :

- **Ça marche : le poids des coups et des armes.** Le marteau ou la hache entraînent le corps, chaque arme bouge à sa façon sans animation dédiée.
- **Surprises positives : des moments drôles et la variété.** Les combats ne se répètent pas.
- **Instabilité physique : rien de vu sur les duels courants.** À surveiller, pas de défaut constaté.
- **Lisibilité : les compétences sont illisibles.** Exemple : l'attaque sautée ne retombe pas toujours sur la cible, elle est parfois bloquée et ne fait pas de dégâts, sans qu'on comprenne pourquoi. Le joueur l'attribue au fait que les compétences ne sont pas encore conçues, pas au ragdoll.
- **Formes simples : une contrainte, pas un choix.** Le joueur voudrait des persos plus détaillés. Les persos détaillés générés par code (pistes 2 et 4) étaient moins beaux et difficiles à rendre cohérents par une IA.

Vidéos : `evidence/piste-1-ragdoll.mp4`, `evidence/piste-2-modulaire.mp4`, `evidence/piste-4-combo.mp4`, `evidence/piste-5-simple-effets.mp4`, `evidence/piste-5-armes-loup-garou.mp4`.

---

## Metrics

| Metric | Value |
|--------|-------|
| Path used | Engine |
| Iterations to playable | ⚠ non relevé |
| Prototype duration | ⚠ non relevé (fait le 2026-11-09) |
| Playtesters | 1 interne |
| Feel assessment | Poids des armes convaincant ; compétences illisibles (saut qui rate sa cible sans raison visible) |
| Hypothesis verdict | CONFIRMED |

---

## Recommendation: PROCEED

La piste 5 devient la base du jeu : ragdoll actif piloté par des poses cibles, persos en formes simples, effets. Le poids des armes et la variété des combats, deux points du pari de départ, sont là. Le seul défaut observé vient des compétences, qui n'ont pas encore été conçues : c'est un chantier de design, pas une raison de changer de technique.

---

## If Proceeding

- **Core tuning values discovered:** ralenti d'impact à 0,18 de vitesse pendant 900 ms (piste 5) contre 0,4 pendant 300 ms (piste 1), dans `arena.ts`. Les forces des muscles et des armes sont dans `ragdoll.ts` et `weapons.ts` ; à reprendre en config.
- **Assumptions confirmed:** une arme = un corps physique accroché à la main au point de prise ; deux mains = seconde articulation plus souple. Le poids change le geste sans animation. Les cosmétiques (accessoires, oreilles, griffes, queue en chaîne physique) s'accrochent à une partie du corps.
- **Assumptions disproved:** les persos détaillés générés par code ne rendent pas mieux ; la cohérence visuelle passe par des formes simples.
- **Emergent mechanics:** le comique physique (chutes, coups ratés) vient tout seul et mérite d'être gardé comme un trait du jeu.

**Points à traiter dans le vrai code :**
- Les compétences doivent être conçues pour être lisibles : ciblage du saut, raison visible quand un coup ne fait pas de dégâts (bloqué, esquivé, raté).
- Garder un œil sur la stabilité physique quand le nombre d'armes et d'archétypes augmente.
- Garder ouverte la question d'un rendu plus détaillé, sans perdre la cohérence que donnent les formes simples.

**Next steps (rigor `minimal`):**
1. `/brainstorm` : écrire `design/game-brief.md` à partir de ce verdict.
2. `/create-stories` depuis le brief.
3. `/dev-story` sur la première story, code réécrit de zéro dans `src/`.

---

## Lessons Learned

- **What assumptions were broken by actually building this?** Qu'un habillage détaillé rendrait mieux : il rend moins bien et se tient mal.
- **What surprised us that didn't show up in the brainstorm?** Le comique et la variété viennent de la physique sans effort de design.
- **What would we test differently next time?** Relever la durée et le nombre d'itérations, et tester une compétence conçue (avec feedback visuel) à part, au lieu de les brancher vite.

---

> *Prototype code location: `prototypes/combat-animation-concept/`*
> *This code is throwaway. Never refactor into production.*
