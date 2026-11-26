---
trigger: glob
globs: src/render/**, src/ui/**, src/scenes/**, src/content/presentation.ts, src/content/cosmetics/**
description: Règles du rendu Phaser 4 d'UnTruc (effets, interface, scènes, cosmétiques).
---

# Rendu Phaser 4

- **Phaser 4.2.1**, pas Phaser 3 : les filtres remplacent les FX et pipelines. Vérifie chaque API dans
  `docs/engine-reference/web/phaser.md` ou dans `node_modules/phaser/types/phaser.d.ts` avant de l'utiliser.
- **Le rendu s'abonne aux événements** du duel (`src/core/events.ts` : `hit`, `ko`, `skillStart`,
  `skillTrigger`, `statusTick`…). La logique de `src/core/` ne l'appelle jamais, et le rendu ne modifie
  jamais l'état du duel.
- **Rien ne doit changer les empreintes** des duels de référence : un effet, un cosmétique ou une queue
  qui bouge restent côté affichage (aucun corps Matter ajouté, aucun tirage du RNG du duel).
- **Aucune allocation à chaque image** dans `update` : objets Phaser créés une fois, pools de taille fixe,
  `world.readPart(fighter, part, out)` avec un objet de sortie réutilisé, tableaux plutôt que `Map.values()`.
- **Valeurs en données** : couleurs, tailles, durées, textes dans `src/content/presentation.ts` (types dans
  `src/core/presentation-config.ts` et voisins).
- **Accessibilité** : pas plus de 3 flashs par seconde (`FlashLimiter`) ; mouvement réduit
  (`prefers-reduced-motion`) coupe tremblements et secousses ; contraste AA ; texte de 14 px au moins.
- **Temps** : les effets avancent en temps d'effet (`ImpactFx.timeScale`, ralenti compris) ; jamais de
  valeur dépendant du nombre d'images par seconde.
- **Vérification** : `npm run smoke`, puis `/verifier-rendu` avec une capture.
