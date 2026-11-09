# Game Brief: UnTruc

## In your words
- un auto-battler au tour par tour dans l'esprit de La Brute, en 2D, sur le web
- Concepts choisis : « les 3 » (élève ton combattant, ligue de combattants, arène de tournoi)
- le poids des coups/armes
- des moments drôles et la variété
- les formes simples c'est plus une contrainte technique je voudrais plu mais ce n'est pas possible avec une ia
- tout ce qui va être compétence, c'est très illisible. [...] il faudrait mettre en place des compétences
- Création d'un compte, ça ce sera demandé je pense. D'ailleurs il faudrait penser à une base de données, c'est vrai. [...] j'aurais peut-être un serveur distant.
- Son et musique. [...] tu peux le laisser dans Autoscope, mais tu peux le mettre en later du coup. Je pense qu'on pourrait le mettre en place après.
- J'ai dit que peut-être une compétence pourrait transformer quelqu'un en loup-garou. J'ai jamais dit qu'il y avait un archétype de loup-garou.
- Story 5, tout ce qui est UI, ça va être très important à faire. [...] menu de gestion du personnage, de tout, pour montrer les armes et les skills. Ça, il faudra peut-être un prototype de plusieurs prototypes pour que je choisisse moi-même. Parce que notamment, on doit pouvoir avoir des skills facilement représentables par des petites icônes, par exemple. Les armes facilement représentables et tout ça. C'est quelque chose de très important, notamment pour la brute, qui était très intéressant pour ça.
- Aussi le fait que les stats soient intéressantes à mettre en place [...] on n'avait encore rien vu pour les stats. Du coup, je pense qu'on le fera après
- After play (story 001) : en termes de rapidité du combat, de fluidité du combat, c'est moins intéressant. C'est-à-dire que là, il y en a un qui se rapproche, qui attaque, c'est tout ce qui se passe. Moi, je veux des esquives, du fait que ça parte un peu dans tous les sens, que ça... Il y a des contre-attaques, des attaques, etc. [...] les bonhommes, ils ont un peu changé, notamment sa tête.
- Élargir du coup avec les stats avant comme nouvelle story aussi

**Pitch:** Élève un combattant, équipe-le, puis regarde la physique le faire se battre en tournoi : chaque coup pèse, aucun duel ne se ressemble. *(guessed)*

**Genre:** auto-battler au tour par tour, 2D, ragdoll physique

**Controls:** souris ou toucher pour préparer le combattant ; aucun contrôle pendant le duel. *(guessed)*

**Question:** les compétences deviennent-elles lisibles à l'œil nu (ciblage, raison visible d'un coup bloqué ou raté) sans perdre le poids et la variété du ragdoll ? *(guessed)*

**Hooks:** des combats uniques à chaque fois, sortis de la physique et sans animation dessinée ; des armes dont le poids change le geste. *(guessed)*

**Intent:**

## Look and references
- Look: persos en formes simples et cohérentes, arène 2D vue de côté, effets d'impact marqués (étincelles, ralentis, onde de choc, boule de feu) ; chaque figure dessinée, jamais d'emoji. *(guessed, d'après la piste 5)*
- References: La Brute (l'esprit du jeu, le combat qui se joue tout seul ; armes et compétences lisibles en petites icônes).
- View: 2D · Camera: fixe, de côté. *(guessed)*

## First minute
Le joueur arrive devant son combattant, choisit une arme, lance un premier duel et voit le marteau ou l'épée entraîner le corps de l'adversaire jusqu'au premier gros impact au ralenti. *(guessed)*

## Challenge
Le premier adversaire sérieux arrive au deuxième ou troisième duel ; perdre met fin au tournoi, le combattant reste. Plus tard : compétences comme la transformation en loup-garou, et armes à deux mains. *(guessed)*

## Core loop
- Préparer : arme, compétences, cosmétiques → regarder le duel → gagner de quoi améliorer → affronter un adversaire plus fort. *(guessed)*

## Goal & fail state
- Gagner la finale du tournoi. Le tournoi s'arrête sur la première défaite ; le combattant et son équipement restent pour réessayer. *(guessed)*

## Features
- [ ] Moteur de duel ragdoll (muscles PD, tour par tour) propre, rejouable à seed fixe ; stats du combattant ; duel rapide qui part dans tous les sens : esquive, parade, contre-attaque, enchaînements, pilotés par les stats
- [ ] Armes physiques en données : prise à une ou deux mains, attaque propre à chaque arme
- [ ] Compétences lisibles : ciblage visible, raison affichée quand un coup est bloqué ou raté
- [ ] Écran de gestion du personnage : armes et compétences lisibles en petites icônes, cosmétiques ; forme choisie parmi plusieurs prototypes
- [ ] Compétence Transformation : le combattant devient loup-garou (griffes, queue physique)
- [ ] Tournoi solo : enchaînement d'adversaires, récompenses entre les duels
- [ ] Effets d'impact (étincelles, ralentis, onde de choc, boule de feu) et look des combattants de la piste 5 (yeux expressifs, tête)

## Keep
-

## Avoid
- Persos détaillés générés par code : écartés, moins beaux et incohérents.
- Compétences illisibles : on doit comprendre pourquoi un coup touche ou pas.

## Out of scope
- Comptes joueurs, base de données, serveur distant · later (prévu ; le tournoi solo n'en a pas besoin)
- Ligue en ligne, duels asynchrones, classement · later (après les comptes)
- Son et musique · later
- Création de Trucs ou de persos par IA (`design/ideas/le-truc.md`, parkée)
- Rendu détaillé des persos

## Build order
1. Duel de bout en bout dans `src/` : moteur ragdoll, deux armes, effets d'impact, sans compétences. Puis les stats du combattant, puis le rythme et les réactions (esquive, parade, contre-attaque, enchaînements).
2. Compétences lisibles (saut ciblé, retour visuel sur coup bloqué) : le point le moins prouvé du prototype. Puis la compétence Transformation (loup-garou).
3. Prototypes de l'écran de gestion du personnage (plusieurs variantes, Maxence choisit), puis l'écran lui-même.
4. Tournoi solo.

---
**Kill condition:** si après deux passes les compétences restent incompréhensibles sans explication. *(guessed)*

**Who it's for / what they feel:** joueurs de La Brute et d'auto-battlers qui veulent des combats drôles et physiques. *(guessed)*

**Games you love / don't:** La Brute (l'esprit : le combat qui se joue seul).
