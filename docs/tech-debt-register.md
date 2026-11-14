## Technical Debt Register

Last updated: 2026-11-14

Total items: 4 | Estimated total effort: S + S + M + S

| ID | Category | Description | Files | Effort | Impact | Priority | Status | Added | Sprint |
|----|----------|-------------|-------|--------|--------|----------|--------|-------|--------|
| TD-001 | Test | Tests de `core/duel.ts` écrits le 2026-11-11 (égalité au double KO, vainqueur, coups simultanés, dégâts, seed) ; restent sans test : machine à états, RNG, physique, rendu — from production/epics/untruc/story-001-moteur-duel-ragdoll.md | src/core/duel.ts, src/core/fighter-state.ts | M | High | — | Open | 2026-11-10 | Backlog |
| TD-002 | Performance | Petites allocations à chaque image : tableau de contacts par pas, objet `PartTransform` par partie et par image, redessin du HUD même sans changement de PV ; à traiter si une mesure montre un problème — from production/epics/untruc/story-001-moteur-duel-ragdoll.md | src/physics/matter-duel-world.ts, src/render/fighter-view.ts, src/ui/duel-hud.ts | S | Low | — | Open | 2026-11-10 | Backlog |
| TD-003 | Performance | Pas d'interpolation du rendu entre deux pas de simulation : saccades possibles sur un écran à 144 Hz (signalé par la relecture, non vérifié) — from production/epics/untruc/story-001-moteur-duel-ragdoll.md | src/scenes/duel-scene.ts, src/render/fighter-view.ts | S | Low | — | Open | 2026-11-10 | Backlog |
| TD-004 | Performance | Les têtes (une quinzaine de pièces, plus leurs contours) sont redessinées à chaque image : Phaser rejoue tout le tampon de commandes d'un `Graphics` ; sans doute négligeable à deux combattants, à figer en texture (`generateTexture`) si une mesure le demande — from production/epics/untruc/story-010-look-combattants-piste-5.md | src/render/fighter-view.ts, src/render/face-drawing.ts | S | Low | — | Open | 2026-11-14 | Backlog |
