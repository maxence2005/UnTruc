# ADR-0001: Principes de code (contenu en données, couches, patterns, déterminisme)

## Status

Proposed

> Seul Maxence (ou `technical-director` sur sa confirmation explicite) passe ce
> statut à `Accepted`, via `/architecture-decision accept ADR-0001`.

## Date

2026-11-09

## Last Verified

2026-11-09

## Decision Makers

Maxence (décision), `technical-director` (rédaction à partir du brouillon `docs/architecture/principes-code.md`).

## Summary

Le code d'UnTruc est écrit et maintenu surtout par des IA, sur de nombreuses itérations : sans règles fixes, il se dégrade. On fige cinq choses : le contenu est de la donnée lue par un moteur générique, le code est découpé en couches à dépendance descendante (`core` sans Phaser), un petit jeu de patterns toujours identiques, une simulation déterministe (RNG seedé, pas fixe) et une liste d'interdits.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web : Vite 8.3.7, TypeScript 7.0.2 (`strict`), Phaser 4.2.1 avec Matter.js intégré (versions lues dans `package-lock.json`) |
| **Domain** | Core |
| **Layer** | Foundation |
| **Knowledge Risk** | HIGH — Vite 8, TypeScript 7 et Phaser 4 sont postérieurs au cutoff (`docs/engine-reference/web/VERSION.md`) |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`, `docs/engine-reference/web/phaser.md` |
| **Post-Cutoff APIs Used** | Aucune imposée par cet ADR. `core/` et `content/` n'importent pas Phaser. `render/` suit `phaser.md` (import `import * as Phaser from 'phaser'`, renderer WebGL, Filters au lieu de FX/pipelines). |
| **Verification Required** | 1. Deux combats lancés avec la même seed et les mêmes persos produisent la même suite d'événements (`phaser.md` classe la répétabilité de `game.loop.sleep()` / `game.step()` en **[J]**, non vérifiée). 2. L'API Matter.js exposée par Phaser 4.2.1 n'est documentée dans aucun fichier de `docs/engine-reference/web/` : la vérifier dans le code de Phaser avant d'écrire l'adaptateur `physics/`. |

> Knowledge Risk HIGH : ré-valider cet ADR à chaque montée de version de Phaser, Vite ou TypeScript.

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | Tout ADR futur sur le moteur de duel, les compétences, le contenu ou l'UI |
| **Blocks** | Brief build order 1 (duel de bout en bout dans `src/`) et la suite |
| **Ordering Note** | Le prototype `prototypes/combat-animation-concept/` est hors périmètre : jetable, il ne respecte pas ces règles et n'a pas à le faire. |

## Context

### Problem Statement

Une IA (ou un humain) qui arrive sans contexte doit savoir où ajouter une chose, l'ajouter sans casser le reste, et le code doit rester propre après cinquante passages. La décision doit être prise maintenant, avant que le duel du build order 1 soit porté dans `src/`.

### Current State

Le prototype valide la direction (piste 5 : ragdolls actifs, muscles PD, armes physiques en données dans `src/ragdoll/weapons.ts`), mais il n'a aucune règle d'architecture.

### Constraints

- Projet perso, rigueur `minimal`, un seul développeur humain.
- TypeScript `strict`. Phaser 4 et Matter.js intégré.
- Contenu destiné à grossir vite : armes, compétences, cosmétiques, effets.

### Requirements

- Ajouter une arme, une compétence ou un cosmétique sans toucher au moteur.
- Même seed + mêmes persos = même combat (rejouable et testable).
- Règles de combat testables sans navigateur ni Phaser.

## Decision

### 1. Le contenu est de la donnée, le moteur est générique

- Persos, armes, prises en main, compétences, cosmétiques, effets sont des **données typées** (objets TypeScript ou JSON validés), lues par un moteur générique.
- Ajouter une arme = ajouter une entrée dans le registre des armes, sans toucher au moteur.
- Une compétence = une timeline de phases (pose cible, impulsions, fenêtre de coup, effets), pas une fonction écrite à la main.
- Les valeurs d'équilibrage (dégâts, portées, durées, forces) vivent dans des fichiers de config.

### 2. Couches

```
content ──types──▶ core ◀── physics ◀── render (lecture seule)
                     ▲                    │
                     └──── ui (lecture) ──┘ (render lit aussi core)
```

| Couche | Rôle | Dépend de |
|---|---|---|
| `core/` | Règles du combat : stats, tours, dégâts, IA de combat, timelines. TypeScript pur, **sans Phaser**. | rien |
| `physics/` | Ragdoll, muscles, articulations. Adaptateur autour de Matter.js. | `core` |
| `render/` | Dessin des persos, cosmétiques, armes, effets. Phaser. | `core`, `physics` (lecture seule) |
| `ui/` | HUD, menus, écrans. | `core` (lecture seule) |
| `content/` | Données : armes, compétences, cosmétiques, archétypes. | types de `core` |

Une couche ne remonte jamais vers une couche supérieure. Le rendu lit l'état, il ne le modifie pas.

### 3. Patterns (toujours les mêmes)

- **Registre** : armes, compétences, cosmétiques et effets sont enregistrés par identifiant (`weaponRegistry.get('marteau')`). Une seule façon de déclarer et de retrouver un élément.
- **Composition** : un combattant = corps + équipement + cosmétiques + compétences. Pas d'héritage en profondeur.
- **Machine à états explicite** du combattant : `idle → approche → attaque → récupération`, `sonné`, `KO`. Transitions listées à un seul endroit.
- **Bus d'événements typé** (`hit`, `ko`, `skillStart`, `weaponDropped`…) : effets, son et UI s'abonnent ; la logique ne les appelle jamais directement.
- **Stratégie** quand un comportement varie vraiment (ex. IA prudente / agressive).

### 4. Déterminisme

- Tout aléatoire passe par un RNG seedé et injecté.
- La simulation avance à pas fixe, indépendamment du framerate.

### 5. Taille et lisibilité

- Un fichier = une responsabilité ; viser moins de 300 lignes, découper au-delà.
- Noms en anglais dans le code ; commentaires en français autorisés pour le *pourquoi*.
- Exports nommés, pas d'export par défaut.
- Chaque dossier de `content/` a un court README : à quoi il sert et comment ajouter un élément (recette pas à pas).

### 6. Tests

- Tests unitaires (Vitest) sur `core/` : formules de dégâts, timelines de compétences, registres, machine à états.
- Test de validation du contenu : chaque entrée de chaque registre est chargée et vérifiée automatiquement.
- Le rendu se vérifie par captures d'écran.

### Key Interfaces

Cet ADR ne fixe aucune signature. Il impose seulement : un registre par type de contenu avec accès par identifiant, un bus d'événements typé, un RNG injecté, une machine à états du combattant avec transitions centralisées.

### Implementation Guidelines

- `core/` **must never** importer Phaser ni Matter.js.
- Une couche **must never** importer une couche située au-dessus d'elle dans le tableau.
- `render/` et `ui/` **must never** modifier l'état de `core` ou `physics`.
- Tout contenu **must** être déclaré dans son registre et lu par identifiant.
- Toute valeur d'équilibrage **must** venir d'un fichier de config.
- Tout aléatoire **must** passer par le RNG seedé injecté ; `Math.random()` **must never** apparaître hors du module RNG.
- La simulation **must** avancer à pas fixe.
- La logique **must never** appeler effets, son ou UI directement : elle émet sur le bus.
- **Must never** : logique de jeu dans les scènes Phaser ; singletons globaux mutables ; fichiers fourre-tout (`utils.ts`, `helpers.ts`, `misc.ts`) ; copier-coller d'une arme ou compétence pour une variante (on paramètre) ; héritage en profondeur pour les combattants ; `any` hors des adaptateurs vers des librairies mal typées ; export par défaut.

## Alternatives Considered

### Alternative 1 : code ad hoc, comme le prototype
- **Pros** : rapide au début.
- **Cons** : chaque passage d'IA réinvente une structure ; armes et compétences copiées-collées ; combats non rejouables.
- **Rejection Reason** : incompatible avec un code maintenu par des IA sur la durée.

### Alternative 2 : logique dans les scènes Phaser
- **Pros** : moins de couches, idiome Phaser standard.
- **Cons** : `core` intestable sans navigateur ; règles couplées à une API post-cutoff (Phaser 4) qu'une IA connaît mal.
- **Rejection Reason** : tue la testabilité et le déterminisme.

## Consequences

### Positive
- Ajouter du contenu ne touche pas au moteur ; une IA sait où écrire.
- `core` testable en Vitest pur, combats rejouables à seed fixe.
- La surface exposée à Phaser 4 (API post-cutoff) se limite à `render/` et `physics/`.

### Negative
- Plus de plomberie au départ (registres, bus, adaptateur physique) qu'un code direct.
- Le portage du prototype vers `src/` est une réécriture, pas un copier-coller.

### Neutral
- Le prototype reste hors règles.

## Risks

- **Le déterminisme ne tient pas avec Matter.js** (flottants, ordre des contacts). Mitigation : test « même seed, même suite d'événements » dès le build order 1.
- **Les frontières de couches s'érodent** sans outil qui les vérifie. Mitigation : voir Open questions.

## GDD Requirements Addressed

Pas de GDD à ce niveau de rigueur : la traçabilité pointe vers `design/game-brief.md`, section Features.

| Source | Requirement | How This ADR Addresses It |
|---|---|---|
| Brief MVP feature 1 | Moteur de duel ragdoll propre, rejouable à seed fixe | §2 couches (`core` sans Phaser, `physics` adaptateur), §4 RNG seedé + pas fixe |
| Brief MVP feature 2 | Armes physiques en données, prise à une ou deux mains, attaque propre | §1 contenu en données, registre des armes, pas de copier-coller |
| Brief MVP feature 3 | Compétences lisibles : ciblage visible, raison affichée d'un coup bloqué ou raté | §1 compétence = timeline de phases ; §3 bus typé que `render`/`ui` écoutent pour l'afficher |
| Brief MVP feature 4 | Écran de gestion : armes et compétences en petites icônes, cosmétiques | §2 `ui` lit `core` ; §3 registres par identifiant |
| Brief MVP feature 5 | Compétence Transformation (loup-garou) | §3 composition (pas de classe `LoupGarou`) ; §1 compétence en données |
| Brief MVP feature 6 | Tournoi solo, adversaires enchaînés | §2 règles dans `core` ; §4 duels rejouables |
| Brief MVP feature 7 | Effets d'impact (étincelles, ralentis, onde de choc, boule de feu) | §3 bus d'événements, effets dans `render` ; effets enregistrés en registre |

## Performance Implications

- **CPU** : bus et registres négligeables. Le pas fixe peut imposer plusieurs pas physiques par frame ; budget non défini (`technical-preferences.md` : framerate et frame budget `[TO BE CONFIGURED]`).
- **Memory / Load Time / Network** : pas d'impact notable.

## Migration Plan

Aucun code de production existant à migrer ; le prototype n'est pas migré, il est réécrit selon ces règles au build order 1.

**Rollback plan** : remplacer cet ADR par un nouvel ADR qui le marque `Superseded`.

## Validation Criteria

- `core/` ne contient aucun import de `phaser` ou `matter`.
- Ajouter une troisième arme ne modifie aucun fichier hors `content/`.
- Deux combats à même seed produisent la même suite d'événements.
- Le test de validation du contenu passe sur tous les registres.

## Open questions

À trancher par Maxence ; cet ADR ne décide rien sur ces points.

1. **Dossiers hors tableau.** `src/` contient aussi `scenes/`, `shared/`, `puppet/`, `ragdoll/`, `debug/`. Où se placent-ils dans les couches ? `ragdoll/` et `puppet/` sont-ils `physics/` ? `shared/` est-il un fourre-tout déguisé (interdit §7 du brouillon) ou une couche à définir ?
2. **Accès à Matter.js.** `physics/` passe-t-il par le plugin Matter de la scène Phaser (alors `physics` dépend de Phaser et ne se teste pas sans navigateur) ou par le moteur Matter.js seul, piloté hors Phaser ? Le brouillon dit « adaptateur autour de Matter.js » sans trancher.
3. **Portée du déterminisme.** « Même seed = même combat » sur la même machine seulement, ou aussi entre navigateurs ? Matter.js en flottants ne garantit pas le second ; cela compte si les duels asynchrones de la ligue (later) rejouent un combat chez un autre joueur.
4. **Valeur du pas fixe** (ex. 60 Hz ?) et lien entre « tours » de `core` et pas physiques : le brief dit « tour par tour », le combat est une simulation continue.
5. **Format du contenu.** Objets TypeScript ou JSON validé ? Si JSON, quelle validation (librairie à approuver : aucune n'est listée dans Allowed Libraries) ?
6. **« Archétypes » dans `content/`.** Le brief précise que le loup-garou est une compétence, pas un archétype. Le dossier `content/archetypes` a-t-il encore une raison d'être ?
7. **Vérification des frontières.** Faut-il un outil (règle de lint sur les imports, test qui scanne `core/`) ou la revue suffit-elle ? La limite de 300 lignes est-elle indicative ou vérifiée ?
8. **Vitest pas encore installé.** Le brouillon l'impose ; `package.json` ne le contient pas. Version épinglée par le template : 5.0.5 (`VERSION.md`). À ajouter via `/test-setup`.
9. **Bus et RNG : qui les possède ?** Instances créées par combat et injectées (cohérent avec « pas de singleton mutable ») : à confirmer, et dans quelle couche vit le type des événements (`core` a priori).

## Related

- Source : `docs/architecture/principes-code.md` (brouillon)
- `design/game-brief.md`
- `.claude/docs/technical-preferences.md` (Forbidden Patterns, alignés)
- `docs/engine-reference/web/VERSION.md`, `docs/engine-reference/web/phaser.md`
