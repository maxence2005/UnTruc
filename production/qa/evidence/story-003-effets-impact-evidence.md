# Test Evidence: Effets d'impact

> **Story**: `production/epics/untruc/story-003-effets-impact.md`
> **Story Type**: Visual/Feel
> **Date**: 2026-11-16
> **Tester**: Maxence (validation du rendu), Claude (captures et relecture)
> **Build / Commit**: `3bc02ef` + changements non commités de la story 003

---

## What Was Tested

Les effets d'un coup en duel : étincelles au point d'impact, flash du combattant touché, onde
de choc et ralenti avec voile sombre sur un gros coup, petites étincelles aux poings, boule de
feu avec traînée. Duel de la seed 3, joué avec les armes (`?armes=sword,hammer`) pour les gros
coups et sans arme pour le duel de référence.

**Acceptance criteria covered**: AC-1 à AC-6

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | Un coup qui touche produit des étincelles au point d'impact. | PASS | Captures 02 et 04. |
| AC-2 | Un gros coup déclenche un ralenti court ; vitesse et durée dans la config. | PASS | Capture 03 ; `fx.slowmo`. |
| AC-3 | Un coup très fort produit une onde de choc visible. | PASS | Capture 02. |
| AC-4 | La boule de feu existe comme effet (projectile lumineux avec traînée). | PASS | Captures 05 et 06. |
| AC-5 | Le combattant touché flashe brièvement. | PASS | Capture 01. |
| AC-6 | Les effets s'abonnent aux événements du combat ; la logique ne les appelle jamais. | PASS | `src/render/fx/impact-fx.ts`. |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `story-003-effets-impact/01-flash-de-la-victime.png` | Flash blanc de la victime et disque lumineux au contact | AC-5, AC-1 |
| 2 | `story-003-effets-impact/02-onde-de-choc-et-etincelles.png` | Onde de choc, étincelles et flash pendant le ralenti | AC-1, AC-3 |
| 3 | `story-003-effets-impact/03-ralenti-voile-plan-large.png` | Plan large pendant le ralenti, voile sombre derrière les combattants | AC-2 |
| 4 | `story-003-effets-impact/04-petites-etincelles-coup-de-poing.png` | Petites étincelles d'un coup de poing | AC-1 |
| 5 | `story-003-effets-impact/05-boule-de-feu-en-vol.png` | Boule de feu en vol | AC-4 |
| 6 | `story-003-effets-impact/06-boule-de-feu-onde-a-l-arrivee.png` | Onde de choc à l'arrivée de la boule de feu | AC-4 |
| 7 | `story-003-effets-impact/07-duel-sans-arme-inchange.png` | Fin du duel sans arme, inchangé (hash `1a46eb7a`) | AC-2 (le ralenti ne change pas le duel) |

---

## Test Conditions

- **Game state at start**: duel de la seed 3, combattants par défaut ; armes par `?armes=sword,hammer` pour les gros coups.
- **Capture**: Chrome sans tête, `vite preview`.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Maxence | 2026-11-16 | [x] Approved |

*Approbation donnée par Maxence en réponse à la question de clôture de `/story-done`, après son message « c'est incroyable, j'adore les effets ».*
