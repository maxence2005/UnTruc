Duel épée (Rouge) contre marteau (Bleu), joué le 2026-11-16 avec
`npm run check:weapons -- sword,hammer 3,7` (armes choisies par l'adresse `?armes=`,
combattants par défaut inchangés), après deux changements demandés par Maxence : la seconde
main suit le manche au lieu d'y être attachée, et chaque arme a sa garde de parade (l'épée en
a une, le marteau non : son porteur ne pare pas, il esquive seulement).

| Seed | KO | Vainqueur | PV (Rouge / Bleu) | Écart main avant - prise (max) | Coups épée / marteau | Parades épée / marteau |
|---|---|---|---|---|---|---|
| 3 | tick 928 | Bleu | 0 / 37 | épée 0,3 px, marteau 0,4 px | 3 / 3 | 0 / 0 |
| 7 | tick 972 | Bleu | 0 / 16 | épée 0,2 px, marteau 0,5 px | 4 / 4 | 1 / 0 |

Aucune envolée sans coup reçu. Main arrière du marteau à 17 px du manche en moyenne.
Avant la correction de la seconde main, le marteau s'écartait de la main avant de 14 px en
moyenne et jusqu'à 28 px (ce que Maxence a vu en jeu). Duel sans arme, seed 3 : tick 1313,
PV 0 / 38, hash `1a46eb7a` (inchangé).

Captures 01 à 04 : ce duel (03 : Rouge pare à l'épée, bras levé, lame relevée). Captures 05 et
06 : prises le 2026-11-14, avant le réglage final du marteau et avant ces deux changements.
