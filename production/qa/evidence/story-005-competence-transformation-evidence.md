# Test Evidence: Compétence Transformation (loup-garou)

> **Story**: `production/epics/untruc/story-005-competence-transformation.md`
> **Story Type**: Visual/Feel
> **Date**: 2026-11-26
> **Tester**: Maxence (validation du rendu), Claude (captures et relecture)
> **Build / Commit**: `ceef9e1` + changements non commités de la story 005

---

## What Was Tested

La Transformation en démo (`?seed=7&competences=loup`, seed 3 aussi) : grognement à 50 % des PV, transformation
à 30 %, attributs du loup-garou (oreilles, museau, griffes, queue), griffures à l'impact et saignement.
La compétence n'est pas encore sur les combattants par défaut : le choix des compétences viendra de la story 006.

**Acceptance criteria covered**: AC-1 à AC-10

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | La Transformation est une compétence en données. | PASS | `src/content/skills/transformation.ts` ; `tests/unit/transformation/`. |
| AC-2 | Le combattant devient loup-garou : oreilles, museau, griffes, queue. | PASS | Capture 05 ; capture 03 (avant la correction des oreilles). |
| AC-3 | Il attaque avec ses griffes, qui laissent des traces à l'impact. | PASS | Capture 05 (trois griffures rouges sur Bleu). |
| AC-4 | Le moment se voit et se lit. | PASS | Captures 01 (« Grognement ») et 02 (« Transformation », éclair vert). |
| AC-5 | Attributs cosmétiques accrochés aux parties du corps, réutilisables. | PASS | `src/core/cosmetic-spec.ts`, `src/content/cosmetics/` ; capture 05. |
| AC-6 | Effets au niveau de la story 003. | PASS | Captures 01, 02, 04 ; validé par Maxence. |
| AC-7 | Catégorie `transformation` et coût en points plus élevé. | PASS | `transformation.test.ts` (4 points). |
| AC-8 | Grognement à 50 % : dégâts, étourdissement d'environ 2 s, ni esquivable ni parable. | PASS | Tests ; capture 01 (onde dans l'arène). |
| AC-9 | Transformation à 30 % : vitesse et agilité fortement augmentées. | PASS | Tests (bonus lus par le duel, vérifiés par mutation) ; capture 02. |
| AC-10 | Les griffes font saigner. | PASS | Tests (pas de saignement sur un coup paré ou mortel) ; capture 05. |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `story-005-competence-transformation/01-grognement-onde-arene.png` | Anneau crème qui traverse l'arène, bandeau « Grognement », arcs devant la bouche | AC-4, AC-6, AC-8 |
| 2 | `story-005-competence-transformation/02-transformation-nom-eclair.png` | Bandeau « Transformation », éclair vert et particules, voile du ralenti | AC-4, AC-6, AC-9 |
| 3 | `story-005-competence-transformation/03-loup-garou-museau-griffes-queue.png` | Loup-garou : museau, griffes, queue (oreilles encore cachées par les cheveux) | AC-2, AC-5 |
| 4 | `story-005-competence-transformation/04-coup-griffes-impact.png` | Coup du loup-garou : onde de choc, flash, étincelles | AC-3, AC-6 |
| 5 | `story-005-competence-transformation/05-griffures-oreilles-seed7-tick923.png` | Oreilles, museau, griffes, queue et trois griffures rouges sur Bleu | AC-2, AC-3, AC-5, AC-10 |

---

## Test Conditions

- **Game state at start**: duel de la seed 7 (seed 3 pour le grognement et la transformation), Rouge porte la Transformation par le paramètre `?competences=loup`.
- **Capture**: Chrome sans tête, `vite preview`. Les captures 01 à 04 datent d'avant les corrections de la revue de code (KO causé par un stade, ordre de libération de l'étourdissement) ; la 05 a été reprise après les premières. Ces corrections ne changent pas le rendu.
- **Duels de référence sans la démo** : seed 3 `?competences=aucune` tick 1313, hash `1a46eb7a` ; seed 3 `d1973395` ; seed 7 `a09e13b0` (inchangés).
- **Non vu** : le loup-garou tourné vers la gauche (dessin retourné).

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Maxence | 2026-11-26 | [x] Approved |

*Approbation donnée par Maxence en réponse aux questions de `/story-done` (« Oui, ça passe » sur le rendu : grognement, transformation, attributs du loup-garou, griffures).*
