# Idée en attente : le Truc

> **Statut** : en attente, pas prévu pour l'instant
> **Date** : 2026-11-09
> **Origine** : brainstorm sur le nom du jeu (UnTruc)

## L'idée

Chaque combattant a **son Truc** : un objet improbable gardé caché et sorti pendant le combat (poêle, poulet en caoutchouc, échelle, parapluie, aimant…). Le nom joue sur les deux sens de « truc » : un objet qu'on n'arrive pas à nommer, et une astuce.

## Pourquoi ça colle au jeu

- **C'est la physique qui anime.** Un Truc est un objet physique (forme, poids, rebond, effet), pas une animation. Chaque utilisation est différente.
- **Le style plat le rend faisable.** Un Truc se décrit en données simples : quelques formes géométriques, des couleurs, des propriétés physiques et un effet pris dans une liste fermée (repousser, assommer, faire glisser, voler une arme…). Le moteur le dessine, donc le rendu reste cohérent.

## Variantes

- **Truc inventé par le joueur** : le joueur tape un nom (« la tong de mamie »), une IA le traduit une fois en objet jouable, avec une puissance équilibrée par des règles fixes. L'appel IA n'a lieu qu'à la création, puis l'objet est sauvegardé.
- **Truc mystère** : l'adversaire ne sait pas ce que l'autre cache, et la révélation devient un moment fort du combat.
- **Progression** : gagner un combat fait gagner un Truc, ou permet de voler celui du vaincu.

## Avant de le relancer

1. Tester 4 ou 5 Trucs écrits à la main sous forme de données, pour vérifier que c'est drôle.
2. Ensuite seulement, brancher l'IA (génération + validation + équilibrage).
