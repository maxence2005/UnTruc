---
name: generer-image
description: Crée une image ou une icône pour UnTruc avec Nano Banana (génération d'image Gemini), en suivant l'art bible, en proposant des variantes à Maxence, puis en rangeant le fichier choisi dans assets/ avec sa provenance.
---

# Générer une image pour UnTruc

1. **Comprendre la demande.** Ce que l'image doit montrer, où elle s'affiche (duel, écran de gestion,
   icône, fond), à quelle taille. S'il manque une information qui change le résultat, demande à Maxence.
2. **Lire la direction.** Dans `design/art/art-bible.md`, lis les sections utiles (style, formes,
   couleurs, interface). Relis la règle `.agents/rules/images-et-assets.md`. Regarde ce qui existe déjà à
   l'écran (`production/qa/evidence/` contient des captures récentes) pour rester cohérent.
3. **Écrire le prompt.** Décris le sujet, le style UnTruc (formes simples, contours sombres épais, aplats
   de couleurs vives, lisible en petit), le cadrage, le fond (transparent si l'image se superpose), la palette
   de l'art bible. Pour un combattant : **une partie du corps par image**, dans le repère de la partie au
   repos. Interdit : imiter un jeu, une marque, une personne réelle.
4. **Générer 2 ou 3 variantes** avec Nano Banana. Range-les dans `assets/references/` (images de travail).
5. **Montrer à Maxence** les variantes côte à côte, avec une phrase par variante sur ce qui change. Il choisit.
   N'intègre rien sans son choix.
6. **Préparer le fichier retenu** : recadrage, transparence, taille utile, format PNG ou WebP, nom en
   `kebab-case`, rangé dans le bon dossier d'`assets/` (voir `assets/README.md`).
7. **Provenance** : ajoute l'entrée dans `assets/provenance.yaml` (fichier, outil et modèle, date, prompt,
   variante retenue, retouches, licence).
8. **Intégrer** seulement si Maxence le demande : chargement dans la scène Phaser concernée, valeurs de
   placement en données (`src/content/`), jamais en dur. Respecte `.agents/rules/rendu-phaser.md`.
9. **Vérifier** : `/verifier-code` puis `/verifier-rendu`, capture gardée dans `production/qa/evidence/`.
10. **Résumer** à Maxence : fichiers ajoutés, ce qui a été choisi et pourquoi, ce qui reste à décider.
