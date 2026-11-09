<!-- PROTOTYPE - NOT FOR PRODUCTION
     Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
     Date: 2026-11-09 -->

# Prototype : animation des combats

**Statut : conclu le 2026-11-09, verdict PROCEED (piste 5).** Rapport : [`REPORT.md`](REPORT.md).

Quatre pistes, même stack (Vite + TypeScript + Phaser 4, Matter.js intégré) :

| Page | Piste | Principe |
|---|---|---|
| `piste-1.html` | Ragdoll physique actif | Pantins Matter.js avec « muscles » (régulateurs PD). Coups, chutes et relevés sortent de la simulation. Formes brutes. |
| `piste-2.html` | Modulaire animé par code | Persos générés par code (pièces), squelette 2D, compétences écrites en poses clés. |
| `piste-4.html` | Combo | Moteur de la piste 1 + habillage de la piste 2 + effets. |
| `piste-5.html` | Formes simples + effets | Look de la piste 1 + animations et effets de la piste 4 : yeux expressifs, accessoire par perso, armes en formes simples. Direction retenue pour la suite. Ajouts : armes physiques avec prise en main et attaque propres (`src/ragdoll/weapons.ts`), archétype loup-garou (oreilles, museau, griffes, queue physique, compétence Griffes). |

Lancer depuis la racine du dépôt : `npm run proto:combat`, puis http://localhost:5173.
`R` ou « Nouveau combat » relance avec deux nouveaux persos.

Code jetable : valeurs en dur, aucune architecture. À réécrire proprement dans `src/` une fois la piste choisie.

## Tester un duel précis (piste 5)

Paramètres d'URL pour forcer les deux combattants du premier combat : `a` (gauche) et `b` (droite), valeurs `loup`, `epee`, `marteau`, `hache`, `baton` ou `mains`.

- http://localhost:5173/piste-5.html?a=loup&b=marteau
- http://localhost:5173/piste-5.html?a=epee&b=hache
- http://localhost:5173/piste-5.html?a=baton&b=loup

## Ce que le prototype a montré

- Une arme = un corps physique accroché à la main par une articulation au point de prise. Deux mains = seconde articulation, plus souple, plus loin sur le manche. Le poids de l'arme change le mouvement sans animation dédiée (le marteau entraîne les bras).
- Chaque arme a sa propre attaque, décrite en données (pose d'armement, pose de frappe, impulsion, moulinet).
- Les cosmétiques (accessoires, oreilles, museau, griffes) sont des formes accrochées à une partie du corps. Une queue peut être une petite chaîne physique.
