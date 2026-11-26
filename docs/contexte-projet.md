# Contexte projet — UnTruc

Projet **perso**. Règle de base : rien en rapport avec iAdvize (aucun outil, connecteur, dépôt ou contenu de l'organisation iAdvize, rien poussé chez eux). Le dépôt est `maxence2005/UnTruc`.

## Où on en est (2026-11-09)

Le jeu : `jeu.untruc.fr`, un auto-battler dans l'esprit de La Brute, en 2D, sur le web. Pas de tour par tour : chaque combattant agit à son propre rythme, comme dans la piste 5.

- **Stack retenue** : Vite + TypeScript + Phaser 4, physique Matter.js (intégrée à Phaser). Pas de MCP.
- **Prototype** : `prototypes/combat-animation-concept/` (lire son `README.md`). Cinq pistes testées. Vidéos dans `evidence/`.
- **Direction retenue : piste 5.** Ragdolls physiques actifs (muscles PD, aucune animation dessinée) + persos en formes simples (style de la piste 1) + effets de la piste 4 (étincelles, ralentis, onde de choc, boule de feu). Les persos détaillés générés par code (pistes 2 et 4) sont écartés : moins beaux, et difficiles à rendre cohérents.
- **Validé dans le prototype** : armes physiques avec prise en main à une ou deux mains et attaque propre à chaque arme (`src/ragdoll/weapons.ts`), cosmétiques accrochés aux parties du corps, loup-garou (griffes, queue physique). Dans le jeu, le loup-garou est une compétence de transformation, pas un archétype.
- **Verdict : PROCEED** (2026-11-09), voir `prototypes/combat-animation-concept/REPORT.md`. Point faible : les compétences (ex. saut) sont illisibles, à concevoir. Les formes simples sont une contrainte (cohérence par IA), pas un idéal.
- **Suite** : `/brainstorm` pour écrire `design/game-brief.md`, puis `/create-stories` et `/dev-story`.

## Documents à lire

- `docs/architecture/principes-code.md` : principes de code pour un projet maintenu par des IA (contenu en données, couches, patterns, déterminisme, interdits). Brouillon à transformer en ADR avec `/architecture-decision`.
- `.claude/docs/technical-preferences.md` : rendu, physique et interdits remplis.
- `design/ideas/le-truc.md` : idée mise de côté (chaque combattant a son « Truc », objet physique ; variante générée par IA). Ne pas lancer sans demande.

## Gemini sur le projet (2026-11-26)

Maxence utilise aussi Gemini (Antigravity, sur sa machine perso) pour les images et le rendu graphique (Nano Banana). Ses règles : `GEMINI.md` à la racine, `.agents/rules/`, procédures dans `.agents/skills/` (`/generer-image`, `/verifier-rendu`, `/verifier-code`). Les deux machines se synchronisent par git (`maxence2005/UnTruc`) : faire un `git pull` avant de travailler, et ne pas reprendre des fichiers que Gemini est en train de modifier. Les images vont dans `assets/` avec leur entrée dans `assets/provenance.yaml`. `npm run check:hashes` rejoue les duels de référence.
