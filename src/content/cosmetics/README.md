# content/cosmetics/

Les cosmétiques (story 005) : des formes accrochées aux parties du corps d'un combattant. Ce sont des
données lues par le rendu seul (`render/cosmetic-view.ts`) : un cosmétique ne change jamais le duel
(aucun corps physique, aucune collision, rien dans l'empreinte). Format : `CosmeticSpec` dans
`src/core/cosmetic-spec.ts`.

## Ajouter un cosmétique

1. Dans un fichier de ce dossier (ex. `werewolf.ts`), déclarer un `CosmeticSpec` :
   - `id` unique, `part` (partie du corps : `head`, `torso`, `foreArmFront`...) ;
   - `layer` : couche dans le combattant (membres arrière 0, torse 1, tête 2, membres avant 3).
     Une valeur entre deux passe entre les deux : 2.05 dessine sur la tête et ses cheveux, 0.9 derrière
     le torse ;
   - `polygons` : formes pleines cernées d'encre, points `[x0, y0, x1, y1, ...]` en px dans le repère de la
     partie (`+x` vers l'avant du combattant, retourné quand il regarde à gauche ; `+y` vers le bas de la
     partie : menton pour la tête, bout de la main pour un avant-bras, bassin pour le torse) ;
   - ou `chain` : une petite chaîne (queue) simulée côté rendu, avec inertie, gravité et rappel vers une
     direction de repos (`rest`), à pas fixe (`stepMs`).
2. Le faire apparaître :
   - par un stade de compétence à déclenchement : `cosmetics` dans `skills.byId.<id>.stages.<stade>` de
     `../presentation.ts` (ex. le loup-garou, posé par le stade `transformation` jusqu'à la fin du duel).
3. Vérifier en jeu : un cosmétique trop bas dans les couches est caché par le corps ou la coiffure
   (les premières oreilles du loup-garou, en couche 1.9, disparaissaient sous les cheveux en pics).

## Repères du corps par défaut (`../fighters.ts`)

Tête de rayon 13, torse 30 × 58, avant-bras de 28 de long et 9 de large (la main est à `+y` 18 environ).
