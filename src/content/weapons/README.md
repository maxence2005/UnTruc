# content/weapons/

Les armes du jeu (story 002). Une arme est une donnée (`WeaponSpec`, type dans
`src/core/weapon-spec.ts`) déclarée dans le registre `WEAPONS` (`index.ts`) et
retrouvée par son identifiant : `WEAPONS.get('hammer')`. Le moteur (`core/`,
`physics/`, `render/`) ne connaît aucune arme.

## Ajouter une arme

1. Copier `sword.ts` (une main) ou `hammer.ts` (deux mains) sous un nouveau nom,
   par exemple `axe.ts`, et changer `id` (unique) et `name`.
2. **Forme et poids** : `pieces`, des rectangles dans le repère du manche (`y` = distance
   depuis la crosse vers la pointe, `x` = écart à l'axe). Chaque pièce a sa
   `density` : le poids de l'arme = somme des surfaces × densités (`weaponMass`).
   Une arme lourde met sa densité dans la tête, loin des mains (charte, section 3).
   `color` : `ARM_YELLOW` pour ce qui est tenu, `STEEL` pour le métal (`colors.ts`).
3. **Prise** : `hands` (1 ou 2), `mainGrip.at` (distance depuis la crosse) et
   `mainGrip.stiffness` (raideur 0..1, gardée à 1). C'est la seule articulation de
   l'arme. À deux mains, `offGrip.at` est obligatoire, plus loin sur le manche : la main
   arrière vient s'y poser et suit le manche, sans y être attachée.
4. **Tenue au repos** : `stancePose` (retouche de la posture du combattant, angles en
   radians, `+` = vers l'avant, voir `core/pose.ts`) et `stanceAngle` (angle de l'arme
   par rapport à l'avant-bras ; 0 = dans le prolongement, `+` = vers l'avant puis le
   haut). Tenir l'arme droite en garde : une arme pointée vers l'avant empale
   l'adversaire qui s'approche.
5. **Garde de parade** (`guard`, facultative) : `pose` (retouche de la posture au repos
   armée pendant la parade) et `angle` (angle de l'arme, comme `stanceAngle`). La parade
   reste décidée par la logique (chance tirée de l'agilité, 30 % des dégâts) : la garde
   n'est que le geste. **Sans `guard`, l'arme ne permet pas de parer** : son porteur peut
   seulement esquiver (le marteau, trop lourd).
6. **Attaque** (`attack`) : `windupPose` / `strikePose` (retouches de la posture),
   `windupAngle` / `strikeAngle` (angle de l'arme), `kick` (élan donné à l'arme au
   premier tick de la frappe : `forward`, `down` en px par pas, `spin` = moulinet en
   rad par pas, facultatif), durées `windupMs` / `strikeMs` / `recoveryMs`, `reach`
   (distance entre bassins qui déclenche l'attaque), `lungeSpeed`, `strikeArmBoost`,
   `damage` (dégât de base, multiplié par la vitesse d'impact comme les poings) et
   `strikingParts` (`['weapon']` : seule l'arme fait des dégâts).
7. **Muscle du poignet** : `wrist` (`kp`, `kd`, `pivotAtJoint: true`), comme les
   muscles du corps.
8. Ajouter l'arme à `WEAPON_LIST` dans `index.ts`. Elle est vérifiée au chargement
   (`assertWeaponSpec`) et par `tests/unit/weapons.test.ts` (`npm test`).
9. **La voir en duel sans toucher aux données** : `npm run dev`, puis l'adresse
   `?armes=axe,hammer` (dans l'ordre Rouge, Bleu ; `?armes=,axe` = Rouge aux poings) et
   `&seed=3`. Pour l'équiper pour de bon : `weapon: WEAPONS.get('axe')` dans une entrée de
   `FIGHTERS` (`../fighters.ts`). Sans `weapon`, le combattant se bat aux poings.
10. **La vérifier** : `npm run check:weapons -- axe,sword 3,7 <dossier>` joue chaque seed
   jusqu'au KO et signale ce qui ne va pas (voir plus bas). Ouvrir quelques captures du
   dossier : le script mesure, l'œil juge.

## Vérifier une arme : ce qu'on mesure et pourquoi

`npm run check:weapons` lit le hook du duel (`window.__untrucDuel`) et la sonde des armes
(`window.__untrucWeapons`, `src/debug/weapon-probe.ts`), installée dès qu'un combattant est
armé. Il échoue si, sur une des seeds :

| Mesure | Seuil | Ce que ça attrape |
|---|---|---|
| KO atteint | en moins de 60 s | combattants bloqués (croisés, coincés) |
| Écart main avant - prise | 3 px au plus | arme qui flotte à côté de la main |
| Envolée sans coup reçu | 0 tick | un muscle qui propulse son porteur |
| Coups portés avec l'arme | au moins 1 | geste qui ne descend jamais sur l'adversaire |
| Parades d'une arme sans garde | 0 | garde oubliée ou mal branchée |

L'écart main arrière - seconde prise, les parades et les esquives sont affichés. Avec un
dossier de captures, le script en prend aussi une à la première parade de chaque arme : la
garde se juge à l'œil.
Le duel sans arme doit rester identique : `?seed=3` sans `armes` finit au tick 1313,
PV 0 / 38, hash `1a46eb7a`.

## Ce que le marteau a appris (à ne pas refaire)

Le marteau a demandé de nombreux allers-retours. Les causes, pour que l'arme suivante aille vite :

- **Les muscles posent des vitesses, avec une force illimitée** (`physics/muscles.ts`).
  Toute pièce pilotée par un muscle doit rendre sa poussée au porteur
  (`wrist.reaction: true`, `physics/reaction.ts`), sinon une arme lourde fait décoller son
  porteur. L'envolée venait du poignet, pas d'un contact : on l'a d'abord mal diagnostiquée.
- **Une seule articulation physique par arme.** Un second lien vers la main arrière,
  même très souple (0,05), arrachait l'arme de la main avant (jusqu'à 28 px). La main
  arrière suit le manche à la place (`reachAngles`).
- **Plafond de vitesse sur la vitesse ET la rotation** (`maxSpeed`) : sans le second, la
  pointe dépasse le plafond et traverse la cible.
- **Une arme lourde traîne** : le bras ne suit pas une frappe trop courte. Régler
  `windupPose`, `strikeMs`, `strikeArmBoost` et `kick` pour que la tête descende sur
  l'adversaire ; vérifier « coups portés » sur deux seeds.
- **Ne pas masquer un défaut du moteur par un réglage** : baisser l'élan du marteau pour
  freiner l'envolée a dû être défait une fois la vraie cause corrigée.
- **Mesurer ce qu'on voit.** Le hash et le KO ne disaient rien de l'arme qui flottait
  hors de la main : c'est Maxence qui l'a vu. D'où la sonde et `check:weapons`.
- **Ne plus armer en modifiant `fighters.ts`** pour un essai : c'est oublié, ça casse les
  tests entre-temps et `npm run dev` recharge l'essai à chaud. Utiliser `?armes=`.

