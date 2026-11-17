# Test Evidence: Compétences lisibles

> **Story**: `production/epics/untruc/story-004-competences-lisibles.md`
> **Story Type**: Visual/Feel
> **Date**: 2026-11-17
> **Tester**: Maxence (validation du rendu), Claude (captures et relecture)
> **Build / Commit**: `e62e059` + changements non commités de la story 004

---

## What Was Tested

Trois compétences (saut, charge, boule de feu) dans le duel par défaut, seed 7 : nom au lancement,
cible du saut (marque au sol et arc pointillé), effets de chaque compétence, raison affichée quand
un coup ne fait pas de dégâts. Maxence a aussi joué les duels dans `npm run dev` (seeds 3 et 7).

**Acceptance criteria covered**: AC-1 à AC-9

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | Une compétence est une donnée (timeline de phases). | PASS | `src/content/skills/*.ts`, `src/core/skill-spec.ts` ; `tests/unit/skills.test.ts`. |
| AC-2 | Le nom de la compétence s'affiche au lancement. | PASS | Captures 01 et 07. |
| AC-3 | Le saut vise la cible : il retombe dessus ou rate pour une raison visible. | PASS | Captures 03, 04, 07 ; seed 3 : 7 sauts sur 8 touchent, les autres sont esquivés ou parés. |
| AC-4 | Quand un coup ne fait pas de dégâts, la raison s'affiche. | PASS | « Bloqué » (05) et « Esquivé » (06). « Raté » : vu dans le journal du duel (seed 7), pas sur une capture. |
| AC-5 | Au moins trois compétences jouables, dont le saut et la boule de feu. | PASS | Seed 7 : 7 sauts, 1 boule de feu, 1 charge. |
| AC-6 | Un spectateur comprend pourquoi chaque coup a touché ou non. | PASS | Validé par Maxence après avoir joué les duels. |
| AC-7 | Chaque compétence a ses effets au niveau de la story 003. | PASS | Captures 01, 02, 04, 07 ; validé par Maxence. |
| AC-8 | Chaque compétence a une catégorie et un coût en points. | PASS | `tests/unit/skills.test.ts` (validation des deux champs). |
| AC-9 | La boule de feu se lance à distance, jamais au corps à corps. | PASS | `minDistance` 260 en données ; test « never picks the fireball at melee range ». |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `story-004-competences-lisibles/01-noms-charge-boule-de-feu.png` | Bandeaux « Charge » et « Boule de feu » au lancement | AC-2, AC-7 |
| 2 | `story-004-competences-lisibles/02-boule-de-feu-en-vol.png` | Boule de feu en vol avec sa traînée, charge en cours, bandeaux « Charge » et « Boule de feu » | AC-2, AC-7, AC-9 |
| 3 | `story-004-competences-lisibles/03-saut-cible-et-arc.png` | Marque au sol et arc pointillé du saut, deux bandeaux « Saut » | AC-2, AC-3 |
| 4 | `story-004-competences-lisibles/04-saut-touche.png` | Saut qui touche : onde de choc, étincelles, flash | AC-3, AC-7 |
| 5 | `story-004-competences-lisibles/05-raison-bloque.png` | Texte « Bloqué » sur un coup paré | AC-4 |
| 6 | `story-004-competences-lisibles/06-raison-esquive.png` | Texte « Esquivé » | AC-4 |
| 7 | `story-004-competences-lisibles/07-sauts-croises-bandeaux-ecartes.png` | Deux sauts croisés, bandeaux écartés | AC-2, AC-3 |

---

## Test Conditions

- **Game state at start**: duel de la seed 7, combattants par défaut (Rouge : saut et charge ; Bleu : saut et boule de feu).
- **Capture**: Chrome sans tête, `vite preview`. Les captures 01 à 06 datent d'avant trois réglages demandés par Maxence (saut visé pile sur la marque, bandeaux écartés, ralenti à 30 % des PV et 0,7 s) ; les captures 02, 03 et 07 ont été refaites après, et après les corrections des deux revues de code (rendu identique).
- **Duel sans compétences**: `?competences=aucune`, seed 3 : tick 1313, hash `1a46eb7a`, inchangé.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Maxence | 2026-11-17 | [x] Approved |

*Approbation donnée par Maxence en réponse aux questions de `/story-done` (« Oui, ça passe » sur la lisibilité et sur les effets). Le look des bandeaux, jugé classique, est reporté à la story 014.*
