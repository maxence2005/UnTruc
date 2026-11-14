# Test Evidence: Look des combattants de la piste 5

> **Story**: `production/epics/untruc/story-010-look-combattants-piste-5.md`
> **Story Type**: Visual/Feel
> **Date**: 2026-11-14
> **Tester**: Maxence (validation des captures), Claude (captures et relecture)
> **Build / Commit**: `61b47eb` + changements non commités de la story 010

---

## What Was Tested

Le rendu des deux combattants après la story : tête de la piste 5 (œil blanc avec
pupille, sourcil, bouche, nez, joue, cheveux, barbe), contour sombre sur la tête et le
corps, visage retourné pour qui regarde à gauche, tête lisible quand elle tourne avec le
ragdoll. Le duel de la seed 3 a été joué jusqu'au KO en gros plan.

**Acceptance criteria covered**: AC-1 à AC-6

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | La tête reprend celle de la piste 5 : œil blanc avec pupille, sourcil, bouche, nez, oreille, joue. | PASS | Validé par Maxence ; l'oreille est peu visible à cette taille. |
| AC-2 | Les variantes d'yeux (rond, fâché, fin) et de bouche (grr, sourire, o, dents) sont des données du combattant. | PASS | `src/content/face-kit.ts`, champ `look` de `src/content/fighters.ts`. Seules `round`, `angry`, `smile` et `teeth` sont vues à l'écran. |
| AC-3 | Cheveux et barbe du prototype sont disponibles comme données du combattant. | PASS | Six coiffures au catalogue ; pics et bol vus à l'écran, barbe vue sur Bleu. |
| AC-4 | Tête et corps ont un contour épais ; le combattant se lit en silhouette. | PASS | Validé par Maxence ; le contour se détache peu du fond sombre actuel. |
| AC-5 | Le visage suit le sens du regard et reste lisible quand la tête tourne avec le ragdoll. | PASS | Captures 01 (Bleu regarde à gauche) et 03 (tête de Rouge au sol). |
| AC-6 | Le rendu lit l'état sans le modifier ; rien n'est importé de `prototypes/`. | PASS | `src/physics/` intact, hash final de la seed 3 identique à avant la story (`756d2cca`). |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `story-010-look-combattants-piste-5/01-tetes-debut-de-duel.png` | Les deux têtes en début de duel : pics blonds et bouche à dents (Rouge), bol roux et barbe (Bleu) | AC-1, AC-3, AC-4, AC-5 |
| 2 | `story-010-look-combattants-piste-5/02-tetes-en-combat-parade.png` | Les têtes en combat, avant-bras levés de Rouge | AC-1, AC-4 |
| 3 | `story-010-look-combattants-piste-5/03-tete-au-sol-apres-ko.png` | Tête de Rouge au sol après le KO, Bleu debout | AC-5 |

---

## Test Conditions

- **Game state at start**: duel de la seed 3 (`?seed=3`), combattants par défaut de `src/content/fighters.ts`.
- **Capture** : Chrome sans tête, `vite preview`, gros plan ×3 sur la zone de combat.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Maxence | 2026-11-14 | [x] Approved |

*Approbation donnée par Maxence en réponse à la question de clôture de `/story-done`.*
