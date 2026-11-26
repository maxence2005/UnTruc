---
name: verifier-code
description: Vérifie qu'un changement n'a rien cassé dans UnTruc : types, tests, build et empreintes des duels de référence ; à faire avant tout commit.
---

# Vérifier le code d'UnTruc

1. `npm test` : tous les tests doivent passer. Donne le nombre de tests et les noms de ceux qui échouent.
2. `npm run smoke` : vérification des types (`tsc --noEmit`) et build Vite. Une ligne `error TS` nomme le
   fichier fautif.
3. `npm run check:hashes` : rejoue les duels de référence dans Chrome sans tête et compare leurs
   empreintes à celles attendues (`tools/hash-check.mjs`). Il faut Google Chrome ; sinon donne son chemin
   avec `CHROME_PATH=/chemin/vers/chrome npm run check:hashes`. Le script dit `OK` ou `DIFFÉRENT` pour
   chaque duel.
   - Un changement de rendu (images, effets, interface) ne doit **jamais** changer une empreinte.
   - Si une empreinte change, arrête-toi et explique la cause à Maxence ; ne mets pas à jour l'empreinte
     attendue sans son accord.
4. Résume : commandes lancées, résultat de chacune, ce qui reste à faire.
