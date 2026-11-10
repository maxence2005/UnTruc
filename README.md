# UnTruc

Jeu web perso, destiné à `jeu.untruc.fr`. Idée de départ : un auto-battler dans l'esprit de La Brute, où les combattants agissent chacun à leur rythme (pas de tour par tour).

## Prototypes de combat

Trois façons d'animer des combattants sans dessiner chaque animation à la main :

| Page | Piste | Principe |
|---|---|---|
| `piste1.html` | Ragdoll physique actif | Pantins Matter.js avec « muscles » (régulateurs PD). Les coups, chutes et relevés sortent de la simulation. Formes brutes. |
| `piste2.html` | Modulaire animé par code | Persos générés à partir de pièces dessinées par code, squelette 2D, compétences écrites en poses clés. |
| `piste4.html` | Combo | Moteur de la piste 1, habillage de la piste 2, effets (étincelles, ralentis, boule de feu, onde de choc). |

`R` ou le bouton « Nouveau combat » relance un combat avec deux nouveaux persos.

## Stack

- Vite + TypeScript
- Phaser 4 (rendu, scènes, tweens, particules, filtres)
- Matter.js, intégré à Phaser, pour la physique des ragdolls

## Lancer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # sortie dans dist/
```

## Organisation du code

```
src/
  shared/character.ts   génération procédurale d'un perso (apparence, stats, compétences) + textures
  shared/fx.ts          effets : étincelles, onde de choc, poussière, textes
  shared/ui.ts          config du jeu, HUD, décor, boutons de la page
  shared/rng.ts         aléatoire déterministe (seed)
  puppet/Puppet.ts      squelette 2D + système de poses (piste 2)
  ragdoll/Ragdoll.ts    ragdoll physique actif (pistes 1 et 4)
  ragdoll/arena.ts      arène, IA, compétences et dégâts des ragdolls
```
