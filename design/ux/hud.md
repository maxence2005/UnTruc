# HUD Design

> **Status**: Draft — à valider par /ux-review
> **Author**: Maxence + ux-designer
> **Last Updated**: 2026-11-17
> **Platform Targets**: Web (navigateur, ordinateur et mobile) ; clavier et toucher, pas de manette (art bible, Section 7). Le HUD du duel est en lecture seule : aucune interaction pendant le combat.
> **Template**: HUD Design
> **Story**: `production/epics/untruc/story-014-hud-duel.md`

---

## HUD Philosophy

**Discret, l'arène d'abord** (Maxence, 2026-11-17). Le spectateur regarde les combattants, il ne joue pas. Le HUD reste petit, dans les marges, et seuls les moments forts prennent de la place : lancement d'une compétence, coup sans dégâts, KO et victoire. Rien ne se dessine sur les combattants (art bible, Section 1, principe 2). Ce qui peut se lire sans texte se lit sans texte (art bible, principe 1).

Conséquence : un élément qui n'aide pas à comprendre ce qui se passe *maintenant* n'est pas affiché en permanence.

---

## Information Architecture

### Full Information Inventory

Pas de GDD au niveau `minimal` : l'inventaire vient des stories 004 (compétences, mana), 013 (statuts) et 014 (HUD), et de l'art bible (Section 7).

| # | Information | Source |
|---|---|---|
| 1 | Nom du combattant | story 001 |
| 2 | Vie (PV), traînée de dégâts, alerte PV bas | stories 001, 014 ; art bible Section 4 |
| 3 | Énergie (stamina) | stories 008, 009, 014 |
| 4 | Mana | stories 004, 008, 014 |
| 5 | Statuts : icône et nombre de charges | story 013 |
| 6 | ~~Portrait expressif~~ : retiré par Maxence le 2026-11-17 | story 014 |
| 7 | Icônes des compétences : lancement, recharge, mana insuffisant | stories 004, 014 |
| 8 | Bandeau du nom de compétence dans l'arène | story 004 (nouveau look : story 014) |
| 9 | Raison d'un coup sans dégâts : « Bloqué », « Esquivé », « Raté » | story 004 |
| 10 | Annonces : « Combat ! », KO, victoire | story 014 |

### Categorization

Décidé par Maxence le 2026-11-17 :

| Catégorie | Éléments |
|---|---|
| **Toujours affiché** | 1 nom, 2 vie, 3 énergie, 4 mana |
| **Contextuel** | 5 statuts (seulement s'il y en a ; la ligne apparaît sous la barre), 7 icônes de compétences (au lancement et pendant la recharge), 8 bandeau de compétence, 9 raisons, 10 annonces |
| **Retiré** | 6 portrait : pas de portrait dans le HUD |
| **À la demande** | aucun : le spectateur n'a pas de commande pendant le duel |
| **Caché** | aucun |

Les déclencheurs des éléments contextuels sont dans « HUD Element Specifications ».

---

## Layout Zones

**Coins hauts, en miroir** (Maxence, 2026-11-17) : chaque combattant dans son coin haut, Rouge à gauche, Bleu à droite ; le centre haut sert aux annonces. Le reste de l'écran appartient à l'arène.

```
+------------------------------------------------------------+
| Rouge [======= vie =======]          [======= vie =======] Bleu |  Z1
|       [- énergie -][- mana -]        [- mana -][- énergie -]    |  Z2
|       (statuts)  (compétences)  COMBAT !  (compétences)  (statuts)  Z3 / Z4
|                                                            |
|            [Saut]                 « Esquivé »              |  Z5 (arène)
|              o/                       \o                   |
|             /|                         |\                 |
|=============/ \=======================/ \==================|
+------------------------------------------------------------+
```

| Zone | Contenu | Toujours ? |
|---|---|---|
| Z1 coin haut, par combattant | nom (sur ruban adhésif, art bible) et barre de vie | oui |
| Z2 sous la barre de vie | deux barres fines : énergie, mana | oui |
| Z3 sous Z2, côté extérieur | statuts (icône et charges) | quand il y en a un |
| Z3 sous Z2, côté intérieur | icônes des compétences lancées ou en recharge | quand il y en a une |
| Z4 centre haut | annonces : « Combat ! », KO, victoire | au début et à la fin |
| Z5 arène, au-dessus des têtes | bandeau du nom de compétence, raisons « Bloqué », « Esquivé », « Raté » | au moment où ça arrive |

- Miroir : chez Bleu, l'ordre est inversé (barre ancrée à droite, statuts tout à droite, compétences vers le centre).
- Rien dans Z1 à Z4 ne descend dans la zone où les combattants sautent : le HUD occupe au plus le haut de l'écran (voir « Visual Budget »).

---

## HUD Element Specifications

Grammaire commune (art bible, Sections 3, 4 et 7) : contour encre #22302A, aplats, plaques de métal à petit rayon, texte en sans-sérif condensée (14 px minimum), feutre réservé aux grands moments. Chez Bleu, tout est en miroir. « (hypothèse) » = valeur proposée, pas encore validée par Maxence.

**E1 — Nom** · toujours affiché
- Forme : nom en majuscules, écrit au feutre sur un ruban adhésif crème #E8D9A0 légèrement incliné, posé au bout extérieur de la barre de vie.
- Mise à jour : jamais pendant le duel.

**E2 — Vie** · toujours affichée
- Forme : barre en plaque de métal (gris acier #9AA3AD, contour encre), remplissage **crème #E8D9A0** (Maxence, 2026-11-17). Encoches tous les 25 % des PV max.
- Mise à jour : à chaque événement `hit` (et plus tard aux dégâts de statut, story 013).
- **Traînée de dégâts** : le morceau perdu reste affiché, **hachuré** (rayures encre sur rouge frappe #D9573B), clignote (2 clignotements au plus, jamais plus de 3 par seconde), puis se vide en encre (hypothèse : tenue 400 ms, vidage 300 ms). Les hachures le distinguent du remplissage, même quand celui-ci est rouge sous 25 % des PV (revue UX, 2026-11-17).
- **Gros coup** (au-delà du seuil du ralenti, `fx.thresholds.slowmoDamageShare`) : la plaque tremble brièvement (hypothèse : 4 px, 200 ms).
- **PV bas** (sous 25 %, art bible) : le remplissage passe au rouge frappe, une pulsation lente (1 par seconde) et la valeur en chiffres apparaît à côté, pour ne pas dépendre de la couleur.

**E3 — Énergie** · toujours affichée
- Forme : barre fine sous la vie, remplissage **jaune** (Maxence, 2026-11-17 ; hypothèse : #F2C230, proche du jaune arme #E3B23C : voir les paires à risque, Accessibilité), contour encre.
- Mise à jour : en continu (dépense à chaque action, récupération par `recovery`).
- **Manque** (Maxence, 2026-11-17 ; règle précisée par la revue UX) : deux encoches au plus sur ordinateur, aux coûts de la parade et du contre (8) et de l'esquive (12) (`reactions.staminaCost`). Règle d'affichage :
  - énergie ≥ 12 : remplissage normal ;
  - 8 ≤ énergie < 12 : le remplissage reste plein mais devient **hachuré** : il pare encore, il n'esquive plus ;
  - énergie < 8 : le remplissage est **hachuré et terne** : plus aucune réaction.
  - Écran étroit : une seule encoche, celle de l'esquive (12) ; sous elle, hachuré et terne (les deux encoches seraient à 4 px l'une de l'autre).
- Les compétences qui coûtent de l'énergie (saut 15, charge 12) ne mettent pas d'encoche ici : leur manque se lit sur leur icône (E6).

**E4 — Mana** · toujours affiché
- Forme : barre fine sous l'énergie, remplissage **violet magie #8064C8** (Maxence, 2026-11-17), contour encre.
- Mise à jour : à chaque dépense (lancement d'une compétence). Pas de récupération pendant le duel aujourd'hui.
- **Manque** : encoche au coût de la compétence en mana la moins chère du combattant ; en dessous, barre hachurée et terne. Sans compétence magique, pas d'encoche.

**E5 — Statuts** · contextuel (story 013)
- Forme : petites pastilles carrées (comme les compétences) côté extérieur sous les barres, avec le nombre de charges en chiffre ; une pastille par statut.
- Apparition : la ligne n'existe que s'il y a au moins un statut (Maxence, 2026-11-17) ; la pastille glisse en place à l'application, s'efface à l'expiration.
- Au plus 3 pastilles par combattant ; au-delà, un « +N » remplace les plus anciennes.

**E6 — Icônes des compétences** · contextuel
- Forme : pastille carrée arrondie (coins ~13 % du côté) dans la couleur de la famille, pictogramme blanc craie (art bible, Section 3), côté intérieur sous les barres.
- Apparition : au lancement, l'icône s'allume (hypothèse : pastille 1,0 → 1,15 → 1,0 en 150 ms, le « clac » de l'art bible) ; pendant la recharge, **un voile sombre descend du haut vers le bas** (Maxence, 2026-11-17) ; à la fin de la recharge, l'icône s'efface.
- Faute de mana **ou d'énergie** à la fin de la recharge : l'icône reste, barrée d'une hachure, tant que la ressource manque (hypothèse ; énergie ajoutée par la revue UX, 2026-11-17).
- Au plus 3 icônes par combattant ; au-delà, les plus anciennes recharges sont masquées en premier.

**E7 — Bandeau de compétence dans l'arène** · contextuel
- Aujourd'hui : bandeau arrondi sombre au-dessus du lanceur (story 004). Nouveau look à choisir parmi les variantes de la story 014 : même pastille que E6, avec le nom.

**E8 — Raisons d'un coup sans dégâts** · contextuel
- « Bloqué », « Esquivé », « Raté » au point d'impact, qui montent et s'effacent (story 004, inchangé).

**E9 — Annonces** · contextuel
- **Gros texte qui claque** (Maxence, 2026-11-17) : grandes lettres qui arrivent en zoom et rebondissent, façon jeu de combat. « COMBAT ! » au départ, au centre haut ; à la fin, « VICTOIRE » avec le nom du vainqueur, sans couvrir le vainqueur ; « ÉGALITÉ » en cas de double KO. Contour encre épais, police feutre (art bible : le feutre est réservé aux grands moments).
- Écart avec l'art bible : elle proposait un ruban adhésif « VICTOIRE » collé en travers de l'écran (Section 2, proposition). Maxence préfère le texte qui claque ; à reporter dans l'art bible.
- Détails de durée et de file d'attente dans « Feedback & Notification Systems ».

Les valeurs marquées « (hypothèse) » ci-dessus ont été gardées par Maxence le 2026-11-17 ; elles restent réglables en données.

**Sources de données** (revue UX, 2026-11-17). Le HUD lit l'état du duel et ses événements, il n'écrit jamais rien (le HUD ne possède aucun état de jeu).

| Élément | Lu depuis | Quand | Si absent |
|---|---|---|---|
| E1 Nom | spec du combattant (`FighterSpec.name`) | au début | jamais absent |
| E2 Vie | PV du combattant (état du duel), événement `hit` | à chaque `hit` | jamais absent |
| E3 Énergie | endurance du combattant (état du duel), coûts `reactions.staminaCost` | à chaque image | jamais absente |
| E4 Mana | mana du combattant (état du duel), coût en mana de ses compétences | à chaque image | barre affichée vide si mana max 0 ; pas d'encoche sans compétence magique |
| E5 Statuts | statuts du combattant (story 013) | à l'application et à l'expiration | ligne absente |
| E6 Icônes | `skillStart`, recharges du combattant, coûts de la compétence | au lancement, puis à chaque image pendant la recharge | ligne absente ; un combattant sans compétence n'en a jamais |
| E7 Bandeau | `skillStart` | au lancement | — |
| E8 Raisons | `noDamage` | à l'événement | — |
| E9 Annonces | début de la scène, `ko`, `duelEnd` | aux événements | — |

---

## HUD States by Gameplay Context

Le duel n'a ni exploration, ni dialogue, ni pause : le spectateur n'a aucune commande. Les contextes du template sont remplacés par ceux du duel.

| État | Déclencheur | Ce qui change |
|---|---|---|
| Avant le duel | ouverture de la scène | barres pleines ; « COMBAT ! » claque au centre haut, puis disparaît |
| Duel | premier tick | E1 à E4 affichés ; E5, E6, E7, E8 selon les événements |
| Ralenti (gros coup) | seuil `fx.thresholds.slowmoDamageShare` | **le HUD s'atténue avec l'arène** (Maxence, 2026-11-17 ; hypothèse : opacité 0,5, au même rythme que le voile) ; la traînée de dégâts continue, au ralenti ; il revient à la fin du ralenti |
| PV bas | PV < 25 % | E2 rouge, pulsation lente, PV en chiffres |
| Énergie ou mana insuffisants | sous l'encoche du coût | barre hachurée et terne |
| Aucun statut, aucune compétence en recharge | — | la ligne E5 / E6 n'existe pas |
| Combattant sans compétence magique | spec | barre de mana affichée sans encoche ; vide si mana max 0 |
| Combattant sans compétence | spec | jamais d'icône E6 ni de bandeau E7 |
| KO | événement `ko` | ralenti du KO ; le HUD s'atténue comme au ralenti ; la barre du perdant reste vide |
| Fin | `duelEnd` | « VICTOIRE » + nom, ou « ÉGALITÉ », claque au centre ; les barres restent |
| Onglet masqué | navigateur | rien de propre au HUD : le duel suit la boucle de la scène |

---

## Information Hierarchy

| Élément | Niveau | Pourquoi | Si masqué, qui porte l'info |
|---|---|---|---|
| E2 Vie | MUST KEEP | qui gagne, à quel point ça a fait mal | rien : jamais masquée |
| E1 Nom | MUST KEEP | à qui est la barre (la vie est crème pour les deux) | la position (gauche Rouge, droite Bleu) |
| E9 Annonces | MUST KEEP | début et issue du duel | rien |
| E8 Raisons | MUST KEEP | pourquoi un coup n'a rien fait (kill condition du brief) | rien |
| E7 Bandeau de compétence | SHOULD KEEP | quelle compétence part | E6 l'icône dans le coin |
| E3 Énergie, E4 Mana | SHOULD KEEP | pourquoi il n'esquive plus, pourquoi la boule ne part pas | le comportement du combattant |
| E6 Icônes de compétences | CAN HIDE | recharge en cours | E7 au lancement |
| E5 Statuts | CAN HIDE | statut actif et charges | le dessin du statut sur le combattant (story 013) |

## Visual Budget

- **Zones fixes** (Z1 et Z2, les deux coins) : au plus **12 % de la hauteur de l'arène** sur ordinateur (hypothèse), soit 86 px logiques sur 720 ; jamais dans la zone où les combattants sautent. Tailles sur ordinateur, en px logiques (revue UX, 2026-11-17) : marge 16, barre de vie 24 (nom à côté, texte 22), écart 4, énergie 8, écart 3, mana 8 : **63 px**.
- **Ligne Z3** (icônes et statuts, contextuelle) : hors budget fixe ; icônes et pastilles de 28 px avec un écart de 6 px sur ordinateur, soit 97 px avec Z1 et Z2 (13,5 %), jamais plus de 15 % de la hauteur de l'arène.
- **Écran étroit** (≤ 720 px de large réels) : au plus **25 % de la hauteur de l'arène**, marges réduites à 8 px réels (revue UX, 2026-11-17 ; choix proposé par Claude, à confirmer par Maxence). Calcul de vérification sur un téléphone en portrait de 390 px : arène d'environ 390 × 219 px réels (arène logique 1280 × 720, `duel-config.ts`), budget ≈ 55 px. Le nom passe au-dessus de la barre (14 px de texte + 2 px), barre de vie 10 px, énergie et mana 5 px chacune avec 2 px d'écart, marge 8 px : ≈ 46 px pour Z1 et Z2. La ligne Z3 (icônes et statuts de 16 px) ne vit que le temps d'un événement : elle peut dépasser le budget, jamais 35 % de la hauteur.
- **Éléments permanents** : 8 au plus (nom, vie, énergie, mana, par combattant).
- **En même temps à l'écran** : au plus 2 bandeaux de compétence (un par combattant, écartés s'ils se touchent), 6 raisons (`skills.reasons.maxShown`), 1 annonce, 3 icônes de compétence et 3 pastilles de statut par combattant.
- **Si ça déborde** : on retire d'abord E5, puis E6 (ordre de la hiérarchie) ; E1, E2, E8, E9 ne sont jamais retirés.

## Feedback & Notification Systems

| Notification | Déclencheur | Où | Durée | En même temps | File d'attente |
|---|---|---|---|---|---|
| « COMBAT ! » | début du duel | centre haut | hypothèse : 900 ms, entrée en zoom et rebond | 1 | jamais en file : premier affichage du duel |
| « VICTOIRE » + nom / « ÉGALITÉ » | `duelEnd` | centre, au-dessus de l'arène, sans couvrir le vainqueur | jusqu'à la sortie de la scène | 1 | attend la fin du ralenti du KO (le KO se voit d'abord) |
| Bandeau de compétence | `skillStart` | au-dessus du lanceur | 1100 ms (`skills.banner`) | 1 par combattant | pas de file : un nouveau lancement du même combattant remplace l'ancien ; deux combattants s'écartent |
| Raison « Bloqué / Esquivé / Raté » | `noDamage` | au point du coup | 900 ms (`skills.reasons`) | 6 | au-delà de 6, le plus ancien emplacement est réutilisé |
| Icône de compétence | `skillStart` | coin, côté intérieur | durée de la recharge | 1 par compétence | pas de file |
| Statut | application d'un statut (story 013) | coin, côté extérieur | durée du statut | 1 par statut | pas de file ; les charges s'ajoutent au chiffre |
| Traînée de dégâts | `hit` | sur la barre de vie | 700 ms | 1 par barre | un nouveau coup pendant la traînée l'allonge (le morceau perdu grandit) |

---

## Platform Adaptation

- **Ordinateur** : disposition de référence (coins hauts, en miroir), dessinée à 1280 px de large logiques ; l'écran s'adapte à la taille de l'arène.
- **Écran étroit (téléphone)** (Maxence, 2026-11-17) : sous une largeur seuil (hypothèse : 720 px réels), **le ruban du nom passe au-dessus de la barre de vie**, qui prend toute la largeur de son coin. Le texte ne descend jamais sous 14 px réels ; un nom trop long est coupé avec une ellipse.
- **Écran étroit, le reste** (revue UX, 2026-11-17) : énergie et mana restent deux barres fines sous la vie, sur toute la largeur du coin ; icônes de compétences et pastilles de statut passent à 16 px, sur une seule ligne sous les barres (statuts à l'extérieur, compétences à l'intérieur) ; l'annonce reste au centre, réduite pour tenir dans la largeur.
- **Marges** : le HUD garde une marge de sécurité aux bords (hypothèse : 16 px réels sur ordinateur, 8 px sur écran étroit), et sur mobile il respecte les zones sûres (encoche, coins arrondis).
- **Piste pour l'implémentation** : sur un téléphone en portrait, l'arène ne remplit pas la hauteur ; si le canevas peut occuper l'écran entier, le HUD peut vivre dans la bande libre au-dessus de l'arène, hors budget. À vérifier avec le mode d'échelle de Phaser.
- **Pas de cible tactile** : le HUD du duel n'est pas interactif.

---

## Accessibility

Niveau du projet : **Basic + 4 ajouts** (`design/accessibility-requirements.md`, Maxence, 2026-11-17) : mouvement réduit, réduction des flashs, avertissement photosensible, vitesse du duel réglable. Contraste WCAG AA (art bible, Section 7).

- **Réduction des flashs** : le clignotement de la traînée de dégâts, le tremblement de la plaque et la pulsation des PV bas suivent ce réglage (intensité réduite).

- **Pas d'interaction** : aucun ordre de focus à définir ; le HUD n'a pas de cible clavier ni tactile.
- **Contraste** : texte ≥ 4,5:1 (petit) ou 3:1 (≥ 19 px gras) ; barres et icônes ≥ 3:1 sur leur fond. À mesurer sur les variantes, en particulier le jaune énergie et le crème vie sur le fond de l'arène.
- **Taille** : texte jamais sous 14 px réels.
- **Jamais la couleur seule** : PV bas = rouge + pulsation + chiffres ; morceau perdu = hachures ; manque d'énergie ou de mana = hachures + encoche ; à qui est la barre = nom + côté ; énergie et mana se distinguent aussi par leur ordre (énergie au-dessus).
- **Paires de couleurs à risque** (à reporter dans le tableau daltonisme de l'art bible, Section 4) :

| Paire | Confusion | Relais |
|---|---|---|
| Vie crème #E8D9A0 / énergie jaune #F2C230 | jaune clair / jaune | épaisseur (vie épaisse, énergie fine), position (vie au-dessus), contour encre |
| Énergie jaune #F2C230 / jaune arme #E3B23C | quasi identiques (non mesuré) | ne se côtoient pas dans le HUD (pas d'icône d'arme) ; si une variante en ajoute, la pastille ronde d'arme les distingue |
| Morceau perdu rouge / remplissage rouge (PV bas) | rouge / rouge | hachures du morceau perdu |
| Mana violet #8064C8 / Bleu (combattant) | bleu / violet | le HUD n'utilise pas la couleur du combattant (vie crème) |

- **Contraste pendant le ralenti** (revue UX, 2026-11-17) : le seuil de contraste s'applique hors ralenti. Pendant un ralenti (0,7 s) ou le ralenti du KO, le HUD à 0,5 d'opacité peut passer sous 3:1 : exemption assumée, parce que c'est un moment bref où le regard doit aller à l'impact (choix de Maxence : le HUD s'atténue avec l'arène).
- **Clignotement** : jamais plus de 3 fois par seconde (traînée de dégâts, PV bas).
- **Mouvement réduit** (réglage du système) : pas de zoom ni de rebond pour les annonces (fondu), pas de tremblement de la plaque, pulsation des PV bas remplacée par un contour épais fixe.
- **Lecteur d'écran** : hors périmètre pour un jeu à regarder en temps réel ; noté en question ouverte.

## Tuning Knobs

Réglages en données (`presentation.ts`), pas de réglage joueur pour l'instant :

| Réglage | Défaut | Où |
|---|---|---|
| Seuil PV bas | 25 % | `hud` (nouveau) |
| Traînée de dégâts : tenue, vidage | 400 ms, 300 ms | `hud` (nouveau) |
| Tremblement de la plaque | 4 px, 200 ms | `hud` (nouveau) |
| Couleurs vie, énergie, mana, danger | crème #E8D9A0, jaune #F2C230, violet #8064C8, rouge #D9573B | `hud` (nouveau) |
| Opacité du HUD pendant le ralenti | 0,5 | `hud` (nouveau) |
| Largeur où le nom passe au-dessus | 720 px | `hud` (nouveau) |
| Budget de hauteur : ordinateur, écran étroit | 12 %, 25 % de l'arène | `hud` (nouveau) |
| Marges : ordinateur, écran étroit | 16 px, 8 px réels | `hud` (nouveau) |
| Icônes de compétences, pastilles de statut par combattant | 3, 3 | `hud` (nouveau) |
| Taille des icônes et pastilles : ordinateur, écran étroit | 28 px logiques, 16 px réels | `hud` (nouveau) |
| Hauteurs sur ordinateur : vie, énergie, mana | 24, 8, 8 px logiques | `hud` (nouveau) |
| Durée de « COMBAT ! » | 900 ms | `hud` (nouveau) |
| Bandeau, raisons | voir `skills.banner`, `skills.reasons` | existant (story 004) |

Réglages joueur (taille du HUD, masquer énergie et mana) : plus tard, avec un écran d'options.

## Acceptance Criteria

- [ ] À 1280 px, aucun élément du HUD ne touche un bord à moins de 16 px réels ; sur un écran étroit (≤ 720 px), à moins de 8 px réels ni dans une zone non sûre du mobile.
- [ ] Sur un écran étroit, le nom passe au-dessus de la barre de vie et aucun texte ne descend sous 14 px réels.
- [ ] Sur un téléphone en portrait de 390 px de large, nom, vie, énergie et mana des deux combattants tiennent dans 25 % de la hauteur de l'arène ; icônes et statuts tiennent sur une ligne de 16 px sous les barres.
- [ ] Pendant tout le duel, nom, vie, énergie et mana des deux combattants sont visibles ; sans statut ni compétence en recharge, la ligne sous les barres n'existe pas.
- [ ] Un coup fait apparaître la traînée de dégâts (morceau perdu rouge, puis vidé) ; elle ne clignote jamais plus de 3 fois par seconde.
- [ ] Sous 25 % des PV, la barre passe au rouge, pulse et affiche les PV en chiffres (lisible sans couleur).
- [ ] Quand l'énergie passe sous le coût de la réaction la moins chère, la barre devient hachurée sous l'encoche ; même règle pour le mana et la compétence magique la moins chère.
- [ ] Au lancement d'une compétence, son icône s'allume dans le coin du lanceur, se couvre d'un voile qui descend pendant la recharge, puis disparaît.
- [ ] Pendant un ralenti, le HUD s'atténue avec l'arène et revient ensuite.
- [ ] « COMBAT ! » claque au début ; « VICTOIRE » + nom (ou « ÉGALITÉ ») claque après le ralenti du KO, sans couvrir le vainqueur.
- [ ] Sur ordinateur (arène 1280 × 720), nom, vie, énergie et mana tiennent dans 86 px de haut ; avec la ligne d'icônes et de statuts, dans 108 px (15 %).
- [ ] Le HUD de Bleu est le miroir exact de celui de Rouge (barre ancrée à droite, statuts tout à droite, compétences vers le centre).
- [ ] Deux compétences lancées au même tick donnent deux bandeaux qui ne se chevauchent pas ; « VICTOIRE » n'apparaît qu'une fois le ralenti du KO fini.
- [ ] Hors ralenti, textes, barres et icônes du HUD respectent les contrastes mesurés (4,5:1 petit texte, 3:1 gros texte et graphismes), sur le fond de l'arène retenu.
- [ ] Sur ordinateur, avec une énergie entre 8 et 12, le remplissage de la barre d'énergie est hachuré ; sous 8, il est hachuré et terne ; à 12 ou plus, il est normal. Sur écran étroit, une seule encoche (12) : sous elle, hachuré et terne.
- [ ] Une compétence qui sort de recharge sans l'énergie ou le mana pour partir garde son icône hachurée.
- [ ] Avec « mouvement réduit », pas de zoom, de rebond ni de tremblement.
- [ ] Toutes les valeurs du tableau « Tuning Knobs » sont en données ; le HUD ne change jamais le duel.

---

## Open Questions

- Pas de carte du parcours joueur. Pour donner le contexte du joueur à ce HUD, l'écrire à partir du modèle `.claude/docs/templates/player-journey.md`.
- Plateforme non configurée dans `project.yaml` (`/setup-engine` peut l'enregistrer) ; le HUD suit l'art bible : web, clavier et toucher.
- Lecteur d'écran pour un duel en temps réel : hors périmètre pour l'instant.
- Art bible à mettre à jour : annonces en « gros texte qui claque » au lieu du ruban « VICTOIRE » ; HUD sans portrait.
- Les variantes visuelles (2 ou 3, story 014) se départagent sur le style (plaques, rubans, typographie), pas sur la disposition, déjà décidée.
- Budget sur écran étroit (25 %, marges 8 px) : choisi par Claude pendant la revue UX faute de réponse ; à confirmer par Maxence. Alternatives écartées : téléphone en paysage imposé, texte à 12 px sur mobile.
- Mesure des contrastes à faire sur les variantes, une fois le fond de l'arène décidé (art bible, Section 2 : sol de gymnase proposé).

## Review History

- 2026-11-17 `/ux-review` : NEEDS REVISION (1 bloquant : budget de hauteur intenable sur écran étroit ; 8 conseils). Corrigé le même jour : budget 25 % et marges 8 px sur écran étroit, hachures du morceau perdu, exemption de contraste pendant le ralenti, sources de données, deux encoches d'énergie et icône hachurée faute d'énergie, disposition étroite des icônes et statuts, paires de couleurs à risque, 6 critères ajoutés, plafond d'éléments. Accessibilité toujours NOT ASSESSED (pas de niveau défini).
- 2026-11-17 `/ux-review` (2e passe) : NOT ASSESSED (0 bloquant, 4 conseils ; accessibilité sans niveau). Corrigé : règle précise des encoches d'énergie, une seule encoche sur écran étroit, contradiction sur le jaune levée, tailles sur ordinateur et budget de 12 % sans la ligne Z3 (15 % avec).
