# content/statuses/

Les statuts de combat (story 013). Un statut est une donnée (`StatusSpec`, type dans
`src/core/status-spec.ts`) déclarée dans le registre `STATUSES` (`index.ts`). Le moteur
(`core/status-system.ts`) n'en connaît aucun.

## Ajouter un statut

1. Copier `bleed.ts`, changer `id` (unique), l'ajouter à `STATUS_LIST` dans `index.ts`.
2. Champs :
   - `chargeDurationMs` : durée d'une charge. Chaque charge a la sienne : une nouvelle charge ne
     relance pas les autres, et chacune expire seule.
   - `maxCharges` : cumul au plus (1 = non cumulable). Au plafond, une nouvelle charge remplace
     la plus ancienne (le statut se rafraîchit).
   - `damagePerSecondPerCharge` : PV perdus par seconde et par charge, **entier** (décompte exact
     au tick, sans dérive d'arrondi). La perte de PV peut mettre KO ; ce n'est pas un coup (pas
     de recul, pas d'étourdissement).
   - `weightLossPerCharge` : poids retiré par charge, rendu à l'expiration de la charge. Le poids
     effectif change la masse du corps, le recul, l'étourdissement et la marche (story 008).
   - `weightFloorShare` : plancher du poids effectif, en part du poids de base (0.8 = 80 %).
3. Le format couvre dégâts dans la durée et perte de poids. Un statut qui touche à autre chose
   (brûlure, gel...) demandera un nouveau champ ici et dans le moteur.

## Qui applique un statut

Seules les compétences : `hit.applies: [{ status: BLEED, charges: 1 }]` dans la compétence
(`content/skills/`). Le chemin de touche du duel (`applyHit`) lit `PendingHit.applies` : c'est le
point d'entrée unique. Un coup paré, esquivé ou qui met la victime KO n'applique rien.

**Story 005 (Transformation)** : les griffes du loup-garou transformé feront saigner. La story
005 remplira `PendingHit.applies` pour les coups de griffes pendant la transformation (dans
`contactHit`, `core/hit.ts`), sans toucher au système de statuts.

## Événements (rendu)

`statusApplied`, `statusTick` (perte de PV, avec `x`, `y`), `statusExpired` : voir `core/events.ts`.
