---
name: verifier-rendu
description: Lance UnTruc, ouvre la scène modifiée dans le navigateur, prend et garde une capture, et la compare à l'art bible et aux critères de la story ; à faire après tout changement visible.
---

# Vérifier le rendu d'UnTruc

1. `npm run smoke` doit réussir (types et build). Sinon, corrige d'abord.
2. Lance le jeu : `npm run dev` (ou `npm run build` puis `npx vite preview --port 4173 --strictPort`).
3. Ouvre la bonne scène avec le navigateur d'Antigravity :
   - écran de gestion : l'adresse sans paramètre ;
   - duel : `?seed=3` (ou `?seed=7`) ; démos : `?competences=loup`, `?statut=saignement`, `?fx=fireball`,
     `?armes=sword,hammer`.
   Le duel avance seul : attends le moment voulu (le journal du duel est lisible dans la console avec
   `window.__untrucDuel`, qui donne `tick`, PV et état).
4. **Prends une capture** et range-la dans `production/qa/evidence/<story>/` (nom de la story en cours,
   ex. `story-006-ecran-gestion-personnage/`), avec un nom qui dit ce qu'elle montre
   (`03-icone-saut-survol.png`). Une capture non gardée ne compte pas.
5. **Regarde vraiment l'image** et compare-la aux critères de la story et à l'art bible : formes, couleurs,
   lisibilité en petit, contraste, rien de caché par un autre élément, rien sur les combattants pendant le
   duel (le HUD reste dans les marges).
6. Décris à Maxence ce que tu vois, image par image, y compris ce qui ne va pas. N'affirme jamais qu'une
   chose s'affiche sans l'avoir vue sur une capture.
7. Arrête le serveur que tu as lancé.
