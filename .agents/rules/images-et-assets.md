---
trigger: model_decision
description: À lire avant de créer, générer (Nano Banana), modifier ou intégrer une image, une icône, une texture, une police ou tout autre asset graphique d'UnTruc.
---

# Images et assets

- **Direction** : `design/art/art-bible.md` fait autorité (sections 1 à 4 pour le style, les formes et
  les couleurs ; section 7 pour l'interface ; section 8 pour les standards d'asset). Lis la section utile
  avant chaque génération.
- **Style actuel** : formes simples, contours sombres épais, aplats de couleurs vives (piste 5 du
  prototype). Pas de rendu photo, pas de détails fins illisibles en petit, pas de fond sombre générique
  « qui fait IA ». Interface en style « Vestiaire » (casiers verts, plaques de métal, ruban adhésif, feutre).
- **Variantes** : propose toujours 2 ou 3 variantes à Maxence ; il choisit. Ne remplace jamais un asset
  existant sans son accord.
- **Où ranger** : `assets/` (voir `assets/README.md`) : `assets/characters/`, `assets/ui/`, `assets/fx/`,
  `assets/backgrounds/`, `assets/references/` (images de travail, non chargées par le jeu).
- **Provenance obligatoire** : chaque fichier ajouté a une entrée dans `assets/provenance.yaml`
  (fichier, outil et modèle, date, prompt ou source, licence, retouches). Pas d'entrée, pas d'asset.
- **Droits** : aucune image qui imite une marque, un jeu existant (pas d'éléments de La Brute), une
  personne réelle ou une œuvre protégée. Polices : licence libre seulement (OFL ou Apache 2.0).
- **Formats** : PNG ou WebP avec transparence pour ce qui se superpose ; taille utile, pas plus
  (une icône d'interface tient en 128 × 128) ; noms en `kebab-case`.
- **Combattants** : une image par partie du corps (`head`, `torso`, `upperArmFront`, `foreArmFront`,
  `upperArmBack`, `foreArmBack`, `thighFront`, `shinFront`, `thighBack`, `shinBack`), dessinée dans le
  repère de la partie au repos (voir `src/core/cosmetic-spec.ts` pour le repère et
  `src/content/fighters.ts` pour les tailles). Une image d'un seul bloc ne bouge pas avec le ragdoll.
- **Lisibilité** : contraste AA (texte 4,5:1, graphismes 3:1), jamais la couleur seule pour porter une
  information (forme, chiffre ou libellé en plus), 14 px minimum pour le texte.
- **Après intégration** : lance `/verifier-rendu` et garde une capture.
