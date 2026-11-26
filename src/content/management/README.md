# Écran de gestion : données (story 006)

Ce dossier dit ce que l'écran propose et ce qu'il écrit. Le moteur de duel ne le lit pas. Le calcul est dans
`src/core/` (`loadout.ts`, `stat-description.ts`, `management-view.ts`) ; la scène (passe 2) ne fait que dessiner
le `ManagementViewModel` rendu par `buildManagementView`.

- `index.ts` : `MANAGEMENT`, le nombre d'emplacements (`maxSkillSlots`), les libellés et les chiffres d'exemple. Vérifié au chargement (`assertManagementData`).
- `items.ts` : armes et compétences proposées.
- `stats.ts` : les dix stats (libellé, effet, qui la lit, phrases avec chiffres).

## Ajouter une arme

1. Créer l'arme dans `src/content/weapons/` et l'inscrire dans `weapons/index.ts` (voir son README).
2. Ajouter une entrée dans `MANAGED_WEAPONS` : `id`, `weaponId` (l'id du registre), `name`, `effect` (une phrase vraie),
   `iconShape: 'round'`, `iconBadge: 'weapon'`, `usesStats`.
3. `usesStats` : seulement les stats que le code lit pour cette arme. Lire `src/core/stats.ts` et son usage dans `duel.ts`, `hit.ts`.
4. Le dessin de l'icône (passe 2) va dans `src/ui/` ou `src/render/`, pas ici.

## Ajouter une compétence

1. La créer dans `src/content/skills/` et l'inscrire dans `skills/index.ts`.
2. Ajouter une entrée dans `MANAGED_SKILLS` : `id` (celui du registre), `name`, `effect`, `iconShape: 'rounded-square'`,
   `iconBadge` (sa catégorie), `usesStats`.
3. `usesStats` : puissance physique ou magique selon `hit.scaling`, endurance ou mana selon `cost`, intelligence si elle se tire
   (pas une compétence à déclenchement), plus les stats que son `trigger` modifie ou lit (`statBonus`, `hpShare`).
4. Le coût en points, l'endurance et le mana sont lus dans la compétence : ne pas les recopier.

## Ajouter une stat

1. L'ajouter à `FighterStats` (`src/core/stats.ts`) et à `STAT_IDS` (`src/core/management-spec.ts`).
2. Ajouter son entrée dans `stats.ts` ici : `label`, `unit`, `effect`, `scope`, `wired`, `lines`.
3. Si elle a des chiffres à montrer, ajouter une fonction dans `VALUES` (`src/core/stat-description.ts`) qui appelle les formules du moteur,
   et nommer ses `{valeurs}` dans les `lines`. Ne jamais recalculer une formule à la main.
4. `wired: false` tant que le duel ne la lit pas : l'écran affiche alors `labels.notWiredText` et aucun chiffre.

Les tests (`tests/unit/management/`) vérifient les ids, les formes d'icône et que les chiffres affichés égalent ceux des fonctions du moteur.
