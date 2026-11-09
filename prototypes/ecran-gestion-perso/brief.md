# Game Brief: Écran de gestion du perso

## In your words
écran de gestion du personnage, 3 variantes, armes et compétences en petites icônes

(Plus tôt dans la conversation :) Story 5, tout ce qui est UI, ça va être très important à faire. [...] menu de gestion du personnage, de tout, pour montrer les armes et les skills. Ça, il faudra peut-être un prototype de plusieurs prototypes pour que je choisisse moi-même. Parce que notamment, on doit pouvoir avoir des skills facilement représentables par des petites icônes, par exemple. Les armes facilement représentables et tout ça. C'est quelque chose de très important, notamment pour la brute, qui était très intéressant pour ça.

After play: J'aime bien la variante 1. [...] Le fond noir, ça fait un peu IA [...] je pense qu'on peut le faire dans un menu de sélection de personnages au tout début. Mais est-ce qu'on peut le changer quand on veut? Ça, je suis pas trop sûr. Les icônes de compétences, très intéressant tout ça. [...] Ça fait un peu trop cartoon, tu vois, ces icônes. Après, j'aime bien celui de la boule de feu du loup-garou [...] mais genre, les coups de poing, l'attaque, je sais pas trop. Ok, les armes, ça c'est super [...] je prends la variante 1, mais il faudrait que tu me donnes différentes, genre design d'interface [...] des couleurs qui diffèrent, des manières de faire l'interface

**Pitch:** Trois façons d'équiper son combattant d'un coup d'œil : armes et compétences en petites icônes lisibles, combattant visible qui change en direct. *(guessed)*

**Genre:** écran de gestion d'un auto-battler (maquette jouable)

**Controls:** souris ou toucher ; clavier en secours (1 à 4 change de style, I change de jeu d'icônes, flèches + Entrée pour choisir). *(guessed)*

**Question:** Laquelle des trois mises en page rend armes et compétences les plus lisibles et le choix le plus agréable ?

**Hooks:** chaque icône se reconnaît sans texte ; le combattant à l'écran porte tout de suite ce qu'on choisit. *(guessed)*

**Intent:** no goal to reach *(provisional)*

## Look and references
- Look: formes simples du jeu (piste 5 du prototype de combat) : contours sombres épais, aplats de couleurs vives ; icônes dessinées en code (silhouette d'arme, pictogramme de compétence) sur pastille colorée par famille (frappe, mouvement, magie, transformation, arme) ; combattant dessiné en grand. Chaque figure dessinée, jamais d'emoji, jamais de rond nu. *(guessed)*
- References: La Brute (armes et compétences lisibles en petites icônes ; ses valeurs, pas sa mise en page). Aucun fichier dans `references/`.
- View: 2D · Camera: écran fixe, combattant de face au centre ou sur le côté selon la variante. *(guessed)*

## First minute
L'écran s'ouvre sur la variante A avec un combattant tiré au hasard. On survole une icône : son nom et son effet s'affichent. On clique le marteau : le combattant le tient aussitôt. On ajoute deux compétences, on change de coiffure, puis on bascule sur B et C (1/2/3 ou boutons) avec le même équipement pour comparer. *(guessed)*

## Challenge
Aucun échec : c'est une maquette. La contrainte est le nombre d'emplacements (1 arme, 3 compétences) qui force à choisir. *(provisional)*

## Core loop
- Survoler une icône → lire nom et effet → choisir → voir le combattant changer → comparer dans une autre variante.

## Goal & fail state
- Pas de but ni d'échec : une session est complète quand Maxence a essayé les 3 variantes et en choisit une. *(provisional)*

## Features
- [x] Variante A « Fiche » : combattant au centre, armes d'un côté, compétences de l'autre, cosmétiques en bas
- [x] Variante B « Onglets » : onglets Armes / Compétences / Cosmétiques en grande grille, aperçu et emplacements sur le côté
- [x] Variante C « Silhouette » : emplacements autour du corps (arme près de la main, compétences en badges), réserve en dessous
- [x] 5 armes (mains nues, épée, marteau, hache, bâton) et 10 compétences, chacune avec sa propre icône dessinée
- [x] Info-bulle nom + effet au survol ou au toucher
- [x] Cosmétiques : coiffure, barbe, tenue, couleurs ; le combattant change en direct
- [x] Même équipement partagé entre les 3 variantes, bascule 1/2/3
- [x] Quatre styles de la Fiche (Riso, Vestiaire, Arène, Original), bascule 1 à 4 ; la Fiche est la mise en page par défaut (B et C restent accessibles par ?variant=)
- [x] Deux jeux d'icônes de compétences : pictogrammes sportifs (silhouette qui fait le geste) ou dessins, touche I ; Boule de feu et Transformation inchangées

## Keep
- La variante 1 (Fiche) : c'est la mise en page choisie *(you said)*
- Les icônes d'armes : « on voit bien que c'est des armes » *(you said)*
- Les icônes Boule de feu et Transformation (loup-garou) : « une bonne icône » *(you said)*

**Open question:** personnaliser le combattant à tout moment, ou seulement dans un écran de création au début ? Pas tranché *(you said)*.

## Avoid
- Fond noir / sombre générique « qui fait IA » *(you said)*
- Icônes trop cartoon (surtout les coups : poing, enchaînement, coup d'arme) *(you said)*
- Stats du combattant (later).
- Copier l'écran de La Brute.
- Archétypes : le loup-garou est une compétence (Transformation), pas un type de combattant.

## Out of scope
- Le vrai duel (story 001), sauvegarde, comptes.

## Build order
1. Les 15 icônes et le combattant dessinés, puis la variante A complète ; ensuite B et C sur le même état.

---
**Kill condition:** si aucune des trois ne rend les icônes lisibles sans texte. *(guessed)*

**Who it's for / what they feel:** Maxence, qui choisit la mise en page de l'écran principal.

**Games you love / don't:** La Brute (lisibilité des icônes).
