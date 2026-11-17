# Accessibility Requirements

> **Status**: Committed
> **Author**: Maxence + ux-designer
> **Last Updated**: 2026-11-17
> **Accessibility Tier Target**: Basic, plus quatre ajouts (voir ci-dessous)
> **Platform(s)**: Web (navigateur, ordinateur et mobile)
> **External Standards Targeted**:
> - WCAG 2.1 Level AA pour le contraste du texte et des graphismes (déjà exigé par l'art bible, Section 7)
> - Harding FPA / WCAG 2.3.1 : pas plus de 3 flashs par seconde
> - Xbox / PlayStation / Apple / Google : N/A (jeu web)
> **Accessibility Consultant**: None engaged
> **Linked Documents**: `design/game-brief.md`, `design/art/art-bible.md` (Sections 4 et 7), `design/ux/hud.md`
> **Template**: Accessibility Requirements

---

## Accessibility Tier Definition

**Niveau visé : Basic** (Maxence, 2026-11-17), plus quatre ajouts.

UnTruc est un auto-battler : pendant le duel, le spectateur regarde et ne commande rien. Les barrières motrices les plus lourdes (réflexes, précision, temps de réaction) n'existent donc pas dans le duel ; les commandes se limitent aux écrans de préparation (gestion, choix du personnage), au clavier ou au toucher, sans limite de temps. Les vrais risques sont visuels (couleurs, flashs d'impact, ralentis, ondes de choc, tremblements) et cognitifs (comprendre pourquoi un coup touche, kill condition du brief). Pour un projet perso développé seul, Basic couvre les risques graves (photosensibilité, couleur seule, texte illisible) sans chantier lourd ; les quatre ajouts visent précisément les risques visuels et cognitifs du duel.

**Ajouts au-delà de Basic** (Maxence, 2026-11-17) :
- **Mode mouvement réduit** (niveau Comprehensive) : suit le réglage du système (`prefers-reduced-motion`). Pas de zoom, rebond ni tremblement dans l'interface ; ralentis, ondes de choc et secousses adoucis dans l'arène. Déjà annoncé par l'art bible (Section 7) et la spec du HUD.
- **Réduction des flashs** : un réglage qui baisse l'intensité des flashs d'impact, du flash du combattant touché et du voile du ralenti.
- **Avertissement photosensible** : un écran au lancement prévient que le jeu contient des flashs et des effets lumineux (exigé aussi par Basic, voir Visual Accessibility).
- **Vitesse du duel réglable** : ×0,5, ×0,75, ×1 ; aide cognitive pour suivre chaque coup. Change seulement la vitesse d'affichage : le duel reste le même à seed fixe (pas de simulation fixe).

**Hors périmètre, explicitement** :
- Mode daltonien dédié (niveau Standard) : remplacé par la règle « jamais la couleur seule », déjà appliquée (art bible, Section 4 ; HUD).
- Taille de texte réglable et mise à l'échelle de l'interface (Standard) : texte de 14 px minimum à la place.
- Remappage des commandes (Standard) : pas de commande pendant le duel ; les écrans de préparation suivent les touches standard du navigateur (Tab, Entrée, Échap).
- Sous-titres, réglages de volume séparés : pas de son pour l'instant (« later » dans le brief). Les réglages de volume séparés (musique, effets) deviennent obligatoires au niveau Basic quand le son arrive.
- Lecteur d'écran (Comprehensive) : voir Known Intentional Limitations.

### Tier Definitions

| Tier | Contenu |
|---|---|
| Basic | Texte important lisible ; aucune information par la couleur seule ; volumes séparés (quand il y a du son) ; aucun risque photosensible. |
| Standard | Basic + remappage complet, sous-titres, taille de texte réglable, au moins un mode daltonien, aucune commande à temps limité. |
| Comprehensive | Standard + lecteur d'écran pour les menus, mono, aides de difficulté, HUD repositionnable, mouvement réduit, indicateurs visuels pour les sons importants. |
| Exemplary | Comprehensive + personnalisation complète des sous-titres, contraste élevé, aides cognitives, alternatives haptiques, audit externe. |

---

## Visual Accessibility

| Exigence | Niveau | Portée | Statut | Notes |
|---|---|---|---|---|
| Taille minimale du texte | Basic | Tout le jeu | En place (HUD, story 004) ; à vérifier sur chaque écran | 14 px réels minimum (art bible, Section 7). Valeur du projet, plus basse que les 20-24 px du template, assumée pour un jeu web à regarder. |
| Contraste du texte et des graphismes | Basic (AA) | Tout le jeu | Spécifié (art bible, HUD) ; mesures à faire sur les variantes du HUD | 4,5:1 petit texte, 3:1 gros texte et graphismes. Exemption assumée pendant les ralentis (HUD). |
| Jamais la couleur seule | Basic | Tout le jeu | Spécifié | Tableau des paires à risque : art bible, Section 4 ; HUD, Accessibility. Chaque couleur a un relais (forme, hachures, chiffres, position, libellé). |
| Flashs : pas plus de 3 par seconde | Basic | Effets d'impact, HUD | À auditer | Flash du combattant touché, flash des compétences, clignotement de la traînée de dégâts, pulsation des PV bas (1 par seconde). Audit sur un duel complet. |
| Avertissement photosensible au lancement | Basic + ajout | Écran de démarrage | À faire | Texte court avant le premier duel ; non bloquant après la première fois. |
| Réduction des flashs | Ajout | Effets d'impact, compétences, voile du ralenti | À faire | Réglage : intensité des flashs et du voile réduite (hypothèse : 80 % de moins). |
| Mouvement réduit | Ajout (Comprehensive) | Interface, HUD, effets de l'arène | Spécifié (HUD) ; à faire | Suit `prefers-reduced-motion` ; plus tard aussi un réglage dans le jeu. La physique des combattants ne change pas (c'est le jeu) ; seuls les effets et l'interface s'adoucissent. |
| Mode daltonien | Standard | — | Hors périmètre | Remplacé par « jamais la couleur seule ». |
| Taille du texte réglable | Standard | — | Hors périmètre | — |

---

## Motor Accessibility

| Exigence | Niveau | Portée | Statut | Notes |
|---|---|---|---|---|
| Aucune commande pendant le duel | — (conception) | Duel | En place | Le duel se joue seul : pas de réflexe ni de précision demandés. |
| Aucune commande à temps limité | Basic (conception du jeu) | Écrans de préparation | À respecter (stories 006, 012) | Aucun choix ne doit expirer. |
| Clavier seul et toucher | Basic (conception du jeu) | Écrans de préparation | Spécifié (art bible, Section 7) | Focus clavier toujours visible (pointillé blanc craie) ; un tap remplace le survol. Pas de manette. |
| Remappage des commandes | Standard | — | Hors périmètre | — |

---

## Cognitive Accessibility

| Exigence | Niveau | Portée | Statut | Notes |
|---|---|---|---|---|
| Comprendre pourquoi un coup touche ou non | Brief (kill condition) | Duel | En place (story 004) | Raisons « Bloqué », « Esquivé », « Raté » ; nom de la compétence au lancement ; cible du saut. |
| Vitesse du duel réglable | Ajout | Duel | À faire | ×0,5, ×0,75, ×1 ; sans effet sur le déroulement du duel (pas fixe et seed). |
| Pas de texte seul pour une information de jeu | Basic (art bible, principe 1) | Tout le jeu | Spécifié | Ce qui peut se lire sans texte se lit sans texte (icônes, formes). |

---

## Auditory Accessibility

Pas de son pour l'instant (brief : « later »). Quand le son arrivera :
- volumes séparés (musique, effets) : obligatoire au niveau Basic ;
- aucune information de jeu portée par le son seul : chaque son important a déjà un relais visuel (effets d'impact, textes).

---

## Platform Accessibility API Integration

| Plateforme | API | Statut | Notes |
|---|---|---|---|
| Web | `prefers-reduced-motion` (CSS / `matchMedia`) | À faire | Lu au démarrage et suivi en direct ; pilote le mode mouvement réduit. |
| Web | ARIA / lecteur d'écran | Hors périmètre | Le jeu est dessiné dans un canevas Phaser ; voir Known Intentional Limitations. |

---

## Per-Feature Accessibility Matrix

| Système | Visuel | Moteur | Cognitif | Statut |
|---|---|---|---|---|
| Duel (moteur, réactions, story 001/009) | flashs à auditer | aucune commande | raisons des coups (004) | Partiel |
| Effets d'impact (story 003) | flashs, ralenti, onde de choc : réduction des flashs, mouvement réduit | — | — | À faire |
| Compétences (story 004) | couleur jamais seule (nom affiché) | — | nom, cible, raisons | En place |
| HUD (story 014) | contraste, hachures, 14 px, mouvement réduit | — | lecture des ressources | Spécifié (`design/ux/hud.md`) |
| Écran de gestion (story 006) | contraste (panneaux assombris), icônes rond/carré | clavier seul, toucher, pas de temps limite | info-bulles | À spécifier |
| Choix du personnage (story 012) | idem | idem | — | À spécifier |
| Statuts (story 013) | pastilles + chiffres, gouttes dessinées | — | — | À spécifier |
| Transformation (story 005) | flash vert à vérifier (≤ 3 par seconde), silhouette | — | — | À spécifier |

---

## Accessibility Test Plan

- **Contraste** : mesurer chaque couleur du HUD et des écrans sur leur fond réel (outil de contraste), à chaque nouvelle variante.
- **Couleur seule** : regarder un duel et l'écran de gestion en niveaux de gris et en simulation protanopie et deutéranopie ; toute information doit rester lisible.
- **Flashs** : enregistrer un duel complet avec des compétences, compter les flashs par seconde sur les pics (gros coups, KO, boule de feu).
- **Mouvement réduit** : activer `prefers-reduced-motion` dans le navigateur et vérifier chaque animation listée dans le HUD.
- **Vitesse du duel** : à ×0,5 et ×1, même seed, même vainqueur et même empreinte du duel.
- **Clavier seul** : parcourir les écrans de préparation sans souris.

---

## Known Intentional Limitations

- **Lecteur d'écran** : le duel est une animation physique en temps réel dans un canevas ; une narration n'a pas de sens au rythme du combat. Les écrans de préparation pourraient en avoir une plus tard (passage au niveau Comprehensive).
- **Mode daltonien dédié et taille de texte réglable** : non prévus au niveau Basic ; compensés par « jamais la couleur seule » et le texte de 14 px minimum.
- **Exemption de contraste pendant les ralentis** : le HUD s'atténue à 0,5 d'opacité pendant moins d'une seconde (choix de Maxence, HUD).

---

## Audit History

| Date | Type | Résultat |
|---|---|---|
| 2026-11-17 | Engagement du niveau (`/ux-design accessibility`) | Basic + 4 ajouts ; aucun audit encore |

---

## External Resources

- WCAG 2.1 : https://www.w3.org/TR/WCAG21/
- Game Accessibility Guidelines : https://gameaccessibilityguidelines.com/
- Harding FPA (photosensibilité) : test des flashs.

---

## Open Questions

- Avertissement photosensible : à quel écran (avant le premier duel, ou au lancement du jeu) ? Faut-il le montrer à chaque visite ?
- Où vivent les réglages (réduction des flashs, vitesse du duel) tant qu'il n'y a pas d'écran d'options ? Proposition : un petit menu sur l'écran de gestion (story 006).
- La spec du HUD fixait WCAG AA « comme base » : c'est maintenant ce document qui le fixe.
