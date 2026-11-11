# content/

Données du jeu, lues par un moteur générique (`core/`, `physics/`, `render/`).
Aucune valeur d'équilibrage ne vit dans la logique : tout se règle ici.

## Changer un réglage

- **Un combattant** (PV, dégâts, durées, forces des muscles, poses, couleurs) :
  `fighters.ts`. `BASE_FIGHTER` est partagé ; chaque entrée de `FIGHTERS`
  écrase ce qu'elle veut (`...BASE_FIGHTER, stats: { ...BASE_FIGHTER.stats, hp: 150 }`).
  - Stats (`stats`, dix valeurs) : `hp` (PV max, 100), `physicalPower` (10, multiplie les dégâts), `weight` (70, masse du corps, résistance à l'étourdissement et au recul, lenteur de marche), `stamina` (100, réserve d'endurance et son plafond), `recovery` (10, récupération d'endurance), `agility` (10, chances d'esquive, de parade, de contre-attaque et d'enchaînement), `speed` (10, raccourcit le délai entre deux actions). Valeurs au départ sans effet : `magicPower` (10), `mana` (50, réserve), `intelligence` (0 : chaque point gagné débloquera un comportement, story 004).
  - Dégât de base d'un coup : `attack.damage` (fixe, multiplié ensuite par la vitesse d'impact, voir `duel-config.ts`).
  - Rythme d'un coup : `attack.windupMs`, `strikeMs`, `recoveryMs` ; portée : `attack.reach` (px).
  - Étourdissement de base : `stunMs` (280 ms ; un coup reçu interrompt l'action en cours). La durée réelle = `stunMs` × facteur d'impact ÷ facteur de poids, bornée (voir `stats` dans `duel-config.ts`).
  - Force des muscles : `muscles.*.kp` (raideur) et `kd` (réactivité) ; par état : `stateTuning`.
  - Gestes : `stance`, `slump`, `dodgePose` (esquive), `parryPose` (garde), `attack.windupPose`, `attack.strikePose` (radians, `+` = vers l'avant, voir `core/pose.ts`).
- **L'arène, le pas fixe, le rythme des actions, les dégâts, la physique** : `duel-config.ts`.
  - `stepHz` (60) : ne pas le changer sans régler de nouveau les muscles (`kd`), le maintien debout et la marche, qui sont exprimés par pas de simulation.
  - Taille : `arena.width` / `height` (l'écran s'adapte).
  - Premier coup : `action.firstDelayMs` (combattant 0) + `action.firstDelayStaggerMs` par index suivant.
  - Délai entre deux coups d'un même combattant : (`action.delayBaseMs` + part aléatoire seedée dans [0, `action.delayRandomMs`)) × facteur de vitesse `stats.referenceActionSpeed` (10) ÷ `speed`, borné par `stats.minDelayScale` (0.4) et `stats.maxDelayScale` (2.5).
  - Limite de portée : `action.approachResumeMargin` (15 px). Un combattant en marche s'arrête à `attack.reach` ; arrêté, il ne repart qu'au-delà de `reach` + cette marge, ou quand son délai est écoulé.
  - Réactions (`reactions`) : chance = `base` + `perAgility` × agilité, plafonnée à `max`, pour `dodgeChance` (esquive : aucun dégât), `parryChance` (tirée si l'esquive échoue), `counterChance` (après une esquive ou une parade, sans attendre le délai), `comboChance` (après un coup qui a touché sans être paré). `leadMs` (150) : avance du geste du défenseur sur la frappe. `dodgeRetreatSpeed` (3 px par pas) : recul pendant l'esquive. `parryFactor` (0.3) : part des dégâts et du recul d'un coup paré, qui ne sonne pas. `maxComboHits` (3) : coups d'une série.
  - Endurance : coûts dans `reactions.staminaCost` (`attack` 6, `dodge` 12, `parry` 8, `counter` 8, `combo` 10). Sans l'endurance pour payer, pas d'esquive, de parade, de contre ni d'enchaînement ; l'attaque simple reste possible. Elle remonte de `stats.staminaRegenPerRecovery` (0.5) × `recovery` par seconde, hors attaque et hors réaction.
  - Recul d'un coup (`stats`) : `knockbackSpeed` (3.5 px par pas) × facteur d'impact × (poids attaquant ÷ poids victime), ce rapport borné par `minKnockbackRatio` (0.25) et `maxKnockbackRatio` (4) ; `knockbackLift` (0.4) : part envoyée vers le haut.
  - Marche selon le poids (`stats`) : `walk.speed` × (`referenceWeight` ÷ `weight`) ^ `walkWeightExponent` (1), borné par `minWalkScale` (0.35) et `maxWalkScale` (1.5).
  - Étourdissements en série : `stats.maxStunSeriesMs` (900) plafonne leur durée cumulée ; au-delà, un coup fait ses dégâts mais ne sonne plus, jusqu'au réveil.
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
