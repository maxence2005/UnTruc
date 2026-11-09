# Principes de code — UnTruc

> **Statut** : brouillon, à transformer en ADR et en control manifest via `/architecture-decision`
> **Date** : 2026-11-09

Le code de ce projet est écrit et maintenu en grande partie par des IA, sur de nombreuses itérations. L'objectif : qu'une IA (ou un humain) qui arrive sans contexte comprenne où ajouter une chose, l'ajoute sans casser le reste, et que le code reste propre après cinquante passages.

Le prototype `prototypes/combat-animation-concept/` ne respecte pas ces règles : c'est voulu, il est jetable.

## 1. Le contenu est de la donnée, le moteur est générique

Persos, armes, prises en main, compétences, cosmétiques, effets : ce sont des **données typées** (objets TypeScript ou JSON validés), lues par un moteur générique.

- Ajouter une arme = ajouter une entrée dans le registre des armes. On ne touche pas au moteur.
- Une compétence = une timeline de phases (pose cible, impulsions, fenêtre de coup, effets), pas une fonction écrite à la main.
- Les valeurs d'équilibrage (dégâts, portées, durées, forces) vivent dans des fichiers de config, jamais en dur dans la logique.

## 2. Couches séparées

| Couche | Rôle | Dépend de |
|---|---|---|
| `core/` | Règles du combat : stats, tours, dégâts, IA de combat, timelines. TypeScript pur, **sans Phaser**. | rien |
| `physics/` | Ragdoll, muscles, articulations. Adaptateur autour de Matter.js. | `core` |
| `render/` | Dessin des persos, cosmétiques, armes, effets. Phaser. | `core`, `physics` (lecture seule) |
| `ui/` | HUD, menus, écrans. | `core` (lecture seule) |
| `content/` | Données : armes, compétences, cosmétiques, archétypes. | types de `core` |

Une couche ne remonte jamais vers une couche supérieure. Le rendu lit l'état, il ne le modifie pas.

## 3. Patterns à utiliser (toujours les mêmes)

- **Registre** : armes, compétences, cosmétiques et effets sont enregistrés par identifiant (`weaponRegistry.get('marteau')`). Une seule façon de déclarer et de retrouver un élément.
- **Composition** : un combattant = corps + équipement + cosmétiques + compétences. Pas d'héritage en profondeur (`class LoupGarou extends Brute`), on compose.
- **Machine à états explicite** pour le combattant : `idle → approche → attaque → récupération`, `sonné`, `KO`. Les transitions sont listées à un seul endroit.
- **Bus d'événements typé** (`hit`, `ko`, `skillStart`, `weaponDropped`…) : les effets, le son et l'UI s'abonnent, la logique ne les appelle jamais directement.
- **Stratégie** quand un comportement varie vraiment (ex. IA prudente / agressive), plutôt que des `if` qui s'accumulent.

## 4. Déterminisme

- Toute source d'aléatoire passe par un RNG seedé et injecté. Pas de `Math.random()` dans `core/` ni `physics/`.
- La simulation avance à pas fixe, indépendamment du framerate.
- Objectif : même seed + mêmes persos = même combat, rejouable et testable.

## 5. Taille et lisibilité

- Un fichier = une responsabilité. Viser moins de 300 lignes, découper au-delà.
- Noms explicites, en anglais dans le code. Commentaires en français autorisés pour expliquer le *pourquoi*.
- Exports nommés, pas d'export par défaut.
- TypeScript `strict`. Pas de `any` en dehors des adaptateurs vers des librairies mal typées.
- Chaque dossier de `content/` a un court README : à quoi il sert et **comment ajouter un élément** (recette pas à pas). C'est ce que l'IA lira en premier.

## 6. Tests

- Tests unitaires (Vitest) sur `core/` : formules de dégâts, timelines de compétences, registres, machine à états.
- Test de validation du contenu : chaque arme, compétence ou cosmétique du registre est chargé et vérifié automatiquement.
- Le rendu se vérifie par captures d'écran.

## 7. Interdits

- Logique de jeu dans les scènes Phaser.
- Valeurs magiques dans la logique (passer par la config).
- Singletons globaux mutables.
- Fichiers fourre-tout (`utils.ts`, `helpers.ts`, `misc.ts`).
- Copier-coller d'une compétence ou d'une arme pour en faire une variante : on paramètre.
- `Math.random()` hors du module RNG.
