---
trigger: glob
globs: src/core/**, src/physics/**, src/content/duel-config.ts, src/content/fighters.ts, src/content/skills/**, src/content/weapons/**, src/content/statuses/**
description: Règles du cœur du duel d'UnTruc (règles, physique, données d'équilibrage) ; zone tenue par Claude Code.
---

# Cœur du duel

- Cette zone est **tenue par Claude Code** à travers les stories. N'y touche que si Maxence te le demande
  explicitement, et dis-le dans ton résumé.
- **Déterminisme** : pas fixe à 60 Hz, RNG seedé injecté, aucun `Math.random()`, aucune dépendance au temps
  réel. `src/core/` n'importe ni Phaser ni Matter.
- **Empreintes de référence** : après toute modification, `npm run check:hashes` doit redonner les
  empreintes attendues (inscrites dans `tools/hash-check.mjs` et dans les Completion Notes de la dernière
  story close). Si une empreinte change, arrête-toi et explique pourquoi à Maxence.
- **Tests** : `npm test` doit rester vert ; une règle nouvelle a son test (`tests/unit/`), et un bug corrigé
  a un test de régression qu'on a vu échouer avant la correction.
- **Données** : toute valeur d'équilibrage est dans `src/content/`, avec sa justification en commentaire.
