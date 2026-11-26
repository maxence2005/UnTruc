# assets/

Les fichiers graphiques d'UnTruc qui ne sont pas dessinés par le code. Aujourd'hui presque tout est dessiné
en code (combattants, icônes, effets) ; ce dossier accueille ce qui arrive en fichiers (images générées,
textures, fonds).

| Dossier | Contenu |
|---|---|
| `characters/` | Images des combattants, **une par partie du corps** (le combattant est un ragdoll). |
| `ui/` | Icônes, plaques, fonds de l'interface (écran de gestion, HUD). |
| `fx/` | Textures d'effets (étincelles, ondes, gouttes). |
| `backgrounds/` | Fonds d'arène ou d'écran. |
| `references/` | Images de travail et variantes non retenues : jamais chargées par le jeu. |

Règles :
- **Provenance obligatoire** : chaque fichier a son entrée dans `provenance.yaml` (outil et modèle, date,
  prompt ou source, licence, retouches).
- Style : `design/art/art-bible.md`. Règle pour les agents : `.agents/rules/images-et-assets.md`.
- Noms en `kebab-case`, PNG ou WebP, taille utile seulement.
- Les polices viennent de npm (`@fontsource`), pas de ce dossier ; leurs licences sont citées dans les crédits.
