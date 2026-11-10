# content/

Données du jeu, lues par un moteur générique (`core/`, `physics/`, `render/`).
Aucune valeur d'équilibrage ne vit dans la logique : tout se règle ici.

## Changer un réglage

- **Un combattant** (PV, dégâts, durées, forces des muscles, poses, couleurs) :
  `fighters.ts`. `BASE_FIGHTER` est partagé ; chaque entrée de `FIGHTERS`
  écrase ce qu'elle veut (`...BASE_FIGHTER, maxHp: 150`).
  - PV : `maxHp`. Dégât de base d'un coup : `attack.damage` (fixe, multiplié ensuite par la vitesse d'impact, voir `duel-config.ts`).
  - Rythme d'un coup : `attack.windupMs`, `strikeMs`, `recoveryMs` ; portée : `attack.reach` (px).
  - Étourdissement après un coup reçu : `stunMs` (280 ms : un coup reçu interrompt l'action en cours).
  - Force des muscles : `muscles.*.kp` (raideur) et `kd` (réactivité) ; par état : `stateTuning`.
  - Gestes : `stance`, `slump`, `attack.windupPose`, `attack.strikePose` (radians, `+` = vers l'avant, voir `core/pose.ts`).
- **L'arène, le pas fixe, le rythme des actions, les dégâts, la physique** : `duel-config.ts`.
  - `stepHz` (60) : ne pas le changer sans régler de nouveau les muscles (`kd`), le maintien debout et la marche, qui sont exprimés par pas de simulation.
  - Taille : `arena.width` / `height` (l'écran s'adapte).
  - Premier coup : `action.firstDelayMs` (combattant 0) + `action.firstDelayStaggerMs` par index suivant.
  - Délai entre deux coups d'un même combattant : `action.delayBaseMs` + part aléatoire seedée dans [0, `action.delayRandomMs`).
  - Facteur de dégâts selon la vitesse d'impact : `damage.referenceSpeed` (px par pas, donne le dégât de base), borné par `damage.minFactor` et `damage.maxFactor`.
  - Vitesse minimale d'un contact pour compter comme un coup : `minHitSpeed`.
  - Seed par défaut : `seedDefault` (l'URL peut la remplacer avec `?seed=123`).
- **Couleurs de l'arène, textes de l'interface** : `presentation.ts`.

Un même seed et les mêmes combattants donnent le même duel. Changer une valeur
ici change le duel, c'est normal.

## Changer qui se bat

Le duel oppose les deux entrées de `FIGHTERS` (`fighters.ts`) : modifier ou
remplacer ces deux entrées. Un combattant de plus = une entrée de plus dans la
liste des specs, à brancher ensuite dans `main.ts`.
