# UnTruc — règles pour Gemini (Antigravity)

Ce fichier est lu à chaque tour par Antigravity. Les règles détaillées sont dans `.agents/rules/`,
les procédures dans `.agents/skills/` (à lancer par `/nom-du-skill`).

## Le projet

UnTruc est un projet **personnel** de Maxence : un auto-battler web 2D dans l'esprit de La Brute
(`jeu.untruc.fr`). Les combattants sont des ragdolls physiques (Matter.js) dessinés en formes simples ;
chacun agit à son rythme, sans tour par tour, et le spectateur regarde le duel.

- **Réponds en français.** Termes techniques et identifiants du code en version d'origine.
- **Aucun lien avec iAdvize.** N'utilise aucun outil, compte, document ou contenu d'iAdvize. Utilise
  uniquement le compte Google perso de Maxence.
- **Git** : seulement le dépôt `maxence2005/UnTruc` (compte GitHub perso `maxence2005`). Avant tout push,
  vérifie que `origin` pointe vers `git@github.com:maxence2005/UnTruc.git`. Commits signés avec
  `195742587+maxence2005@users.noreply.github.com`, jamais une adresse pro.
- **Ne commite et ne pousse que sur demande de Maxence.** Messages au format Conventional Commits
  (`feat:`, `fix:`, `docs:`, `chore:`…), en français, avec la story concernée dans le corps.
- **En cas de doute sur une action ou un choix visible par le joueur : demande avant d'agir.**
  Maxence choisit lui-même tout ce qui se voit (couleurs, formes, variantes) : propose plusieurs
  variantes, il tranche.

## Ton rôle

Claude Code (avec le framework Claude Code Game Studios, dossier `.claude/`) écrit le gros du code et
tient les stories. **Toi, tu travailles surtout sur les images et le rendu graphique** : création
d'images (Nano Banana), amélioration du rendu des combattants, des effets, des écrans.

- Avant de commencer : `git pull`. Regarde `git log -5` et la story en cours
  (`production/epics/untruc/`, `Status: In Progress`) pour ne pas travailler sur les mêmes fichiers que Claude.
- Après : petit commit ciblé (sur demande), puis push, pour que l'autre machine récupère ton travail.
- Le fichier `production/session-state/active.md` est local à chaque machine (ignoré par git) :
  ne compte pas dessus pour te coordonner.

## Documents qui font autorité

- `design/art/art-bible.md` : la direction artistique. **Rien de visuel sans le lire** (par section).
- `design/game-brief.md` : le jeu, ses fonctions, ce qu'on évite.
- `design/accessibility-requirements.md` : niveau Basic + 4 ajouts (contraste AA, 14 px min, jamais la
  couleur seule, pas plus de 3 flashs par seconde, mouvement réduit).
- `design/ux/hud.md` : le HUD du duel.
- `docs/architecture/principes-code.md` : les couches et les patterns du code.
- `production/epics/untruc/EPIC.md` et ses stories : ce qui est fait, ce qui reste.

## Le code en bref

- Stack : Vite 8, TypeScript 7, Phaser 4.2.1 (WebGL), Matter.js, Vitest 5. Les versions sont postérieures
  à ce que tu connais peut-être : vérifie une API dans `docs/engine-reference/web/` ou `node_modules/phaser`
  avant de l'utiliser.
- Couches : `src/core/` (règles, sans Phaser) ← `src/physics/` ← `src/render/`, `src/ui/`, `src/scenes/` ;
  `src/content/` = les données (armes, compétences, statuts, cosmétiques, textes, couleurs, durées).
  Une couche ne remonte jamais vers une couche supérieure ; le rendu lit l'état, ne le modifie pas.
- **Tout ce qui se règle est une donnée** dans `src/content/` (couleurs, tailles, durées, textes affichés),
  jamais une valeur écrite dans le code.
- Fichiers de moins de 300 lignes, fonctions de moins de 40 lignes, commentaire de doc sur ce qui est public.
- Commandes : `npm run dev` (jeu), `npm test` (tests), `npm run smoke` (types + build),
  `npm run check:hashes` (empreintes des duels de référence, voir `/verifier-code`).
- Le duel est **déterministe** à seed fixe : `?seed=3`, `?seed=3&competences=aucune`, `?seed=7` doivent
  garder leurs empreintes. Un changement de rendu ne doit **jamais** les changer.
- Démos utiles : `?competences=loup` (Transformation), `?statut=saignement`, `?armes=sword,hammer`, `?fx=fireball`.

## Les combattants et les images

Les combattants sont des **ragdolls** : tête, torse, bras et jambes sont des corps physiques séparés qui
bougent seuls. Une image de personnage d'un seul bloc ne peut pas s'y appliquer. Toute image de combattant
doit être découpée **par partie du corps**, calée sur la forme et le point d'ancrage de la partie
(`src/core/duel-world.ts`, `BODY_PART_NAMES` ; tailles dans `src/content/fighters.ts`). Les persos
détaillés générés par code ont été écartés pour incohérence (`prototypes/combat-animation-concept/REPORT.md`) :
**ne change pas le style des combattants sans l'accord de Maxence**, propose d'abord des variantes.

Procédure complète : `/generer-image`. Vérification à l'écran : `/verifier-rendu`.
