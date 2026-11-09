# content/

Données du jeu, lues par un moteur générique (`core/`, `physics/`, `render/`).
Aucune valeur d'équilibrage ne vit dans la logique : tout se règle ici.

## Changer un réglage

- **Un combattant** (PV, dégâts, durées, forces des muscles, poses, couleurs) :
  `fighters.ts`. `BASE_FIGHTER` est partagé ; chaque entrée de `FIGHTERS`
  écrase ce qu'elle veut (`...BASE_FIGHTER, maxHp: 150`).
  - PV : `maxHp`. Dégâts d'un coup : `attack.damageMin` / `damageMax` (tirés avec le RNG seedé).
  - Rythme d'un coup : `attack.windupMs`, `strikeMs`, `recoveryMs` ; portée : `attack.reach` (px).
  - Étourdissement après un coup reçu : `stunMs`.
  - Force des muscles : `muscles.*.kp` (raideur) et `kd` (réactivité) ; par état : `stateTuning`.
  - Gestes : `stance`, `slump`, `attack.windupPose`, `attack.strikePose` (radians, `+` = vers l'avant, voir `core/pose.ts`).
- **L'arène, le pas fixe, le rythme des tours, la physique** : `duel-config.ts`.
  - Taille : `arena.width` / `height` (l'écran s'adapte).
  - Vitesse minimale d'un contact pour compter comme un coup : `minHitSpeed`.
  - Seed par défaut : `seedDefault` (l'URL peut la remplacer avec `?seed=123`).
- **Couleurs de l'arène, textes de l'interface** : `presentation.ts`.

Un même seed et les mêmes combattants donnent le même duel. Changer une valeur
ici change le duel, c'est normal.

## Changer qui se bat

Le duel oppose les deux entrées de `FIGHTERS` (`fighters.ts`) : modifier ou
remplacer ces deux entrées. Un combattant de plus = une entrée de plus dans la
liste des specs, à brancher ensuite dans `main.ts`.
