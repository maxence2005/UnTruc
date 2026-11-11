# content/

Données du jeu, lues par un moteur générique (`core/`, `physics/`, `render/`).
Aucune valeur d'équilibrage ne vit dans la logique : tout se règle ici.

## Changer un réglage

- **Un combattant** (PV, dégâts, durées, forces des muscles, poses, couleurs) :
  `fighters.ts`. `BASE_FIGHTER` est partagé ; chaque entrée de `FIGHTERS`
  écrase ce qu'elle veut (`...BASE_FIGHTER, stats: { ...BASE_FIGHTER.stats, hp: 150 }`).
  - Stats (`stats`, neuf valeurs) : `hp` (PV max, 100), `physicalPower` (10, multiplie les dégâts), `weight` (70, masse du corps et résistance à l'étourdissement). Valeurs au départ sans effet : `magicPower` (10), `stamina` (100, réserve d'énergie), `mana` (50, réserve), `agility` (10), `speed` (10), `intelligence` (0 : chaque point gagné débloquera un comportement, story 004).
  - Dégât de base d'un coup : `attack.damage` (fixe, multiplié ensuite par la vitesse d'impact, voir `duel-config.ts`).
  - Rythme d'un coup : `attack.windupMs`, `strikeMs`, `recoveryMs` ; portée : `attack.reach` (px).
  - Étourdissement de base : `stunMs` (280 ms ; un coup reçu interrompt l'action en cours). La durée réelle = `stunMs` × facteur d'impact ÷ facteur de poids, bornée (voir `stats` dans `duel-config.ts`).
  - Force des muscles : `muscles.*.kp` (raideur) et `kd` (réactivité) ; par état : `stateTuning`.
  - Gestes : `stance`, `slump`, `attack.windupPose`, `attack.strikePose` (radians, `+` = vers l'avant, voir `core/pose.ts`).
- **L'arène, le pas fixe, le rythme des actions, les dégâts, la physique** : `duel-config.ts`.
  - `stepHz` (60) : ne pas le changer sans régler de nouveau les muscles (`kd`), le maintien debout et la marche, qui sont exprimés par pas de simulation.
  - Taille : `arena.width` / `height` (l'écran s'adapte).
  - Premier coup : `action.firstDelayMs` (combattant 0) + `action.firstDelayStaggerMs` par index suivant.
  - Délai entre deux coups d'un même combattant : `action.delayBaseMs` + part aléatoire seedée dans [0, `action.delayRandomMs`).
  - Facteur de dégâts selon la vitesse d'impact : `damage.referenceSpeed` (px par pas, donne le dégât de base), borné par `damage.minFactor` et `damage.maxFactor`.
  - Formules des stats (`stats`) : `referencePhysicalPower` (10, puissance qui donne les dégâts de base), `referenceWeight` (70, poids qui donne la masse de base), `minMassScale` (0.5) et `maxMassScale` (3) bornent `weight / referenceWeight` (masse et étourdissement), `minStunMs` (100) et `maxStunMs` (600) bornent la durée d'étourdissement.
  - Vitesse minimale d'un contact pour compter comme un coup : `minHitSpeed`.
  - Seed par défaut : `seedDefault` (l'URL peut la remplacer avec `?seed=123`).
- **Couleurs de l'arène, textes de l'interface** : `presentation.ts`.

Un même seed et les mêmes combattants donnent le même duel. Changer une valeur
ici change le duel, c'est normal.

## Changer qui se bat

Le duel oppose les deux entrées de `FIGHTERS` (`fighters.ts`) : modifier ou
remplacer ces deux entrées. Un combattant de plus = une entrée de plus dans la
liste des specs, à brancher ensuite dans `main.ts`.
