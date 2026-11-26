# content/skills/

Les compétences du jeu (story 004). Une compétence est une donnée (`SkillSpec`, type dans
`src/core/skill-spec.ts`) déclarée dans le registre `SKILLS` (`index.ts`) et retrouvée par son
identifiant : `SKILLS.get('jump')`. Le moteur (`core/skill-system.ts`) ne connaît aucune
compétence : il lit une **timeline de phases**. Ce que le spectateur voit (nom, couleur, cible,
effets) est dans `../presentation.ts`, champ `skills.byId`.

## Ajouter une compétence

1. Copier la compétence la plus proche : `charge.ts` (au sol, corps à corps), `jump.ts`
   (saut visé), `fireball.ts` (projectile). Changer `id` (unique).
2. **Catégorie et points** : `category` vaut `attack` (mêlée physique), `magic` (coûte du mana)
   ou `transformation` (réservée à la story 005) ; une catégorie inconnue est refusée au chargement.
   Libellés : `skills.categories` dans `../presentation.ts`. `points` (entier, 1 au moins) : coût
   pour ajouter la compétence au personnage, plus cher pour une compétence forte. Aucun budget
   n'est appliqué pour l'instant (écran de gestion, niveaux : plus tard).
3. **Quand elle part** : `cost` (`stamina`, `mana`, payés au lancement ; sans de quoi payer, elle
   n'est pas proposée), `cooldownMs` (recharge), `conditions` (`minDistance` / `maxDistance` entre
   bassins en px, `Infinity` permis ; `maxOwnHpShare` : 1 = toujours, 0.3 = sous 30 % des PV),
   `weight` (poids du tirage parmi les compétences possibles). La chance de tenter une compétence
   plutôt qu'un coup simple est commune : `skills.useChance` dans `../duel-config.ts`.
4. **Réactions** : `reactions.dodgeable`, `reactions.parryable`. Elles passent par le même chemin
   que les coups simples (esquive = aucun dégât, parade = 30 %, pas d'étourdissement). Saut et
   charge : les deux ; boule de feu : esquivable, pas parable.
5. **Dégâts** : `hit.damage` (dégât de base), `hit.scaling` (`physical` : × facteur d'impact × force
   physique, comme un coup ; `magic` : × `magicPower` ÷ `skills.referenceMagicPower`),
   `hit.strikingParts` (parties qui frappent pendant une fenêtre de coup).
6. **Timeline** (`timeline`) : une liste de phases jouées dans l'ordre. Chaque phase :
   - `name`, `durationMs`, `pose` (retouche de la posture, radians, `+` = vers l'avant, voir
     `core/pose.ts` ; interpolée depuis la pose de la phase précédente) ;
   - `strikeWindow` : un contact des `strikingParts` compte comme un coup ; `endOnHit` : la phase
     s'arrête au premier coup ;
   - `walkSpeed` (px par pas vers l'adversaire, au sol), `armBoost` (force des bras) ;
   - `airborne` : le maintien debout est coupé (en l'air) ;
   - `impulse` (saut visé, la phase doit être `airborne`) : `maxSpeedX`, `maxSpeedY` (px par pas),
     `standoff` (px avant la cible où retomber). La vitesse est calculée pour retomber sur le point
     visé **au lancement** après la durée de cette phase et des phases `airborne` qui suivent ;
   - `projectile` : `speed` (px par pas), `spawnPart`, `hitRadius`, `hitParts`, `maxFlightMs` ;
   - `cue` : nom d'événement de rendu émis à l'entrée de la phase (`skillCue`).
   La dernière phase est la récupération (`pose: {}` = retour à la posture).
7. **Ce qu'on voit** : une entrée dans `skills.byId` de `../presentation.ts` : `name` (affiché au
   lancement), `color`, `marker` (cible marquée au sol, pour un saut), `cues` (effets par `cue` :
   `sparks`, `shockwave`, `flash`, `trail`, `slowmo`, ancrés aux pieds, à la main ou au torse),
   `onHit` (au point d'impact), `onMiss` (fin d'un projectile qui n'a rien touché).
   **Une compétence sans effet n'est pas finie** (story 004).
8. Ajouter la compétence à `SKILL_LIST` dans `index.ts` (vérifiée au chargement par
   `assertSkillSpec`, et par `tests/unit/skills.test.ts`), puis à un combattant :
   `skills: [SKILLS.get('id')]` dans `../fighters.ts`.

## Compétence à déclenchement (story 005)

La Transformation (`transformation.ts`) ne se tire pas : elle part toute seule sur des seuils de PV.
Le moteur (`core/skill-trigger.ts`) ne connaît aucune compétence ; tout est dans le champ `trigger`
(`core/skill-trigger-spec.ts`, validé au chargement). Pour en ajouter une :

1. Copier `transformation.ts`. Les champs `cost`, `cooldownMs`, `weight`, `conditions`, `reactions`,
   `hit` et `timeline` sont ignorés (valeurs neutres, `timeline: []`) : seuls `id`, `category` et `points`
   comptent, avec `trigger`. Une compétence à déclenchement n'est jamais tirée comme une autre.
2. `trigger.stages` : des stades du seuil de PV le plus haut au plus bas. Chacun a `id` (unique dans la
   compétence), `hpShare` (entre 0 et 1 exclus : part de PV max ; le stade part quand PV <= part × PV max),
   `timeline` (phases sans coup ni mouvement : le combattant est immobile pendant leur durée ; `cue` émis
   comme pour une compétence).
3. Effets d'un stade, tous facultatifs : `strike` (`damage`, `stunMs` : l'adversaire les subit sans
   esquive ni parade possibles, et l'étourdissement passe outre `stats.maxStunMs` et `maxStunSeriesMs`),
   `arena` (`intensity` de 0 à 1, `durationMs` : onde et tremblement d'écran, lus par le rendu dans l'événement
   `skillTrigger`), `statBonus` (`speed`, `agility` : additifs jusqu'à la fin du duel), `hitApplies` (statuts
   que chaque coup de corps du combattant applique ensuite, ex. le saignement des griffes ; le coup porte
   alors `form` = id du stade dans l'événement `hit`).
4. Règles : chaque stade se joue une fois par duel ; si un coup franchit plusieurs seuils, seul le plus bas
   se joue ; un combattant KO ne déclenche rien ; le stade attend que le combattant soit à l'arrêt ou en
   approche (sonné, en attaque, en compétence, en récupération ou en réaction : il attend) ; un seul combattant
   déclenche par tick (Rouge d'abord). La forme reste jusqu'à la fin du duel, même soigné.
5. Ce qu'on voit, par stade : `skills.byId.<id>.stages.<stade>` dans `../presentation.ts` (types :
   `core/stage-presentation.ts`) : `name` et `color` du bandeau (sinon le nom de la compétence), `flash`,
   `burst`, `slowmo`, `arena` (onde qui traverse l'arène, tremblement d'écran coupé en mouvement réduit),
   `cosmetics` (posés jusqu'à la fin du duel, voir `../cosmetics/README.md`), `scratches` (griffures sur
   les coups de la forme). Les flashs des stades passent par une limite commune (`skills.stageFlashLimit`).
6. Démo : `?competences=loup` donne la Transformation à Rouge (`src/debug/transformation-demo.ts`).

## Erreurs à éviter

- **Ne pas donner d'élan par un muscle.** Un muscle pose des vitesses avec une force illimitée ;
  un saut est une vraie impulsion (`impulse`), appliquée une fois à tout le corps.
- **Viser au lancement, pas pendant le vol.** Le point visé est montré au spectateur ; un saut qui
  corrige sa course en l'air rendrait la raison d'un raté illisible (l'adversaire s'est déplacé).
- **Un saut trop court ne se lit pas** : sous ~800 ms de vol, il ne monte que de quelques dizaines
  de pixels. `maxSpeedX` borne la portée : au-delà, le saut retombe court (« Raté »).
- **Pas de compétence sans fenêtre de coup ni projectile** : refusée (elle ne toucherait jamais).
- **Distance minimale** : une compétence à distance (`minDistance`) n'est jamais lancée plus près.
- Tester en duel : `npm run dev`, `?seed=3` ; `?competences=aucune` rejoue le duel sans
  compétences (référence seed 3 : tick 1313, PV 0 / 38, hash `1a46eb7a`).
