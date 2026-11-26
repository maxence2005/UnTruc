# Art Bible: UnTruc

> **Status**: Draft
> **Owned By**: art-director
> **Last Updated**: 2026-11-09
> **Art Director Sign-Off (AD-ART-BIBLE)**: SKIPPED 2026-11-09 — solo mode

`/art-bible` writes these nine sections in this order and replaces each
section's `[To be designed]` line as that section is approved. A section still
holding its placeholder is incomplete; a later run fills only those.

## 1. Visual Identity Statement

**Règle visuelle :** tout est dessiné en formes simples et franches (contour sombre épais, aplats), et rien ne se lit par le détail : si on ne comprend pas la figure en silhouette, à petite taille et sans texte, elle est ratée. Vaut pour l'arène et pour l'interface ; porte sur la cohérence et la lisibilité, pas sur « simple pour toujours ».

*Le brief (rigor `minimal`) n'a pas de piliers : chaque principe s'appuie sur une ligne du pitch ou de « what they feel ».*

1. **Lisible avant joli.**
   - Sert : « armes et compétences lisibles en petites icônes » ; « on doit comprendre pourquoi un coup touche ou pas ».
   - Test : quand plus de détail gêne la lecture immédiate à petite taille, choisir la silhouette ou l'aplat qui se lit sans texte.
2. **Le poids se voit.**
   - Sert : « chaque coup pèse », « le poids des coups/armes », effets d'impact.
   - Test : quand un effet ou un décor concurrence le corps ou l'arme, choisir ce qui montre la masse et la cause du coup. L'effet souligne l'impact, il ne cache jamais le combattant.
3. **Du concret, pas du générique.**
   - Sert : « combats drôles et physiques », variété.
   - Test : entre un fond neutre, sombre ou lisse et un élément matériel et précis (casier, ruban adhésif, marquage de sport), choisir le matériel. Modèle : le style « Vestiaire » de l'écran de gestion (`prototypes/ecran-gestion-perso/`).

**À éviter** (dit par Maxence) :
- Fond noir ou sombre générique « qui fait IA ».
- Icônes trop cartoon, surtout pour les coups (poing, enchaînement, coup d'arme).
- Persos détaillés générés par code : moins beaux et incohérents.
- Compétences illisibles.

**Reste ouvert :** le look de l'arène (palette, ambiance, décor) ; une vraie image de vestiaire derrière l'écran de gestion. Dans l'arène, la règle impose seulement des combattants lisibles sur le fond, des formes cohérentes et des effets qui servent le coup.

**Hypothèses non dites par Maxence** (validées avec la section le 2026-11-09, à revoir si besoin) : contour épais + aplats (venu du brief et des captures) ; principe 3 étendu de l'écran de gestion à tout le jeu ; garde-fou « l'effet ne cache jamais le combattant ». Les formes simples sont une contrainte de cohérence, pas un idéal : Maxence voudrait plus de détail si c'était faisable de façon cohérente.

## 2. Mood & Atmosphere

*Règle commune : chaque état se reconnaît en vignette, sans texte, par une température dominante et un élément porteur. Les combattants gardent toujours le contraste le plus fort (Section 1, principe 2). « (proposition) » = pas encore décidé par Maxence.*

**Écran de gestion (Vestiaire)** — décidé
- Émotion : se préparer tranquillement, on bricole son combattant sans pression.
- Lumière : intérieur, néons froids vert-gris, égale, sans ombres portées marquées ; contraste bas sur le fond (#46645A / #3A554C), fort sur les icônes et le combattant.
- Adjectifs : calme, familier, bricolé, concret, ordonné. Énergie : basse à moyenne.
- Élément porteur : titres sur ruban adhésif crème (#E8D9A0) écrits au feutre.
- Ouvert : vraie image de vestiaire en fond. Si oui : plus sombre et moins saturée que les panneaux, floutée ou désaturée d'au moins un cran.

**Duel en cours** — (proposition)
- Émotion : curiosité amusée ; le joueur regarde, il ne joue pas.
- Lumière : chaude, éclairage de salle de sport par le haut ; contraste moyen sur le décor, fort sur les combattants.
- Adjectifs : chaud, physique, ouvert, sportif. Énergie : moyenne à haute.
- Élément porteur : sol de gymnase (parquet clair, lignes de terrain peintes) ; on sort du vestiaire, on entre sur le terrain. En vignette : vestiaire vert et froid, arène boisée et chaude.

**Gros impact (ralenti)** — (proposition, base piste 5 : vitesse 0,18 pendant 900 ms)
- Émotion : « oh ! », le poids du coup, puis le rire.
- Lumière : bref flash au point d'impact ; décor désaturé et assombri d'un cran pendant le ralenti ; combattants, arme et effet en pleine couleur.
- Adjectifs : lourd, suspendu, net, brutal, drôle. Énergie : pic.
- Élément porteur : onde de choc centrée sur le contact, avec les étincelles. L'effet ne recouvre jamais la tête ni l'arme.

**KO / victoire** — (proposition)
- Émotion : triomphe comique ; le perdant reste en ragdoll mou.
- Lumière : la salle s'éclaire et se réchauffe d'un cran ; le décor reprend sa couleur après le ralenti.
- Adjectifs : joyeux, absurde, chaleureux, libéré. Énergie : haute qui retombe.
- Élément porteur : bande de ruban « VICTOIRE » au feutre en travers de l'écran, sans couvrir le vainqueur.

**Défaite / élimination du tournoi** — (proposition)
- Émotion : déception légère, « on y retourne », sans punition.
- Lumière : la salle baisse et refroidit (gris-bleu) ; décor désaturé, pas les combattants. Jamais d'écran noir ou sombre générique.
- Adjectifs : retombé, honnête, calme. Énergie : basse.
- Élément porteur : tableau du tournoi, ligne du combattant barrée au feutre.

**Entre deux duels (tournoi)** — (later, proposition)
- Émotion : progression, attente du prochain adversaire.
- Lumière : celle du Vestiaire, un peu plus chaude. Énergie : moyenne.
- Élément porteur : tableau en liège accroché au casier, arbre du tournoi au feutre, portraits scotchés.

## 3. Shape Language

**Silhouette du combattant**
- Corps en formes simples (gélules et rectangles arrondis du ragdoll), tête ronde avec visage, contour sombre épais, aplats.
- Pas d'archétype. Traits distinctifs, par ordre de lecture en vignette :
  1. **L'arme** : la plus grande forme après le corps ; une arme lourde a une tête massive, le poids se voit à la forme (principe 2).
  2. **Coiffure et barbe** : changent le haut de la silhouette.
  3. **La tenue** : un bloc de couleur sur le torse.
  4. **Transformation** : la seule compétence qui change la silhouette (oreilles, museau, griffes, queue physique) ; se lit en ombre chinoise.
- Test : en silhouette noire à environ 48 px de haut, deux combattants diffèrent au moins par l'arme ou la coiffure.
- Toute figure a des membres et une pose. Jamais de rond nu pour une figure, jamais d'emoji.

**Géométrie de l'arène** — (proposition)
- Dominante horizontale : sol plat, lames de parquet, lignes de terrain, murs en longs rectangles.
- Diagonales et courbes réservées aux corps, aux armes et aux effets ; le décor reste droit pour que tout ce qui bouge se détache.
- Aucun élément de décor à hauteur de tête au-dessus des combattants.

**Grammaire de l'interface (Vestiaire)**
- Plaques de métal en rectangles à petit rayon (~6 px), rivets aux coins des grands panneaux, ruban adhésif légèrement incliné pour les titres, sans-sérif condensée pour le texte, feutre pour les titres seulement.
- **L'interface reste distincte de l'arène** : verticale, métallique, froide, contre horizontale, boisée, chaude (proposition). Communs : le contour, les pastilles d'icônes, le ruban adhésif.
- Le HUD du duel (proposition) reprend la grammaire du Vestiaire en petit, dans les marges.

**Formes principales et secondaires**
- Principales : combattants, armes, effets d'impact ; contour le plus épais, pleine saturation.
- Secondaires : décor de l'arène, fond du Vestiaire ; contour plus fin ou teinté, saturation et contraste plus bas, aplats sans détail.
- Effets : formes pointues (étincelles) pour l'impact, cercles pour l'onde de choc et la boule de feu ; ils soulignent le coup et ne masquent jamais le combattant.

**Grammaire des icônes**
- **Armes** : objet dessiné en diagonale (~45°) sur pastille **ronde** jaune arme.
- **Compétences** : pastille **carrée arrondie** (coins ~13 % du côté) de la couleur de la famille, pour toutes les compétences. La forme dit « compétence », le rond dit « arme ».
  - Pictogramme sportif : figure géométrique blanc craie (tête ronde, membres en barres) qui fait le geste.
  - Boule de feu et Transformation (tête de loup) gardent leur dessin, posé sur la pastille carrée (choix de Maxence, 2026-11-09).
  - Marques de famille dans les pictogrammes (impact, trajectoire) : libres, pas imposées (choix de Maxence) ; voir le risque en Section 4.
- **Équipé** : halo crème de la forme de la pastille + coche dans un disque en haut à droite. **Focus** : contour pointillé blanc craie.
- Interdits : emoji ; rond nu pour une figure ; icône de coup cartoon (poing gonflé, étoiles) ; texte dans l'icône.

## 4. Color System

**Palette de base**

| Couleur | Hex | Rôle dans ce monde |
|---|---|---|
| Encre | #22302A | Tous les contours et le texte sur ruban ; une seule encre pour tout le jeu (proposition pour l'arène). |
| Vert casier | #46645A (fond), #557466 (panneaux), #486457 (lignes d'item), #3A554C (ombres) | Le Vestiaire : la préparation, le calme. Interface seulement. Panneaux assombris d'un cran par rapport au prototype (#6E8C7F) pour la lisibilité du texte (Section 7). |
| Crème ruban | #E8D9A0 | Ce qui est nommé ou choisi : titres, halo d'équipement. |
| Blanc craie | #F3F5EF | Texte sur métal, figures des pictogrammes. |
| Bois de salle | à définir (proposition : miel clair, moins saturé que le jaune arme) | Le sol de l'arène : la chaleur du duel. |
| Gris acier | #9AA3AD | Le métal porté ou tenu (têtes d'armes, armure) : fait lire le poids. |

**Couleurs sémantiques** (communes à tout le jeu)
- Familles : arme #E3B23C (objet tenu en main) · frappe #D9573B (coup au contact) · mouvement #2F8FB8 (déplacement offensif) · magie #8064C8 (pouvoir à distance) · transformation #6FB04A (changer de corps).
- Équipé : halo crème #E8D9A0, coche, ligne #557236 avec la mention « En main » (#8AA06A du prototype abandonné : 2,5:1). Focus : pointillé blanc craie #F3F5EF.
- PV et dégâts (proposition) : jauge en plaque, remplissage crème ; le morceau perdu clignote en rouge frappe puis se vide en encre. Le rouge veut aussi dire « ça a fait mal ».
- Danger (proposition) : remplissage rouge sous 25 % de PV, avec pulsation et encoches visibles.
- Effets (proposition) : étincelles blanc chaud ou crème ; boule de feu orange-jaune avec halo violet magie ; éclair vert transformation au passage en loup-garou.

**Interface et arène**
- Interface froide et verte ; arène chaude et boisée (proposition). Communs : encre, crème, blanc craie, les cinq couleurs de famille.
- Le vert casier ne sort jamais de l'interface : pas de vert dominant dans le décor de l'arène (confusion avec Transformation).

**Température par zone** : Vestiaire froid · arène chaude (proposition) · ralenti : décor désaturé, combattants et effet en couleur · défaite : décor refroidi · décor toujours moins saturé et contrasté que les combattants.

**Daltonisme : paires à risque et relais**

| Paire | Confusion | Relais |
|---|---|---|
| Arme #E3B23C / Transformation #6FB04A | vert/jaune | Forme : pastille ronde (arme) contre carrée (compétence). Réglé. |
| Frappe #D9573B / Transformation #6FB04A | rouge/vert | Dessin (figure contre tête de loup) + libellé. |
| Mouvement #2F8FB8 / Magie #8064C8 | bleu/violet | Dessin (figure contre boule de feu) + libellé. |
| Frappe / Mouvement | luminances proches (~0,22 / ~0,24) : échec en niveaux de gris | Même forme : seul le pictogramme les distingue. **Risque accepté** (marques libres, choix de Maxence) ; secours : libellé et info-bulle. |
| Arme / Frappe | rouge/jaune (protanopie) | Forme (rond contre carré), objet contre figure. |
| Halo d'équipement / Arme | crème/jaune, faible contraste | Coche, mention « En main », ligne verte. |
| Ligne équipée #557236 / Transformation | vert/vert | Coche et libellé. |
| Rouge dégâts / bois de salle | rouge/brun | Contour encre, éclat en pointes à cœur blanc ; la jauge porte des encoches. |
| Rouge PV bas / remplissage crème | rouge/jaune | Encoches, pulsation, valeur en chiffres. |

**À revoir en Section 5** : les peaux verte (#b8e0a0) et bleue (#a9c8ff) des cosmétiques peuvent rappeler Transformation et Mouvement.

**Hypothèses non dites par Maxence** (validées avec la section) : familles communes à tout le jeu ; rouge = dégâts et danger ; seuil de 25 % ; une seule encre.

## 5. Character Design Direction

[To be designed] — the player character's visual archetype, how players tell
enemies, NPCs and allies apart at a glance, expression and pose style, and how
much detail survives at game camera distance (LOD philosophy).

## 6. Environment Design Language

[To be designed] — architectural style and its tie to the world's culture,
texture philosophy (painted, PBR or stylised, and why), prop density rules per
area type, and environmental storytelling guidelines.

## 7. UI/HUD Visual Direction

### Vue artistique

- **Où vit l'interface** : écran de gestion = interface plein écran, style Vestiaire (décidé). Duel = HUD en espace écran, dans les marges, même grammaire en petit : noms sur ruban adhésif, PV en plaque de métal (proposition). Rien de diégétique dans l'arène.
- **Typographie** :
  - Une sans-sérif condensée pour tout le texte (prototype : Avenir Next Condensed).
  - Un « feutre » pour les titres et les grands moments seulement (« VICTOIRE ») (prototype : Marker Felt).
  - Hiérarchie (à 1280×720 logique) : titres 28-30 · noms d'items 18-20 gras · étiquettes 14-16. **Minimum 14 px**.
  - Les polices du prototype sont des polices système macOS, absentes ailleurs : le jeu embarque des polices sous licence libre (OFL ou Apache 2.0), une condensée et une manuscrite façon feutre, installées par npm (`@fontsource`) : Barlow Condensed (OFL) et Permanent Marker (Apache 2.0) (Maxence, 2026-11-26). Le texte de leurs licences accompagne le jeu (crédits).
- **Icônes** : voir Section 3 (rond = arme, carré arrondi = compétence, pictogrammes sportifs).
- **Animation** : l'interface ne bouge qu'en réponse à une action.
  - Équiper : « clac » court (pastille 1,0 → 1,08 → 1,0 en 120 ms).
  - Un seul moment orchestré : la porte du casier qui s'ouvre entre la gestion et le duel (proposition).
  - Pas d'animation en boucle ; « mouvement réduit » du système respecté.

### Vue UX

- **Duel** : le joueur regarde, il ne joue pas. Les infos les plus importantes sont les PV, la compétence lancée (nom ou icône) et la raison d'un coup sans dégâts (bloqué, esquivé, raté). Elles s'affichent au-dessus des têtes ou dans les marges, jamais sur les combattants (Section 1, principe 2).
- **Écran de gestion** : le toucher remplace le survol (un tap montre l'info-bulle) ; focus clavier toujours visible (pointillé). Jouable au clavier seul ; pas de manette (jeu web).
- **Couleur jamais seule** : voir le tableau daltonisme de la Section 4.
- **Clignotement** : jamais plus de 3 fois par seconde (flash d'impact, pulsation des PV bas).
- **Contraste du texte** (WCAG : 4,5:1 petit texte, 3:1 gros texte et graphismes), mesuré sur les couleurs du prototype :
  - Texte craie sur panneau #6E8C7F : 3,3:1, **échec**. Ligne équipée (« En main » sur #8AA06A) : 2,5:1, **échec**.
  - Feutre sur ruban : 10:1 ; craie sur fond #46645A : 5,9:1 ; pictogrammes sur pastilles : ~3,3:1 (graphismes) : **passent**.

### Conflit et décision

- Art : panneaux vert clair du Vestiaire. UX : petit texte illisible dessus.
- **Décision de Maxence (2026-11-09) : assombrir les panneaux.** Panneau #557466 (texte craie 4,7:1), ligne d'item #486457 (5,9:1), ligne équipée #557236 (« En main » 4,8:1). Couleurs reportées en Section 4.
- Reste : texte secondaire #D2E2D8 directement sur panneau = 3,8:1 → seulement en 19 px gras ou plus, ou posé sur une ligne d'item.

## 8. Asset Standards

[To be designed] — file formats, naming convention, texture resolution tiers,
LOD levels, export settings, and the engine's hard limits (poly budgets per
asset category, texture memory, material slots). Where an art preference and a
technical limit disagree, record both and the trade-off chosen.

## 9. Reference Direction

[To be designed] — 3–5 references (games, films, art styles or artists). For
each: the specific element to take from it, and what to avoid so the result
does not read as a copy.
